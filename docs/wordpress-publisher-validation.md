# WordPress Publisher 0.3.0 — implementación y validación

Fecha: 2026-09-30. Base: main del repositorio propio. No se modificó el
repositorio de Claude. La PR previa #7 sigue siendo un trabajo separado:
reconciliar cambios de WordPress al revisarlas, sin reemplazar ciegamente una
versión por la otra.

## Implementado

| Modo | Salida y alcance |
| --- | --- |
| front-page | Exportador histórico; configuración sin mode sigue aquí. Hooks, aislamiento visual y rutas externas preservados. |
| page-template / canvas | Plantilla seleccionable registrada por plugin, documento completo con hooks; sólo páginas asignadas. |
| page-template / theme | Header/footer del tema y fragmento con CSS encapsulado; no desencola estilos del tema. |
| embedded-page | Shortcode derivado del slug, ID validado y fragmento generado; CSS/JS al renderizar. |
| elementor-widgets | Categoría propia, FAQ con repeater y Product Grid dinámico con filtros, orden y paginación. |

Los componentes de catálogo usan wc_get_products y WC_Product. Búsqueda,
atributo y rango de precio se resuelven en un adaptador acotado al datastore
CPT. El generador no convierte automáticamente el HTML en widgets.

Preserva los comandos públicos y los campos del reporte de portada. Nuevos
requisitos locales: dependencias npm del skill y PHP CLI (o PHP_BINARY).
WordPress no ejecuta Astro. No se instaló ni activó nada remotamente y las
copias del skill instaladas en el equipo no se actualizaron.

## Evidencia automatizada local

Entorno observado: Windows, Node 24.14.0, PHP CLI 8.4.25, Chromium/Playwright.

- npm test: suite existente completa aprobada, más 15 pruebas nuevas aprobadas.
- Exportación, validación PHP y estructura ZIP para los cuatro modos, incluidas
  ambas variantes de page-template.
- Ejecución real de PHP generado con APIs simuladas: rutas ajenas, guards,
  registro de plantilla, shortcode, carga condicional, deduplicación de CSS,
  módulo JS, ausencia de Elementor y ausencia de WooCommerce.
- Con un proveedor Woo simulado, el producto cambia entre renders: demuestra
  consulta dinámica del proveedor, no integración real con una base WooCommerce.
- Browser: CSS embebido cambia el contenido interno y deja intactos el h1 y body
  anfitriones. Esto no equivale a QA visual completa de un tema real.
- Pruebas negativas: modo, versión, cabeceras, rutas, assets HTML/CSS ausentes,
  CSS no soportado, PHP inválido, cambios en artefactos y packaging inválido.
- Validador oficial del skill: Skill is valid.
- npm audit del nuevo paquete wordpress-publisher: 0 vulnerabilidades al instalar.
  Otros seis paquetes existentes informaron alertas de dependencia previas;
  no se actualizaron sus lockfiles como parte de este alcance.
- CI configurada para Node 22, PHP 7.4 y Chromium; su resultado remoto debe
  consultarse en la PR, no inferirse de este informe local.

## Build real y exportaciones

También se construyó una página Astro sintética con Astro 7.3.5 y se pasó su
dist por publish --skip-build para las cinco variantes:
demo-front-page, demo-canvas, demo-theme, demo-embedded y demo-widgets.
Cada ejecución pasó el validador y generó un ZIP. Elementor no necesita ese
build: su prueba separada confirma publicación sin dist ni proyecto Astro.

Los ejemplos y ZIP de esa prueba son artefactos locales de la entrega, no
contenido de cliente ni parte del paquete del skill. Las fixtures versionadas
y npm run test:wordpress permiten repetir las pruebas del exportador.

## Preparado, no implementado

- Varias experiencias dentro de un mismo plugin: estructura generated/<id>,
  pero la configuración acepta una sola.
- Otros componentes como Product Hero, Gallery, Specs, CTA y Related.
- Conversión automática de la apariencia del build en controles Elementor.
- Adaptadores de filtros para almacenes de productos no CPT.
- Inserción AJAX tardía y garantía de re-render de scripts en el editor.

## Pendiente antes de producción

Instalar en un WordPress de staging autorizado y verificar Elementor real,
WooCommerce real, base de datos, productos variables/ocultos, checkout, cuenta,
consentimiento, SEO, temas de bloques, caché/CDN y fidelidad visual desktop/mobile.
Los filtros de precio trabajan con el valor almacenado, no prometen equivalencia
con multimoneda, precios personalizados ni todas las configuraciones fiscales.
Revisar JS del build: CSS encapsulado no es aislamiento de scripts.
