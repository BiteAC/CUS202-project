# Which skills are on

Four skills install by default. Everything else is one command away.

| Group | How many | Installed by default | Installed with |
|---|---|---|---|
| Default skills | 4 | yes | `.\scripts\install.ps1` |
| Canvas side | 1 server and 1 routing skill | no | `.\scripts\setup-canvas.ps1` |
| Optional skills | 3 | no | `.\scripts\fetch-optional.ps1` |
| Academic skills | 8 | no | `.\scripts\install-academic.ps1` |

## The default four, and why those

They cover the two failures this project is about. Invented content, and text nobody can act on.

| Skill | Failure it addresses |
|---|---|
| ground-in-course | The answer came from memory |
| cite-check | The answer quoted something that is not there |
| i-have-adhd | The answer buried the point |
| humanizer | The answer read as machine-written |

Two of the four are ours. The other two are borrowed, and both are pinned to a commit.

## Why so little is on

A skill is not a light switch.

Once a skill sits in the skills folder, its name and description are always in view. The assistant reads them every turn. If your question matches the description, the skill can act, whether or not you wanted it.

So a skill is either present and able to fire, or gone. There is no third state.

Four is a number you can keep in your head. Everything else is a deliberate step.

## The two exceptions worth explaining

`i-have-adhd` changes how answers look, which normally argues against a default install. It stays because it carries this line:

```
disable-model-invocation: true
```

That tells the assistant, never pick this yourself. A person has to type `/i-have-adhd`. A skill that cannot fire until called cannot spoil a session that never calls it.

`humanizer` has no such guard, so it can fire on its own. It is in the default set because it belongs to the same job as the other three. It is also why our study does not score style: a style metric would be measuring this skill.

## Adding a skill

Optional skills, fetched at a pinned commit:

```powershell
.\scripts\fetch-optional.ps1 -Component claude-video
```

Academic skills, vendored in this repository:

```powershell
.\scripts\install-academic.ps1 -Only peer-review
```

The Canvas side, which is a server plus a routing skill:

```powershell
.\scripts\setup-canvas.ps1
```

## Removing one

```powershell
Remove-Item "$env:USERPROFILE\.claude\skills\humanizer" -Recurse -Force
```

Deleting the folder is the honest off switch. There is no other command to remember.

## Why the Canvas side is opt in

Two of the four default skills need material to check against. Without a source, they stop rather than guess.

The Canvas side supplies that material, and it charges for the privilege: Node.js, a browser login, and a few minutes. Most readers do not need any of that, and a skill pack that demands a browser login before it does anything is a pack people abandon halfway.

So the four skills ship, the server does not, and the routing skill arrives with the server.

## Why this matters for our study

The four default skills are the variables. Everything else sits outside the measurement.

The Canvas side is set up in every session, including the control, because it only supplies material. What changes between conditions is the four skills.

Two outside skills rewrite output, so any score about length or tone would move with them for reasons that have nothing to do with grounding.

If a session runs with an extra on, we log it and leave that session out of the analysis.
