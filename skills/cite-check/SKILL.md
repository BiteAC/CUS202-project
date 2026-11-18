---
name: cite-check
description: Use before sending any answer that quotes a course requirement, a deadline, a mark allocation or a policy. Checks that every quoted string exists in material already retrieved, and blocks the ones that do not.
---

# Cite check

A last pass over the draft. Nothing new is retrieved here.

## Check each claim

| Check | Fail if |
|---|---|
| The quote exists | The exact string cannot be found in any retrieved result |
| The source is current | The retrieved result predates a change the user mentioned |
| The number matches | A percentage, a word count or a date differs from the source |
| The claim is in the source | The source mentions the topic but does not say what the draft says |

A claim that fails any row gets removed, or rewritten as "not stated on the page".

## Output

If everything passes, send the answer unchanged.

If something fails, do not silently edit it. Return:

```
Blocked: <the claim>
Reason: <not found / differs from source / source silent>
Retrieved instead: <what the material actually says>
```

## The three ways this usually fails

1. **Rounding a rule into a habit.** "About 1,500 words" from a source that says
   "1,500 words, excluding references".
2. **Borrowing a neighbouring field.** Reading the weight of an assignment and
   reporting it as the word limit.
3. **Inventing a policy.** Writing "late submissions lose 10% per day" when the
   course page says nothing about lateness.

The third one is the reason this skill exists. A fabricated policy is worse than
a missing one, because the user cannot tell the difference.
## If there are no Canvas tools

The server is optional. If no `canvas_*` tool is available, do not guess and do
not answer from memory. Say that the Canvas server is not set up and point to
`docs/CANVAS.md`.