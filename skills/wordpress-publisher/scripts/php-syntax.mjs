import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { files } from './lib/files.mjs';
export async function checkPhpSyntax(directory) {
  const issues = [];
  for (const file of (await files(directory)).filter(f => f.endsWith('.php'))) {
    const result = spawnSync(process.env.PHP_BINARY || 'php', ['-n', '-l', path.join(directory, file)],
      { encoding: 'utf8', timeout: 15000, shell: false });
    if (result.error) throw new Error('PHP CLI requerido: instalá PHP o configurá PHP_BINARY. ' + result.error.message);
    if (result.status !== 0) issues.push(file + ': ' + (result.stderr || result.stdout).trim());
  }
  return issues;
}
