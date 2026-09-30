import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import valueParser from 'postcss-value-parser';

export function assertScopedCss(source, scope) {
  const root = postcss.parse(source, { from: undefined, map: { prev: false } });
  root.walkAtRules(r => {
    if (!['media','supports','container','layer','keyframes','-webkit-keyframes','font-face'].includes(r.name)) throw new Error('At-rule no aislada: ' + r.name);
    if (/keyframes$/.test(r.name) && !r.params.startsWith(scope + '-')) throw new Error('Keyframes sin namespace');
    if (r.name === 'font-face') r.walkDecls('font-family', d => {
      if (!valueParser(d.value).nodes[0]?.value.startsWith(scope + '-')) throw new Error('Fuente sin namespace');
    });
  });
  root.walkRules(r => {
    if (/keyframes$/.test(r.parent.name || '')) return;
    selectorParser(selectors => selectors.each(s => {
      if (s.first?.type !== 'class' || s.first.value !== scope) throw new Error('Selector fuera de raíz: ' + s);
      const firstCombinator = s.nodes.find(n => n.type === 'combinator');
      if (firstCombinator && ['+', '~', '||'].includes(firstCombinator.value.trim())) throw new Error('Selector escapa de raíz');
    })).processSync(r.selector);
  });
}


// Fail closed for syntax that needs a separate isolation strategy, rather than
// silently promoting document-global CSS into a host page.
export function collectCssNames(sources, scope) {
  const names = new Map();
  for (const source of sources) {
    const root = postcss.parse(source, { from: undefined, map: { prev: false } });
    root.walkAtRules(rule => {
      if (/keyframes$/.test(rule.name)) names.set(rule.params, scope + '-' + rule.params);
      if (rule.name === 'font-face') rule.walkDecls('font-family', d => {
        const nodes = valueParser(d.value).nodes.filter(n => n.type !== 'space');
        if (nodes.length !== 1 || !['word', 'string'].includes(nodes[0].type)) throw new Error('Usar comillas para nombres de fuentes con espacios');
        names.set(nodes[0].value, scope + '-' + nodes[0].value);
      });
    });
  }
  return names;
}
export function scopeCss(source, scope, names = collectCssNames([source], scope)) {
  const root = postcss.parse(source, { from: undefined, map: { prev: false } });
  root.walkAtRules(rule => {
    const name = rule.name.toLowerCase();
    if (!['media','supports','layer','container','font-face','keyframes','-webkit-keyframes'].includes(name))
      throw new Error('CSS embebido no admite @' + name + '; resolverlo en Astro antes de exportar');
    if (/keyframes$/.test(name)) {
      if (!/^[\w-]+$/.test(rule.params)) throw new Error('Nombre de animación no soportado');
      names.set(rule.params, scope + '-' + rule.params);
      rule.params = scope + '-' + rule.params;
    }
    if (name === 'font-face') rule.walkDecls('font-family', d => {
      const original = valueParser(d.value).nodes[0]?.value;
      if (original) { names.set(original, scope + '-' + original); d.value = JSON.stringify(scope + '-' + original); }
    });
    if (name === 'layer' && rule.params) {
      rule.params = rule.params.split(',').map(n => scope + '-' + n.trim()).join(',');
    }
  });
  root.walkRules(rule => {
    if (/keyframes$/.test(rule.parent.name || '')) return;
    if (rule.parent.type === 'rule') throw new Error('Expandir CSS nesting antes de exportar');
    rule.selector = selectorParser(selectors => {
      selectors.each(selector => {
        let rootSeen = false;
        for (const node of [...selector.nodes]) {
          if (node.type === 'nesting') throw new Error('Expandir CSS nesting antes de exportar');
          const isRoot = (node.type === 'tag' && /^(html|body)$/i.test(node.value)) || (node.type === 'pseudo' && node.value === ':root');
          if (isRoot) {
            if (rootSeen) {
              if (node.prev()?.type === 'combinator' && node.prev().value.trim() === '') node.prev().remove();
              else throw new Error('Combinador de raíz no soportado');
              node.remove();
            } else {
              if (node !== selector.first) throw new Error('Selector de raíz debe ser inicial');
              node.replaceWith(selectorParser.className({ value: scope }));
              rootSeen = true;
            }
          }
          if (node.nodes) {
            let hasRoot = false;
            node.walk?.(nested => { if ((nested.type === 'tag' && /^(html|body)$/i.test(nested.value)) || nested.value === ':root') hasRoot = true; });
            if (hasRoot) throw new Error('Resolver raíces dentro de pseudoselectores antes de exportar');
          }
        }
        if (rootSeen) {
          // Do not allow ".root + .host" to leak outside the wrapper.
          for (const node of selector.nodes) {
            if (node.type === 'combinator') {
              if (['+', '~', '||'].includes(node.value.trim())) throw new Error('Selector escapa de la raíz aislada');
              break;
            }
          }
        } else {
          selector.prepend(selectorParser.combinator({ value: ' ' }));
          selector.prepend(selectorParser.className({ value: scope }));
        }
      });
    }).processSync(rule.selector);
  });
  root.walkDecls(d => {
    if (/^(?:-webkit-)?(?:animation(?:-name)?|font(?:-family)?)$/.test(d.prop) || d.prop.startsWith('--')) {
      const parsed = valueParser(d.value);
      parsed.walk(node => { if (names.has(node.value)) node.value = names.get(node.value); });
      d.value = parsed.toString();
    }
  });
  root.walkComments(comment => { if (/sourceMappingURL/i.test(comment.text)) comment.remove(); });
  return root.toString();
}
