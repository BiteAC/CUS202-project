#!/usr/bin/env node
/**
 * 登录助手：用本机已安装的 Edge 打开 Canvas，完成 PolyU NetID 单点登录后，
 * 把浏览器会话 cookie 保存到 ~/.canvas-polyu/session.json，供只读客户端使用。
 *
 * 用法：node scripts/login.mjs
 * 说明：学校关闭了学生自助创建 API token 的入口，所以用登录会话代替。
 *       会话过期（通常数周）后重跑本脚本即可。
 */

import { chromium } from 'playwright-core';
import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { HOME_DIR, SESSION_FILE, BASE_URL } from '../lib/canvas.mjs';

const execFileAsync = promisify(execFile);
const PROFILE_DIR = join(HOME_DIR, 'browser-profile');
const WAIT_MS = 5 * 60 * 1000;

async function tightenAcl(path, isDir = false) {
  if (process.platform !== 'win32') return;
  const grant = isDir ? `${process.env.USERNAME}:(OI)(CI)F` : `${process.env.USERNAME}:(R,W)`;
  try {
    await execFileAsync('icacls', [path, '/inheritance:r', '/grant:r', grant]);
  } catch {
    /* 权限收紧失败不阻塞流程 */
  }
}

await mkdir(HOME_DIR, { recursive: true });
await mkdir(PROFILE_DIR, { recursive: true });
await tightenAcl(PROFILE_DIR, true);

const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
  channel: 'msedge',
  headless: false,
  viewport: { width: 1280, height: 900 },
  args: ['--no-first-run', '--no-default-browser-check'],
});

let browserClosed = false;
ctx.on('close', () => {
  browserClosed = true;
});

const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }).catch(() => {});

console.log(`已用 Edge 打开 ${BASE_URL}`);
console.log('请在这个窗口里用 PolyU NetID 登录（含 2FA）。登录成功后会自动继续…\n');

const deadline = Date.now() + WAIT_MS;
let user = null;
while (Date.now() < deadline) {
  if (browserClosed) {
    console.error('✗ 浏览器窗口已关闭，登录未完成。');
    process.exit(3);
  }
  try {
    const res = await ctx.request.get(`${BASE_URL}/api/v1/users/self`, { timeout: 15_000 });
    if (res.ok()) {
      user = await res.json();
      break;
    }
  } catch {
    /* 还没登录，继续等 */
  }
  await new Promise((r) => setTimeout(r, 2000));
}

if (!user) {
  await ctx.close().catch(() => {});
  console.error('✗ 超时：5 分钟内没有检测到登录成功。请重跑 node scripts/login.mjs');
  process.exit(2);
}

await ctx.storageState({ path: SESSION_FILE });
await tightenAcl(SESSION_FILE);

const cookies = (await ctx.storageState()).cookies.filter((c) => /polyu\.edu\.hk$/.test(c.domain.replace(/^\./, '')));

console.log(`✓ 登录成功：${user.name} (id ${user.id})`);
console.log(`✓ 已保存 ${cookies.length} 个 cookie 到 ${SESSION_FILE}`);
console.log(`  会话类 cookie：${cookies.filter((c) => c.expires === -1).map((c) => c.name).join(', ') || '（无）'}`);
console.log('\n窗口可以关掉了。验证一下： node server.mjs --check');

await ctx.close().catch(() => {});
process.exit(0);
