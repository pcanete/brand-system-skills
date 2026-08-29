#!/usr/bin/env node

// Ejecuta el circuito completo y corta ante el primer fallo:
// build -> exportación -> validación -> ZIP.
// La instalación en WordPress sigue siendo una acción humana separada.

import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { exportPlugin, resolveConfig } from './export-plugin.mjs';
import { packagePlugin } from './package-plugin.mjs';
import { validatePlugin } from './validate-plugin.mjs';

function arg(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

function runBuild(projectRoot) {
  const command = process.platform === 'win32'
    ? { file: process.env.ComSpec || 'cmd.exe', args: ['/d', '/s', '/c', 'npm run build'] }
    : { file: 'npm', args: ['run', 'build'] };

  return new Promise((resolve, reject) => {
    const child = spawn(command.file, command.args, { cwd: projectRoot, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`El build falló${signal ? ` por ${signal}` : ` con código ${code}`}.`));
    });
  });
}

export async function publish({ projectRoot, configPath, outPath, skipBuild = false }) {
  if (!skipBuild) await runBuild(projectRoot);

  const raw = JSON.parse(await readFile(configPath, 'utf8'));
  const config = resolveConfig(raw);
  const { pluginDir, report } = await exportPlugin({ projectRoot, config });

  const issues = await validatePlugin(pluginDir);
  if (issues.length) {
    throw new Error(`El plugin exportado no superó la validación:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`);
  }

  const zipPath = outPath || path.join(path.dirname(pluginDir), `${config.slug}-${config.version}.zip`);
  const packaged = await packagePlugin({ pluginDir, outPath: zipPath });
  return { pluginDir, zipPath, report, packaged };
}

async function main() {
  const projectRoot = path.resolve(process.cwd(), arg('project', '.'));
  const configPath = path.resolve(projectRoot, arg('config', 'wordpress.config.json'));
  const outArg = arg('out');
  const result = await publish({
    projectRoot,
    configPath,
    outPath: outArg ? path.resolve(process.cwd(), outArg) : null,
    skipBuild: process.argv.includes('--skip-build'),
  });

  console.log('✓ build disponible');
  console.log('✓ plugin exportado y verificado');
  console.log(`✓ ZIP instalable: ${result.zipPath}`);
  console.log(`${result.packaged.files} archivos, ${(result.packaged.bytes / 1024 / 1024).toFixed(2)} MB`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
