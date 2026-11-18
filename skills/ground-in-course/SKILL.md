---
name: ground-in-course
description: Use when answering a question about assignment requirements, marking criteria, deadlines or course policies. Forces the answer to be built from retrieved course pages, with the source recorded for each claim.
---

# Ground in course material

The answer must be traceable. Not "I believe the deadline is Friday", but "the
deadline is Friday, stated on the Assignment 2 page".

## Procedure

1. Retrieve before writing. If you have not called a canvas tool for this
   question, you are not ready to answer it.
2. Build the answer one claim at a time.
3. For each claim, note the tool and the object it came from:
   `course 12345 / assignment 678 / "Submission" section`.
4. Mark anything you could not retrieve as unknown, in the answer itself.

## Answer shape

```
Short answer: <one sentence>
Basis:
- <claim>  — <assignment or page> (<course_code>)
- <claim>  — <page> (<course_code>)
Not found: <what the available material does not cover>
```

## Failure modes to avoid

- **Filling a gap.** If the page does not mention a word limit, there is no word
  limit to report. Say that the page is silent.
- **Merging courses.** Two courses can have an assignment with the same name.
  Keep the `course_code` attached to every claim.
- **Stale reads.** If the user says the brief changed, retrieve again rather than
  reusing the earlier answer.
- **Answering from the title.** Assignment titles are summaries. Read the body.
## If there are no Canvas tools

The server is optional. If no `canvas_*` tool is available, do not guess and do
not answer from memory. Say that the Canvas server is not set up and point to
`docs/CANVAS.md`.