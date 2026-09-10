# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
bundle install && npm install   # first-time setup

npm start           # dev: esbuild watcher + `jekyll serve --livereload` at 127.0.0.1:4000
npm run build       # production: build:assets, then `jekyll build`
npm run build:assets  # esbuild only (hashed, minified) — writes assets/ + _data/manifest.json
npm run clean       # delete assets/js, assets/css, _site, _data/manifest.json

bundle exec htmlproofer _site --disable-external   # the only check in CI; run after a build
```

There is no test suite. "Does it pass" means: `npm run build` succeeds and htmlproofer is clean over `_site`.

## Architecture

Two build systems, run in a fixed order. **esbuild owns everything that reaches the browser; Jekyll owns HTML.**

1. `esbuild.config.mjs` bundles `src/js/main.js` and `src/css/main.css` into `assets/js/` and `assets/css/`, then writes `_data/manifest.json` mapping logical names to built paths (`"main.js": "/assets/js/main-6Q3ZX3R2.js"`).
2. Jekyll reads that manifest through `_includes/asset.html`. Templates never hardcode a hash — they do `{% include asset.html name='main.css' fallback='css/main.css' %}`.

Consequences worth knowing before touching either side:

- `src/`, `package.json`, `node_modules`, and `Gemfile` are in `_config.yml`'s `exclude`. Jekyll only ever sees compiled output.
- Assets must be built before Jekyll, or the manifest is stale/absent and pages fall back to unhashed paths.
- Watch mode uses **stable** filenames and sourcemaps; production uses content hashes and minifies. Only the production path exercises the manifest's real values.
- `jekyll serve --incremental` is deliberately not used: it skips regeneration when only `_data/manifest.json` changes, leaving HTML pointing at replaced filenames.
- esbuild wipes `assets/js` and `assets/css` at the start of every build. `assets/images/` is hand-committed and survives; `assets/media/` (fonts, emitted via the `file` loader) is generated.
- Build output — `assets/js/`, `assets/css/`, `assets/media/`, `_data/manifest.json`, `_site/` — is gitignored. CI rebuilds it.

## Conventions that are easy to get wrong

**Listing pages are `.html`, not `.md`.** Any page that loops over content (`index.html`, `posts.html`, `projects.html`) must stay HTML. Markdown runs through kramdown *after* Liquid, so whitespace-stripping tags like `{%- for -%}` pull generated markup onto the line of a preceding heading and kramdown renders the tags as literal text. Prose pages (`about.md`) are fine as Markdown.

**Front matter is minimal by design.** `defaults` in `_config.yml` assigns layouts by collection, so posts and projects need only a `title`. Projects additionally accept `description`, `tags`, `repo`, `link`, `order` (the index sorts by `order`). `strict_front_matter: true` — a malformed block fails the build rather than being ignored.

**Content paths:** posts are `_posts/YYYY-MM-DD-slug.md` → `/posts/:year/:month/:slug/`; projects are `_projects/slug.md` → `/projects/:name/`. Nav links live in the `nav:` list in `_config.yml`, not in `header.html`.

**Layouts:** `default` (shell) → `home`, `page`, `post`, `project`, `feed`. `feed` is `page` on the wide wrapper, used by pages with a card grid.

## Front end

`src/js/main.js` is the single entry point — import a module there and it ships. Web Components in `src/js/components/`; register the custom element in its own file and use the tag directly in Markdown or a layout.

- `<theme-toggle>` cycles system → light → dark. **Theme state is duplicated in two places that must agree**: `src/js/lib/theme.js` (canonical, owns the `site-theme` localStorage key and the `data-theme` attribute on `<html>`) and a deliberately tiny inline script in `_includes/head.html` that applies the stored value before first paint to avoid a light flash. Changing the storage key or attribute means changing both.
- `<ascii-globe>` renders a rotating Earth as text into a `<pre>`, one string assignment per frame at 18fps. No canvas. Pauses off-screen, renders one static frame under `prefers-reduced-motion`, absent without JS. Land mask is a hand-drawn 72×36 grid in `src/js/lib/world-map.js`.

CSS: add a file under `src/css/` and `@import` it from `main.css`. Colours and spacing are custom properties in `src/css/tokens.css` (gruvbox, light + dark blocks) — that is the file to edit when re-theming, not the component styles.

## Ruby setup

`Gemfile` has a version guard: on Ruby < 3.0 (the macOS system Ruby 2.6) it pins `ffi` and `jekyll-sass-converter` back so a local preview works without a Ruby manager; on 3.x it adds `html-proofer`. Because the two resolve differently, **`Gemfile.lock` is not committed**. CI pins Ruby 3.3 and Node 22. Bundler installs to `vendor/bundle` (`.bundle/config`).

## Deployment

`.github/workflows/pages.yml` runs on every push to `main`: npm ci → `build:assets` → `jekyll build` (with `JEKYLL_ENV=production`) → htmlproofer → deploy to GitHub Pages. Pull requests build and check but do not deploy.
