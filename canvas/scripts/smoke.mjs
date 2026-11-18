/**
 * MCP 握手冒烟测试：直接用 stdio JSON-RPC 与服务器对话，
 * 验证 initialize / tools/list 是否正常，不需要 Canvas token。
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const serverPath = join(here, '..', 'server.mjs');
const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'inherit'] });

let buffer = '';
const seen = new Map();

child.stdout.on('data', (chunk) => {
  buffer += chunk.toString('utf8');
  let idx;
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      seen.set(msg.id, msg);
      if (msg.id === 1) {
        console.log('initialize →', JSON.stringify(msg.result?.serverInfo), 'protocol', msg.result?.protocolVersion);
        send({ jsonrpc: '2.0', method: 'notifications/initialized' });
        send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
      }
      if (msg.id === 2) {
        const list = msg.result?.tools ?? [];
        console.log(`tools/list → ${list.length} tools`);
        for (const t of list) console.log('  -', t.name, '|', t.title ?? '');
        send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'canvas_whoami', arguments: {} } });
      }
      if (msg.id === 3) {
        const text = msg.result?.content?.[0]?.text ?? JSON.stringify(msg.result);
        console.log('tools/call canvas_whoami → isError:', msg.result?.isError ?? false);
        console.log(text.split('\n').slice(0, 6).join('\n'));
        child.kill();
        process.exit(0);
      }
    } catch (e) {
      console.error('bad line:', line.slice(0, 200), e.message);
    }
  }
});

function send(obj) {
  child.stdin.write(JSON.stringify(obj) + '\n');
}

child.on('exit', (code) => {
  if (!seen.get(3)) {
    console.error('server exited early, code', code);
    process.exit(1);
  }
});

send({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: { protocolVersion: '2026-07-28', capabilities: {}, clientInfo: { name: 'smoke', version: '0.0.1' } },
});

setTimeout(() => {
  console.error('timeout');
  child.kill();
  process.exit(1);
}, 15000);
