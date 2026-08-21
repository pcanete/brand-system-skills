# Interaction Analysis

Interaction analysis reconstructs behavioral grammar.

## Categories

- NAVIGATION
- HOVER
- FOCUS
- PRESS
- CLICK
- TOGGLE
- DRAG
- SWIPE
- CURSOR
- MEDIA
- FORM
- FILTERING
- FULLSCREEN_MEDIA
- DIRECT_MANIPULATION
- ROUTE_TRANSITION
- SCROLL_REACTIVE

## Interaction descriptor

A meaningful interaction should support:

- id
- target
- semantic_role
- trigger
- initial_state
- active_state
- final_state
- visual_changes
- layout_changes
- media_changes
- cursor_changes
- motion_ref
- reversible
- interruptible
- touch_equivalent
- keyboard_equivalent
- mode
- confidence
- salience
- evidence_refs
- notes

## Hover analysis

Inspect independently:

- text
- color
- opacity
- underline
- border
- background
- scale
- rotation
- position
- media
- mask
- clip-path
- cursor
- siblings
- parents

Do not inspect only the hovered element.

## Hover family detection

Synthesize repeated behavior into interaction families.

## Focus

Do not assume focus equals hover.

Reference fidelity never overrides fundamental keyboard accessibility.

## Press / active

Inspect pointer-down only when visually meaningful.

## Menus

Record:

- closed
- opening
- open
- closing
- route-transitioning when relevant
- overlay behavior
- scroll locking
- backdrop
- focus behavior
- content reveal
- close behavior
- interruption behavior

## Cursor systems

Record:

- native/custom
- shape
- size
- color
- blend mode
- label
- media preview
- lag/spring
- scale changes
- context changes
- touch fallback

## Drag and direct manipulation

Record:

- semantic purpose
- axis
- constraints
- momentum
- snap
- resistance
- cursor
- touch behavior
- spatial response
- edge behavior

Do not infer rendering technology from drag behavior.

## Filtering

Record:

- available options
- open/closed state
- single/multi-select
- collection changes
- animated reflow
- URL persistence
- reset behavior
- responsive behavior

Unknown values remain unknown.

## Fullscreen media

Record:

- entry action
- transition
- navigation inside
- close action
- keyboard behavior
- touch behavior
- background treatment
- media persistence

## Media interaction

Inspect:

- hover autoplay
- click-to-play
- mute controls
- fullscreen
- poster transition
- pause behavior
- scrub behavior
- looping
- reveal masks

## Stateful components

For accordions, tabs, filters, menus, carousels and modals, record the complete
state model.

## Reversibility

Record whether behavior reverses when user intent ends.

## Interruption

Determine whether rapid new input:

- queues
- interrupts
- snaps
- reverses
- is unknown

## Confidence

High confidence requires direct observation.

## Salience

Increase salience when interaction:

- changes large visual regions
- repeats
- defines navigation
- changes media
- changes cursor
- drives storytelling
- defines the site's personality

## Synthesis

STYLE_DNA should describe interaction grammar while REFERENCE_EVIDENCE stores
specific captures and state observations.
