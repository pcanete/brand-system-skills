---
name: visual-tuning-kit
description: Adds a bounded, development-only visual tuning layer to an Astro site so users can adjust declared typography, spacing, grid, alignment, content, section order, and behavior variants without becoming a free-form page builder. Produces validated tuning schema, approved values, and an auditable changeset. Use after an initial Astro implementation exists. Not for reference scanning, initial site generation, production CMS editing, or arbitrary drag-and-drop layout.
license: MIT
metadata:
  version: "0.2.0"
---

# Visual Tuning Kit

Turn a designed Astro implementation into a bounded review surface.

The site author decides what can be tuned. The user explores those controls,
saves a proposal, and explicitly approves values that the source project can
consume. The kit is not a visual page builder.

## Required inputs

1. An existing Astro project.
2. Its approved `SITE_BLUEPRINT.json`.
3. `TUNING_SCHEMA.json` following `schemas/tuning-schema.schema.json`.
4. `TUNING_VALUES.json` following `schemas/tuning-values.schema.json`.

Read `references/editor-boundary.md` before deciding which controls to expose.
Use `assets/TUNING_SCHEMA.example.json` as the structural example.
Use `assets/TUNING_VALUES.example.json` as the draft-values example.

## Safe editing model

Expose only deliberate controls:

- numerical design tokens through CSS custom properties;
- enumerated variants;
- boolean inspection or behavior switches;
- text and line breaks mapped to a content path;
- images chosen from a declared folder inside `public/`;
- section order chosen from a fixed set;
- grid span, alignment and bounded offsets represented as tokens or enums.

Do not expose arbitrary CSS, raw HTML, executable JavaScript, unrestricted
selectors, free absolute positioning, or unconstrained drag-and-drop.

## Workflow

1. Derive controls from the implementation and approved blueprint.
2. Give every control a reason, safe range or option set, and production target.
3. Validate schema and values:

```bash
node scripts/validate-tuning.mjs \
  --schema TUNING_SCHEMA.json \
  --values TUNING_VALUES.json
```

4. Scaffold the local tuner:

```bash
node scripts/scaffold-tuner.mjs --project /path/to/astro-project \
  --schema TUNING_SCHEMA.json --values TUNING_VALUES.json
```

5. Add `visualTunerDev()` from `scripts/visual-tuner-dev.mjs` to
   `vite.plugins` in `astro.config.mjs`, import
   `assets/VisualTunerLoader.astro` into the base layout and render it once.
   The plugin has `apply: "serve"`; the loader uses `import.meta.env.DEV` to
   load `assets/visual-tuner-client.js`. Both are absent from production.
6. Bind production content with `assets/tuning-runtime.mjs`; generate production
   CSS custom properties only from approved values with:

```bash
node scripts/build-approved-css.mjs --schema TUNING_SCHEMA.json \
  --values TUNING_VALUES.json --out src/styles/tuning-approved.css
```

7. Open the local site with `?tune=1` and experiment. Unapproved experiments
   stay in local storage.
   Elements with `data-tune-id` become contextual targets: click one to isolate
   its control, and double-click declared text to edit it inline. Image controls
   list only files from their declared `public/` folder. Section order changes
   only direct children inside the declared container id.
8. Saving creates a complete validated `TUNING_VALUES.json` and an auditable
   `TUNING_CHANGESET.json`.
9. Production consumes approved values but never ships the tuner panel or save endpoint.

Run `scripts/test-runtime.mjs` when changing the development plugin, client or
production helpers.

## Approval and source of truth

`TUNING_VALUES.json` is data, not an invisible code mutation. The project must
bind CSS controls through custom properties and content controls through stable
ids or content paths. Approved values may be folded back into source later, but
that is a separate reviewed change.

The agent must not mark values approved on the user's behalf.

## Completion gate

- Every value matches a declared control.
- Every control has a bounded target and rationale.
- Text controls map to known content paths.
- Image controls map to known content paths and a folder contained by `public/`.
- Order controls list every allowed section exactly once.
- The tuner and save endpoint are absent from production output.
- Desktop and mobile values are explicit where behavior differs.
- The user approved the final values.
