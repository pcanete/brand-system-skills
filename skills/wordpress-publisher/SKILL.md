---
name: wordpress-publisher
description: Convierte un sitio Astro ya construido en un plugin de WordPress que reemplaza únicamente la portada, dejando que WordPress siga atendiendo cuenta, registro, tienda, búsqueda y administración. Genera el paquete, verifica que sea instalable y produce un ZIP. Usar cuando la portada nueva tiene que convivir con un WordPress existente en lugar de reemplazarlo. No usar para publicar un sitio estático completo, que no necesita WordPress en el medio.
license: MIT
metadata:
  version: "0.2.0"
---

# WordPress Publisher

El último paso: una portada compilada, adentro de un WordPress que sigue vivo.

Es el caso frecuente en un rediseño real. El cliente tiene WordPress con
cuentas, tienda, formularios y plugins que funcionan. Lo que quiere cambiar es
la portada. Reemplazar todo el sitio para eso es desproporcionado, y publicar
la portada aparte parte el dominio en dos.

Este skill toma el `dist/` de Astro y lo empaqueta como plugin: WordPress
entrega la portada nueva y conserva todo lo demás intacto.

## Qué toca y qué no

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

## Uso

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

## El plugin generado

Se niega a activarse si le falta el build. Es preferible un plugin que no
enciende a una portada en blanco en producción.

Agrega una clase estable al `body` de la portada, que la hoja de aislamiento
usa para acotar sus reglas. Nada de lo que hace se derrama al resto del sitio.

## Actualizar la portada

Volver a construir, volver a exportar, volver a validar y subir el ZIP nuevo.
El plugin no guarda estado propio: todo lo que muestra viene del build.
