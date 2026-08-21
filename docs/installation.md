# Installation

## Install through Codex

Give Codex the GitHub directory URL for the skill you want:

```text
Install this skill:
https://github.com/pcanete/brand-system-skills/tree/main/skills/brand-dna-scanner
```

Available directories:

- `skills/brand-dna-scanner`
- `skills/reference-scanner`
- `skills/reference-to-astro`

Install all three when you want the complete brand-to-web workflow. Install
only the relevant skill when the task is narrower.

## Manual installation

Copy each desired skill directory directly under your local Codex skills
directory:

```text
~/.codex/skills/<skill-name>/SKILL.md
```

Do not place the repository root itself there; Codex should see each skill as a
direct child.

## Script dependencies

`brand-dna-scanner` and `reference-to-astro` include Node.js validation tools.
After manual installation, run `npm install` inside those skill directories.
`reference-scanner` has no package dependency.

The Playwright visual QA in `reference-to-astro` may require:

```powershell
npx playwright install chromium
```
