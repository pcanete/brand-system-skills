import { lstat, readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
export async function files(root, prefix = '') {
  const result = [];
  for (const entry of await readdir(path.join(root, prefix), { withFileTypes: true })) {
    const rel = prefix ? prefix + '/' + entry.name : entry.name;
    if (entry.isSymbolicLink()) throw new Error('No se admiten symlinks: ' + rel);
    if (entry.isDirectory()) result.push(...await files(root, rel));
    else if (entry.isFile()) result.push(rel);
    else throw new Error('Archivo no regular: ' + rel);
  }
  return result;
}
export async function put(root, name, value) {
  await mkdir(path.dirname(path.join(root, name)), { recursive: true });
  await writeFile(path.join(root, name), value);
}
export function assetPath(url) {
  const clean = decodeURIComponent(url.split(/[?#]/)[0]).replace(/^\//, '');
  if (!clean || clean.includes('\\') || clean.includes(':') || clean.includes('\0') ||
      clean.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Ruta de asset insegura: ' + url);
  return clean;
}
export async function safeDestination(projectRoot, slug) {
  for (const rel of ['wordpress', 'wordpress/build', 'wordpress/build/' + slug]) {
    const info = await lstat(path.join(projectRoot, rel)).catch(e => { if(e.code !== 'ENOENT') throw e; });
    if (info?.isSymbolicLink()) throw new Error('Destino symlink rechazado: ' + rel);
  }
}
export async function auditDist(root) {
  if ((await lstat(root)).isSymbolicLink()) throw new Error('Build symlink rechazado');
  const inventory = await files(root);
  for (const name of inventory) {
    if (/\.(php\d*|phtml|phar|cgi|pl|htaccess)$/i.test(name) || path.basename(name).startsWith('.')) throw new Error('Build no estático: ' + name);
    if (/\.(html|css|js|mjs|svg)$/i.test(name)) {
      const content = await readFile(path.join(root, name), 'utf8');
      if (/<\?(?!xml\b)/i.test(content)) throw new Error('PHP en build estático: ' + name);
    }
  }
  return inventory;
}
