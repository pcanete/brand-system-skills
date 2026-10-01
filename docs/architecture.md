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

### brand-manual-builder

Consumes `BRAND_DNA.json`, `BRAND_EVIDENCE.json` and a review composition
contract. It renders a standalone visual manual and records an explicit human
approval checkpoint. It does not discover new Brand DNA or silently promote
inferences; source paths and evidence references remain traceable.

### reference-scanner

Analyzes one reference website as a visual and behavioral system. It produces
`STYLE_DNA.json`, `REFERENCE_EVIDENCE.json`, and `STYLE_REPORT.md`.

Brand DNA may inform interpretation, but website-specific behavior remains
channel-specific unless cross-channel evidence supports promotion to brand core.

### reference-lab-builder

Consumes `STYLE_DNA.json`, `REFERENCE_EVIDENCE.json` and a declarative lab
spec. It renders a neutral interactive website that isolates evidenced
typography, components, responsive states, motion and behavior for human
approval. It uses invented content and generated geometry, not source assets.

### reference-to-astro

Consumes `STYLE_DNA`, `REFERENCE_EVIDENCE`, `CONTENT_MANIFEST`, and a build brief.
Before implementation it produces `SITE_BLUEPRINT.json`: the human-approved
mapping from real content to evidenced reference patterns, composition,
responsive behavior and acceptance criteria. Only an approved blueprint may
become an Astro implementation.

### visual-tuning-kit

Consumes an existing Astro implementation plus an explicit tuning schema. It
adds a bounded development-only review panel for declared tokens, text,
variants and section order. Saved values remain draft data until a person
approves them. Production may consume approved values, but never includes the
panel or its write endpoint.

## Contract ownership

### WordPress: criterio, contrato y ejecución

La revisión de responsabilidades conserva reference-to-astro como dueño de la
implementación Astro y visual-tuning-kit como ajuste acotado de desarrollo.
Ninguno debe convertirse en un editor WordPress ni perder su fuente canónica.
wordpress-publisher mantiene sus exportadores compilados y el generador
histórico de widgets como alternativa explícita; no adquiere un conector remoto.

La nueva capacidad independiente elementor-component-spec posee la decisión
por región y ELEMENTOR_COMPONENT_SPEC 0.1. Recibe diseño aprobado, HTML,
componentes Astro o STYLE_DNA con evidencia y brief editorial. No necesita
copiar los contratos de los scanners, generar PHP ni diseñar desde cero.

```text
diseño aprobado + evidencia + necesidades editoriales
  -> elementor-component-spec -> revisión humana del contrato
       COMPILED -> wordpress-publisher -> build/ZIP validado
       NATIVE   -> widgets existentes en documento Elementor
       CUSTOM   -> plugin propio del proyecto / widget de dominio
                    |
              executor apto (Novamira cuando disponible)
              inspección -> permiso de staging -> implementación
              -> evidencia visual -> revisión -> permiso de producción
```

El executor descubre capacidades y versiones reales. No existe dependencia de
una API Novamira supuesta: el contrato puede trasladarse a otro agente o equipo.
La aprobación de diseño no autoriza operaciones remotas. No se crea un ZIP de
widgets como paso predeterminado ni se modifica Elementor core.

En un sitio híbrido cada región editable tiene su spec y las regiones
compiladas se inventarían explícitamente. El punto de montaje debe verificarse
en destino: no se promete composición automática entre Astro y Elementor.
Los cinco casos y la definición completa están en
[contract.md](../skills/elementor-component-spec/references/contract.md).

### Alcance de esta incorporación

Se agrega skills/elementor-component-spec con instrucciones, schema, ejemplos,
validator y pruebas autónomas. Se cambia sólo el routing documental y versión
patch de wordpress-publisher, además de README, arquitectura, instalación,
versiones, changelog y registro/CI de pruebas. No se modifica el código de
exportación, reference-to-astro ni visual-tuning-kit; sus responsabilidades se
evaluaron arriba sin duplicarlas.

No se modifica un repositorio de Claude, una copia instalada del skill ni un
WordPress remoto. Esta incorporación entrega especificación y pruebas locales,
no un plugin Elementor probado en una instalación real.

## Propiedad de contratos

- Brand contracts belong to `brand-dna-scanner`.
- The manual composition and review contract belongs to `brand-manual-builder`.
- Web reference contracts are authored by `reference-scanner`.
- The neutral demonstration and approval contract belongs to `reference-lab-builder`.
- `reference-to-astro` carries exact copies of the web contracts so it remains
  independently installable.
- `SITE_BLUEPRINT` belongs to `reference-to-astro`: the scanner cannot map a
  target site whose content and business objective it does not own.
- Tuning schema and value contracts belong to `visual-tuning-kit`; the Astro
  builder may propose controls but cannot approve the user's choices.
- CI fails if shared web schemas drift.
- ELEMENTOR_COMPONENT_SPEC belongs to elementor-component-spec, including its
  revision approval digest. Implementation reports remain separate from the
  approved contract and are tied to that digest.

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
