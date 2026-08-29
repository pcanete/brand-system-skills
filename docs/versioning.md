# Versioning and Compatibility

Each skill follows semantic versioning independently.

| Skill | Current version | Contract |
| --- | ---: | --- |
| brand-dna-scanner | 0.4.0 | Brand DNA 0.1.x |
| brand-manual-builder | 0.1.0 | Brand Manual Spec 0.1 |
| reference-scanner | 0.7.0 | Web reference schemas 0.4.x |
| reference-lab-builder | 0.1.0 | Reference Lab Spec 0.1 |
| reference-to-astro | 1.0.0 | Web reference schemas 0.3.x–0.4.x + Site Blueprint 1.0 |
| visual-tuning-kit | 0.1.1 | Tuning Schema and Values 0.1 |

## Rules

- Patch: documentation, validation, or behavior fixes without contract changes.
- Minor: backward-compatible capabilities or optional schema fields.
- Major: incompatible schema, required-input, or output-contract changes.

Repository releases describe the included version of every skill. Skill
versions do not need to move in lockstep.

Use release tags such as:

- `brand-dna-scanner-v0.4.0`
- `brand-manual-builder-v0.1.0`
- `reference-scanner-v0.7.0`
- `reference-lab-builder-v0.1.0`
- `reference-to-astro-v1.0.0`
- `visual-tuning-kit-v0.1.1`
