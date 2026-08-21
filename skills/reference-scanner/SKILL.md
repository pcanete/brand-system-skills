---
name: reference-scanner
description: Analyzes reference websites and converts their visual system, layout logic, typography, media treatment, responsive behavior, interactions, motion language, page transitions, and WebGL characteristics into structured STYLE_DNA and REFERENCE_EVIDENCE artifacts for high-fidelity website reconstruction.
license: MIT
metadata:
  version: "0.3.0"
---

# Reference Scanner

Analyze an existing website as a design and interaction system.

The objective is not to copy source code or proprietary assets.

The objective is to reconstruct the site's:

- visual grammar
- spatial logic
- typography system
- component language
- media behavior
- responsive transformations
- interaction grammar
- motion language
- transition system
- optional WebGL behavior

Produce structured evidence another agent can implement.

## Required output

Produce:

1. `STYLE_DNA.json`
2. `REFERENCE_EVIDENCE.json`
3. `STYLE_REPORT.md`

STYLE_DNA is the synthesized implementation specification.

REFERENCE_EVIDENCE records what was actually observed.

STYLE_REPORT is the human-readable interpretation.

Never present an inferred behavior as directly observed.

## Capability detection

Before scanning, determine what inspection capabilities are actually available.

Possible capabilities include:

- page text/content access
- DOM inspection
- computed CSS inspection
- browser automation
- screenshots
- viewport resizing
- pointer interaction
- keyboard interaction
- scroll automation
- video/screen recording
- source/network inspection
- JavaScript inspection
- canvas/WebGL inspection

Do not claim evidence from capabilities that are unavailable.

Record available capabilities in REFERENCE_EVIDENCE.

If browser automation is unavailable, continue with reduced confidence and
document the limitation.

## Scan modes

### QUICK

Use for early exploration.

Inspect:

- homepage
- dominant visual language
- primary typography
- main layout
- representative media
- obvious interaction

Do not claim comprehensive coverage.

### STANDARD

Use for normal reconstruction.

Inspect:

- homepage
- important routes
- multiple viewport sizes
- navigation
- representative components
- interaction states
- scroll behavior
- media behavior
- responsive transformations

### FORENSIC

Use for high-fidelity reconstruction or complex interactive references.

Inspect:

- route inventory
- section inventory
- component families
- major interaction states
- hover/focus/active states
- scroll-linked sequences
- page transitions
- responsive behavior
- video/media behavior
- WebGL/canvas behavior
- repeated motion samples
- capability fallbacks

Default to FORENSIC when the reference is highly animated, experimental,
WebGL-driven, or award-site-like and high fidelity is requested.

Read `references/scanner-protocol.md`.

## Observation model

Every meaningful conclusion must be distinguishable from its evidence.

Use:

- exact
- derived
- inferred
- adaptive
- unknown

And a confidence score from 0.0 to 1.0.

Also assign perceptual salience from 0.0 to 1.0 when useful.

Read `references/observation-model.md`.

## Evidence-first rule

Prefer:

OBSERVE
→ RECORD
→ COMPARE
→ INFER
→ SYNTHESIZE

Never:

ASSUME
→ DESCRIBE AS FACT

## Phase 1 — Reconnaissance

Identify:

- canonical URL
- primary routes
- navigation structure
- language variants
- page families
- major content types
- visible interactive regions
- embedded media
- canvas/WebGL presence
- dynamic or personalized content

Record scan scope.

## Phase 2 — Capture matrix

Define routes, viewports, and states requiring evidence.

At minimum for STANDARD or FORENSIC evaluate representative:

- large desktop
- desktop/laptop
- tablet
- mobile

Do not assume desktop behavior describes mobile behavior.

## Phase 3 — Art direction

Read `references/visual-analysis.md`.

Analyze:

- visual personality
- editorial character
- density
- tension
- contrast
- hierarchy
- visual mass
- negative space
- repetition
- asymmetry
- composition
- brand expression

Describe principles rather than adjectives alone.

## Phase 4 — Typography

Identify when evidence allows:

- font family
- fallback family
- category
- optical character
- weight
- width
- size relationships
- line height
- tracking
- capitalization
- measure
- wrapping behavior
- responsive scale

Do not invent exact font identities from visual similarity alone.

## Phase 5 — Layout system

Capture:

- container behavior
- viewport-relative sizing
- grid logic
- alignment
- section rhythm
- horizontal margins
- vertical spacing
- overlap
- full-bleed behavior
- sticky/pinned structures
- negative space
- intentional irregularity

Classify important properties as:

- fixed
- fluid
- content-driven
- viewport-driven
- breakpoint-transformed

## Phase 6 — Component language

Identify reusable visual families.

Do not impose conventional component categories on intentionally editorial
layouts.

Record anatomy, states, visual rules, responsive behavior, and interaction.

## Phase 7 — Media

Analyze:

- image aspect ratios
- cropping
- object positioning
- masks
- video behavior
- embeds
- autoplay/mute/loop when observable
- poster states
- hover media
- fullscreen treatment
- media sequences
- interactive scenes
- loading/reveal behavior

Do not reuse third-party reference assets unless explicitly authorized.

## Phase 8 — Interaction

Read `references/interaction-analysis.md`.

Inspect representative:

- hover
- focus
- pointer down
- active
- menu open/close
- carousel navigation
- filtering
- fullscreen media
- direct manipulation
- drag/swipe
- cursor transformations
- link transitions
- media interaction

## Phase 9 — Motion

Read `references/motion-analysis.md`.

Classify animation as:

- entrance
- interaction
- scroll-triggered
- scroll-linked
- continuous
- media
- page transition
- WebGL

For complex long-form regions, represent coordinated behavior as scroll scenes
rather than isolated animation fragments.

## Phase 10 — Scroll behavior

Inspect:

- native scrolling
- smooth/inertial feel
- pinned regions
- sticky elements
- scrubbed sequences
- horizontal movement
- scroll snapping
- section reveals
- media scaling
- parallax
- progressive masking
- header behavior

## Phase 11 — WebGL detection

Read `references/webgl-detection.md`.

Separate observed behavior from suspected technology.

Do not prescribe WebGL when CSS, DOM animation, video, or Canvas 2D adequately
explain available evidence.

## Phase 12 — Responsive analysis

Read `references/responsive-analysis.md`.

Compare the same conceptual component across viewport classes.

Classify changes as:

- invariant
- scale
- reflow
- reorder
- replace
- omit
- recrop
- interaction substitution
- motion reduction
- layout mode change

## Phase 13 — Page transitions

When observable inspect:

- outgoing behavior
- incoming behavior
- persistent/shared media
- overlays
- background transitions
- navigation continuity
- scroll restoration
- interruption behavior

Describe observable behavior separately from technology hypothesis.

## Phase 14 — Synthesis

Read `references/synthesis-rules.md`.

Convert observations into reusable design rules rather than a transcript of
coordinates.

## Phase 15 — Constraints

Produce:

`must_preserve`

`may_adapt`

`must_not_introduce`

## Phase 16 — Coverage audit

Report separate coverage for:

- visual
- typography
- layout
- media
- interaction
- motion
- responsive
- transitions
- WebGL

A FORENSIC scan must not call itself complete when high-salience behavior
remains unobserved.

## Phase 17 — Output validation

Validate required structure against available schemas.

STYLE_DNA must not contradict REFERENCE_EVIDENCE.

## Final response

Return a short summary containing:

- scan mode
- coverage
- strongest design characteristics
- important uncertainty
- generated artifacts

Do not claim exact interaction fidelity where evidence was unavailable.
