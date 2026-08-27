#!/usr/bin/env node
/**
 * Verifies the built package before publishing.
 *
 * v1.0.0 shipped with `main` and `exports["."].require` pointing at a
 * `tablez.umd.js` that Vite never emits (lib mode with multiple entries
 * produces ES + CJS only), `types` pointing at a `dist/index.d.ts` that was
 * not in the tarball, and declaration files that were nothing but
 * `export {}`. Every one of those failed silently — the build reported
 * success. This script makes them loud.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

const failures = [];
const check = (label, condition, detail) => {
  if (!condition) failures.push(`${label}: ${detail}`);
};

/** Collect every path the package advertises. */
const declared = [
  ['main', pkg.main],
  ['module', pkg.module],
  ['types', pkg.types],
];

for (const [subpath, value] of Object.entries(pkg.exports ?? {})) {
  if (typeof value === 'string') {
    declared.push([`exports["${subpath}"]`, value]);
  } else {
    for (const [condition, target] of Object.entries(value)) {
      declared.push([`exports["${subpath}"].${condition}`, target]);
    }
  }
}

for (const [label, target] of declared) {
  if (!target) continue;
  check(label, existsSync(resolve(root, target)), `${target} does not exist`);
}

// Declarations must contain actual types, not an empty module.
for (const [label, target] of declared.filter(([l]) => l.includes('types'))) {
  const path = resolve(root, target);
  if (!existsSync(path)) continue;

  const size = statSync(path).size;
  check(label, size > 200, `${target} is only ${size} bytes — declarations did not emit`);

  const body = readFileSync(path, 'utf8');
  check(label, /export\s+(declare|type|interface|\{[^}]*\w)/.test(body), `${target} exports nothing`);
}

// The global JSX namespace is gone in React 19, which this package peers on.
for (const [label, target] of declared.filter(([l]) => l.includes('types'))) {
  const path = resolve(root, target);
  if (!existsSync(path)) continue;
  const body = readFileSync(path, 'utf8');
  check(
    label,
    !/(^|[^.\w])JSX\.Element/.test(body),
    `${target} references the global JSX.Element, which React 19 consumers cannot resolve`,
  );
}

// The CommonJS build must actually load under CommonJS.
const requirePath = pkg.exports?.['.']?.require ?? pkg.main;
if (requirePath && existsSync(resolve(root, requirePath))) {
  try {
    const require = createRequire(import.meta.url);
    const loaded = require(resolve(root, requirePath));
    check('cjs entry', Object.keys(loaded).length > 0, `${requirePath} exported nothing`);
  } catch (error) {
    check('cjs entry', false, `${requirePath} failed to require — ${error.code ?? error.message}`);
  }
}

// react-native is only needed by the /native subpath; a required peer would
// pull ~83MB into every web consumer.
if (pkg.peerDependencies?.['react-native']) {
  check(
    'peerDependenciesMeta',
    pkg.peerDependenciesMeta?.['react-native']?.optional === true,
    'react-native must be marked optional or npm installs it for web-only consumers',
  );
}

if (failures.length) {
  console.error('\npackage verification failed:\n');
  failures.forEach((line) => console.error(`  ✗ ${line}`));
  console.error('');
  process.exit(1);
}

console.log(`package verification passed — ${declared.length} declared paths resolve`);
