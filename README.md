# Brand System Skills

An open-source collection of evidence-driven Codex skills for moving from
brand understanding to reference analysis and Astro implementation.

## Resumen en español

Este repositorio reúne tres skills independientes pero compatibles para
analizar una marca, estudiar cómo una web expresa un lenguaje visual y
reconstruir ese lenguaje en Astro con contenido autorizado.

## Skills

| Skill | Version | Purpose |
| --- | --- | --- |
| [`brand-dna-scanner`](skills/brand-dna-scanner/) | 0.1.0 | Extract cross-channel Brand DNA with evidence, rules, and reusable prompts. |
| [`reference-scanner`](skills/reference-scanner/) | 0.3.0 | Turn a reference website into `STYLE_DNA`, evidence, and a style report. |
| [`reference-to-astro`](skills/reference-to-astro/) | 0.3.0 | Build an Astro site from reference evidence and supplied client content. |

## System flow

```text
Brand touchpoints                    Reference website
        |                                    |
        v                                    v
brand-dna-scanner  ---- optional ----> reference-scanner
                                             |
                                             v
                                        STYLE_DNA
                                             |
                           client content + build brief
                                             |
                                             v
                                   reference-to-astro
                                             |
                                             v
                                      Astro website
```

Each skill remains independently installable. Brand DNA informs the web
workflow but is not required for every reference reconstruction.

## Install in Codex

Ask Codex to install one or more skill directories from this repository:

```text
Install brand-dna-scanner from
https://github.com/pcanete/brand-system-skills/tree/main/skills/brand-dna-scanner
```

Use the equivalent path for `reference-scanner` or `reference-to-astro`.
See [installation instructions](docs/installation.md) for manual installation
and dependencies.

## Principles

- Evidence is kept separate from inference.
- Brand core is kept separate from campaigns and one-off executions.
- Reference fidelity does not authorize copying source code or third-party assets.
- Supplied client content remains authoritative.
- Website-specific behavior is not automatically promoted into global Brand DNA.
- Every skill can be installed and versioned independently.

## Development

```powershell
npm ci --prefix skills/brand-dna-scanner
npm ci --prefix skills/reference-to-astro
npm test
```

The repository check validates JSON, JavaScript syntax, local skill references,
schema parity, Brand DNA examples, and the synthetic reference-system fixture.

## Documentation

- [Architecture](docs/architecture.md)
- [Installation](docs/installation.md)
- [Versioning and compatibility](docs/versioning.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## License

MIT. The license covers this repository's original code and documentation. It
does not grant rights to third-party brands, websites, media, fonts, trademarks,
or client materials analyzed with these skills.
