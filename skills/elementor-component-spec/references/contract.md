# Contrato portable 0.1

## Decisiones y cinco casos

| Caso | Decisión | Motivo y límite |
| --- | --- | --- |
| Hero complejo no editable | COMPILED | La complejidad visual no justifica un widget. Conservar Astro y elegir front-page, page-template o embedded-page. |
| Heading, texto e imagen simples | ELEMENTOR_NATIVE | Widgets existentes suficientes sin pérdida relevante. Documentar mapping y ajustes. |
| Card WooCommerce compleja | ELEMENTOR_CUSTOM_WIDGET | Anatomía, estados y edición como unidad; precio/stock desde WooCommerce, nunca duplicados manualmente. |
| Listado JetEngine con filtros | Probablemente CUSTOM, tras inspección | Si widgets instalados ya resuelven fidelidad, filtros, paginación y edición, elegir NATIVE. Sin inspección no cerrar decisión. |
| Página Astro con sólo dos áreas editables | COMPILED mayoritario + contratos por área | Mantener hero, footer y regiones estables. Especificar por separado las dos áreas; no convertir toda la página. |

El modo describe una región, no todo el sitio. scope.keepCompiledRegions y
editableRegions son un inventario acordado; el componente debe pertenecer a su
grupo. El executor aún debe comprobar cómo montar áreas editables en el anfitrión:
este contrato no ofrece interpolación automática Elementor dentro de HTML Astro.
Datos dinámicos sin necesidad de Elementor pueden requerir otra integración;
resolver ese alcance antes de forzar uno de los modos editables.

## Campos obligatorios

- componentName/componentSlug/purpose: identidad, raíz CSS estable y objetivo.
- sourceReference: id, tipo, archivo relativo al evidence root, SHA-256,
  digestMode (bytes o utf8-lf para normalizar CRLF) y descripción honesta.
  No URLs como sustituto de evidencia, paths absolutos, traversal ni symlinks.
- publicationMode + decision: necesidad editorial/dinámica, reutilización,
  decoración, evaluación nativa, razones, mapping, scope e integración compilada.
- visualRequirements/layoutStructure/responsiveBehavior: anatomía y reglas a
  desktop/tablet/mobile. Cada requisito tiene id, statement, basis
  (observed/inferred/decision) y evidenceRefs. No convertir decisiones en observaciones.
- editableControls: id, label, type, default, responsive, required, dynamic,
  source y constraints. Sólo controles con necesidad editorial. El executor
  traduce tipos lógicos a APIs Elementor y confirma soporte, no evalúa cadenas.
- dynamicData: binding de fuente/field a targetPath lógico, tipo, escaping,
  fallback ante vacío/dependencia ausente. targetPath no es código ejecutable.
- dataSources: provider (WordPress, WooCommerce, ACF, JetEngine, campo personalizado,
  taxonomía, meta o ajuste de sitio), objeto, locator declarativo, acceso,
  dependencia y estado pending/verified. verified exige inspección real fuera del
  validador. No secretos, SQL arbitrario ni datos personales en el contrato.
- interactions/states: disparadores, estados origen/destino, teclado y evidencia.
- dependencies: proveedores/librerías, versiones a comprobar, obligatoriedad y fallback.
- cssIsolation/javascriptRequirements: raíz, selectores prohibidos, carga por
  instancia/página, necesidad real de JS, inicialización, limpieza y reduced motion.
- accessibilityRequirements/fallbackBehavior: resultados comprobables, no etiquetas
  vacías de “accesible” o “responsive”.
- acceptanceCriteria: prueba, resultado esperado y requirementRefs; cubrir
  requisitos, controles y bindings. Para fidelidad real usar visual-comparison,
  no aceptar una revisión de código como sustituto de capturas.
- implementationNotes/validationChecklist: restricciones y planificación de QA;
  cada criterio aparece en checklist. passed exige reviewer y evidencia.
- approval: borrador sin recibo, o aprobación de esta revisión exacta.
- executionPolicy: executorNeutral true, contenedor según modo,
  productionRequiresExplicitApproval true, remoteWritesAuthorized false siempre.

Schema completo: ../schemas/elementor-component-spec.schema.json.
Los tipos lógicos no prometen soporte universal de versiones Elementor. constraints
se validan para defaults y deben implementarse también en controles y servidor:
un contrato no sanitiza entradas de usuarios en WordPress.

## Validar y aprobar

Desde la carpeta del skill:

```bash
npm ci
node scripts/validate-component-spec.mjs --spec examples/ELEMENTOR_COMPONENT_SPEC.json --allow-draft
npm test
```

Para un proyecto: --spec apunta al contrato y --evidence-root a la carpeta que
contiene los archivos de sourceReference. Si se omite evidence-root, usa la
carpeta del contrato. Entregar ambos juntos; no depender de este monorepo.

La salida entrega specDigest, SHA-256 de JSON ordenado recursivamente excluyendo
approval. Tras aprobación real, copiar ese digest a approval.specDigest y
registrar approvedBy, approvedAt ISO 8601 y record (referencia al mensaje o
registro autorizado). Poner status approved y ejecutar de nuevo SIN --allow-draft.
No hay comando que apruebe por el usuario. El recibo no es firma criptográfica:
el executor debe corroborar que proviene del humano y corresponde al objetivo.

Cambiar contenido, evidencia o checklist invalida la aprobación; pedir una nueva.
Guardar resultados de implementación en ELEMENTOR_IMPLEMENTATION_REPORT.md,
vinculando specDigest, para no reescribir el contrato aprobado durante QA.
Un checklist pending es planificación, no un resultado probado.

--allow-draft sólo permite falta de aprobación; no desactiva schema, coherencia,
evidencia ni cobertura. Ejemplos sintéticos nunca cuentan como QA de un cliente.
Integridad de hashes no demuestra verdad, equivalencia visual, ausencia de
vulnerabilidades ni autorización remota.

## Límites del validador

Verifica estructura, decisión, cobertura, referencias, defaults, fuentes locales
y digest. No interpreta prosa, no descarga webs, no autentica al aprobador, no
inspecciona WordPress ni genera PHP. La comparación visual y el comportamiento
real son responsabilidad del executor y de la revisión humana.
