/**
 * Read-only Canvas tool definitions.
 * Every tool maps to one or more GET requests; nothing here can mutate Canvas.
 */

import { z } from 'zod';
import { getAll, getJSON, BASE_URL } from './canvas.mjs';

const HKT_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Hong_Kong',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** 把 ISO 时间同时给出 HKT 可读形式 */
function when(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { iso };
  return { iso, hkt: HKT_FMT.format(d).replace(',', '') };
}

function stripHtml(html, max = 1500) {
  if (!html) return '';
  const text = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|td|th)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text.length > max ? `${text.slice(0, max)}… [truncated ${text.length - max} chars]` : text;
}

const strip = (html, max) => stripHtml(html, max);

function courseId(value, label = 'course_id') {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} 必须是正整数（Canvas 课程 id），收到：${JSON.stringify(value)}`);
  }
  return value;
}

const isoDate = (offsetDays) => {
  const d = new Date(Date.now() + offsetDays * 86400_000);
  return d.toISOString().slice(0, 10);
};

/** 取课程页面列表；页面功能被课程关闭时 Canvas 返回 404，这里降级成提示 */
async function getAllPages(cid) {
  try {
    return await getAll(`/api/v1/courses/${cid}/pages`, { sort: 'title' });
  } catch (error) {
    if (error.status === 404) return { note: '该课程未启用「页面」功能或你无权查看（404）。' };
    throw error;
  }
}

/** 页面正文常是 iframe / 外链嵌入，剥完标签会空，这里把嵌入源抓出来 */
function extractEmbeds(html, max = 5) {
  if (!html) return [];
  const out = new Set();
  for (const m of html.matchAll(/<(?:iframe|embed|object|video|audio)[^>]*?\ssrc=["']([^"']+)["']/gi)) {
    if (/^https?:/i.test(m[1])) out.add(m[1]);
    if (out.size >= max) break;
  }
  if (!out.size) {
    for (const m of html.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)) {
      out.add(m[1]);
      if (out.size >= max) break;
    }
  }
  return [...out];
}

export const tools = [
  {
    name: 'canvas_whoami',
    title: 'Canvas 当前用户',
    description:
      '返回当前 Canvas token 对应的账号信息（姓名、登录名、邮箱、时区）以及 Canvas 实例版本。用于验证 token 是否可用。',
    shape: {},
    async run() {
      const [profile, self] = await Promise.all([
        getJSON('/api/v1/users/self/profile'),
        getJSON('/api/v1/users/self'),
      ]);
      const p = profile.data;
      return {
        instance: BASE_URL,
        user: {
          id: p.id,
          name: p.name,
          short_name: p.short_name,
          login_id: p.login_id,
          primary_email: p.email ?? p.primary_email ?? null,
          time_zone: p.time_zone ?? null,
          locale: p.locale ?? null,
        },
        canvas_user_id: self.data?.id ?? p.id,
      };
    },
  },

  {
    name: 'canvas_list_courses',
    title: '列出课程',
    description:
      '列出当前账号的课程（默认只看 active 状态），包含课程 id、名称、课程代码、学期、我的角色与当前成绩。后续所有工具都用这里的 id 作为 course_id。',
    shape: {
      enrollment_state: z
        .enum(['active', 'invited_or_pending', 'completed', 'all'])
        .optional()
        .describe('选课状态，默认 active；想看全部（含已结课）用 all'),
    },
    async run({ enrollment_state = 'active' }) {
      const courses = await getAll('/api/v1/courses', {
        enrollment_state,
        'include[]': ['term', 'total_scores', 'favorites'],
        'state[]': enrollment_state === 'all' ? ['available', 'completed'] : ['available'],
      });
      const rows = courses.map((c) => {
        const en = (c.enrollments || []).find((e) => /student/i.test(e.type ?? e.role ?? '')) || (c.enrollments || [])[0] || {};
        return {
          id: c.id,
          name: c.name,
          course_code: c.course_code,
          term: c.term?.name ?? null,
          role: en.role ?? en.type ?? null,
          enrollment_state: en.enrollment_state ?? null,
          current_score: en.computed_current_score ?? null,
          current_grade: en.computed_current_grade ?? null,
          html_url: `${BASE_URL}/courses/${c.id}`,
        };
      });
      return { count: rows.length, courses: rows };
    },
  },

  {
    name: 'canvas_get_course',
    title: '课程详情',
    description: '获取单个课程的详情：名称、学期、教师、课程大纲（syllabus 纯文本）、首页链接。',
    shape: { course_id: z.number().int().positive().describe('课程 id') },
    async run({ course_id }) {
      const { data: c } = await getJSON(`/api/v1/courses/${courseId(course_id)}`, {
        'include[]': ['syllabus_body', 'term', 'teachers', 'course_image'],
      });
      return {
        id: c.id,
        name: c.name,
        course_code: c.course_code,
        term: c.term?.name ?? null,
        teachers: (c.teachers || []).map((t) => ({ name: t.display_name, id: t.id })),
        syllabus: strip(c.syllabus_body, 3000) || null,
        default_view: c.default_view ?? null,
        html_url: `${BASE_URL}/courses/${c.id}`,
      };
    },
  },

  {
    name: 'canvas_list_assignments',
    title: '列出作业',
    description:
      '列出某门课程的作业/考核项，含截止时间（HKT）、满分、提交状态与得分。bucket=upcoming 只看未截止的。',
    shape: {
      course_id: z.number().int().positive().describe('课程 id'),
      bucket: z
        .enum(['upcoming', 'past', 'overdue', 'undated', 'future'])
        .optional()
        .describe('时间范围筛选，默认不筛选'),
      include_description: z.boolean().optional().describe('是否附带作业说明正文（较长），默认 false'),
    },
    async run({ course_id, bucket, include_description = false }) {
      const { data: list } = await getJSON(`/api/v1/courses/${courseId(course_id)}/assignments`, {
        bucket,
        'include[]': ['submission', 'all_dates', 'overrides'],
        per_page: 100,
        order_by: 'due_at',
      });
      const rows = list.map((a) => {
        const sub = a.submission || {};
        return {
          id: a.id,
          name: a.name,
          due_at: when(a.due_at),
          unlock_at: when(a.unlock_at),
          lock_at: when(a.lock_at),
          points_possible: a.points_possible ?? null,
          submission_types: a.submission_types ?? [],
          submission: {
            state: sub.workflow_state ?? null,
            submitted_at: when(sub.submitted_at),
            score: sub.score ?? null,
            late: sub.late ?? null,
            missing: sub.missing ?? null,
            graded_at: when(sub.graded_at),
          },
          html_url: a.html_url ?? `${BASE_URL}/courses/${course_id}/assignments/${a.id}`,
          ...(include_description ? { description: strip(a.description, 2000) } : {}),
        };
      });
      return { course_id, count: rows.length, assignments: rows };
    },
  },

  {
    name: 'canvas_get_assignment',
    title: '作业详情',
    description: '获取单个作业的完整信息：说明正文、评分标准（rubric）、截止与解锁时间、我的提交与得分。',
    shape: {
      course_id: z.number().int().positive().describe('课程 id'),
      assignment_id: z.number().int().positive().describe('作业 id'),
    },
    async run({ course_id, assignment_id }) {
      const { data: a } = await getJSON(
        `/api/v1/courses/${courseId(course_id)}/assignments/${assignment_id}`,
        { 'include[]': ['submission', 'rubric_association', 'all_dates'] },
      );
      const sub = a.submission || {};
      return {
        id: a.id,
        name: a.name,
        due_at: when(a.due_at),
        points_possible: a.points_possible ?? null,
        submission_types: a.submission_types ?? [],
        description: strip(a.description, 6000) || null,
        rubric: (a.rubric || []).map((r) => ({
          criterion: r.description,
          points: r.points,
          ratings: (r.ratings || []).map((x) => `${x.points}: ${x.description}`),
        })),
        my_submission: {
          state: sub.workflow_state ?? null,
          submitted_at: when(sub.submitted_at),
          score: sub.score ?? null,
          grade: sub.grade ?? null,
          late: sub.late ?? null,
          missing: sub.missing ?? null,
          attempt: sub.attempt ?? null,
          body: sub.body ? strip(sub.body, 1500) : null,
        },
        html_url: a.html_url ?? `${BASE_URL}/courses/${course_id}/assignments/${a.id}`,
      };
    },
  },

  {
    name: 'canvas_list_modules',
    title: '课程模块',
    description:
      '列出课程模块（Modules）及其条目（页面、作业、文件、外部链接等）、完成要求，并给出读取该条目内容所需的标识：' +
      'Page 给 page_url（可直接传给 canvas_list_pages），File 给 file_id/下载链接，Assignment 给 assignment_id。',
    shape: { course_id: z.number().int().positive().describe('课程 id') },
    async run({ course_id }) {
      let modules;
      try {
        ({ data: modules } = await getJSON(`/api/v1/courses/${courseId(course_id)}/modules`, {
          'include[]': ['items', 'content_details'],
          per_page: 100,
        }));
      } catch (error) {
        if (error.status === 404) {
          return { course_id, count: 0, modules: [], note: '该课程没有启用「模块」或你无权查看（404）。' };
        }
        throw error;
      }
      return {
        course_id,
        count: modules.length,
        modules: modules.map((m) => ({
          id: m.id,
          name: m.name,
          position: m.position,
          state: m.state ?? null,
          unlock_at: when(m.unlock_at),
          items: (m.items || []).map((i) => {
            const cd = i.content_details ?? {};
            return {
              title: i.title,
              type: i.type,
              html_url: i.html_url ?? null,
              content_id: i.content_id ?? null,
              // 读内容用的标识（页面 slug / 作业 id / 文件 id）
              ...(i.type === 'Page' ? { page_url: i.page_url ?? null } : {}),
              ...(i.type === 'Assignment' && i.content_id ? { assignment_id: i.content_id } : {}),
              ...(i.type === 'Quiz' && i.content_id ? { quiz_id: i.content_id } : {}),
              ...(i.type === 'File' ? { file_id: i.content_id ?? null, file_name: cd.display_name ?? null } : {}),
              ...(i.type === 'ExternalUrl' && i.external_url ? { external_url: i.external_url } : {}),
              locked: cd.locked_for_user ?? null,
              completion_requirement: i.completion_requirement ?? null,
            };
          }),
        })),
      };
    },
  },

  {
    name: 'canvas_list_announcements',
    title: '课程公告',
    description:
      '列出公告。给了 course_id 就只取这门课；不给则汇总所有 active 课程的公告（按发布时间倒序）。',
    shape: {
      course_id: z.number().int().positive().optional().describe('课程 id；省略则汇总全部课程'),
      limit: z.number().int().positive().max(50).optional().describe('最多返回条数，默认 15'),
    },
    async run({ course_id, limit = 15 }) {
      // 说明：全局 /api/v1/announcements 在本校实例上会漏报（只回到 1/8 条），
      // 所以改成逐课程取 discussion_topics?only_announcements=true 再合并。
      let courses;
      if (course_id) {
        courses = [{ id: courseId(course_id) }];
      } else {
        courses = await getAll('/api/v1/courses', { enrollment_state: 'active', 'state[]': ['available'] });
        if (!courses.length) return { count: 0, announcements: [], note: '没有 active 课程' };
      }

      const batches = await Promise.all(
        courses.slice(0, 20).map(async (c) => {
          const { data } = await getJSON(`/api/v1/courses/${c.id}/discussion_topics`, {
            only_announcements: true,
            per_page: 20,
          });
          return (Array.isArray(data) ? data : []).map((a) => ({
            id: a.id,
            title: a.title,
            posted_at: when(a.posted_at),
            author: a.author?.display_name ?? null,
            course_id: c.id,
            course: c.name ?? null,
            message: strip(a.message, 1000),
            html_url: a.html_url ?? `${BASE_URL}/courses/${c.id}/discussion_topics/${a.id}`,
          }));
        }),
      );

      const rows = batches
        .flat()
        .sort((a, b) => String(b.posted_at?.iso ?? '').localeCompare(String(a.posted_at?.iso ?? '')))
        .slice(0, limit);
      return { count: rows.length, announcements: rows };
    },
  },

  {
    name: 'canvas_list_grades',
    title: '成绩',
    description:
      '查询成绩。给 course_id 返回该课各成绩项与总分；不给则返回所有课程（含已结课）的当前/最终分数与等级。',
    shape: {
      course_id: z.number().int().positive().optional().describe('课程 id；省略则汇总全部课程'),
    },
    async run({ course_id }) {
      if (course_id) {
        const { data } = await getJSON(`/api/v1/courses/${courseId(course_id)}/enrollments`, {
          user_id: 'self',
        });
        const en = (Array.isArray(data) ? data : []).find((e) => /student/i.test(e.type ?? e.role ?? '')) || {};
        return {
          course_id,
          current_score: en.grades?.current_score ?? null,
          current_grade: en.grades?.current_grade ?? null,
          final_score: en.grades?.final_score ?? null,
          final_grade: en.grades?.final_grade ?? null,
          enrollment_state: en.enrollment_state ?? null,
        };
      }

      const { data } = await getJSON('/api/v1/users/self/enrollments', { per_page: 100 });
      const rows = (Array.isArray(data) ? data : [])
        .filter((e) => /student/i.test(e.type ?? e.role ?? ''))
        .filter((e) => ['active', 'completed'].includes(e.enrollment_state))
        .map((e) => ({
          course_id: e.course_id,
          current_score: e.grades?.current_score ?? null,
          current_grade: e.grades?.current_grade ?? null,
          final_score: e.grades?.final_score ?? null,
          final_grade: e.grades?.final_grade ?? null,
          enrollment_state: e.enrollment_state ?? null,
        }));
      return { count: rows.length, courses: rows };
    },
  },

  {
    name: 'canvas_list_todo',
    title: '待办与近期事件',
    description: '我的待办清单（todo，未提交的作业等）和未来近期事件（upcoming events）。',
    shape: {},
    async run() {
      const [todo, upcoming] = await Promise.all([
        getJSON('/api/v1/users/self/todo', { per_page: 50 }),
        getJSON('/api/v1/users/self/upcoming_events', { per_page: 50 }),
      ]);
      return {
        todo: (todo.data || []).map((t) => ({
          type: t.type,
          course_id: t.course_id ?? null,
          assignment: t.assignment
            ? {
                id: t.assignment.id,
                name: t.assignment.name,
                due_at: when(t.assignment.due_at),
                points_possible: t.assignment.points_possible ?? null,
              }
            : null,
          quiz: t.quiz ? { id: t.quiz.id, title: t.quiz.title, due_at: when(t.quiz.due_at) } : null,
          html_url: t.html_url ?? null,
        })),
        upcoming_events: (upcoming.data || []).map((e) => ({
          id: e.id,
          title: e.title,
          start_at: when(e.start_at),
          end_at: when(e.end_at),
          type: e.type ?? null,
          context_code: e.context_code ?? null,
          html_url: e.html_url ?? null,
        })),
      };
    },
  },

  {
    name: 'canvas_list_calendar',
    title: '日程 / 学习计划',
    description:
      '按时间线列出 Canvas「日程」里的条目：作业截止、公告、测验等（即仪表盘 To-Do/Upcoming 看到的那些）。默认查今天起 30 天内。',
    shape: {
      start_date: z.string().optional().describe('YYYY-MM-DD，默认今天'),
      end_date: z.string().optional().describe('YYYY-MM-DD，默认 +30 天'),
      course_ids: z.array(z.number().int().positive()).optional().describe('只查这些课程；省略则全部课程'),
      types: z
        .array(z.enum(['assignment', 'announcement', 'quiz', 'discussion_topic', 'calendar_event', 'planner_note']))
        .optional()
        .describe('只保留这些类型；省略则全部'),
    },
    async run({ start_date, end_date, course_ids, types }) {
      // 说明：/api/v1/calendar_events 只要带 context_codes 在本校实例上就 500，
      // 因此改用 /api/v1/planner/items —— 它才是 Canvas 仪表盘「日程」的真实数据源。
      const window = { start_date: start_date || isoDate(0), end_date: end_date || isoDate(30) };
      const items = await getAll('/api/v1/planner/items', { ...window, per_page: 100 });

      const rows = (Array.isArray(items) ? items : [])
        .filter((i) => !types?.length || types.includes(i.plannable_type))
        .filter((i) => !course_ids?.length || course_ids.includes(Number(i.course_id)))
        .map((i) => {
          const p = i.plannable ?? {};
          return {
            type: i.plannable_type,
            title: p.title ?? p.name ?? null,
            at: when(i.plannable_date),
            due_at: when(p.due_at),
            points_possible: p.points_possible ?? null,
            course_id: i.course_id ?? null,
            course: i.context_name ?? null,
            html_url: i.html_url ? new URL(i.html_url, BASE_URL).href : null,
          };
        })
        .sort((a, b) => String(a.at?.iso ?? '').localeCompare(String(b.at?.iso ?? '')));

      return { count: rows.length, window, items: rows };
    },
  },

  {
    name: 'canvas_list_files',
    title: '课程文件',
    description: '列出课程文件（只返回元信息与下载链接，不下载文件内容）。',
    shape: {
      course_id: z.number().int().positive().describe('课程 id'),
      search_term: z.string().optional().describe('按文件名搜索'),
    },
    async run({ course_id, search_term }) {
      let files;
      try {
        files = await getAll(`/api/v1/courses/${courseId(course_id)}/files`, {
          search_term,
          sort: 'updated_at',
          order: 'desc',
        });
      } catch (error) {
        // 部分课程的「文件」页面对学生关闭，Canvas 直接返回 403 —— 这不是故障
        if (error.status === 403) {
          return {
            course_id,
            count: 0,
            files: [],
            note: '该课程未向学生开放文件接口（403）。可以试试 canvas_list_modules 里的 file 条目，或 canvas_list_pages 看课程页面。',
          };
        }
        throw error;
      }
      const rows = (Array.isArray(files) ? files : []).map((f) => ({
        id: f.id,
        name: f.display_name ?? f.filename,
        size_kb: f.size ? Math.round(f.size / 1024) : null,
        content_type: f['content-type'] ?? null,
        updated_at: when(f.updated_at),
        url: f.url ?? null,
      }));
      return { course_id, count: rows.length, files: rows };
    },
  },

  {
    name: 'canvas_list_submissions',
    title: '我的提交记录',
    description:
      '列出我在某门课的提交与评分情况（是否迟交、是否缺交、得分）。由作业列表附带提交信息聚合而来，不含评语。',
    shape: {
      course_id: z.number().int().positive().describe('课程 id'),
      limit: z.number().int().positive().max(200).optional().describe('最多条数，默认 100'),
    },
    async run({ course_id, limit = 100 }) {
      // 说明：/courses/:id/students/submissions?student_ids[]=self 在本校实例上会 500，
      // 因此改用 assignments + include[]=submission（数据等价，只是没有评语）。
      const { data } = await getJSON(`/api/v1/courses/${courseId(course_id)}/assignments`, {
        'include[]': ['submission'],
        per_page: 100,
        order_by: 'due_at',
      });
      const rows = (Array.isArray(data) ? data : [])
        .filter((a) => a.submission)
        .slice(0, limit)
        .map((a) => ({
          assignment_id: a.id,
          assignment: a.name,
          due_at: when(a.due_at),
          state: a.submission.workflow_state ?? null,
          submitted_at: when(a.submission.submitted_at),
          score: a.submission.score ?? null,
          points_possible: a.points_possible ?? null,
          late: a.submission.late ?? null,
          missing: a.submission.missing ?? null,
          excused: a.submission.excused ?? null,
          attempt: a.submission.attempt ?? null,
          html_url: a.html_url ?? `${BASE_URL}/courses/${course_id}/assignments/${a.id}`,
        }));
      return { course_id, count: rows.length, submissions: rows };
    },
  },

  {
    name: 'canvas_list_pages',
    title: '课程页面',
    description:
      '列出或读取课程 Wiki 页面。不给 page_url 时列出全部页面；给了则返回该页面正文（纯文本）。' +
      '若正文是 iframe/外链嵌入，会额外返回 embeds 里的源地址。',
    shape: {
      course_id: z.number().int().positive().describe('课程 id'),
      page_url: z.string().optional().describe('页面 slug（来自列表的 url 字段，或 canvas_list_modules 里的 page_url）'),
    },
    async run({ course_id, page_url }) {
      if (page_url) {
        try {
          const { data: p } = await getJSON(
            `/api/v1/courses/${courseId(course_id)}/pages/${encodeURIComponent(page_url)}`,
          );
          const body = strip(p.body, 6000);
          const embeds = extractEmbeds(p.body);
          return {
            course_id,
            url: p.url,
            title: p.title,
            updated_at: when(p.updated_at),
            body,
            ...(embeds.length ? { embeds } : {}),
            ...(body || embeds.length
              ? {}
              : { note: '页面正文为空（可能内容全部在前端渲染或已被清空）。' }),
            html_url: `${BASE_URL}/courses/${course_id}/pages/${p.url}`,
          };
        } catch (error) {
          if (error.status === 404) {
            return { course_id, url: page_url, error: '该页面不存在、未发布，或是不允许学生查看（404）。' };
          }
          throw error;
        }
      }
      const pages = await getAllPages(courseId(course_id));
      if (pages.note) return { course_id, count: 0, pages: [], note: pages.note };
      return {
        course_id,
        count: pages.length,
        pages: (Array.isArray(pages) ? pages : []).map((p) => ({
          url: p.url,
          title: p.title,
          published: p.published ?? null,
          updated_at: when(p.updated_at),
        })),
      };
    },
  },

  {
    name: 'canvas_list_conversations',
    title: 'Canvas 收件箱',
    description:
      '只读查看 Canvas 站内信（Conversations）。不给 conversation_id 时列出收件箱摘要；给了则返回该会话全部消息。',
    shape: {
      conversation_id: z.number().int().positive().optional().describe('会话 id'),
      scope: z.enum(['inbox', 'sent', 'archived', 'starred']).optional().describe('默认 inbox'),
      limit: z.number().int().positive().max(50).optional().describe('默认 20'),
    },
    async run({ conversation_id, scope = 'inbox', limit = 20 }) {
      if (conversation_id) {
        const { data: c } = await getJSON(`/api/v1/conversations/${conversation_id}`);
        return {
          id: c.id,
          subject: c.subject,
          participants: (c.participants || []).map((p) => p.name),
          message_count: c.message_count ?? null,
          messages: (c.messages || []).map((m) => ({
            author: m.author_id ?? null,
            at: when(m.created_at),
            body: strip(m.body, 2000),
          })),
        };
      }
      const { data } = await getJSON('/api/v1/conversations', { scope, per_page: limit });
      const rows = (Array.isArray(data) ? data : []).map((c) => ({
        id: c.id,
        subject: c.subject,
        participants: (c.participants || []).map((p) => p.name),
        message_count: c.message_count ?? null,
        last_message_at: when(c.last_message_at),
        last_message: c.last_message ? strip(c.last_message, 300) : null,
        workflow_state: c.workflow_state ?? null,
        context_name: c.context_name ?? null,
      }));
      return { count: rows.length, conversations: rows };
    },
  },
];

export const toolIndex = Object.fromEntries(tools.map((t) => [t.name, t]));
