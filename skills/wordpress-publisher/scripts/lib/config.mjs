import { resolveConfig as legacyConfig } from '../exporters/front-page.mjs';
export const MODES = ['front-page', 'page-template', 'embedded-page', 'elementor-widgets'];
export const php = value => "'" + String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'") + "'";
export function resolveConfig(raw = {}) {
  const config = legacyConfig({ ...raw, additionalStyleSources: raw.additionalStyleSources ?? raw.blockedStyleSources });
  const mode = raw.mode ?? 'front-page';
  if (!MODES.includes(mode)) throw new Error('config.mode no reconocido: ' + mode);
  const text = (value, fallback) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !value.trim() || /[<>\r\n\x00]/.test(value)) throw new Error('Texto de configuración inválido');
    return value.trim().slice(0, 200);
  };
  const template = { name: text(raw.template?.name, config.name), layout: raw.template?.layout ?? 'canvas' };
  if (!['theme', 'canvas'].includes(template.layout)) throw new Error('template.layout debe ser theme o canvas');
  const id = raw.embedded?.id ?? config.slug;
  if (!/^[a-z][a-z0-9-]{0,63}$/.test(id)) throw new Error('embedded.id inválido');
  const widgets = raw.elementor?.widgets ?? ['faq', 'product-grid'];
  if (!Array.isArray(widgets) || !widgets.length || new Set(widgets).size !== widgets.length ||
      widgets.some(w => !['faq', 'product-grid'].includes(w))) throw new Error('elementor.widgets admite faq y product-grid, sin duplicados');
  return { ...config, mode, template, embedded: { id },
    elementor: { category: text(raw.elementor?.category, 'Brand System'), widgets } };
}
