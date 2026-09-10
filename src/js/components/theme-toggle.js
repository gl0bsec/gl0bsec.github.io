import { cycleTheme, storedTheme } from '../lib/theme.js';

const LABELS = { system: 'System', light: 'Light', dark: 'Dark' };

// Inline SVG rather than Unicode symbols: ☀/☾ get substituted with emoji on
// some platforms, which ignores currentColor and breaks the alignment.
const SVG = (paths) =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true" focusable="false">${paths}</svg>`;

const ICONS = {
  // Half-filled disc: follow the system.
  system: SVG(
    '<circle cx="12" cy="12" r="8.5"/>' +
      '<path d="M12 3.5a8.5 8.5 0 0 0 0 17z" fill="currentColor" stroke="none"/>',
  ),
  light: SVG(
    '<circle cx="12" cy="12" r="4.2"/>' +
      '<path d="M12 2.2v2.4M12 19.4v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7' +
      'M2.2 12h2.4M19.4 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7"/>',
  ),
  dark: SVG('<path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1z"/>'),
};

/**
 * <theme-toggle> — cycles system -> light -> dark.
 *
 * Renders its own button in shadow DOM, so it only appears when the script
 * has run; the page is fully usable without it. The glyph carries no text, so
 * the current theme is exposed through aria-label and title instead.
 */
class ThemeToggle extends HTMLElement {
  #button;

  connectedCallback() {
    if (this.shadowRoot) return;

    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        button {
          display: grid;
          place-items: center;
          inline-size: 2.1rem;
          block-size: 2.1rem;
          padding: 0;
          font: inherit;
          color: inherit;
          background: none;
          border: 0;
          /* Inherited from the page, so the focus ring tracks the site's radius. */
          border-radius: var(--radius, 0.35rem);
          cursor: pointer;
          opacity: 0.7;
        }
        button:hover { opacity: 1; }
        /* With the frame gone this is the only boundary the button ever draws,
           and base.css :focus-visible does not cross the shadow boundary. */
        button:focus-visible {
          opacity: 1;
          outline: 2px solid var(--accent, currentColor);
          outline-offset: 2px;
        }
        svg { display: block; }
      </style>
      <button type="button" part="button"></button>
    `;

    this.#button = root.querySelector('button');
    this.#button.addEventListener('click', () => this.#render(cycleTheme()));
    document.addEventListener('themechange', (event) => this.#render(event.detail.theme));
    this.#render(storedTheme());
  }

  #render(theme) {
    const key = theme in ICONS ? theme : 'system';
    // Static constants only — no interpolated input reaches innerHTML.
    this.#button.innerHTML = ICONS[key];
    this.#button.setAttribute('aria-label', `Theme: ${LABELS[key]}. Click to change.`);
    this.#button.title = `Theme: ${LABELS[key]}`;
  }
}

customElements.define('theme-toggle', ThemeToggle);
