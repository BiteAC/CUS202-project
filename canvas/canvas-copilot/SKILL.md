---
name: canvas-copilot
description: Use when a question depends on the user's own PolyU Canvas courses — assignment requirements, deadlines, module content, course files, announcements or grades. Routes to the right canvas tool and hands the draft to cite-check before answering.
---

# Canvas Copilot

The entry point. Answer from the user's own courses, not from memory.

## Decide first

| The question is about | Tool |
|---|---|
| which courses the user is in | `canvas_list_courses` |
| a deadline or a list of assignments | `canvas_list_assignments` |
| the full text of a brief or a page | `canvas_get_assignment`, `canvas_list_pages` |
| course structure | `canvas_list_modules` |
| files and readings | `canvas_list_files` |
| notices | `canvas_list_announcements` |
| grades or submissions | `canvas_list_grades`, `canvas_list_submissions`, `canvas_get_course` |
| what is due soon | `canvas_list_todo`, `canvas_list_calendar` |

`canvas_whoami` is for setup checks only. Never call it as part of answering.

## Order of operations

1. Get `course_id` from `canvas_list_courses`. Do not guess an id.
2. Fetch the narrowest thing that answers the question. One tool call beats four.
3. Read the page body, not just the title.
4. Draft the answer.
5. Pass the draft to `cite-check` before sending it.

## Rules

- If a course page exists for the question, use it. Memory is not an acceptable
  source for a requirement or a deadline.
- If the tool returns nothing, say so. Do not fill the gap with a plausible rule.
- Never expose another student's name from a discussion or a submission list.
- Do not call the server more than needed. Each call costs a round trip and the
  user is paying attention.

## If there are no Canvas tools

The server is optional. If no `canvas_*` tool is available, do not pretend.

Say that the Canvas server is not set up, and point to `docs/CANVAS.md`. Then
answer only what can be answered without it, or ask the user for the material.

Never answer a course question from memory as a substitute.
