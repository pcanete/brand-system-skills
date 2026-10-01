# Integraciones WordPress

Para necesidades editoriales, decidir primero con elementor-component-spec y
entregar el contrato aprobado a Novamira u otro executor apto. La exportación
elementor-widgets documentada aquí es una alternativa explícita cuando falta
ese executor, no una conversión automática del nuevo contrato.

## Configuración y comandos

Se preservan slug, name, description, author, version (x.y.z), constPrefix,
fnPrefix, headOwnership, additionalStyleSources e isolateWooStyles.
Los prefijos explícitos siguen disponibles; elegirlos únicos entre plugins.
Sin mode se conserva front-page. Un modo desconocido falla antes del build.

Ejemplo plantilla:
```json
{
  "slug": "brand-product",
  "name": "Brand Product",
  "version": "0.3.0",
  "mode": "page-template",
  "template": { "name": "Landing Producto", "layout": "canvas" }
}
```

Ejemplo fragmento:
```json
{
  "slug": "brand-calculator",
  "version": "0.3.0",
  "mode": "embedded-page",
  "embedded": { "id": "calculadora" }
}
```

Insertar `[brand_calculator_page id="calculadora"]`. El nombre se deriva del
slug para permitir varios plugins sin colisión. ID desconocido devuelve vacío;
no se usa el atributo como ruta. Hoy hay una experiencia por plugin, guardada
en generated/<id>/fragment.php. El registro multibuild queda para una extensión.

Ejemplo widgets:
```json
{
  "slug": "brand-shop",
  "version": "0.3.0",
  "mode": "elementor-widgets",
  "elementor": { "category": "Brand System", "widgets": ["faq", "product-grid"] }
}
```

widgets es una lista de tipos permitidos (faq y product-grid), no nombres de
clases PHP ni rutas arbitrarias. Se puede incluir sólo uno. Para sumar tipos,
agregar template PHP, registro y pruebas; no aceptar código vía JSON.
La categoría tiene identificador propio derivado del slug y título configurable.

Desde el skill instalado, npm ci. Los scripts resuelven sus recursos desde su
ubicación, no desde cwd. Desde cualquier carpeta:
```text
node <skill>/scripts/publish.mjs --project <proyecto> --config wordpress.config.json
node <skill>/scripts/publish.mjs --project <proyecto> --skip-build
node <skill>/scripts/export-plugin.mjs --project <proyecto>
node <skill>/scripts/validate-plugin.mjs --plugin <plugin>
node <skill>/scripts/package-plugin.mjs --plugin <plugin> --out <destino.zip>
```

export-plugin y package-plugin no construyen Astro. publish construye los tres
modos estáticos salvo --skip-build. Elementor genera PHP y no necesita dist ni
ejecuta npm/astro build. El build/diseño se revisa como referencia para adaptar
los widgets: el catálogo incluido tiene estilo neutral, no reconstruye la web.

Los comandos sobrescriben exclusivamente wordpress/build/<slug>, que es salida
regenerable. No editar ahí: traducir cambios a Astro o a templates del generador.
El ZIP debe estar fuera de esa carpeta. Cada entrega aumenta version.

## Portada y canvas

front-page conserva templates/front-page.php, aislamiento visual y hooks WP.
page-template registra una clave <slug>/generated-page.php con
theme_page_templates. Se asigna desde Página > Atributos > Plantilla (o panel
de plantilla equivalente del editor). No crea páginas ni necesita child theme.
Sólo actúa sobre páginas con esa asignación; no sobre entradas u otras rutas.
Páginas protegidas por contraseña conservan el template de WordPress.

canvas conserva wp_head, wp_body_open, wp_footer y aislamiento del exportador
histórico. theme usa get_header, fragmento encapsulado y get_footer, sin
desencolar CSS del anfitrión. theme requiere un tema con estos hooks clásicos;
comprobar temas de bloques en staging y preferir canvas si no los ofrecen.
El plugin no toma el control de la ruta Shop especial de WooCommerce por el
mero hecho de que exista una página: para catálogos, insertar el widget en una
página normal o en una plantilla Elementor autorizada.

## Fragmentos: límites deliberados

HTML se procesa con parse5. No incluye html/head/body en el fragmento. CSS
local se registra y se imprime al renderizar (también si wp_head ya pasó);
WordPress deduplica handles. JS externo se encola para footer y conserva
type=module. No se encola nada en páginas que no renderizan la experiencia.
La integración debe renderizar antes de wp_footer; inserciones AJAX tardías y
el ciclo de re-render del editor requieren adaptación específica.

CSS se analiza con PostCSS y selector-parser. Raíces html/body/:root se
traducen a .bs-<slug>; listas, media, supports y keyframes se procesan.
Fuentes y animaciones se nombran por plugin. No se promete encapsulamiento
total frente a CSS del anfitrión con !important: probar y ajustar en fuente.
Selectores de raíz complejos, CSS nesting, @import, @page y at-rules no
soportadas fallan con mensaje. Compilar/integrar esas hojas antes de publicar.
Las URLs CSS inline se trasladan a una hoja en Astro. Empaquetar CSS/JS remotos
para fragmentos. No modificar una hoja con SRI sin recalcularlo.
JS con imports raíz /_astro o /assets se rechaza en fragmentos: usar un build
relocatable o adaptar el módulo. Revisar JS inline y sus efectos globales.

## Widgets incluidos

FAQ: repeater de pregunta y respuesta enriquecida, salida escapada/filtrada,
details/summary accesible y CSS acotado.

Product Grid: datos actuales de wc_get_products y objetos WC_Product, no un
snapshot del dist. Controles de categoría/tag/atributo global/valor inicial,
cantidad (1–48) y visibilidad de filtros. Filtros GET por instancia: búsqueda,
categoría, tag, atributo configurado, mínimo/máximo, orden y paginación.
No hace mutaciones ni implementa carrito propio: el enlace abre el producto
real, donde WooCommerce resuelve variaciones, compra, stock e impuestos.

La búsqueda, rango de precio y orden usan el hook oficial del almacén CPT,
acotado por un argumento exclusivo del plugin. No SQL manual. La comparación
usa _price almacenado: no equivale necesariamente al precio visible con
impuestos, moneda convertida o extensiones de precios. Si el cliente usa otro
almacén, precios personalizados o requiere reglas de catálogo especiales,
adaptar ese módulo y comprobar resultados; no prometer soporte universal.
Se rechaza de forma segura un almacén distinto de CPT.

Sin Elementor se muestra aviso administrativo sin cargar clases dependientes.
Sin WooCommerce el catálogo queda vacío para visitantes y muestra aviso a
editores; FAQ sigue funcionando. No se instalan dependencias automáticamente.

## Validación y archivos

scripts/export-plugin.mjs despacha exporters/front-page.mjs,
exporters/page-template.mjs, exporters/embedded-page.mjs y
exporters/elementor-widgets.mjs. lib/config.mjs valida entradas;
lib/files.mjs protege rutas; lib/audit-assets.mjs revisa referencias locales;
lib/assets.mjs interpreta el build;
lib/css.mjs encapsula CSS; lib/plugin.mjs comparte PHP;
lib/validate-integration.mjs comprueba los modos.

scripts/validate-plugin.mjs conserva controles legacy y usa
scripts/php-syntax.mjs. integration.json guarda modo, configuración e inventario
SHA-256: detecta alteraciones accidentales, no es una firma de confianza.
Cambios manuales requieren regeneración. El chequeo PHP no ejecuta código.

Las pruebas tests/wordpress-modes.test.mjs exportan los cuatro modos (ambos
layouts), ejecutan PHP con APIs simuladas y descomprimen entradas ZIP. No
sustituyen una instalación real, pruebas del editor, consentimiento, SEO,
checkout, caché/CDN, navegador y fidelidad al diseño. Ejecutar staging antes
de producción y reportar esos niveles por separado.

Preparado, no implementado: multibuild, extensiones de componentes (Hero,
Gallery, Specs, etc.), render AJAX tardío, copia automática de controles desde
Astro y adaptación automática a todos los almacenes WooCommerce.

## APIs de referencia

- [Plantillas desde plugins](https://developer.wordpress.org/reference/hooks/theme_page_templates/)
- [Registro oficial de widgets](https://developers.elementor.com/docs/widgets/add-new-widget/)
- [Dependencias de widgets](https://developers.elementor.com/docs/widgets/widget-dependencies/)
- [Consultas WooCommerce y extensión del datastore](https://developer.woocommerce.com/docs/features/products/wc-get-products/)
