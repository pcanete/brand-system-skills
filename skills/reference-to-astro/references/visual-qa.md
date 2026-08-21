# Visual QA

A successful build is not equivalent to a faithful build.

## What the tooling does, and what it does not

`scripts/visual-qa.mjs` drives a headless browser from `QA_PROFILE.json` and
produces the material these passes need: a full-page baseline per route and
viewport, a before/after pair for each declared interaction, a reduced-motion
pass over every route, and any console or page error that appeared.

It does not compare anything to the reference. There is no automatic diff and
no score. The comparison below is human work performed against the captures;
the tool exists so that work happens on evidence instead of memory.

Two things it does decide: a page error, and a console error not listed in the
profile's `ignore_console`, each fail the run. Silencing known third-party
noise is a decision that belongs in the profile, where it stays visible.

## Required viewports

At minimum inspect:

- 1440 × 900
- 1280 × 800
- 768 × 1024
- 390 × 844

Add reference-specific viewports when needed.

## Pass A — Geometry

Compare:

- content width
- section height
- major alignments
- whitespace
- visual weight
- image scale
- cropping

## Pass B — Typography

Compare:

- family
- weight
- width
- scale
- line height
- tracking
- measure
- line breaks

## Pass C — Surface

Compare:

- colors
- borders
- radius
- shadows
- texture
- opacity

## Pass D — Interaction

Test:

- hover
- keyboard focus
- active
- menu
- carousel
- filtering
- fullscreen
- drag
- direct manipulation
- links
- cursor
- touch equivalents

## Pass E — Motion

Compare:

- trigger
- direction
- sequence
- amplitude
- duration
- easing
- stagger
- scroll relationship
- scene choreography

## Pass F — Responsive

Check whether design intent survives.

## Pass G — Technical

Check:

- production build
- browser console
- missing assets
- overflow
- layout shift
- reduced motion
- keyboard use

## Priority

P0:
broken functionality

P1:
composition, hierarchy, typography, media geometry

P2:
motion, interaction detail

P3:
minor decoration
