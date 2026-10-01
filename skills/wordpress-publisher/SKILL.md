---
name: wordpress-publisher
description: Empaqueta diseños Astro para WordPress como portada, plantilla o experiencia embebida. Para editabilidad deriva primero a elementor-component-spec y a un executor disponible; conserva exportación ZIP de widgets de dominio como alternativa explícita. Valida artefactos sin instalar en producción ni ejecutar Astro en WordPress.
license: MIT
metadata:
  version: "0.3.1"
---

# WordPress Publisher

El último paso: elegir la integración adecuada dentro de un WordPress que sigue vivo.

## Elegir la integración antes de producir

Si se solicita edición Elementor, usar primero elementor-component-spec para
decidir COMPILED, ELEMENTOR_NATIVE o ELEMENTOR_CUSTOM_WIDGET. Con Novamira u
otro executor apto, entregar el contrato aprobado para implementación en el
destino autorizado; no generar un ZIP de widgets por defecto. El modo histórico
elementor-widgets sigue disponible como alternativa explícita si falta ese
executor, con sus límites actuales. No transforma automáticamente el nuevo
contrato en PHP. Los tres exportadores compilados no cambian.

Determinar con el brief y preguntar sólo lo que falte:

1. ¿Es una página completa o una experiencia insertada?
2. ¿Necesita edición granular por una persona no técnica?
3. ¿Necesita datos dinámicos WordPress/WooCommerce?
4. ¿Se reutiliza en varias páginas?
5. ¿Debe vivir dentro de Elementor?

Código compilado para fidelidad y libertad visual; Elementor para componentes
editables, dinámicos o reutilizables. Tener Elementor instalado no es motivo
suficiente para convertir una página a widgets. Datos dinámicos por sí solos
tampoco obligan a Elementor: confirmar el requisito editorial.

| Pedido | Modo |
| --- | --- |
| A. Rediseñar la home sin tocar WooCommerce | `front-page` |
| B. Landing Astro en /servicio-x/ | `page-template` |
| C. Calculadora dentro de una página Elementor | `embedded-page` |
| D. Shop con filtros editables y productos reales | Primero spec y executor; `elementor-widgets` sólo alternativa explícita |
| E. Landing terminada que nadie editará | `page-template`, no fragmentarla |

Leer `references/integration-modes.md` para configuración, límites y puesta en
uso del modo elegido. La configuración sin `mode` conserva `front-page`.
Antes de usar los comandos, ejecutar `npm ci` dentro de este skill. Node 18+
y PHP CLI 7.4+ son requisitos; PHP puede seleccionarse con `PHP_BINARY`.

Los widgets incluidos son FAQ y Product Grid con filtros. No prometer Product
Hero/Gallery/Specs ni fidelidad automática al build: se implementan y verifican
por proyecto como componentes de dominio, no como micro-widgets.

## Comportamiento conservado: front-page

Es el caso frecuente en un rediseño real. El cliente tiene WordPress con
cuentas, tienda, formularios y plugins que funcionan. Lo que quiere cambiar es
la portada. Reemplazar todo el sitio para eso es desproporcionado, y publicar
la portada aparte parte el dominio en dos.

Este skill toma el `dist/` de Astro y lo empaqueta como plugin: WordPress
entrega la portada nueva y conserva todo lo demás intacto.

## Qué toca y qué no en front-page

El plugin interviene **sólo** cuando la petición es la portada pública. Deja
pasar sin tocar nada: administración, AJAX, feeds, embeds y cualquier otra
ruta. La tienda, la cuenta y el registro siguen siendo de WordPress.

En la portada desencola los estilos **visuales** del tema y de los page
builders —Astra y Elementor— porque son los que pelean
con el diseño nuevo. No toca scripts ni estilos de otros plugins: analítica,
píxeles, consentimiento y demás integraciones siguen entrando por `wp_head()`
y `wp_footer()`, que la plantilla conserva.

Los estilos de WooCommerce se conservan por defecto. Sólo se eliminan cuando
`isolateWooStyles` está declarado expresamente y la portada no contiene bloques
funcionales de WooCommerce.

Esa distinción es el corazón del asunto. Aislar de más rompe el sitio del
cliente; aislar de menos deja la portada peleando con el tema.

## Uso de portada (los otros modos conservan estos comandos)

1. Declarar el plugin en `wordpress.config.json`, en la raíz del proyecto:

   ```json
   {
     "slug": "portada-astro",
     "name": "Portada Astro",
     "description": "Portada compilada del sitio.",
     "author": "Estudio"
   }
   ```

   `headOwnership` puede ser `wordpress` (predeterminado, para que WordPress o
   el plugin SEO gobiernen description, favicon y theme-color) o `compiled`.
   `additionalStyleSources` agrega rutas visuales conocidas y
   `isolateWooStyles` requiere una decisión explícita.

   El `slug` manda: de ahí salen el nombre del archivo, el prefijo de las
   constantes PHP y el de las funciones. `constPrefix` y `fnPrefix` se pueden
   declarar si hace falta otra cosa.

   **Subí `version` en cada entrega.** WordPress compara ese número para decidir
   si hay actualización; reempaquetar sin cambiarlo puede dejar la versión vieja
   instalada sin que nadie se entere. El validador rechaza un paquete cuya
   cabecera no declare un `x.y.z` válido.

2. Ejecutar el circuito completo en un paso:

   ```bash
   node scripts/publish.mjs --project . --config wordpress.config.json
   ```

   Esto construye, exporta, verifica y recién entonces genera el ZIP. Si el
   `dist/` ya fue construido y verificado por el mismo commit, se puede usar
   `--skip-build`. `--out archivo.zip` cambia el destino.

3. Para diagnóstico también se pueden ejecutar las etapas por separado:

   ```bash
   node scripts/export-plugin.mjs --project . --config wordpress.config.json
   node scripts/validate-plugin.mjs --plugin wordpress/build/portada-astro
   node scripts/package-plugin.mjs --plugin wordpress/build/portada-astro
   ```

4. Subir manualmente el ZIP desde el panel de WordPress.

El comando nunca instala ni actualiza el plugin remoto: esa frontera evita que
una credencial o un error de entorno conviertan el empaquetado en una mutación
de producción.

El empaquetado no usa la herramienta del sistema a propósito. `Compress-Archive`
en Windows guarda las rutas con barra invertida y el formato ZIP exige barra
normal: PHP puede terminar creando un archivo cuyo nombre contiene la barra
invertida, en vez de la carpeta que correspondía, y el plugin se instala sin
encontrar nada. El script lo escribe con `zlib`, que viene con Node, y las
rutas quedan siempre con barra normal.

## Qué hace el exportador

No inventa nada. Lee `dist/index.html`, lo separa en head y body, y:

- **evita duplicar lo que WordPress ya emite** — siempre retira charset,
  viewport y title; con `headOwnership: "wordpress"` también retira description,
  theme-color e icono. Con `headOwnership: "compiled"` conserva estos últimos
  cuando el build debe seguir siendo su fuente autorizada;
- **reescribe cada URL de asset** a `esc_url( <PREFIJO>_URL . 'dist/...' )`,
  porque dentro de un plugin la raíz del sitio es la de WordPress;
- **reescribe también las URLs dentro del CSS empaquetado**, que apuntan a la
  raíz igual que el HTML y se olvidan seguido;
- **excluye el `index.html` original**: esa portada la sirve WordPress;
- **verifica que cada asset referenciado exista** antes de empaquetar.

Falla en lugar de producir un paquete a medias: si un asset no está, si un
marcador no se reemplazó o si la plantilla perdió los hooks de WordPress, no
hay export.

## Qué verifica el validador

Además del control histórico de portada, el validador verifica el modo en
`integration.json`, el inventario con hashes y sus archivos PHP mediante
`scripts/php-syntax.mjs` (`php -n -l`, sin ejecutar el plugin).
Page-template exige registro, selección acotada y hooks según layout.
Embedded exige shortcode/fragmento aislado; Elementor, dependencias,
categoría, registro y controles. `scripts/package-plugin.mjs` también valida:
no hay un atajo al ZIP cuando falla el artefacto.

Esto comprueba contratos y sintaxis, no una instalación real ni fidelidad
visual. No llamar "probado en WordPress" a un harness con APIs simuladas.

## Verificación de entrega

Probar en staging la página destino, una página ajena, usuario anónimo y
autenticado, búsqueda, cuenta, tienda y carrito. Para theme/embedded revisar
estilos del anfitrión antes/después, shortcode desde Gutenberg y Elementor,
consola, fuentes, módulos JS, dos instancias y navegación. Para widgets,
verificar el editor y frontend con/sin Elementor y WooCommerce, productos
variables, ocultos, precios, paginación, filtros y permisos.
No instalar, activar ni actualizar un WordPress remoto sin autorización.

El aislamiento de CSS no es un sandbox de JavaScript. Revisar scripts del
build: selectores sobre document/body, IDs duplicados, ClientRouter, listeners
y portales pueden afectar al anfitrión. Adaptarlos en Astro y reconstruir;
no afirmar aislamiento funcional basándose sólo en CSS.

## Organización interna

`scripts/export-plugin.mjs` despacha exportadores por modo. Los módulos de
`scripts/exporters` conservan portada y separan plantilla, shortcode y widgets.
`scripts/lib` contiene configuración, HTML/assets, CSS y validación. Las
plantillas históricas están en `assets/plugin-template`; las de componentes
en `assets/elementor`. La documentación técnica y los límites están en
`references/integration-modes.md`.

### Controles históricos conservados para portada

El exportador revisa lo que puede mientras genera. El validador revisa el
artefacto terminado, que es lo que realmente se instala:

- están el archivo principal, la plantilla, la hoja de aislamiento y el build;
- no quedaron marcadores sin renderizar;
- la plantilla conserva `wp_head`, `wp_body_open` y `wp_footer`;
- el plugin limita su alcance a la portada y corta el acceso directo;
- ninguna URL apunta a la raíz del sitio;
- cada asset citado está dentro del paquete;
- la cabecera declara una versión con forma `x.y.z`.

Un paquete incompleto no falla al generarse: falla en la portada del cliente.

## El plugin de portada generado

Se niega a activarse si le falta el build. Es preferible un plugin que no
enciende a una portada en blanco en producción.

Agrega una clase estable al `body` de la portada, que la hoja de aislamiento
usa para acotar sus reglas. Nada de lo que hace se derrama al resto del sitio.

## Actualizar la portada

Volver a construir, volver a exportar, volver a validar y subir el ZIP nuevo.
El plugin no guarda estado propio: todo lo que muestra viene del build.
