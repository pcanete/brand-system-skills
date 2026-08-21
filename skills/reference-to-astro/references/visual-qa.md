# Visual QA

A successful build is not equivalent to a faithful build.

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
