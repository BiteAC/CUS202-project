#!/usr/bin/env node
/**
 * canvas-polyu-mcp — 只读 Canvas LMS MCP 服务器（stdio）
 *
 * 用法：
 *   node server.mjs           # 以 MCP stdio 服务器运行
 *   node server.mjs --check   # 自检：验证 token、列出课程数，然后退出
 *   node server.mjs --list    # 打印已注册的工具清单
 */

import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { tools } from './lib/tools.mjs';
import { CanvasError, BASE_URL, getAuth } from './lib/canvas.mjs';

const NAME = 'canvas-polyu';
const VERSION = '0.1.0';

/** 统一把工具结果包装成 MCP 文本内容 */
function ok(payload) {
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
}

function fail(error) {
  const isCanvas = error instanceof CanvasError;
  const text = [
    `ERROR: ${error?.message ?? String(error)}`,
    isCanvas && error.hint ? `\n提示：${error.hint}` : '',
    isCanvas && error.status ? `\nHTTP 状态：${error.status}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return { content: [{ type: 'text', text }], isError: true };
}

function buildServer() {
  const server = new McpServer(
    { name: NAME, version: VERSION },
    {
      capabilities: { tools: {} },
      instructions:
        `只读访问 ${BASE_URL} 的 Canvas LMS。所有工具都只发送 GET 请求，不会修改任何数据。` +
        '先用 canvas_list_courses 取得 course_id，再调用课程内的作业/模块/公告/成绩工具。',
    },
  );

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.shape,
        annotations: {
          title: tool.title,
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
      },
      async (args) => {
        try {
          return ok(await tool.run(args ?? {}));
        } catch (error) {
          return fail(error);
        }
      },
    );
  }

  return server;
}

async function selfCheck() {
  const { toolIndex } = await import('./lib/tools.mjs');
  console.log(`Canvas 实例: ${BASE_URL}`);
  try {
    const auth = await getAuth();
    console.log(`凭证来源: ${auth.source}（${auth.kind === 'bearer' ? 'Personal Access Token' : '登录会话 cookie'}）`);
    const me = await toolIndex.canvas_whoami.run({});
    console.log(`✓ 认证成功: ${me.user.name} (${me.user.login_id})`);
    const courses = await toolIndex.canvas_list_courses.run({ enrollment_state: 'active' });
    console.log(`✓ active 课程数: ${courses.count}`);
    for (const c of courses.courses.slice(0, 10)) {
      console.log(`   - [${c.id}] ${c.course_code} ${c.name}`);
    }
    if (courses.count > 10) console.log(`   … 其余 ${courses.count - 10} 门省略`);
    return 0;
  } catch (error) {
    console.error(`✗ ${error.message}`);
    if (error.hint) console.error(`\n提示：\n${error.hint}`);
    return 1;
  }
}

const arg = process.argv[2];

if (arg === '--check') {
  process.exit(await selfCheck());
} else if (arg === '--list') {
  for (const t of tools) console.log(`${t.name.padEnd(26)} ${t.title}`);
  process.exit(0);
} else {
  serveStdio(buildServer);
}
