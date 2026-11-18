# Academic skills

Eight skills for research work. Borrowed from K-Dense Inc., MIT licensed, vendored under `third-party/academic/`.

They are not installed by default. Each one is heavy, and heavy skills grab turns they were not invited to. Install the ones you need for the task in front of you.

## What each one does

| Skill | What it does | Reach for it when |
|---|---|---|
| citation-management | Searches OpenAlex, PubMed and Google Scholar, pulls metadata, validates a reference list, writes BibTeX | You have a reference list and half the entries are wrong |
| paper-lookup | Queries eighteen scholarly APIs at once, returns provenance and open-access status | You need a paper that exists and can be read |
| peer-review | Drafts an evidence-bounded review, with claims traced to the manuscript | You want to argue with your own draft before a marker does |
| scientific-slides | Builds research talk decks | You have to present the project |
| scientific-visualization | Produces publication-ready figures, and checks they are readable and truthful | You have data and need one clear chart |
| venue-templates | Formats a manuscript, poster or grant to a venue's own rules | The brief says APA, or the conference has a template |
| pptx-posters | Builds and audits an editable conference poster in PowerPoint | The deliverable is a poster, not slides |
| uncertainty-and-units | Converts units, propagates measurement uncertainty, checks significant figures | Numbers came off an instrument and you have to report an error bar |

## The three worth knowing first

For a coursework project, these three do the most work.

### peer-review

What it does. Takes your manuscript and produces a structured review: summary, strengths, weaknesses, and a list of claims that the evidence does not carry.

What you get. The kind of comment a marker would write, but before submission. It is set up to trace every criticism back to a specific sentence, so you cannot dismiss the review as vague.

When to use it. Two days before the deadline, on a draft you consider finished.

What to watch. It will find problems. Reading its output the night before a deadline is a bad plan.

### scientific-visualization

What it does. Designs and audits figures. Checks contrast, colour accessibility, axis honesty, missing data.

What you get. One chart that survives being shrunk to half a page, and does not mislead. The audit part matters more than the drawing part.

When to use it. Anytime a number has to become a picture.

What to watch. It will refuse some choices, such as a truncated y-axis on a bar chart. It is right about that.

### citation-management

What it does. Takes a DOI or a title, finds the paper, extracts the metadata, formats the entry, and flags entries it cannot verify.

What you get. References that exist, with the right year and the right spelling. The flagging is the useful half. An entry it cannot verify is usually an entry that was never real.

When to use it. Before submission, on the whole reference list.

What to watch. Google Scholar lookups can be rate-limited. The OpenAlex and Crossref routes are more reliable.

## The other five

### paper-lookup

Eighteen scholarly APIs behind one call, with provenance attached to every result. Use it when you need breadth, or when you suspect you are missing the paper that matters.

### scientific-slides

Slide decks for research talks. Not a general presentation tool. It assumes a method, a result and a contribution, and it will ask for them.

### venue-templates

Journal, conference, poster and grant formats, with the LaTeX scaffolds bundled. Use it when the formatting rules are long enough that you would get them wrong by hand.

### pptx-posters

Editable posters in `.pptx`, plus a check that the print size and the package are correct. The audit half catches the usual disaster, a poster that is 2 cm too wide for the printer.

### uncertainty-and-units

Unit conversion and uncertainty propagation on top of `pint` and `uncertainties`. Use it when a reported number needs a credible error bar, or when units get mixed and nobody noticed.

## Installing them

```powershell
.\scripts\install-academic.ps1                    # all eight
.\scripts\install-academic.ps1 -Only peer-review  # just one
```

They copy into your agent's skills folder, same as the other skills.

## Why they are not on by default

Two reasons, both practical.

These skills are large. Several carry reference material and scripts, and that material sits in front of the assistant every turn.

Their triggers overlap. A question about a report can wake three of them at once, and then you are reading three sets of instructions instead of writing the report.

Install the one you need, use it, remove it. That behaviour is the whole argument of this project applied to its own toolkit.

## Attribution

MIT licensed. Authored by K-Dense Inc. Full attribution in [THIRD-PARTY.md](../THIRD-PARTY.md).
