---
name: brand-dna-scanner
description: Extracts a complete evidence-backed Brand DNA from websites, brand guidelines, campaigns, social media, photography, video, packaging, product, UI, copy, motion, environmental design, and other brand touchpoints. Distinguishes core brand identity from category conventions, campaign-specific styling, and one-off executions. Produces BRAND_DNA, BRAND_EVIDENCE, BRAND_REPORT, BRAND_RULES, and a reusable BRAND_PROMPT.
license: MIT
metadata:
  version: "0.1.0"
---

# Brand DNA Scanner

Analyze a brand as a system.

The objective is not to produce a moodboard description.

The objective is to reconstruct the strategic, verbal, visual, behavioral,
experiential, and perceptual rules that make the brand identifiable and
reproducible across media.

## Standard outputs

Generate:

1. `BRAND_DNA.json`
2. `BRAND_EVIDENCE.json`
3. `BRAND_REPORT.md`
4. `BRAND_RULES.md`
5. `BRAND_PROMPT.md`

BRAND_DNA is the machine-readable identity model.

BRAND_EVIDENCE records provenance.

BRAND_REPORT is the detailed human-readable analysis.

BRAND_RULES defines operational brand constraints.

BRAND_PROMPT converts the DNA into reusable instructions for another
creative/design agent.

## Evidence-first behavior

Prefer:

OBSERVE
→ RECORD
→ COMPARE
→ IDENTIFY RECURRENCE
→ DISTINGUISH CORE FROM TEMPORARY
→ SYNTHESIZE

Never:

SEE ONE EXAMPLE
→ DECLARE IT A GLOBAL BRAND RULE

## Input scope

The skill may inspect:

- websites
- identity guidelines
- logos
- campaigns
- social media
- advertising
- photography
- films
- packaging
- physical products
- retail
- offices
- exhibitions
- presentations
- UI
- apps
- copy
- founder communication
- customer communication
- audio
- naming systems

Record which channels were actually observed.

Do not imply cross-channel consistency when only one channel was inspected.

## Scan modes

### QUICK

Broad perceptual signature.

Use for early exploration.

### STANDARD

Cross-channel working Brand DNA.

### FORENSIC

Use when the objective is high-confidence brand reproduction or creation of
future branded work.

FORENSIC mode should seek multiple independent touchpoints whenever available.

## Observation model

Every important conclusion should support:

- mode
- confidence
- salience
- recurrence
- consistency
- distinctiveness
- evidence_refs
- notes

Modes:

- exact
- derived
- inferred
- adaptive
- unknown

Read `references/evidence-model.md`.

## Core-vs-expression rule

The scanner must separate:

### BRAND CORE

Long-lived strategic and perceptual identity.

### BRAND SYSTEM

Repeatable rules used across touchpoints.

### CHANNEL EXPRESSION

How the brand behaves in a specific medium.

### CAMPAIGN EXPRESSION

Temporary campaign-specific variation.

### EXECUTION

A single creative artifact.

Do not promote execution-level behavior to Brand DNA without recurrence.

Read `references/core-vs-expression.md`.

## Phase 1 — Source inventory

Create an inventory of available sources.

For each source record:

- source ID
- URL/path
- channel
- date
- campaign/product
- locale
- authority
- current/legacy status
- evidence quality

Authority may include:

- official guideline
- official owned channel
- official campaign
- product
- third-party publication
- archive
- inferred

Prefer first-party current sources.

## Phase 2 — Brand core

Read `references/brand-core.md`.

Analyze when evidence supports it:

- purpose
- mission
- vision
- promise
- category
- positioning
- audience
- differentiation
- functional value
- emotional value
- symbolic value
- reasons to believe
- values
- principles
- cultural position
- archetypes
- personality
- tensions
- boundaries

Declared statements and inferred positioning must remain separate.

## Phase 3 — Verbal DNA

Read `references/verbal-dna.md`.

Analyze:

- voice
- tone
- syntax
- rhythm
- vocabulary
- naming
- claims
- slogans
- CTA language
- product descriptions
- microcopy
- storytelling
- evidence-vs-emotion balance
- recurring phrases
- banned/off-brand language when inferable
- localization/transcreation behavior

Do not infer global tone from one headline.

## Phase 4 — Visual DNA

Read `references/visual-dna.md`.

Analyze:

- logo
- color
- typography
- composition
- grid
- spacing
- shape language
- surfaces/materials
- patterns
- iconography
- hierarchy
- visual mass
- distinctive visual assets

Distinguish design-system constants from campaign art direction.

## Phase 5 — Photography

Read `references/photography-dna.md`.

Analyze:

- subject
- casting
- styling
- pose
- expression
- camera language
- framing
- crop
- lens character
- depth
- lighting
- environment
- set design
- texture
- color grade
- grain
- retouching
- recurring motifs
- prohibited-looking alternatives

## Phase 6 — Illustration, iconography and 3D

Read `references/graphic-assets-dna.md`.

Analyze:

- illustration
- iconography
- CGI
- 3D
- shape systems
- material systems
- recurring visual metaphors

## Phase 7 — Motion

Read `references/motion-dna.md`.

Analyze:

- motion philosophy
- speed
- easing character
- inertia
- amplitude
- stagger
- hierarchy
- entrance
- exit
- interaction
- loading
- scroll
- transitions
- ambient motion
- logo motion
- media motion
- typography motion
- reduced-motion behavior

Do not infer libraries.

## Phase 8 — Digital / web experience

Read `references/web-experience-dna.md`.

Analyze:

- homepage narrative
- navigation
- menus
- loaders
- component language
- cursor
- hover
- focus
- click/press
- drag
- swipe
- filtering
- fullscreen media
- scroll behavior
- scroll scenes
- page transitions
- video
- interactive scenes
- WebGL/canvas behavior
- responsive transformation
- runtime content
- localization
- accessibility behavior

Website-specific behavior must not automatically become global Brand DNA.

Label whether behavior is:

- brand-defining
- channel-specific
- campaign-specific
- implementation-specific
- unknown

## Phase 9 — Content system

Read `references/content-dna.md`.

Analyze:

- content categories
- editorial hierarchy
- narrative structure
- content depth
- educational vs promotional balance
- case studies
- testimonials
- metrics
- founder voice
- product stories
- behind-the-scenes
- CTA frequency
- proof mechanisms
- recurring content modules

## Phase 10 — Product / packaging / physical

When evidence exists analyze:

- form
- silhouette
- materials
- proportions
- labels
- typography
- tactile cues
- unboxing
- premium cues
- sustainability cues
- retail presentation
- relationship between physical and digital identity

## Phase 11 — Environmental identity

When evidence exists analyze:

- architecture/interiors
- signage
- wayfinding
- spatial typography
- material language
- lighting
- color
- exhibition/event design
- object placement
- sensory cues

## Phase 12 — Sonic identity

When evidence exists analyze:

- sonic logo
- voice
- music
- tempo
- instrumentation
- interaction sounds
- ambience
- silence
- recurring sonic motifs

## Phase 13 — Brand behavior

Analyze:

- customer-service tone
- onboarding
- selling style
- education
- exclusivity
- scarcity
- transparency
- community
- social responses
- error recovery
- cultural participation

Only infer behavior when enough evidence exists.

## Phase 14 — Distinctive asset analysis

Read `references/distinctive-assets.md`.

Identify assets such as:

- logo
- symbol
- color
- type
- shape
- photography treatment
- phrase
- naming pattern
- motion
- sonic cue
- product silhouette
- packaging
- interaction pattern
- recurring composition

Score each on:

- salience
- recurrence
- consistency
- distinctiveness
- ownership confidence

Do not confuse category codes with proprietary assets.

## Phase 15 — Competitive/category separation

When competitor/category evidence is available distinguish:

- category conventions
- category clichés
- brand-specific codes
- whitespace
- lookalike risk
- generic design decisions
- truly distinctive decisions

If no competitor evidence exists, mark category-specific conclusions as
inferred.

## Phase 16 — Contradiction analysis

Read `references/contradiction-analysis.md`.

Detect:

- guideline vs execution differences
- legacy vs current identity
- campaign exceptions
- regional differences
- channel differences
- old vs new logos
- inconsistent tone
- inconsistent colors
- conflicting positioning signals

Contradiction is evidence.

Do not average contradictions away.

## Phase 17 — Temporal analysis

Identify:

- timeless/core assets
- trend-dependent styling
- legacy identity
- new emerging identity
- campaign-only experiments
- seasonal behavior

Do not make a recent experimental campaign define the historical brand unless
it is clearly becoming the new system.

## Phase 18 — Recognition model

Determine:

- minimum recognizable asset set
- strongest three assets
- strongest five assets
- generic category assets
- weakly owned assets
- potentially proprietary combinations

Example:

Brand recognition may depend on:

specific type proportion
+ unusual crop style
+ one accent color

rather than logo alone.

## Phase 19 — Relationship graph

The most important synthesis step.

Connect strategic principles to actual execution.

Example:

PRINCIPLE:
Precision with cultural confidence.

VERBAL:
Short authoritative claims.

TYPOGRAPHY:
Tight, controlled display system.

LAYOUT:
Strict grid with deliberate exceptions.

PHOTOGRAPHY:
Technical objects treated as sculptural subjects.

MOTION:
Controlled and inertial rather than playful.

Do not output disconnected checklists only.

## Phase 20 — Brand rules

Generate:

### MUST PRESERVE

Identity-defining principles/assets.

### MAY ADAPT

Flexible rules whose intent matters more than literal execution.

### MUST NOT INTRODUCE

Patterns incompatible with the observed identity.

### CHANNEL-SPECIFIC

Behaviors that should not be universalized.

### CAMPAIGN-SPECIFIC

Temporary art-direction rules.

## Phase 21 — Master Brand Prompt

Generate BRAND_PROMPT.md.

It must be usable by another creative agent to produce new work in the
brand's language without copying existing executions.

The prompt should describe:

- strategic essence
- personality
- verbal rules
- visual rules
- photography
- motion
- content
- interaction when relevant
- distinctive assets
- allowed variation
- forbidden patterns

Do not include unsupported certainty.

## Completion gate

FORENSIC mode should not claim complete Brand DNA when:

- only one channel was observed
- major current touchpoints are missing
- evidence is almost entirely campaign-specific
- core identity is contradicted without resolution
- distinctive asset claims lack recurrence
- current vs legacy identity cannot be separated

## Final response

Return:

- scan mode
- source coverage
- perceptual signature
- strongest distinctive assets
- major contradictions
- evidence limitations
- generated artifacts

Do not expose hidden chain-of-thought.
