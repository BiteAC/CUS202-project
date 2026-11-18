# Design notes

Our project is not about building a tool. It is about using one better.

That shapes every choice in this repository.

## What "using it better" actually means

Our proposal lists six kinds of trouble. Installing, configuring, using, managing skills, writing prompts, judging output.

Four of those are habits. You can be told about them. You cannot install them.

The skills here work on the habits. Each one intervenes at a specific moment.

| Moment | Skill | What it changes |
|---|---|---|
| Before answering | ground-in-course | Must retrieve before speaking |
| While answering | i-have-adhd | Shape of the answer, point first |
| Before sending | cite-check | Blocks claims that cannot be sourced |
| After the draft | humanizer | Removes machine-written texture |

All four are in the default set. Two are ours, two are borrowed.

`canvas-copilot` sits outside that table because it is not an answer skill. It routes a question to the Canvas tools, so it ships with the server rather than with the four.

`academic-research-skills` intervenes at every one of those moments at once, which is exactly why it cannot sit in a measured condition.

Same task, four different points of intervention. That is the design.

## One rule behind all of them

None of these skills carry knowledge. Not one holds a fact about Canvas, about your course, or about the world.

They change the order of operations. That is all.

A skill that carries no facts cannot introduce a wrong fact. It can only make the assistant check something it would otherwise have skipped. That is why they are safe to leave installed.

`canvas-mcp`, the one piece that does hold data, is deliberately read-only. It can be wrong about what a page says. It cannot change the page.

## The exception: i-have-adhd

Interview data put this one in the default set.

One student described long, rambling answers as the real obstacle. They could not tell whether a prompt had worked, because the reply was too diffuse to judge. Forcing short point-first replies made the next prompt easier to write.

That is one account, not a finding. But it describes a mechanism worth taking seriously: output shape feeds back into prompt quality.

It cannot fire on its own, since it carries `disable-model-invocation: true`. Someone has to type `/i-have-adhd`. A skill that stays quiet unless called cannot spoil a session that never calls it.

We log whether it was used, and look at those sessions separately.

## Why the heavier ones stay outside

`academic-research-skills` is the best example. It is genuinely good at what it does. It is also wide enough to swallow an ordinary coursework question and answer it as if it were a paper outline.

`humanizer` and `i-have-adhd` both touch output style. Installing both means any score about tone measures the styles, not the skills.

The rule we settled on: if a skill changes how answers are presented, or carries a broad trigger, it does not go in the default set.

## Why the Canvas part is small

It is a supply line, not the subject.

`ground-in-course` is useless if there is nothing to read. That is the whole justification for the program. It fetches, and it only fetches.

Putting it first would misrepresent the project. The interesting part is what happens to an answer after the material arrives.

## The wall we hit ourselves

PolyU turns off the student self-service token button. The option is greyed out, and the tooltip points you to the Canvas administrators.

So the program logs in through the browser and keeps the session on your own machine.

That belongs in the write-up. We set out to study the friction students hit while setting agents up, then walked into a piece of it while building the thing meant to reduce it.
