# Astro Architecture

## Default

Use Astro for page composition and static content.

## Hydration decision

Ask for every interactive component:

Does this require persistent browser-side state?

NO:
Use `.astro` + CSS + optional lightweight script.

YES:
Consider an island.

## Client directive policy

Use `client:load` only for UI required immediately.

Prefer `client:idle` for secondary interaction.

Prefer `client:visible` for expensive below-the-fold UI.

Do not hydrate static display components.

## Preferred hierarchy

Astro
CSS
Vanilla TypeScript
GSAP
Interactive island
WebGL

Each step must be justified before moving down the hierarchy.

## Routing

Use filesystem routing unless requirements justify more complexity.

## Page transitions

First evaluate native View Transitions.

Use ClientRouter when navigation interception, persistence, or more advanced
transition control is required.

## Assets

Prefer Astro asset handling for local imagery where appropriate.

Preserve focal points and crop behavior.

## Styling

Prefer CSS custom properties for genuine shared tokens.

Do not introduce Tailwind unless requested or already present.

## Framework islands

React/Svelte/Vue should only be introduced if they simplify genuinely
stateful interaction.

Do not create framework islands solely to animate elements.
