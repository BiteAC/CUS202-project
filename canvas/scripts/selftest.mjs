#!/usr/bin/env node
/**
 * 全工具体检：对真实 Canvas 逐个跑一遍 14 个工具，打印字节数与失败原因。
 * 需要一个可用的课程 id —— 默认取你第一门 active 课程。
 *
 * 用法：node scripts/selftest.mjs
 */

import { toolIndex } from '../lib/tools.mjs';

let failed = 0;

async function run(name, args) {
  try {
    const r = await toolIndex[name].run(args);
    const size = JSON.stringify(r).length;
    console.log(`ok   ${name.padEnd(28)} ${String(size).padStart(6)}B  ${Object.keys(r).slice(0, 6).join(',')}`);
    return r;
  } catch (error) {
    failed += 1;
    console.log(`FAIL ${name.padEnd(28)} ${error.status ?? ''} ${error.message.slice(0, 90)}`);
    return null;
  }
}

const courses = await run('canvas_list_courses', {});
const cid = courses?.courses?.[0]?.id;
if (!cid) {
  console.error('没有拿到任何课程，先跑 node server.mjs --check 排查凭证。');
  process.exit(1);
}

console.log(`\n（课程 id 用 ${cid}）\n`);

const assignments = await run('canvas_list_assignments', { course_id: cid });
await run('canvas_whoami', {});
await run('canvas_get_course', { course_id: cid });
await run('canvas_list_modules', { course_id: cid });
await run('canvas_list_announcements', { limit: 5 });
await run('canvas_list_grades', {});
await run('canvas_list_todo', {});
await run('canvas_list_calendar', {});
await run('canvas_list_files', { course_id: cid });
await run('canvas_list_submissions', { course_id: cid });
await run('canvas_list_pages', { course_id: cid });
await run('canvas_list_conversations', {});

const aid = assignments?.assignments?.[0]?.id;
if (aid) await run('canvas_get_assignment', { course_id: cid, assignment_id: aid });

console.log(failed ? `\n${failed} 个工具失败` : '\n全部通过');
process.exit(failed ? 1 : 0);
