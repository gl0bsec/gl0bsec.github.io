---
title: This site
description: A Jekyll site with a modern JavaScript build — esbuild, Web Components, and a globe made of text.
tags: [jekyll, esbuild, web-components]
repo: https://github.com/gl0bsec/gl0bsec.github.io
order: 1
---

The site you are reading is the first project in the list. Jekyll owns the
content layer; esbuild owns everything that runs in the browser.

## How it fits together

`src/` holds the authored front end — JavaScript modules, Web Components, and
CSS. `esbuild.config.mjs` bundles it into `assets/` under content-hashed
filenames and writes `_data/manifest.json`. Jekyll reads that manifest through
`_includes/asset.html`, so templates ask for `main.js` and get
`/assets/js/main-6Q3ZX3R2.js`.

Nothing about that is framework-specific. The output is plain HTML, one CSS
file, and one ES module — it runs in the visitor's browser with no runtime
dependency on the build.

## What's on the page

Behind the homepage headline is `<ascii-globe>`, a Web Component that renders a
slowly rotating Earth as characters in a `<pre>`. Each frame it walks the
character grid, intersects a unit sphere, rotates the hit point back through the
axial tilt and the current spin to get a latitude and longitude, samples a
coarse land mask, and picks a character from one of two density ramps — a
heavier one for land, a lighter one for water — scaled by a simple diffuse term.

There is no canvas and no WebGL: the whole frame is one string assigned to
`textContent`, throttled to 18fps because it should feel like a terminal rather
than a game. It takes its colour from a CSS custom property, pauses when
scrolled out of view, renders a single still frame when `prefers-reduced-motion`
is set, and without JavaScript it is simply absent.

The land mask in `src/js/lib/world-map.js` is a 72x36 grid drawn by hand from
continent bounds. It is about 36% land against Earth's real 29% — close enough
to read as Earth at fifty characters across, and not intended as anything more.

The theme control in the header is `<theme-toggle>`, cycling system, light, and
dark. A three-line inline script in `<head>` applies the saved choice before
first paint so there is no flash of the wrong theme.
