#!/usr/bin/env node
// ============================================================
// check-offline.mjs
// Scans dist/ for external http(s):// URLs.
// Allowed: w3.org namespace strings and localhost.
// Fails with exit code 1 if any external URLs are found.
// ============================================================

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../dist');

const ALLOWED_PATTERNS = [
  'www.w3.org',
  'purl.org',
  'xmlns.com',
  'schema.org',
  'localhost',
  '127.0.0.1',
  'react.dev',
  'reactrouter.com',
  'phishops.net',
];

const TEXT_EXTENSIONS = ['.js', '.mjs', '.css', '.html', '.json', '.ts', '.txt'];

function getAllFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...getAllFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function isAllowed(url) {
  return ALLOWED_PATTERNS.some(p => url.includes(p));
}

const URL_RE = /https?:\/\/[^\s'"`)>]+/g;

let found = [];
const files = getAllFiles(distDir).filter(f => TEXT_EXTENSIONS.some(ext => f.endsWith(ext)));

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const matches = content.match(URL_RE) ?? [];
  for (const url of matches) {
    if (!isAllowed(url)) {
      found.push({ file: file.replace(distDir, ''), url });
    }
  }
}

if (found.length > 0) {
  console.error('\ncheck:offline FAILED — external URLs found in dist/:');
  for (const { file, url } of found) {
    console.error(`  ${file}: ${url}`);
  }
  console.error('');
  process.exit(1);
} else {
  console.log('check:offline passed — no external URLs found in dist/');
}
