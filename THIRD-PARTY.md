# Third-party components

Two kinds of borrowed material live here, and they are handled differently.

- **Fetched at a pinned commit** by `scripts/fetch-optional.ps1`. The code is not stored in this repository.
- **Vendored**, copied into the repository and shipped with it.

## Fetched, not stored

| Component | Repository | Commit | Licence |
|---|---|---|---|
| claude-video | bradautomates/claude-video | `03ceb42f7fa2c4439aca01752118044baabffb8f` | MIT |
| academic-research-skills | Imbad0202/academic-research-skills | `f1c41953418f0da555a0dcef5f9045f9ebffdd88` | CC-BY-NC-4.0 |
| mattpocock-zh-CN | vinvcn/mattpocock-skills-zh-CN | `d97aa0788b120c9363ebddfd47b87618d9314c3e` | MIT |

Attribution for academic-research-skills, required by its licence:

```
Based on Academic Research Skills by Cheng-I Wu
https://github.com/Imbad0202/academic-research-skills
```

It is used for non-commercial coursework. If you intend commercial use, remove
that component. The NonCommercial term does not extend to the rest of this
repository, which is MIT.

## Vendored

| Component | Where | Licence | Installed by |
|---|---|---|---|
| i-have-adhd | `skills/i-have-adhd/` | MIT, ayghri/i-have-adhd at `1ecea1993b7fce257ffbd686c070948b5e07eda6` | `install.ps1`, default |
| humanizer | `skills/humanizer/` | MIT, Siqi Chen, v3.1.0 | `install.ps1`, default |
| eight academic skills | `third-party/academic/` | MIT, K-Dense Inc. | `install-academic.ps1`, optional |

The eight academic skills are citation-management, paper-lookup, peer-review,
scientific-slides, scientific-visualization, venue-templates, pptx-posters and
uncertainty-and-units.

They are copied unmodified. Each carries `license: MIT` and
`skill-author: K-Dense Inc.` in its own front matter. MIT requires that notice
to travel with the code, so do not strip the front matter when copying these
skills elsewhere.

## Reference only

| Component | Repository | Licence | Note |
|---|---|---|---|
| awesome-mcp-servers | punkpeye/awesome-mcp-servers | MIT | A catalogue of MCP servers, consulted before writing our own |

## Why commits are pinned

Several of these projects ship daily. An unpinned dependency makes a study
irreproducible a week after it starts.
