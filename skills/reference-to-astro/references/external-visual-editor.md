# External visual editor workflow

Use this workflow when a user wants free-form visual adjustment beyond the
bounded `visual-tuning-kit`. VvvebJs is a suitable editor because it can import
and export ordinary HTML and CSS. The editor is replaceable; the revision
contract is the durable part.

## Boundary

The editor receives a copy of compiled HTML. Its export is review evidence,
never Astro source and never a deployable build. Compiled HTML has lost
component ownership, content-manifest authority, tokens, responsive intent and
behavior lifecycle.

Keep this package:

```text
REVISION_PACKAGE/
├── original/
│   └── index.html
├── edited/
│   ├── index.html
│   └── editor.css
├── REVISION_CHANGESET.json
└── screenshots/
    ├── desktop.png
    ├── tablet.png
    └── mobile.png
```

Copy the build baseline before opening the editor. Never overwrite `original`.
VvvebJs helper attributes may be removed by its exporter, but preserve every
`data-rta-id` and `data-tune-id`.

## Translate the export

Run with JavaScript disabled so inspection cannot execute the page:

```bash
node scripts/review-changeset.mjs \
  --original REVISION_PACKAGE/original/index.html \
  --edited REVISION_PACKAGE/edited/index.html \
  --edited-css REVISION_PACKAGE/edited/editor.css \
  --out REVISION_PACKAGE/REVISION_CHANGESET.json
```

If the project knows its runtime vocabulary, add comma-separated
`--ignore-classes` or `--ignore-attributes`. The command filters state newly
spread across three or more elements and records it. State-like classes on one
element are only suspected and require human review.

Review missing, added and duplicate anchors. Coverage is diagnostic rather than
a universal percentage gate: an unexpectedly low share means more meaningful
regions need stable anchors before another editing pass.

## Apply safely

The changeset does not mutate source. A person must decide whether each approved
change belongs in:

- `CONTENT_MANIFEST.json` for content;
- a component for owned structure or local styles;
- shared tokens for a genuine system-level decision;
- `SITE_BLUEPRINT.json` when composition or behavior intent changed.

Translate values into the units and abstractions already owned by that source.
Do not paste editor selectors blindly into global CSS. Rebuild, recreate the
three screenshots, test interaction and reduced motion, and compare the result
with the approved revision.
