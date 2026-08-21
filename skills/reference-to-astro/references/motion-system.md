# Motion System

## Principle

Motion must reproduce reference behavior.

Do not add motion merely to make a site feel more premium.

## Categories

- ENTRANCE
- INTERACTION
- SCROLL_TRIGGERED
- SCROLL_LINKED
- SCROLL_SCENE
- CONTINUOUS
- TRANSITION
- MEDIA
- WEBGL

## Minimum descriptor

Each meaningful sequence should define:

- target
- trigger
- initial state
- final state
- duration or duration class
- ease or ease character
- delay
- stagger
- scroll relationship
- repeat
- responsive behavior
- reduced-motion behavior
- confidence

## CSS vs GSAP

Use CSS for:

- basic hover transitions
- simple opacity
- simple transform state changes

Use GSAP for:

- choreography
- timelines
- scroll-linked progression
- pinning
- complex stagger
- dynamic values
- interruptible sequences

## Scroll

Differentiate triggered from linked.

Do not infer scrub merely because animation happens during scrolling.

## Timing

If timing is not directly observed, mark it inferred.

Prefer consistency with overall motion language over arbitrary precision.

## Performance

Prefer transform and opacity.

Avoid unnecessary layout-triggering animation.

## Reduced motion

Provide meaningful static or low-motion alternatives.

Do not simply set every duration to zero if that destroys hierarchy.
