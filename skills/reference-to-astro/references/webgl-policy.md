# WebGL Policy

WebGL is evidence-driven.

## Valid reasons

Use WebGL when evidence shows:

- shader distortion
- GPU image transition
- displacement
- particle system
- true 3D object/scene
- depth-aware spatial interaction
- custom canvas renderer
- postprocessing
- texture-based warping

## Invalid reasons

Do not use WebGL because:

- the reference is an award site
- the site feels experimental
- Three.js would look impressive
- a visually complex effect has not been technically identified

## Architecture

Keep WebGL isolated from document semantics.

HTML remains responsible for:

- content
- SEO
- navigation
- accessibility

Canvas is an enhancement layer.

## Fallback

Every WebGL feature needs:

- reduced-motion behavior
- no-WebGL fallback
- mobile performance consideration
