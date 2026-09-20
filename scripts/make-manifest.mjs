#!/usr/bin/env node
// ============================================================
// make-manifest.mjs
// Computes SHA-256 for each file in public/sample-evidence/
// and writes public/sample-evidence/manifest.json
// ============================================================

import { createHash } from 'crypto';
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const evidenceDir = resolve(__dirname, '../public/sample-evidence');

const files = readdirSync(evidenceDir)
  .filter(f => !f.startsWith('.') && f !== 'manifest.json' && !f.endsWith('.txt'));

const manifest = {};

for (const file of files) {
  const filePath = join(evidenceDir, file);
  const content = readFileSync(filePath);
  const hash = createHash('sha256').update(content).digest('hex');
  manifest[file] = hash;
  console.log(`  ${file}: ${hash.slice(0, 16)}…`);
}

writeFileSync(
  join(evidenceDir, 'manifest.json'),
  JSON.stringify({ generated: new Date().toISOString(), files: manifest }, null, 2)
);

console.log(`\nManifest written with ${files.length} files.`);
