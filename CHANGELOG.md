# Changelog

## Unreleased

`brand-dna-scanner` 0.2.0 · `reference-scanner` 0.4.0 · `reference-to-astro` 0.4.0

Contracts are unchanged: Brand DNA stays `0.1.x` and the web schemas stay
`0.3.x`. Documents that validated before still validate — but a document with
no evidence behind it no longer passes.

### The gates

The validators now check support, not only shape. Across both contract
families:

- an observation recorded as `exact` or `derived` must carry `evidence_refs`;
- declared coverage must be backed by observations in that dimension, and for
  motion, responsive and interaction by recorded samples;
- claims the contract itself marks as salient and confident must appear in
  `observations`, where they can be traced;
- a contract that records nothing is rejected.

In `brand-dna-scanner`, one more: **recurrence must be earned**. Anything
scored recurrent has to trace back to at least two distinct sources — the
skill's founding rule, made executable.

`--lenient` restores shape-only checking for work in progress.

### Wiring

The skills now invoke their own tooling. Every SKILL.md names the schemas,
templates and scripts it ships, and states where each one runs: an input gate
before building, a verification gate before delivering. Previously those files
existed in the repository without any path from the skill's instructions to
them.

- `reference-scanner` gained `scripts/validate-style-dna.mjs`. It can now
  verify its own output without `reference-to-astro` installed.
- `reference-to-astro` runs `validate-inputs.mjs` as a gate before
  construction, and names `build-check`, `audit-assets` and `visual-qa` at
  their QA steps.
- `brand-dna-scanner` runs `validate-brand-dna.mjs` before presenting results.

### Visual QA

- Page loads no longer wait for network idle, which a continuously animated or
  WebGL reference never reaches. Load is bounded and then settled.
- Console errors now fail the run. Known third-party noise goes in the
  profile's `ignore_console`, where the decision stays visible.
- The reduced-motion pass covers every route, not just the first one.
- `audit-assets.mjs` and `visual-qa.mjs` accept `--project`, like
  `build-check.mjs`.
- The report states plainly that captures are evidence, not a verdict: nothing
  here compares the result to the reference automatically.

### Repository

- The repository check now fails on unreferenced bundled files, version drift
  between `SKILL.md`, `package.json` and the docs, and drift in the duplicated
  `scripts/lib/web-contracts.mjs`.
- `tests/rejected/` holds fixtures that must be rejected. If they ever pass,
  the gates stopped working and CI fails.
- Examples and assets are held to the same synthetic-source rule as fixtures.

### Both engines

Skills install into Claude and Codex alike; installation documents both.
Descriptions now state when a skill applies and when it does not, so the wrong
one is not picked. `brand-dna-scanner` moved its optional channels and its
synthesis detail into `references/`, keeping SKILL.md to what is always
needed.

## Initial skill versions

- `brand-dna-scanner` 0.1.0
- `reference-scanner` 0.3.0
- `reference-to-astro` 0.3.0
