# Brand System Skills

**Un sistema abierto de skills para pasar de señales dispersas de una marca a una implementación web fiel, explicable y verificable.**

Una marca no es solamente una paleta. Una web no es solamente una captura de pantalla. Y reconstruir una referencia no debería significar copiar su código ni confundir su identidad con la del cliente.

`brand-system-skills` organiza ese trabajo en cinco capacidades independientes y compatibles: extraer el ADN de una marca, convertirlo en un checkpoint visual aprobable, analizar una web de referencia, probar ese sistema en un laboratorio neutral y convertir los contratos aprobados en un sitio Astro con contenido real.

El repositorio está pensado para diseñadores, desarrolladores, equipos de marca y agentes de IA que necesitan trabajar con más criterio que una indicación como «hacelo parecido a esto».

## El problema que resuelve

En un proyecto real suelen convivir fuentes incompletas o contradictorias:

- una web existente;
- un manual de marca;
- redes sociales y campañas;
- fotografías, videos y piezas editoriales;
- una referencia externa elegida por su estructura o su atmósfera;
- contenido nuevo provisto por el cliente.

Sin un método, esas señales terminan convertidas en decisiones arbitrarias. Este sistema las transforma en contratos explícitos: qué está observado, qué fue inferido, qué pertenece al núcleo de la marca, qué corresponde solamente al canal web y cómo debe implementarse.

El objetivo no es automatizar el gusto. Es hacer visible el razonamiento para que la dirección creativa, la producción y la validación puedan trabajar sobre una misma base.

## Las seis capas

| Capa | Skill | Pregunta que responde | Salida principal |
| --- | --- | --- | --- |
| Identidad | `brand-dna-scanner` | ¿Qué hace reconocible y consistente a esta marca? | `BRAND_DNA.json` y evidencia asociada |
| Checkpoint de marca | `brand-manual-builder` | ¿Cómo se ve y qué debe aprobar una persona antes de producir? | Manual de identidad web navegable |
| Expresión web | `reference-scanner` | ¿Cómo funciona visualmente esta web de referencia? | `STYLE_DNA.json` y evidencia asociada |
| Laboratorio | `reference-lab-builder` | ¿Entendimos realmente sus componentes y comportamientos? | Web neutral interactiva y aprobable |
| Implementación | `reference-to-astro` | ¿Cómo se reconstruye ese sistema con el contenido del cliente? | Proyecto Astro verificado |
| Ajuste visual | `visual-tuning-kit` | ¿Qué detalles declarados necesita ajustar una persona sobre la implementación? | Valores validados y aprobables |
| Publicación WordPress | `wordpress-publisher` | ¿Cómo convive la portada compilada con un WordPress existente? | Plugin validado y ZIP instalable |

```text
Fuentes de marca ──> brand-dna-scanner ──> BRAND_DNA
                                              │
                                              v
                                    brand-manual-builder
                                      revisión + aprobación
                                              │
Web de referencia ─> reference-scanner ─> STYLE_DNA
                                              │
                                              v
                                    reference-lab-builder
                                      revisión + aprobación
                                              │
Contenido + assets + brief ───────────────────┤
                                              v
                                      SITE_BLUEPRINT
                                  revisión + aprobación
                                              │
                                              v
                                    reference-to-astro
                                              │
                                              v
                                  sitio Astro + QA visual
                                              │
                                              v
                                    visual-tuning-kit
                                 ajuste acotado + aprobación
                                              │
                                              v
                                    wordpress-publisher
                              plugin de portada + validación
```

Las capas se complementan, pero no se confunden. El ADN de marca puede orientar una web, una campaña, una presentación o una pieza social. El ADN visual de una referencia web describe ese canal específico. La implementación consume ambos criterios sin apropiarse de la identidad de terceros.

## Principios de funcionamiento

### Evidencia antes que certeza

Cada afirmación relevante debe poder rastrearse hasta una fuente observada. Cuando algo no está demostrado, se registra como inferencia con un nivel de confianza, no como una verdad de marca.

### Núcleo antes que ejecución

El sistema distingue entre reglas duraderas —voz, personalidad, códigos visuales, tensiones y límites— y decisiones propias de una pieza o canal. Esto evita convertir una moda de campaña en una regla permanente.

### Comportamiento antes que tecnología

Una referencia web se analiza por su jerarquía, ritmo, composición, responsive, movimiento, interacción y uso de medios. El framework original de la referencia no define el resultado.

### Fidelidad sin copia

La reconstrucción busca equivalencia perceptual y funcional. No copia código propietario, textos, logos ni activos protegidos. La referencia aporta lógica visual; el cliente aporta identidad y contenido.

### Verificación, no intuición aislada

Los contratos JSON se validan contra esquemas y la implementación incluye controles automatizados. El resultado se puede revisar, repetir y mantener.

### La disciplina se verifica, no se pide

Un principio que solo está escrito en prosa es una exhortación: quien produce el contrato puede ignorarlo sin que nada lo señale. Por eso cada skill trae un validador que corre sobre su propia salida, y ese validador no revisa solamente la forma.

Rechaza un contrato bien armado pero sin sustento:

- una observación registrada como `exact` o `derived` sin ninguna evidencia detrás;
- una cobertura declarada que el escaneo no ganó —`motion: 0.8` sin una sola muestra de movimiento—;
- una afirmación que el propio contrato marca como saliente y confiable pero que no aparece en `observations`, donde podría rastrearse;
- en marca, un activo declarado **recurrente** que se apoya en una sola fuente. La recurrencia significa literalmente que algo aparece más de una vez: exigir dos fuentes distintas es lo que impide que una campaña espectacular se convierta en ADN;
- **cualquier bloque que afirme algo sin una observación respaldada detrás.** Describir la tipografía obliga a decir dónde se la vio.

Esa última compuerta existe porque las otras eran evadibles. Todas leían números que el propio autor escribe sobre su trabajo —confianza, saliencia, cobertura—, y cualquier control que lea esos números se satisface escribiendo uno más bajo. Un contrato que afirmaba una tipografía exacta y una grilla de doce columnas pasaba entero declarándose inseguro. **Bajar un score no es bajar una afirmación:** `family: "Söhne"` afirma lo mismo con 0.55 que con 0.99. Por eso la última compuerta ignora los números y mira lo que el documento dice.

Frente a un rechazo hay dos respuestas honestas: registrar la evidencia que falta, o no hacer la afirmación. El modo `--lenient` verifica solo la forma y existe para trabajo en curso, no para entregar.

## Los skills

### 1. `brand-dna-scanner`

Extrae un sistema de identidad respaldado por evidencia a partir de sitios, brand books, campañas, redes sociales, piezas editoriales y otros puntos de contacto.

Produce:

- `BRAND_DNA.json`: contrato estructurado de identidad;
- `BRAND_EVIDENCE.json`: inventario de fuentes y soporte de cada hallazgo;
- `BRAND_REPORT.md`: lectura humana del sistema de marca;
- `BRAND_RULES.md`: reglas operativas, límites y anti-patrones;
- `BRAND_PROMPT.md`: base reutilizable para crear nuevas piezas con IA.

Puede alimentar webs, presentaciones, campañas, contenido social, guiones, prompts visuales y sistemas de diseño. Su foco no es describir una pieza aislada, sino encontrar los patrones que sobreviven entre canales.

### 2. `brand-manual-builder`

Convierte un `BRAND_DNA` respaldado por evidencia en un manual estático, navegable y responsive para revisión humana. Mantiene visibles la cobertura, las fuentes y las limitaciones, y registra la aprobación sin modificar el contrato original.

Produce:

- `BRAND_MANUAL_SPEC.json`: composición, tema, trazabilidad y checklist;
- `brand-manual/index.html`: checkpoint visual autónomo;
- `brand-manual/BRAND_MANUAL.json`: manifiesto generado y estado de revisión.

No descubre nuevas reglas ni reemplaza al escáner: hace visible lo ya sustentado.

### 3. `reference-scanner`

Analiza una web de referencia como un sistema visual y conductual. Registra el comportamiento de escritorio y móvil, la estructura de las páginas, la tipografía, el color, los medios, el movimiento, las interacciones y las relaciones espaciales.

Produce:

- `STYLE_DNA.json`: contrato reproducible del sistema web;
- `REFERENCE_EVIDENCE.json`: observaciones, procedencia y auditorías temporales de comportamiento;
- `STYLE_REPORT.md`: explicación legible de los hallazgos;
- capturas, inventarios y artefactos auxiliares cuando el análisis lo requiere.

Puede trabajar como skill independiente, y verifica su propia salida antes de entregarla. Si existe un `BRAND_DNA`, lo usa como contexto de interpretación sin promover automáticamente una conducta web a regla central de marca.

### 4. `reference-lab-builder`

Convierte `STYLE_DNA` y su evidencia en una web inventada que permite probar aisladamente tipografías, navegación, hover, scroll, marquees, apilado, parallax, filtros, fullscreen y manipulación directa. No copia contenido ni activos del sitio fuente y no afirma conocer su tecnología.

Produce:

- `REFERENCE_LAB_SPEC.json`: selección declarativa y trazable de demos;
- `reference-lab/index.html`: laboratorio estático e interactivo;
- `reference-lab/REFERENCE_LAB.json`: manifiesto y revisión.

### 5. `reference-to-astro`

Construye una implementación Astro a partir de los contratos de referencia, un manifiesto de contenido, los materiales entregados, un brief de producción y un `SITE_BLUEPRINT` aprobado.

El skill:

- traduce reglas visuales a tokens, layouts y componentes;
- reemplaza el contenido de la referencia por contenido autorizado del cliente;
- crea primero el blueprint que asigna cada sección real a patrones y evidencia de la referencia;
- se detiene para aprobación humana antes de escribir la implementación;
- mantiene responsive, jerarquía, ritmo y comportamiento;
- implementa movimiento con respeto por `prefers-reduced-motion`;
- rechaza los contratos de entrada que no estén sostenidos por evidencia, antes de empezar a construir;
- valida estructura, contratos y calidad técnica;
- produce evidencia visual con Playwright —capturas por ruta y viewport, pares antes/después de cada interacción, pasada de movimiento reducido— para que la comparación contra la referencia se haga mirando, no recordando. Esa comparación es humana: acá no hay diff automático.

Su meta no es entregar una maqueta estática, sino una base web mantenible y verificable.

### 6. `visual-tuning-kit`

Extrae el calibrador como una capa reutilizable de desarrollo. Expone solamente
controles declarados y acotados para tipografía, espaciado, grilla, alineación,
texto, variantes y orden de secciones. Guarda borradores auditables, exige
aprobación humana y no se incluye en el build de producción. El contenido
aprobado se aplica de forma transaccional al manifiesto canónico: si una ruta o
la navegación completa falla, no escribe cambios parciales.

## Flujo completo de trabajo

1. **Reunir fuentes.** Web, manuales, campañas, redes, contenido, fotografías, videos y la referencia elegida.
2. **Escanear la marca.** Ejecutar `brand-dna-scanner` y revisar evidencia, conflictos e inferencias.
3. **Visualizar y aprobar la marca.** Generar el manual navegable con `brand-manual-builder` y resolver su checklist.
4. **Aprobar el núcleo.** Validar tono, principios, códigos visuales, límites y activos permitidos.
5. **Escanear la referencia.** Ejecutar `reference-scanner` en las páginas, estados y viewports relevantes.
6. **Probar la referencia.** Generar y aprobar el laboratorio neutral con `reference-lab-builder`.
7. **Separar marca y canal.** Decidir qué pertenece al cliente, qué pertenece al lenguaje web y qué no debe trasladarse.
8. **Preparar el build brief.** Declarar objetivo, funcionalidades, activos y restricciones.
9. **Aprobar SITE_BLUEPRINT.** Mapear contenido, secciones, composición, responsive, comportamiento y criterios de aceptación.
10. **Construir con Astro.** Ejecutar `reference-to-astro` sobre el blueprint aprobado.
11. **Ajustar visualmente.** Usar `visual-tuning-kit` sobre los controles que el proyecto declaró seguros.
12. **Verificar.** Comparar comportamiento, responsive, accesibilidad, contratos y evidencia visual.
13. **Publicar en WordPress, si corresponde.** Usar `wordpress-publisher` para convertir el build validado en un plugin de portada instalable, sin convertir el HTML compilado en fuente editable.

Cada paso que produce un contrato termina con su validador. Un contrato rechazado no se fuerza: se completa la evidencia o se baja la afirmación.

También es posible utilizar solamente una capa. Por ejemplo, `brand-dna-scanner` puede preparar una campaña sin construir una web, y `reference-scanner` puede documentar una referencia para un equipo que implementará con otra tecnología.

## Casos de uso

- reconstruir una web de referencia con la identidad y el contenido de un cliente;
- transformar un manual de marca y sus piezas reales en reglas utilizables por agentes de IA;
- alinear diseño y desarrollo antes de producir componentes;
- preparar prompts consistentes para imágenes, presentaciones, redes o campañas;
- auditar si una pieza nueva respeta el núcleo de una marca;
- documentar el sistema visual de una web antes de migrarla;
- crear una base reproducible para equipos distribuidos.

## Qué no es

`brand-system-skills` no es:

- un scraper para apropiarse de contenido o activos de terceros;
- un clonador de código fuente;
- un generador automático de logos;
- un sustituto de la aprobación estratégica o legal;
- una promesa de identidad definitiva a partir de una sola captura;
- un tema Astro universal listo para cualquier negocio;
- un sistema que oculta sus inferencias detrás de una puntuación opaca.

## Instalación

Los siete skills funcionan igual en **Claude** y en **Codex**: un `SKILL.md` con
su frontmatter, sus referencias, sus contratos y sus validadores. Cambia dónde
se copia el directorio.

Skills disponibles:

- [brand-dna-scanner](https://github.com/pcanete/brand-system-skills/tree/main/skills/brand-dna-scanner)
- [brand-manual-builder](https://github.com/pcanete/brand-system-skills/tree/main/skills/brand-manual-builder)
- [reference-scanner](https://github.com/pcanete/brand-system-skills/tree/main/skills/reference-scanner)
- [reference-lab-builder](https://github.com/pcanete/brand-system-skills/tree/main/skills/reference-lab-builder)
- [reference-to-astro](https://github.com/pcanete/brand-system-skills/tree/main/skills/reference-to-astro)
- [visual-tuning-kit](https://github.com/pcanete/brand-system-skills/tree/main/skills/visual-tuning-kit)
- [wordpress-publisher](https://github.com/pcanete/brand-system-skills/tree/main/skills/wordpress-publisher)

Instala los siete para el flujo completo de marca a web y WordPress, o solamente el que corresponda a una tarea puntual.

### En Claude

Copia el directorio del skill dentro de la carpeta de skills:

```text
~/.claude/skills/<nombre-del-skill>/SKILL.md      personal, disponible en todo proyecto
<proyecto>/.claude/skills/<nombre-del-skill>/     del proyecto, viaja con el repositorio
```

Claude lee la descripción del frontmatter para decidir cuándo activarlo, así que cada skill debe quedar como hijo directo de la carpeta.

### En Codex

Puedes pedir la instalación usando el directorio público:

```text
Instala este skill:
https://github.com/pcanete/brand-system-skills/tree/main/skills/brand-dna-scanner
```

O copiarlo a mano:

```text
~/.codex/skills/<nombre-del-skill>/SKILL.md
```

En los dos motores vale la misma advertencia: no copies el monorepo completo como si fuera un único skill.

Consulta la [guía de instalación](docs/installation.md) para dependencias y detalles.

## Cómo invocarlos

Ejemplos de pedidos:

```text
Usa brand-dna-scanner para extraer el ADN de esta marca a partir de
su sitio, brand book y campañas. Separa evidencia, inferencias y conflictos.
```

```text
Usa brand-manual-builder para convertir este BRAND_DNA en un manual visual
navegable. Mostrámelo como checkpoint y no lo apruebes por mí.
```

```text
Usa reference-scanner para analizar esta web en desktop y mobile.
Necesito su sistema de layout, tipografía, movimiento e interacciones.
```

```text
Usa reference-lab-builder para convertir este STYLE_DNA en un laboratorio
interactivo neutral. Mostrámelo y no lo apruebes por mí.
```

```text
Usa reference-to-astro para construir un sitio Astro con este STYLE_DNA,
este CONTENT_MANIFEST y los assets del cliente. Primero prepara y presenta
SITE_BLUEPRINT; construye solamente después de mi aprobación y verifica el resultado visual.
```

```text
Usa visual-tuning-kit para declarar y montar controles visuales acotados sobre
este sitio Astro. No incluyas el panel en producción ni apruebes valores por mí.
```

Para mejores resultados, indica fuentes, páginas prioritarias, viewports, restricciones legales, contenido autorizado y el nivel de fidelidad esperado.

## Estructura del repositorio

```text
brand-system-skills/
├── skills/
│   ├── brand-dna-scanner/
│   │   ├── SKILL.md
│   │   ├── schemas/
│   │   ├── scripts/
│   │   ├── examples/
│   │   └── references/
│   ├── brand-manual-builder/
│   │   ├── SKILL.md
│   │   ├── schemas/
│   │   ├── scripts/
│   │   └── references/
│   ├── reference-scanner/
│   │   ├── SKILL.md
│   │   ├── schemas/
│   │   ├── scripts/
│   │   └── references/
│   ├── reference-lab-builder/
│   │   ├── SKILL.md
│   │   ├── schemas/
│   │   ├── scripts/
│   │   └── references/
│   ├── reference-to-astro/
│   │   ├── SKILL.md
│   │   ├── schemas/
│   │   ├── scripts/
│   │   └── references/
│   ├── visual-tuning-kit/
│       ├── SKILL.md
│       ├── schemas/
│       ├── scripts/
│       ├── assets/
│       └── references/
│   └── wordpress-publisher/
│       ├── SKILL.md
│       ├── scripts/
│       └── assets/
├── docs/
│   ├── architecture.md
│   ├── installation.md
│   └── versioning.md
├── scripts/
├── tests/
│   ├── reference-system/   fixtures que deben validar
│   └── rejected/           fixtures que deben ser rechazados
├── .github/workflows/
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

Es un monorepo de mantenimiento, no un skill único acoplado. Cada skill conserva su propio contrato y puede instalarse por separado. Los esquemas web compartidos se verifican para impedir divergencias accidentales.

## Desarrollo y validación

Los validadores de los skills son los que ejecuta la revisión del repositorio, así que sus dependencias hacen falta antes de correr `npm test`:

```bash
npm ci --prefix skills/brand-dna-scanner
```

```bash
npm ci --prefix skills/brand-manual-builder
```

```bash
npm ci --prefix skills/reference-scanner
```

```bash
npm ci --prefix skills/reference-lab-builder
```

```bash
npm ci --prefix skills/reference-to-astro
```

```bash
npm ci --prefix skills/visual-tuning-kit
```

```bash
npm test
```

La revisión comprueba estructura, metadatos, archivos requeridos, JSON, coherencia de versiones entre `SKILL.md`, `package.json` y la documentación, sincronización de los contratos compartidos, y que ningún archivo empaquetado quede sin ser mencionado por su skill. Además corre los validadores sobre los ejemplos —que deben pasar— y sobre los fixtures de `tests/rejected/` —que deben ser rechazados—: si un contrato sin sustento pasara, las compuertas dejaron de funcionar. GitHub Actions ejecuta lo mismo en cada cambio.

El QA visual de `reference-to-astro` puede requerir Chromium para Playwright:

```bash
npx playwright install chromium
```

## Actualización y versiones

Cada skill sigue versionado semántico de forma independiente:

| Skill | Versión actual | Contrato compatible |
| --- | ---: | --- |
| `brand-dna-scanner` | `0.4.0` | Brand DNA `0.1.x` |
| `brand-manual-builder` | `0.1.0` | Brand Manual Spec `0.1` |
| `reference-scanner` | `0.8.0` | Web reference schemas `0.4.x`, con rutas de observación resolubles |
| `reference-lab-builder` | `0.2.1` | Reference Lab Spec `0.1`, con mediciones renderizadas fielmente |
| `reference-to-astro` | `1.3.0` | Web reference schemas `0.3.x–0.4.x` + Site Blueprint `1.0`, con revisión externa trazable |
| `visual-tuning-kit` | `0.6.0` | Tuning Schema and Values `0.1`, con aplicación transaccional de contenido aprobado |
| `wordpress-publisher` | `0.2.0` | Plugin de portada, validación y ZIP en un circuito único |

Para actualizar una copia del repositorio:

```bash
git pull
npm test
```

Las copias ya instaladas bajo `~/.codex/skills` no se actualizan automáticamente al cambiar este repositorio. Deben reinstalarse o sincronizarse de forma explícita.

Las reglas completas están en [versioning.md](docs/versioning.md) y los cambios publicados en [CHANGELOG.md](CHANGELOG.md).

## Requisitos

- Codex con soporte para skills;
- Git para clonar y actualizar;
- Node.js 18 o superior para los validadores;
- acceso autorizado a las fuentes y materiales analizados;
- un navegador compatible cuando el flujo requiere inspección o QA visual;
- Astro en el proyecto de destino para la fase de implementación.

## Privacidad, propiedad intelectual y seguridad

- Usa únicamente fuentes públicas o materiales para los que tengas autorización.
- No incluyas secretos, credenciales ni datos personales innecesarios en los artefactos.
- Conserva procedencia y licencias de los activos del cliente.
- Trata las referencias como evidencia de diseño, no como permiso para reutilizar su contenido.
- Revisa [SECURITY.md](SECURITY.md) antes de reportar una vulnerabilidad.

## Estado del proyecto

El sistema está en etapa temprana, previa a `1.0`. Los contratos son utilizables y están versionados, pero pueden evolucionar a medida que se prueben con más marcas, canales y proyectos reales.

Las contribuciones, casos de prueba y propuestas de mejora son bienvenidos. Consulta [CONTRIBUTING.md](CONTRIBUTING.md).

## Licencia

Publicado bajo licencia [MIT](LICENSE).

Concepto y desarrollo inicial: **Patricio Cañete**.
