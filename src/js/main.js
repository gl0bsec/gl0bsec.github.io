// Single entry point for the site. Everything here ships as one ES module,
// loaded with `type="module" defer` so it never blocks rendering.

import './components/theme-toggle.js';
import './components/ascii-globe.js';
import { applyStoredTheme } from './lib/theme.js';

applyStoredTheme();

// Progressive enhancement marker: CSS can key off this to style only what
// actually has JS behind it.
document.documentElement.classList.add('js');
