/**
 * Canvas LMS read-only HTTP client for canvas.polyu.edu.hk
 *
 * 硬性约束（只读）：
 *   - 本文件只实现 GET。没有任何 POST/PUT/PATCH/DELETE 代码路径。
 *   - 只允许 /api/v1/ 下的路径，禁止 /graphql、login、oauth。
 *   - 不做任何本地写入（凭证只读取）。
 *
 * 凭证优先级：
 *   1. 环境变量 CANVAS_TOKEN
 *   2. ~/.canvas-polyu/token        （Personal Access Token；本校管理员已对学生关闭自助创建）
 *   3. ~/.canvas-polyu/session.json （浏览器登录会话 cookie，由 scripts/login.mjs 生成）
 */

import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const BASE_URL = process.env.CANVAS_BASE_URL || 'https://canvas.polyu.edu.hk';
export const HOME_DIR = join(homedir(), '.canvas-polyu');
export const TOKEN_FILE = process.env.CANVAS_TOKEN_FILE || join(HOME_DIR, 'token');
export const SESSION_FILE = process.env.CANVAS_SESSION_FILE || join(HOME_DIR, 'session.json');

const USER_AGENT = 'canvas-polyu-mcp/0.1 (read-only)';
const TIMEOUT_MS = 30_000;
const MAX_PAGES = 20; // 防御性分页上限

export class CanvasError extends Error {
  constructor(message, { status = 0, body = null, hint = '' } = {}) {
    super(message);
    this.name = 'CanvasError';
    this.status = status;
    this.body = body;
    this.hint = hint;
  }
}

const NO_CREDENTIALS_HINT = [
  '本校 Canvas 管理员已关闭学生自助创建 token 的入口，所以改用浏览器登录会话：',
  '  cd C:\\Users\\Dell\\Desktop\\canvas-polyu',
  '  node scripts/login.mjs        # 会弹出 Edge，用 NetID 登录一次，之后自动保存会话',
  '',
  '（如果学校 IT 之后给你发了 Personal Access Token，也可以直接写进 ' + TOKEN_FILE + '）',
].join('\n');

/** @returns {Promise<{kind: 'bearer'|'cookie', value: string, source: string}>} */
export async function getAuth() {
  if (cachedAuth) return cachedAuth;

  const fromEnv = (process.env.CANVAS_TOKEN || '').trim();
  if (fromEnv) return (cachedAuth = { kind: 'bearer', value: fromEnv, source: 'CANVAS_TOKEN' });

  try {
    const token = (await readFile(TOKEN_FILE, 'utf8')).trim();
    if (token) return (cachedAuth = { kind: 'bearer', value: token, source: TOKEN_FILE });
  } catch {
    /* 没有 token 文件 */
  }

  try {
    const state = JSON.parse(await readFile(SESSION_FILE, 'utf8'));
    const now = Date.now() / 1000;
    const cookies = (state.cookies || []).filter((c) => {
      if (!/polyu\.edu\.hk$/.test(c.domain.replace(/^\./, ''))) return false;
      if (c.expires === undefined || c.expires === null || c.expires === -1) return true; // 会话 cookie
      return c.expires > now;
    });
    if (cookies.length) {
      return (cachedAuth = {
        kind: 'cookie',
        value: cookies.map((c) => `${c.name}=${c.value}`).join('; '),
        source: SESSION_FILE,
      });
    }
  } catch {
    /* 没有会话文件 */
  }

  throw new CanvasError('没有可用的 Canvas 凭证。', { hint: NO_CREDENTIALS_HINT });
}

let cachedAuth = null;

function assertReadOnlyPath(path) {
  if (typeof path !== 'string' || !path.startsWith('/api/v1/')) {
    throw new CanvasError(`拒绝非 /api/v1/ 路径：${path}`, { hint: '客户端只允许只读的 Canvas REST 端点。' });
  }
  if (/graphql/i.test(path) || /(^|\/)(login|logout|oauth)/i.test(path)) {
    throw new CanvasError(`拒绝敏感路径：${path}`);
  }
}

function buildUrl(path, params) {
  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      for (const v of value) url.searchParams.append(key, String(v));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

/** 只读请求：这是全项目唯一的 HTTP 出口，方法固定为 GET */
async function send(url, auth) {
  const headers = {
    Accept: 'application/json',
    'User-Agent': USER_AGENT,
  };
  if (auth.kind === 'bearer') headers.Authorization = `Bearer ${auth.value}`;
  else headers.Cookie = auth.value;

  return fetch(url, {
    method: 'GET',
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

async function toError(res, path, auth) {
  const text = await res.text().catch(() => '');
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = text ? text.slice(0, 500) : null;
  }

  if (res.status === 401) {
    const hint =
      auth.kind === 'cookie'
        ? '登录会话已过期。重新运行：node scripts/login.mjs'
        : 'token 无效或已被撤销。重新生成后覆盖 token 文件（或更新环境变量 CANVAS_TOKEN）。';
    return new CanvasError('Canvas 返回 401：凭证无效或已过期。', { status: 401, body, hint });
  }
  if (res.status === 403) {
    const remaining = res.headers.get('x-rate-limit-remaining');
    if (/rate limit/i.test(text)) {
      return new CanvasError('Canvas 限流（403 Rate Limit Exceeded）。', {
        status: 403,
        body,
        hint: `请等几十秒再试；本次剩余额度：${remaining ?? '未知'}。`,
      });
    }
    return new CanvasError(`Canvas 返回 403：无权限访问 ${path}。`, { status: 403, body });
  }
  if (res.status === 404) {
    return new CanvasError(`Canvas 返回 404：${path} 不存在，或你没有该资源权限。`, { status: 404, body });
  }
  return new CanvasError(`Canvas 返回 ${res.status}：${path}`, { status: res.status, body });
}

/**
 * GET 一个 Canvas REST 路径，返回解析后的 JSON。
 * 401 且本地凭证已更新时，自动重读凭证并重试一次（换 token / 重新登录后无需重启）。
 * @param {string} path 例如 /api/v1/courses
 * @param {Record<string, string|number|boolean|string[]|undefined>} [params]
 */
export async function getJSON(path, params = {}) {
  assertReadOnlyPath(path);
  const url = buildUrl(path, params);
  let auth = await getAuth();

  for (let attempt = 0; ; attempt++) {
    const res = await send(url, auth);
    if (res.ok) return { data: await res.json(), link: res.headers.get('link') };

    if (res.status === 401 && attempt === 0) {
      cachedAuth = null;
      const fresh = await getAuth().catch(() => null);
      if (fresh && (fresh.value !== auth.value || fresh.kind !== auth.kind)) {
        auth = fresh;
        continue;
      }
    }

    throw await toError(res, path, auth);
  }
}

/** GET 并自动跟随分页，返回聚合后的数组（最多 maxPages 页） */
export async function getAll(path, params = {}, maxPages = MAX_PAGES) {
  const out = [];
  let page = 0;
  let { data, link } = await getJSON(path, { per_page: 100, ...params });

  if (!Array.isArray(data)) return data;
  out.push(...data);

  let next = parseNextLink(link);
  while (next && ++page < maxPages) {
    // next 是绝对 URL：只取其 path+query，仍走 getJSON 的只读校验
    const u = new URL(next);
    const { data: pageData, link: pageLink } = await getJSON(u.pathname, paramsFromSearch(u.searchParams));
    if (!Array.isArray(pageData)) break;
    out.push(...pageData);
    next = parseNextLink(pageLink);
  }

  return out;
}

/** 把 URLSearchParams 还原成参数对象，保留重复键（include[] 之类会重复出现） */
function paramsFromSearch(searchParams) {
  const out = {};
  for (const [key, value] of searchParams) {
    if (key in out) {
      out[key] = Array.isArray(out[key]) ? [...out[key], value] : [out[key], value];
    } else {
      out[key] = value;
    }
  }
  return out;
}

function parseNextLink(linkHeader) {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(',')) {
    const m = part.match(/<([^>]+)>\s*;\s*rel="next"/);
    if (m) return m[1];
  }
  return null;
}
