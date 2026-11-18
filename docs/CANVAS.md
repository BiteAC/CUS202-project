# The Canvas server

Optional. The four default skills work without it, they just cannot read anything.

Set it up only if you want the assistant to read your own Canvas courses.

## What it exposes

Fourteen tools, all reads.

| Tool | What it returns |
|---|---|
| `canvas_whoami` | Credential check and account details |
| `canvas_list_courses` | Enrolled courses, with role and current score |
| `canvas_get_course` | One course: syllabus, teachers |
| `canvas_list_assignments` | Deadlines, points, submission state |
| `canvas_get_assignment` | One assignment: brief, rubric, your submission |
| `canvas_list_modules` | Modules and items, with the ids needed to read each one |
| `canvas_list_announcements` | Announcements, newest first |
| `canvas_list_grades` | Current and final grades |
| `canvas_list_todo` | To-do items and upcoming events |
| `canvas_list_calendar` | Planner items, next thirty days by default |
| `canvas_list_files` | Course file metadata |
| `canvas_list_submissions` | Your submissions and marks, without comments |
| `canvas_list_pages` | Course wiki pages and their text |
| `canvas_list_conversations` | Canvas inbox, read-only |

Dates come back twice, as raw `iso` and as readable `hkt`.

Nothing writes. There is no method to write with.

## Read-only, enforced in code

Not a promise. Three things block a write:

- The single HTTP exit hardcodes `GET`.
- A path guard rejects anything outside `/api/v1/`.
- GraphQL and login endpoints are rejected by the same guard.

Pagination stops at twenty pages, so a stray request cannot sweep an entire course.

## Setting it up

One command from the repository root:

```powershell
.\scripts\setup-canvas.ps1
```

It installs the dependencies, opens a browser for the PolyU login, and checks the connection.

Requires Node.js 20 or later. If `node --version` fails, install it from [nodejs.org](https://nodejs.org).

To run the steps by hand:

```powershell
cd canvas
npm install
node scripts/login.mjs
node server.mjs --check
```

The login window opens Edge, waits for NetID and 2FA, then saves the session by itself. You do not click anything. It times out after five minutes, so a slow login means running it again.

Two other entry points exist: `login.cmd` in the `canvas` folder, which does the same thing with a double click, and `setup-token.ps1`, which writes a personal access token if the institution ever issues you one.

## Checking it works

```powershell
node server.mjs --check    # credentials and course list
node server.mjs --list     # every tool
node scripts/smoke.mjs     # protocol handshake, no credentials needed
node scripts/selftest.mjs  # all fourteen tools against real Canvas
```

## When it breaks

| Symptom | Cause and fix |
|---|---|
| `401`, session expired | Canvas logged you out. Run `node scripts/login.mjs` again |
| `403 Rate Limit Exceeded` | Canvas enforces a quota. Wait a minute |
| `404` | Wrong course id, or the course is unpublished |
| "No usable Canvas credential" | The login step never ran, or every cookie expired |
| The browser never opens | Check Edge is installed, or change `channel` to `chrome` in `login.mjs` |
| Window closed too early | The script exits with code 3. Run it again |

## Where your credentials live

In order of priority:

1. `CANVAS_TOKEN` environment variable
2. `~/.canvas-polyu/token`, a personal access token
3. `~/.canvas-polyu/session.json`, the browser session

All three sit outside this repository, and `.gitignore` blocks the session file.

## What this PolyU instance does differently

`canvas.polyu.edu.hk` departs from the Canvas documentation in several places. The server works around all of them, and they are worth knowing if you ever query the API yourself.

| Endpoint | What happens | What the server does |
|---|---|---|
| `/calendar_events` with `context_codes` | Always returns 500 | Uses `/planner/items` instead, the same source the dashboard uses |
| Global `/announcements` | Under-reports badly, 1 result out of 8 | Fetches per course, then merges |
| `/students/submissions?student_ids[]=self` | Always returns 500 | Uses `assignments?include[]=submission`, which is equivalent but lacks comments |
| `/users/self/enrollments?state[]=active` | Returns 500 | Omits `state` and filters locally |
| `/courses/:id/files` | 403 for some courses | Returns a note instead of failing |
| `/courses/:id/pages` | 404 when the page feature is off | Returns a note instead of failing |
| A page body that is an iframe | Text is empty after stripping tags | Also returns the embed source |
| Repeated `include=a&include=b` | Rails keeps the last one only | Always uses the `include[]=` form |
| A course's `term` field | Always null | Accepted, not worked around |

PolyU also disables student self-service access tokens. The `+ New access token` button is greyed out, and the tooltip points you to the Canvas administrators. That is why the browser login is the default path.

## Removing it

Delete the `canvas` folder, then delete `~/.canvas-polyu`. Log out of Canvas in the browser to invalidate the session immediately.

The four default skills keep working afterwards. They just stop being able to read anything, and they say so.
