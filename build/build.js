#!/usr/bin/env node
/*
 * Build script for the self‑modifying binaries slide deck.
 *
 * This script bundles the entire project into a single standalone
 * `dist/index.html`. It inlines CSS, JavaScript, markdown slides and
 * images as base64 data URIs. The result can be opened directly via
 * file:// with zero external dependencies.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'docs');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Read core files
const indexTemplate = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
let themeCss = fs.readFileSync(path.join(projectRoot, 'theme.css'), 'utf8');
const appJs = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf8');

// Load deck and slides
const deck = JSON.parse(fs.readFileSync(path.join(projectRoot, 'deck.json'), 'utf8'));
const slides = {};
deck.slides.forEach(slide => {
  const mdPath = slide.file;
  const fullPath = path.join(projectRoot, mdPath);
  slides[mdPath] = fs.readFileSync(fullPath, 'utf8');
});

// Encode assets to base64 data URIs
const assets = {};
const assetDir = path.join(projectRoot, 'assets');
fs.readdirSync(assetDir).forEach(file => {
  const ext = path.extname(file).toLowerCase();
  const data = fs.readFileSync(path.join(assetDir, file));
  let mime;
  if (ext === '.png') mime = 'image/png';
  else if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
  else if (ext === '.svg') mime = 'image/svg+xml';
  else if (ext === '.gif') mime = 'image/gif';
  else return; // skip unsupported
  const base64 = data.toString('base64');
  assets['assets/' + file] = `data:${mime};base64,${base64}`;
});

// Replace any references to asset files within the CSS with the corresponding
// base64 data URIs. This ensures the background image and other assets
// referenced via url(...) are bundled into the final HTML. We handle
// single‑quoted, double‑quoted and unquoted url() declarations.
themeCss = themeCss.replace(/url\(([^)]+)\)/g, (match, p1) => {
  // Remove surrounding quotes if present
  const trimmed = p1.trim().replace(/^["']|["']$/g, '');
  if (assets[trimmed]) {
    return `url('${assets[trimmed]}')`;
  }
  return match;
});

// Build the EMBED_DATA object
const embedData = { deck, slides, assets };

// Create the replacement script assignment
const embedScript = `window.EMBED_DATA = ${JSON.stringify(embedData)};`;

// Replace CSS, JS and embed placeholder in the template
let distHtml = indexTemplate;
distHtml = distHtml.replace(/<link rel="stylesheet" href="theme\.css">/, `<style>${themeCss}</style>`);
distHtml = distHtml.replace(/<script src="app\.js"><\/script>/, `<script>${appJs}</script>`);
// Insert the embed script by replacing the default assignment (window.EMBED_DATA = window.EMBED_DATA || {};)
distHtml = distHtml.replace(/window\.EMBED_DATA = window\.EMBED_DATA \|\| \{\};/, embedScript);

// Write output
const outPath = path.join(distDir, 'index.html');
fs.writeFileSync(outPath, distHtml, 'utf8');
console.log(`Build complete. Generated ${outPath}`);
