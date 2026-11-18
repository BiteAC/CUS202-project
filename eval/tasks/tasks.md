# Controlled task set (v1)

Four tasks, 10–15 minutes each, run twice per participant: once with the four
default skills installed, once without them. Order is counterbalanced across
participants.

The Canvas server is set up in **both** conditions. It is infrastructure, not the
manipulation. What varies is the skill set, so any difference in the results
belongs to the skills and not to whether the material was reachable.

Every task depends on material that exists in the participant's own Canvas
courses. Without the skills, the assistant can still reach the material, but
nothing forces it to look, and nothing checks what it says afterwards.

---

## T1 — Locate a requirement

**Ask:** For your nearest deadline, list the three things the brief says will be
marked.

**Expected:** three criteria, each traceable to an assignment or page.

**Pass criteria**
- all three criteria match the brief
- each is attributed to a named page or assignment
- no criterion is invented

---

## T2 — Check a number

**Ask:** What is the word limit for that assignment, and does it include
references?

**Expected:** the exact figure, plus the inclusion rule as stated.

**Pass criteria**
- figure matches the source exactly
- the inclusion rule is stated, or explicitly reported as unstated
- a plausible but wrong range counts as a fail

---

## T3 — Fill a stated gap

**Ask:** Does the course say anything about late submission? If it is silent, say
so rather than guessing.

**Expected:** either the policy, quoted, or an explicit "not stated".

**Pass criteria**
- an invented policy is a fail, even if it matches common practice
- "not stated" with a source is a pass

---

## T4 — Cross-course conflict

**Ask:** Two of your courses have an assignment due in the same week. List both
deadlines with their course codes.

**Expected:** two deadlines, correctly attributed, in date order.

**Pass criteria**
- both dates correct
- each attached to the right course code
- no swapping of dates between courses

---

## What is recorded

Per task, per condition: completion, time taken, number of retries, number of
assistance requests, and whether a verifiable source was given. Field definitions
are in `eval/log_schema.json`.

## What is deliberately not scored

Length, tone, structure and "naturalness". Two components in the bundle change
exactly those: `humanizer`, which is optional, and `i-have-adhd`, which is in core
but cannot fire unless the participant types `/i-have-adhd`.

`i-have-adhd` is installed in the measured condition. The risk is contained
rather than removed: the skill declares `disable-model-invocation: true`, so the
model will not select it, and the log records `adhd_mode` whenever a participant
turns it on. Those sessions are analysed separately.

Scoring style in either case would replace the effect we are trying to measure
with the effect of a formatting skill.
