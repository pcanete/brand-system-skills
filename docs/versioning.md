# Versioning and Compatibility

Each skill follows semantic versioning independently.

| Skill | Current version | Contract |
| --- | ---: | --- |
| brand-dna-scanner | 0.4.0 | Brand DNA 0.1.x |
| reference-scanner | 0.7.0 | Web reference schemas 0.4.x |
| reference-to-astro | 1.0.0 | Web reference schemas 0.3.x–0.4.x + Site Blueprint 1.0 |

## Rules

- Patch: documentation, validation, or behavior fixes without contract changes.
- Minor: backward-compatible capabilities or optional schema fields.
- Major: incompatible schema, required-input, or output-contract changes.

Repository releases describe the included version of every skill. Skill
versions do not need to move in lockstep.

Use release tags such as:

- `brand-dna-scanner-v0.4.0`
- `reference-scanner-v0.7.0`
- `reference-to-astro-v1.0.0`
