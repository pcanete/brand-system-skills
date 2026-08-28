# Architecture

## Independent skills, compatible contracts

The repository is a monorepo for maintenance, not a single coupled skill.

### brand-dna-scanner

Analyzes multiple brand touchpoints and produces:

- `BRAND_DNA.json`
- `BRAND_EVIDENCE.json`
- `BRAND_REPORT.md`
- `BRAND_RULES.md`
- `BRAND_PROMPT.md`

Its output can inform websites, campaigns, presentations, social content, and
other production systems.

### reference-scanner

Analyzes one reference website as a visual and behavioral system. It produces
`STYLE_DNA.json`, `REFERENCE_EVIDENCE.json`, and `STYLE_REPORT.md`.

Brand DNA may inform interpretation, but website-specific behavior remains
channel-specific unless cross-channel evidence supports promotion to brand core.

### reference-to-astro

Consumes `STYLE_DNA`, `REFERENCE_EVIDENCE`, `CONTENT_MANIFEST`, and a build brief.
Before implementation it produces `SITE_BLUEPRINT.json`: the human-approved
mapping from real content to evidenced reference patterns, composition,
responsive behavior and acceptance criteria. Only an approved blueprint may
become an Astro implementation.

## Contract ownership

- Brand contracts belong to `brand-dna-scanner`.
- Web reference contracts are authored by `reference-scanner`.
- `reference-to-astro` carries exact copies of the web contracts so it remains
  independently installable.
- `SITE_BLUEPRINT` belongs to `reference-to-astro`: the scanner cannot map a
  target site whose content and business objective it does not own.
- CI fails if shared web schemas drift.

The same applies to verification. `scripts/lib/web-contracts.mjs` holds the
gates for the web contracts and is duplicated byte-identically in
`reference-scanner` and `reference-to-astro`: the scanner verifies what it
produced, the builder verifies what it received, and neither depends on the
other being installed. CI fails if the copies drift.

## Verification

Each skill validates its own output, and the validators check two different
things.

**Shape** — the documents match their JSON Schema. Necessary, and easy to
satisfy without saying anything true.

**Support** — the gates. Observations recorded as observed carry evidence;
declared coverage is backed by what the scan recorded; claims the contract
itself marks as salient appear in `observations`; in brand, recurrence traces
back to at least two distinct sources; and every block that asserts anything
has an evidence-backed observation behind it.

That last gate exists because the others shared a flaw: each read a number the
author wrote about their own work. Any gate driven by a self-reported score is
satisfied by reporting a lower score, and omitting the field entirely was
cheaper still. A contract asserting an exact typeface, a twelve-column grid and
a named easing curve passed every gate by declaring itself uncertain. The fix
was to stop reading the scores and start reading the claims:
`tests/rejected-evasive/` holds that contract, and it must keep failing.

The split matters because the failure mode of an agent writing these contracts
is not malformed JSON. It is a well-formed document full of confident claims
nobody can trace. `--lenient` runs shape only, for work in progress.

`tests/rejected/` holds fixtures that must fail. If they ever pass, the gates
stopped working and the repository check fails.
