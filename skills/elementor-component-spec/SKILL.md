---
name: elementor-component-spec
description: Decide si un diseño aprobado debe conservarse compilado, usar Elementor nativo o convertirse en un widget de dominio. Produce ELEMENTOR_COMPONENT_SPEC con controles, datos, responsive, evidencia y aceptación para Novamira u otro executor. Usar al planificar editabilidad WordPress desde HTML, Astro o STYLE_DNA; no diseña desde cero, no ejecuta cambios remotos ni genera ZIP por defecto.
license: MIT
metadata:
  version: "0.1.0"
---

# Elementor Component Spec

Separar criterio visual, especificación portable y ejecución. Novamira implementa
el contrato aprobado si sus capacidades reales lo permiten: no decide el diseño.

## Fronteras

- reference-scanner observa comportamiento y produce STYLE_DNA con evidencia.
- reference-to-astro implementa el diseño aprobado; Astro sigue siendo su fuente.
- visual-tuning-kit ajusta controles acotados, no crea edición WordPress.
- Este skill decide por región y especifica sin publicar.
- wordpress-publisher conserva los exportadores compilados. Su generador de
  widgets es una alternativa explícita cuando falta un executor apto, no el
  siguiente paso automático. No exige instalar los otros skills para validar.

## Procedimiento

1. Leer diseño aprobado, brief editorial, contenido autorizado y evidencia
   disponible: HTML, componente Astro, STYLE_DNA, capturas o inspección. Un URL
   solo no demuestra cómo se comporta un componente. Si faltan estados,
   responsive o fuente dinámica, pedirlos o registrar inferencias; no inventarlos.
2. Delimitar regiones. Preguntar quién edita qué, reutilización, datos y destino.
   No convertir toda una página porque dos áreas necesitan edición.
3. Leer `references/contract.md` y decidir:
   - COMPILED: sin necesidad editorial/dinámica; conservar build.
   - ELEMENTOR_NATIVE: widgets existentes mantienen fidelidad y edición simple.
   - ELEMENTOR_CUSTOM_WIDGET: pérdida relevante, fragmentación o complejidad;
     construir un componente de dominio, no micro-widgets.
   Si faltan datos para comparar, detener la decisión, inspeccionar y mantener
   el trabajo como borrador incompleto. Nunca elegir custom sólo por incertidumbre.
   Si datos dinámicos no requieren Elementor, aclarar una integración distinta;
   este contrato no pretende abarcar todas las arquitecturas WordPress.
4. Crear `ELEMENTOR_COMPONENT_SPEC.json` según
   `schemas/elementor-component-spec.schema.json`. Registrar fuentes locales y
   hashes, requisitos observados/inferidos/decididos, controles tipados, bindings,
   dependencias, estados, responsive, fallback y criterios verificables.
5. Ejecutar `npm ci` dentro del skill (Node 18+) y
   `scripts/validate-component-spec.mjs` con --spec, --evidence-root y
   --allow-draft para revisión. Leer y corregir todos los rechazos.
6. Presentar decisión, alternativas descartadas, preview/evidencia y límites.
   PAUSAR para aprobación humana del diseño y versión concreta. No inventar
   aprobación ni reutilizar la de un diseño diferente.
7. Registrar aprobación real según contract.md y validar sin --allow-draft.
   El hash comprueba integridad, no autoría humana, fidelidad o permisos.
8. Entregar contrato, fuentes y `references/NOVAMIRA_EXECUTION_GUIDE.md`.
   Usar `references/EXECUTOR_PROMPT.md` para el handoff. El executor inspecciona
   el destino y pide autorización de escritura específica, independiente de la
   aprobación del diseño. Sin Novamira, entregar a otro executor apto; ZIP sólo
   si se solicita esa alternativa. Nunca modificar core, terceros ni producción
   por el mero hecho de recibir un contrato.

## Recursos y pruebas

- `examples/ELEMENTOR_COMPONENT_SPEC.json`: card WooCommerce completa y ámbito
  híbrido con hero/footer compilados y dos regiones editables.
- `examples/ELEMENTOR_NATIVE.json` y `examples/COMPILED.json`: decisiones simples.
- `examples/REJECTED_DECORATIVE_WIDGET.json`: estructura válida, decisión
  contradictoria; debe fallar incluso con --allow-draft.
- `examples/reference.md`: fuente sintética, no prueba de un sitio real.
- `scripts/test-component-spec.mjs`: ejecutar con npm test dentro del skill.
  Los ejemplos son borradores deliberados; ninguno autoriza publicación.
