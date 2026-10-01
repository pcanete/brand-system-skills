# Ejecución del contrato mediante Novamira u otro executor

## 1. Preflight de sólo lectura

1. Leer contrato, fuentes y recibo humano. Ejecutar el validador sin allow-draft.
   Si hay contradicciones entre diseño y entorno, devolver propuesta de revisión;
   no reinterpretar silenciosamente el diseño ni modificar el spec aprobado.
2. Descubrir herramientas realmente cargadas. Confirmar identidad exacta del
   conector Novamira solicitado con una lectura inocua; no sustituirlo por otro
   MCP sin acuerdo. No presuponer nombres de herramientas ni capacidades de
   escribir archivos, ejecutar PHP, activar plugins o crear páginas.
3. Verificar URL y site identity, entorno staging/producción, usuario/capacidades,
   versiones WordPress/PHP/Elementor/Pro y APIs/dependencias instaladas.
   Inspeccionar WooCommerce/ACF/JetEngine sólo cuando el contrato los necesita.
   Documentar lo observado y lo aún desconocido sin exponer credenciales.
4. Inventariar tema, plugins del proyecto, widgets existentes, punto de montaje,
   estilos, caché y datos de prueba. Confirmar mapping nativo y necesidad custom.
   Un plugin de terceros no es un plugin propio editable. No tocar core.
5. Si falta acceso/capacidad, parar escrituras: entregar contrato al humano u
   otro executor acordado. ZIP es una alternativa explícita, no un fallback
   automático. No inventar éxito por tener una configuración de conexión.

## 2. Plan y autorización acotada

6. Presentar destino exacto, archivos/documentos a crear o editar, plugin propio
   candidato, backup/export, versión y procedimiento de reversión. Conservar
   cambios ajenos, datos editoriales y configuración existentes.
7. Obtener autorización para esas escrituras en ese staging, incluso una página
   de prueba draft. La aprobación de diseño, el skill y el contrato no la
   conceden. remoteWritesAuthorized false nunca se convierte en permiso.
8. Elegir contenedor: COMPILED se deriva a wordpress-publisher; NATIVE usa el
   documento Elementor existente con APIs soportadas; CUSTOM vive en un plugin
   mantenible del proyecto, con fuente versionada, namespace y guards.
   No usar functions.php del tema, snippets efímeros ni modificar Elementor core.

## 3. Implementación conforme al diseño

9. CUSTOM: extender Widget_Base y registrar mediante elementor/widgets/register
   con el manager oficial; verificar APIs en la versión instalada. Declarar
   dependencias y falla segura sin Elementor/WooCommerce. No renombrar widgets
   existentes ni cambiar IDs editoriales sin migración acordada.
10. Registrar controles adecuados y responsive mediante API oficial; conectar
    Dynamic Tags sólo si disponibles y autorizadas. Soporte ausente requiere
    fallback acordado o revisión, nunca falsa compatibilidad.
11. Resolver datos con APIs de proveedores: WP fields, WooCommerce, ACF o
    JetEngine según source. Validar IDs/tipos, visibilidad, capacidades,
    allowlists y límites. Nunca exponer privados, ejecutar SQL del contrato o
    confiar en controles del editor como sanitización de servidor.
12. Escapar al imprimir según contexto: esc_html, esc_attr, esc_url o
    wp_kses_post; estructuras image/collection se renderizan con APIs seguras.
    Evitar precio/stock duplicados y respetar contexto comercial. Escrituras
    REST/AJAX requieren capacidades y nonce adecuados; nonce no es autorización.
13. CSS bajo raíz única, sin resets globales. Registrar assets con WordPress y
    declarar handles en get_style_depends/get_script_depends. Cargar sólo al
    renderizar componente; probar dos instancias y aislamiento del anfitrión.
14. JS sólo si el comportamiento lo necesita. Inicializar idempotentemente en
    frontend y preview/editor, limpiar listeners al rerender/desmontaje. Respetar
    teclado, foco, reduced motion y estados vacíos/error/carga/sin proveedor.
    No convertir un enlace simple en runtime JavaScript.
15. Mantener layout, imagen, tipografía, espaciado, responsive e interacciones
    del contrato. Ajustes visuales van a la fuente y requieren revisión si
    cambian lo aprobado; el executor no sustituye criterio de diseño.

## 4. Prueba, evidencia y entrega

16. Crear página de prueba no publicada sólo tras permiso. Verificar editor y
    frontend: desktop/tablet/mobile a anchos del spec; comparar capturas
    pareadas con referencia, estados, filtros, paginación, teclado, accesibilidad,
    consola y assets. Comprobar página ajena y dos instancias, usuarios anónimo
    y autorizado, dependencias ausentes y datos vacíos/privados/variables según
    alcance. Un harness local no demuestra WordPress real ni fidelidad.
17. Guardar ELEMENTOR_IMPLEMENTATION_REPORT.md con specDigest, identidad y
    versiones del destino, capacidades comprobadas del executor, commit/archivos,
    página draft, criterios passed/failed/pending, capturas identificadas,
    limitaciones y reversión. Redactar secretos y PII; no incluir tokens o
    sesiones en URLs. Solicitar revisión humana del resultado visual.
18. Mantener pendiente publicación/activación en producción hasta autorización
    explícita para ese cambio y destino. Revalidar estado antes de publicar,
    aplicar plan reversible, comprobar resultado real y describir qué cambió.
    Si no se ejecutó o verificó una etapa, decirlo; no reportar completado.

## APIs oficiales de referencia

Comprobar documentación y compatibilidad en la ejecución, no asumir versiones:

- [Registro de widgets](https://developers.elementor.com/docs/widgets/add-new-widget/)
- [Dependencias de widgets](https://developers.elementor.com/docs/widgets/widget-dependencies/)
- [Dynamic Tags](https://developers.elementor.com/docs/dynamic-tags/)

Estas referencias describen Elementor, no prueban capacidades de Novamira.
