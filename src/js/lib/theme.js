// Theme state lives in one place so the toggle component and the initial
// page load agree on what "current theme" means.

const STORAGE_KEY = 'site-theme';
export const THEMES = ['system', 'light', 'dark'];

export function storedTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(value) ? value : 'system';
  } catch {
    return 'system'; // private mode / storage disabled
  }
}

export function applyStoredTheme() {
  applyTheme(storedTheme());
}

export function applyTheme(theme) {
  const next = THEMES.includes(theme) ? theme : 'system';
  const root = document.documentElement;

  if (next === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', next);
  }

  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* nothing to do if storage is unavailable */
  }

  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
  return next;
}

export function cycleTheme() {
  const index = THEMES.indexOf(storedTheme());
  return applyTheme(THEMES[(index + 1) % THEMES.length]);
}

/** Resolves 'system' to the concrete theme the browser is showing. */
export function resolvedTheme() {
  const theme = storedTheme();
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
