# gl0bsec.github.io

Site for public projects.

A Jekyll site with a modern JavaScript build. Jekyll owns layouts, Markdown, and
content generation; [esbuild](https://esbuild.dev) bundles the JavaScript and CSS
that ship to the browser. The output is plain HTML, one stylesheet, and one ES
module — no client-side framework.

## Requirements

- Ruby (the macOS system Ruby 2.6 works; see the guard in the `Gemfile`)
- Node.js 20+

```sh
bundle install
npm install
```

## Working on the site

```sh
npm start          # preview at http://127.0.0.1:4000 with live reload
npm run build      # production build: minified, hashed assets + _site/
npm run clean      # remove all generated output
```

`npm start` runs the esbuild watcher and `jekyll serve` together. Editing
anything in `src/` triggers an esbuild rebuild; editing content or templates
triggers a Jekyll rebuild. Either way the browser reloads itself.

Note that `jekyll serve --incremental` is deliberately not used: it skips
regenerating pages when only `_data/manifest.json` changes, which leaves the
HTML pointing at asset filenames the watcher has already replaced.

## Layout

```
_config.yml            site settings, collections, nav
index.html             homepage
projects.html          project index
posts.html             post index
about.md               prose page
_layouts/              default, home, page, post, project
_includes/             head, header, footer, cards, asset.html
_posts/                posts (YYYY-MM-DD-slug.md)
_projects/             projects collection
src/js/                ES modules and Web Components
src/css/               CSS, entry point is main.css
assets/images/         static images, copied through by Jekyll
esbuild.config.mjs     the front-end build
```

### How assets are wired

`esbuild.config.mjs` bundles `src/js/main.js` and `src/css/main.css` into
`assets/` under content-hashed filenames, then writes `_data/manifest.json`:

```json
{
  "main.js": "/assets/js/main-6Q3ZX3R2.js",
  "main.css": "/assets/css/main-6MFVGYRD.css"
}
```

Templates never hardcode a hash. They ask for the logical name:

```liquid
<link rel="stylesheet" href="{% include asset.html name='main.css' %}">
```

Build output (`assets/js/`, `assets/css/`, `_data/manifest.json`, `_site/`) is
generated and not committed — CI rebuilds it.

### Adding front-end code

Drop a module in `src/js/`, import it from `src/js/main.js`, and it is in the
bundle. Web Components live in `src/js/components/`; register the custom element
there and use the tag directly in Markdown or a layout. Two ship by default:

- `<theme-toggle>` — cycles system / light / dark, persisted to `localStorage`
- `<ascii-globe>` — a rotating globe drawn as text, one string assignment per
  frame into a `<pre>`. Paused when off-screen, static under
  `prefers-reduced-motion`. Its land mask lives in `src/js/lib/world-map.js`

CSS is bundled the same way: add a file under `src/css/` and `@import` it from
`main.css`. Colours are CSS custom properties in `src/css/tokens.css`, which is
the file to edit when re-theming.

## Adding content

Posts are `_posts/YYYY-MM-DD-slug.md`; projects are `_projects/slug.md`. Both
pick up their layout automatically from `defaults` in `_config.yml`, so front
matter only needs a `title`. Projects also take `description`, `tags`, `repo`,
`link`, and `order`.

Prose pages are Markdown. **Listing pages that loop over content are `.html`,
not `.md`** — deliberately. Markdown pages run through kramdown after Liquid, so
a whitespace-stripping tag like `{%- for -%}` can pull generated markup onto the
same line as a preceding heading, and kramdown then renders the tags as literal
text. Keeping template-shaped pages in `.html` sidesteps the whole interaction.

## Deployment

`.github/workflows/pages.yml` builds on every push to `main` — Node and Ruby
setup, `npm run build:assets`, `jekyll build`, an html-proofer link check, then
deploy to GitHub Pages. Pull requests build and check without deploying.

Set **Settings → Pages → Source** to **GitHub Actions** for the workflow to
publish.
