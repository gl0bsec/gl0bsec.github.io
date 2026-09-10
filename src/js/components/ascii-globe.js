import { WORLD_MAP, MAP_WIDTH, MAP_HEIGHT } from '../lib/world-map.js';

const ROWS = 30;          // character rows; columns derive from the font's aspect
const RADIUS = 0.92;      // sphere radius in normalised cell space, leaving a margin
const TILT = 0.41;        // ~23.4 degrees, so the poles sit off-vertical
const SPIN = 0.26;        // radians per second: one turn roughly every 24s
const FPS = 18;           // deliberately coarse — it should feel like a terminal
const MAX_FONT = 24;      // ceiling on the glyph size, so the grid stays legible
const AMBIENT = 0.35;     // keeps the night side legible instead of blank

// Density ramps, dark to light. Every land character is visually heavier than
// every water character — without that separation, shaded land and lit ocean
// render identically and the continents disappear.
const WATER = ' ..::';
const LAND = '+*#%@';

const LIGHT = (() => {
  const [x, y, z] = [-0.5, 0.42, 0.76];
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
})();

/**
 * <ascii-globe> — a slowly rotating wireframe-ish globe drawn in text.
 *
 * Renders into a <pre>: one string assignment per frame, no canvas. Decorative,
 * so it is aria-hidden and unselectable. Pauses off-screen and renders a single
 * static frame when the visitor prefers reduced motion.
 */
class AsciiGlobe extends HTMLElement {
  #pre;
  #cols = 50;
  #charWidth = 0.6; // width of one character per 1px of font-size
  #frame = 0;
  #last = 0;
  #angle = 0;
  #visible = true;
  #motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  #observer;

  connectedCallback() {
    if (this.#pre) return;

    this.setAttribute('aria-hidden', 'true');
    this.#pre = document.createElement('pre');
    this.appendChild(this.#pre);

    this.#charWidth = this.#measureCharWidth();
    this.#cols = Math.max(16, Math.round(ROWS / this.#charWidth));

    this.#fit();
    new ResizeObserver(() => this.#fit()).observe(this);

    this.#observer = new IntersectionObserver((entries) => {
      this.#visible = entries[0].isIntersecting;
      this.#sync();
    });
    this.#observer.observe(this);

    this.#motion.addEventListener('change', () => this.#sync());
    this.#sync();
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#observer?.disconnect();
  }

  /**
   * Monospace metrics vary by font, and the column count has to match them or
   * the sphere comes out as an ellipse. Measure once against the real font.
   */
  #measureCharWidth() {
    const probe = document.createElement('pre');
    probe.style.cssText =
      'position:absolute;visibility:hidden;margin:0;padding:0;border:0;' +
      'white-space:pre;font-size:100px;line-height:1;';
    probe.style.fontFamily = getComputedStyle(this.#pre).fontFamily;
    probe.textContent = 'M'.repeat(50);
    this.appendChild(probe);
    const width = probe.getBoundingClientRect().width / 50 / 100;
    probe.remove();
    return width || 0.6;
  }

  /** Scales the type so the grid fills the host box without overflowing it. */
  #fit() {
    const { width, height } = this.getBoundingClientRect();
    if (!width || !height) return;
    const size = Math.min(width / (this.#cols * this.#charWidth), height / ROWS);
    this.#pre.style.fontSize = `${Math.max(3, Math.min(size, MAX_FONT))}px`;
  }

  get #animating() {
    return this.#frame !== 0;
  }

  #sync() {
    const shouldAnimate = this.#visible && !this.#motion.matches;
    if (shouldAnimate && !this.#animating) {
      this.#last = performance.now();
      this.#frame = requestAnimationFrame(this.#tick);
    } else if (!shouldAnimate) {
      cancelAnimationFrame(this.#frame);
      this.#frame = 0;
      this.#draw(); // leave a readable still frame behind
    }
  }

  #tick = (now) => {
    this.#frame = requestAnimationFrame(this.#tick);
    const elapsed = now - this.#last;
    if (elapsed < 1000 / FPS) return;
    this.#last = now;
    this.#angle = (this.#angle + SPIN * (elapsed / 1000)) % (Math.PI * 2);
    this.#draw();
  };

  #draw() {
    const cols = this.#cols;
    const cosTilt = Math.cos(TILT);
    const sinTilt = Math.sin(TILT);
    const cosSpin = Math.cos(this.#angle);
    const sinSpin = Math.sin(this.#angle);
    const [lx, ly, lz] = LIGHT;

    let out = '';
    for (let row = 0; row < ROWS; row++) {
      // Screen y runs downward; negate so +y is north.
      const sy = -(((row + 0.5) / ROWS) * 2 - 1) / RADIUS;

      for (let col = 0; col < cols; col++) {
        const sx = (((col + 0.5) / cols) * 2 - 1) / RADIUS;
        const d2 = sx * sx + sy * sy;
        if (d2 > 1) {
          out += ' ';
          continue;
        }

        // Front-facing point on the unit sphere; for a sphere the position is
        // also the surface normal.
        const sz = Math.sqrt(1 - d2);
        const shade = Math.min(1, AMBIENT + (1 - AMBIENT) * Math.max(0, sx * lx + sy * ly + sz * lz));

        // View space -> globe space: undo the axial tilt, then the spin.
        const ty = sy * cosTilt + sz * sinTilt;
        const tz = -sy * sinTilt + sz * cosTilt;
        const gx = sx * cosSpin - tz * sinSpin;
        const gz = sx * sinSpin + tz * cosSpin;

        const lat = Math.asin(Math.max(-1, Math.min(1, ty)));
        const lon = Math.atan2(gx, gz);

        const mapX = Math.floor(((lon + Math.PI) / (Math.PI * 2)) * MAP_WIDTH) % MAP_WIDTH;
        const mapY = Math.min(
          MAP_HEIGHT - 1,
          Math.floor(((Math.PI / 2 - lat) / Math.PI) * MAP_HEIGHT),
        );

        const ramp = WORLD_MAP[mapY][mapX] === '#' ? LAND : WATER;
        out += ramp[Math.round(shade * (ramp.length - 1))];
      }
      out += '\n';
    }

    this.#pre.textContent = out;
  }
}

customElements.define('ascii-globe', AsciiGlobe);
