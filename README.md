# CUS202-project

Two failures in how students use an AI assistant, and four skills that address them.

The first failure is invented content. An assistant answers a course question from memory, confidently, and with no source behind it.

The second is text nobody can act on. Long diffuse answers bury the point, and you cannot tell whether your last prompt did anything at all.

Four skills install by default. Each one intervenes at a different moment in the answer.

| | |
|---|---|
| Course | CUS202, The Hong Kong Polytechnic University |
| Group | Group 2 |
| Written for | The 19 students in our class, most of whom do not code. Twelve to fifteen of them take part in the study |
| Runs on | Claude Code style skills: a `SKILL.md` file with YAML front matter. Other agents that read the same format will work |
| Needs | Windows with PowerShell 5.1 or later. Node.js 20 or later, only for the optional Canvas side |
| Date | November 2026 |

## Quick start

Skills only. No Node, no login, no Canvas.

```powershell
git clone https://github.com/BiteAC/CUS202-project.git
cd CUS202-project
.\scripts\install.ps1
```

That copies four skills into `%USERPROFILE%\.claude\skills`. Restart your assistant afterwards, skill folders are scanned at startup.

## What installs by default

Four skills. Read the source, each is one file.

### ground-in-course (ours)

Forces the assistant to retrieve before it answers, and to name the page each claim came from.

What you get: a source under every answer, checkable in ten seconds.

What it costs: one extra retrieval per question, and it refuses to answer when nothing is found.

### cite-check (ours)

The last gate before sending. A quote, a number or a policy that cannot be found in what was retrieved gets blocked.

What you stop falling for:

- Invented policy. It says late work loses ten per cent a day and no page ever said that.
- Crossed wires. It reports a marking weight as a word limit.

### i-have-adhd (borrowed from ayghri/i-have-adhd, MIT)

Shorter answers, conclusion first. Installed but inert, because it cannot fire unless you invoke it. You type `/i-have-adhd` to turn it on.

What you get:

- The conclusion without three paragraphs of runway.
- An easier time telling whether your last prompt worked.

Why it is installed: in our interviews one student described exactly this. Long answers made a prompt impossible to judge, and forcing short point-first replies made the next prompt easier to write.

### humanizer (borrowed from blader/humanizer, MIT)

Removes the tells that make text read as machine-written. Sentence rhythm, connector words, the small habits.

What you get: prose that sounds like the person who wrote it.

What it costs: it rewrites surface, and it cannot fix a weak argument. It is also the reason our study does not score style, because a style metric would measure this skill rather than the others.

## Repository layout

What is where, and what each folder costs you.

| Folder | What it holds | Installed by default |
|---|---|---|
| `skills/` | The four default skills | yes |
| `canvas/` | The optional Canvas side: a server and one routing skill | no |
| `third-party/academic/` | Eight vendored academic skills | no |
| `optional/` | Fetched third-party skills, empty until you run the script | no |
| `scripts/` | Installers, one per group | — |
| `docs/` | Four documents, plus `THIRD-PARTY.md` at the root | — |
| `eval/` | The task set and log schema used in our study | — |

## Optional: the Canvas side

One part of the set needs material to check against. That is the whole purpose of this folder.

`canvas-mcp` is a small read-only program over your own Canvas data: courses, assignments, pages, modules, files, grades, announcements, to-do items, calendar items and the Canvas inbox. Fourteen tools, every call a GET.

`canvas-copilot` is the routing skill that decides which of those tools to call.

It is not installed by default, and it is not what this project is about. Install it if you want the four skills to have something to read.

```powershell
.\scripts\setup-canvas.ps1
```

That installs the dependencies, opens the browser login, checks the connection, then adds the routing skill. Detail and troubleshooting: [docs/CANVAS.md](docs/CANVAS.md).

## Optional: three more skills

| Skill | From | What it does | Turn it on when |
|---|---|---|---|
| claude-video | bradautomates/claude-video, MIT | Watches a video, pulls frames, transcribes | You need a recorded lecture read |
| academic-research-skills | Imbad0202/academic-research-skills, CC-BY-NC-4.0 | A full paper pipeline | You are writing a paper, not answering coursework |
| mattpocock-zh-CN | vinvcn/mattpocock-skills-zh-CN, MIT | 38 skills, 20 engineering and 7 productivity among them | You are scoping a project, or doing TypeScript |

```powershell
.\scripts\fetch-optional.ps1 -Component grilling
```

### A note on mattpocock-zh-CN

Half of it has nothing to do with code. The productivity set includes `grilling`, which interviews you about a plan in rounds. Every question is numbered and carries a recommended answer, so "yes" is a complete reply. Facts it can look up itself get looked up rather than asked. It stops when no branch is left unsettled, and it will not start work before you confirm.

That is the behaviour our interviews pointed at. Projects drift when nobody forces the open questions onto the table, and a skill that asks back does the job a supervisor does.

## Optional: eight academic skills

Vendored under `third-party/academic/`. All MIT, authored by K-Dense Inc.

| Skill | What it does |
|---|---|
| citation-management | Fixes a broken reference list and writes the BibTeX |
| paper-lookup | Eighteen scholarly APIs in one call, with provenance |
| peer-review | Argues with your draft before a marker does |
| scientific-slides | Research talk decks |
| scientific-visualization | Figures that survive being shrunk |
| venue-templates | Journal and conference formats, LaTeX included |
| pptx-posters | Editable posters, with a print-size check |
| uncertainty-and-units | Units, significant figures, error bars |

```powershell
.\scripts\install-academic.ps1 -Only peer-review
```

```powershell
.\scripts\install-academic.ps1
```

The first installs one, the second installs all eight. One at a time is the better habit, because these carry reference material that sits in front of the assistant every turn.

Per-skill detail: [docs/ACADEMIC.md](docs/ACADEMIC.md).

One more thing worth knowing: [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) is a catalogue of MCP servers, the protocol the Canvas reader speaks. We searched it before writing our own. It is a list, not a component, so nothing from it is installed.

## Documentation

| File | What it covers |
|---|---|
| [docs/PROFILES.md](docs/PROFILES.md) | Which skills are on, how to add and remove them, and why |
| [docs/ACADEMIC.md](docs/ACADEMIC.md) | The eight academic skills, one section each |
| [docs/CANVAS.md](docs/CANVAS.md) | The optional Canvas side: setup, troubleshooting, read-only guarantees |
| [docs/WHY-THESE-SKILLS.md](docs/WHY-THESE-SKILLS.md) | The design reasoning behind the set |
| [THIRD-PARTY.md](THIRD-PARTY.md) | Every borrowed component, its commit and its licence |

## What this is not

It will not write your assignment. It tells you what the brief asked for.

It will not make a weak argument strong. It stops the answer being worse than it needs to be.

It cannot see other students' work. Those endpoints are not exposed.

## Licence

MIT for the parts we wrote. See [LICENSE](LICENSE). Borrowed skills keep their own licences, listed in [THIRD-PARTY.md](THIRD-PARTY.md).
