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

Consumes `STYLE_DNA`, `REFERENCE_EVIDENCE`, `CONTENT_MANIFEST`, and a build brief
to construct and verify an Astro implementation.

## Contract ownership

- Brand contracts belong to `brand-dna-scanner`.
- Web reference contracts are authored by `reference-scanner`.
- `reference-to-astro` carries exact copies of the web contracts so it remains
  independently installable.
- CI fails if shared web schemas drift.
