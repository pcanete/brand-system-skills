# Installation

Every skill is a directory: `SKILL.md` plus its references, schemas, assets and
scripts. Both engines load it the same way — what changes is where the
directory goes.

Available skills:

- `skills/brand-dna-scanner`
- `skills/reference-scanner`
- `skills/reference-to-astro`

Install all three for the complete brand-to-web workflow. Install only the
relevant one when the task is narrower.

## Install for Claude

Copy the skill directory into a skills folder:

```text
~/.claude/skills/<skill-name>/SKILL.md        personal: available in every project
<project>/.claude/skills/<skill-name>/        project: travels with the repository
```

Claude reads the frontmatter `description` to decide when a skill applies, so
each skill must sit as a direct child of the skills folder — never the
repository root.

The skills call their own validators through the shell, so the session needs
permission to run `node`.

## Install for Codex

Give Codex the GitHub directory URL for the skill you want:

```text
Install this skill:
https://github.com/pcanete/brand-system-skills/tree/main/skills/brand-dna-scanner
```

Or copy the directory manually:

```text
~/.codex/skills/<skill-name>/SKILL.md
```

Same rule: Codex must see each skill as a direct child of `~/.codex/skills`.

## Script dependencies

All three skills ship a validator that the skill itself is expected to run.
After installing, install its dependencies inside the skill directory:

```bash
npm install
```

`reference-to-astro` additionally installs Playwright for visual QA, which may
need a browser binary:

```bash
npx playwright install chromium
```

Without those dependencies the skill still works as instructions, but its
verification gate cannot run — which is the part that keeps its output
honest.

## Updating

Installed copies do not track this repository. After pulling changes, reinstall
or re-copy the skill directories you use, and re-run `npm install` if the
validators changed.
