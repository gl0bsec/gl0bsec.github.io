// Bundles everything under src/ into assets/ and writes _data/manifest.json,
// which Jekyll reads so templates can link to the content-hashed filenames.
//
//   node esbuild.config.mjs           production build: minified, hashed names
//   node esbuild.config.mjs --watch    dev build: stable names, sourcemaps

import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const watch = process.argv.includes('--watch');
const production = !watch;

const OUT_DIR = 'assets';
const MANIFEST = '_data/manifest.json';
const GENERATED = ['assets/js', 'assets/css'];

const entryPoints = ['src/js/main.js', 'src/css/main.css'];

/**
 * Turn the esbuild metafile into { "main.js": "/assets/js/main-A1B2C3.js", ... }
 * keyed by the entry point's basename so templates ask for a stable name.
 */
function writeManifest(metafile) {
  const manifest = {};
  for (const [outfile, meta] of Object.entries(metafile.outputs)) {
    if (!meta.entryPoint) continue; // skip sourcemaps and shared chunks
    manifest[path.basename(meta.entryPoint)] = '/' + outfile.split(path.sep).join('/');
  }
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

const context = await esbuild.context({
  entryPoints,
  outdir: OUT_DIR,
  outbase: 'src',
  // Hashing busts caches in production; plain names keep watch mode tidy.
  entryNames: production ? '[dir]/[name]-[hash]' : '[dir]/[name]',
  bundle: true,
  splitting: false,
  format: 'esm',
  target: ['es2022', 'chrome111', 'firefox111', 'safari16'],
  minify: production,
  sourcemap: production ? false : 'linked',
  metafile: true,
  logLevel: 'info',
  loader: {
    '.png': 'file',
    '.jpg': 'file',
    '.svg': 'file',
    '.woff2': 'file',
    '.glsl': 'text',
  },
  assetNames: 'media/[name]-[hash]',
  plugins: [
    {
      name: 'manifest',
      setup(build) {
        build.onStart(() => {
          // Stale hashed files would otherwise pile up between builds.
          for (const dir of GENERATED) fs.rmSync(dir, { recursive: true, force: true });
        });
        build.onEnd((result) => {
          if (result.errors.length || !result.metafile) return;
          const manifest = writeManifest(result.metafile);
          console.log(`[manifest] ${MANIFEST} ->`, manifest);
        });
      },
    },
  ],
});

if (watch) {
  await context.watch();
  console.log('[esbuild] watching src/ ...');
} else {
  await context.rebuild();
  await context.dispose();
}
