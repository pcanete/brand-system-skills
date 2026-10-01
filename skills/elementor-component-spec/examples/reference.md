# Referencia sintética — tienda de ejemplo
No es un cliente real ni evidencia de una instalación WordPress.
Brief: preservar una card de producto completa. El editor puede seleccionar un producto y editar la etiqueta del enlace; precio, nombre, stock y badge provienen de WooCommerce.
Diseño: imagen 4:3, badge sobre imagen, nombre, precio y enlace al producto; borde de 1px y espaciado interno de 24px.
Desktop 1440px: composición vertical dentro de grilla de tres columnas.
Tablet 768px: grilla de dos columnas. Mobile 390px: una columna, contenido sin recortes.
Estados: disponible y sin-stock; foco visible en enlace; sin-stock cambia badge, no inventa un precio.
Decisión propuesta: un widget de dominio conserva anatomía, responsive y estados. Dividir cada dato en widgets nativos separa el badge y complica las reglas de stock.
Caso nativo: heading, texto e imagen simples, sin pérdida relevante, editables con widgets existentes.
Caso compilado: hero decorativo con composición compleja que nadie necesita editar.
Caso híbrido: home Astro con hero y footer compilados; sólo product-card y faq necesitan edición.
