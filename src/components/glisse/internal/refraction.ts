import { useEffect, useRef, type RefObject } from "react";

import { createLens, distance, fitBackdropLens, shapeOf, type Lens, type LensOptions, type Shape } from "./lens";
import { container, svg } from "./svg";

// Glass bends what's behind it with the same lens as the switch, slider and
// tab bar (see lens.ts), shaped as Aave's free-moving lens, the first demo in
// its article, and scaled to the glass: a rim band a quarter of its shorter
// side wide, a dome that sags the whole half of it, and a reach of 0.45 of
// it, Aave's 72px on its 160px lens. --lg-glass-bend overrides the strength,
// and --lg-glass-dispersion how far its colours split (0.4: red bends 8%
// further than blue). The light on its rim the glass paints over its own
// frost, as iOS does (below).
export const GLASS: LensOptions = {
  strength: 0.45,
  strengthProperty: "--lg-glass-bend",
  dispersion: 0.4,
  dispersionProperty: "--lg-glass-dispersion",
  depth: 0.25,
  dome: 0.5,
  splay: 1,
  relative: true,
  paintsLight: true,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// The light on glass's rim, as iOS 26.1 draws it on `.glassEffect()`,
// measured at 3x over flat grey: a line brightest at the very edge and gone
// 1.2px in, slightly bowed. A light from the top left lights the whole of
// the left side and top, and its reflection the right side and bottom; it
// fades out over the corners between, and is a little wider on the two
// corners it faces. Over 50% grey it lifts the glass 0.65 of the way to
// white on a light page and 0.3 on a dark one (0.13 over black). Part of
// that is the backdrop's own colour, which iOS lets through at the edge, so
// a rim of white alone reads harsher: --lg-rim-shine sets it at 0.3 on a
// light page and 0.13 on a dark one, iOS's white alone over black.
//
// Under the light it draws the glass's 0.5px --lg-edge line, which CSS would
// otherwise draw over it as an inset shadow (see styles.css).
const RIM_WIDTH = 1.22;
const EDGE_WIDTH = 0.5;

/** An sRGB colour, 0–255, with alpha 0–1. */
type Colour = readonly [number, number, number, number];

/** The rim's light, white, over its edge line, at `density` pixels to the px. */
export function rimMap(
  { width, height, radius }: Shape,
  shine: number,
  density: number,
  edge: Colour = [0, 0, 0, 0],
): { columns: number; rows: number; data: Uint8ClampedArray } {
  const columns = Math.max(1, Math.round(width * density));
  const rows = Math.max(1, Math.round(height * density));
  const data = new Uint8ClampedArray(columns * rows * 4);
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const corner = clamp(radius, 0, Math.min(halfWidth, halfHeight));
  const half = 0.5 / density;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = ((column + 0.5) / columns) * width - halfWidth;
      const y = ((row + 0.5) / rows) * height - halfHeight;
      const depth = -distance(x, y, halfWidth, halfHeight, corner);
      if (depth < -half || depth > 2 * RIM_WIDTH) continue;
      // The nearest edge's outward normal.
      const qx = Math.abs(x) - halfWidth + corner;
      const qy = Math.abs(y) - halfHeight + corner;
      let nx = 0;
      let ny = 0;
      if (qx > 0 && qy > 0) {
        const length = Math.hypot(qx, qy);
        nx = (Math.sign(x) * qx) / length;
        ny = (Math.sign(y) * qy) / length;
      } else if (qx > qy) nx = Math.sign(x);
      else ny = Math.sign(y);
      // 1 along the lit sides, √2 on the corners they meet at, 0 on the others.
      const facing = Math.abs(nx + ny);
      const along = Math.max(0, depth) / (RIM_WIDTH * Math.sqrt(Math.max(1, facing)));
      // How much of the pixel the shape, and the edge line, cover.
      const cover = clamp((depth + half) * density, 0, 1);
      const lined = clamp((Math.min(EDGE_WIDTH, depth + half) - Math.max(0, depth - half)) * density, 0, 1);
      const light = along < 1 ? shine * Math.min(1, facing) ** 1.5 * (1 - along ** 1.5) * cover : 0;
      const line = edge[3] * lined * (1 - light);
      const alpha = light + line;
      if (alpha <= 0) continue;
      const i = (row * columns + column) * 4;
      for (let channel = 0; channel < 3; channel++) data[i + channel] = Math.round((255 * light + edge[channel]! * line) / alpha);
      data[i + 3] = Math.round(255 * alpha);
    }
  }
  return { columns, rows, data };
}

// A CSS colour as sRGB and alpha, by the canvas's own parsing.
function parseColour(context: CanvasRenderingContext2D, colour: string): Colour {
  context.fillStyle = "#0000";
  context.fillStyle = colour;
  const value = String(context.fillStyle);
  if (value.startsWith("#")) {
    const [r, g, b] = [1, 3, 5].map((at) => parseInt(value.slice(at, at + 2), 16));
    return [r!, g!, b!, 1];
  }
  const [r = 0, g = 0, b = 0, a = 1] = (value.match(/[\d.]+/g) ?? []).map(Number);
  return [r, g, b, a];
}

const rims = new Map<string, string>();
let palette: CanvasRenderingContext2D | null | undefined;

// Sets the glass's --lg-rim for its size, corners and page, and marks it
// data-rim, as its rim now draws its edge line.
function paintRim(element: HTMLElement): void {
  const style = getComputedStyle(element);
  const shape = shapeOf(element, style);
  palette ??= document.createElement("canvas").getContext("2d");
  if (!shape || !palette) return;
  const tuned = parseFloat(style.getPropertyValue("--lg-rim-shine"));
  const shine = Number.isFinite(tuned) ? clamp(tuned, 0, 1) : 0.13;
  const edge = parseColour(palette, style.getPropertyValue("--lg-edge").trim() || "transparent");
  const density = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 3) : 1;
  const key = [shape.width, shape.height, shape.radius, shine, edge, density].join("|");
  let url = rims.get(key);
  if (!url) {
    const { columns, rows, data } = rimMap(shape, shine, density, edge);
    const canvas = document.createElement("canvas");
    canvas.width = columns;
    canvas.height = rows;
    const context = canvas.getContext("2d");
    if (!context) return;
    const image = context.createImageData(columns, rows);
    image.data.set(data);
    context.putImageData(image, 0, 0);
    url = `url("${canvas.toDataURL()}")`;
    rims.set(key, url);
  }
  element.style.setProperty("--lg-rim", url);
  element.setAttribute("data-rim", "");
}

// What to repaint when the page's theme changes, which no resize reports: a
// data-theme set anywhere, or the system's light or dark.
const repaints = new Set<() => void>();
let unwatch: (() => void) | undefined;

function onThemeChange(repaint: () => void): () => void {
  repaints.add(repaint);
  if (!unwatch) {
    const run = () => repaints.forEach((each) => each());
    const observer = new MutationObserver(run);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"], subtree: true });
    const scheme = matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener?.("change", run);
    unwatch = () => {
      observer.disconnect();
      scheme.removeEventListener?.("change", run);
    };
  }
  return () => {
    repaints.delete(repaint);
    if (repaints.size) return;
    unwatch?.();
    unwatch = undefined;
  };
}

function whenIdle(callback: () => void): () => void {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    const handle = window.requestIdleCallback(callback, { timeout: 500 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = setTimeout(callback, 50);
  return () => clearTimeout(handle);
}

interface Fitting {
  /** Fits again now, once it has fitted at all: for settings changed without a resize. */
  refit(): void;
  /** Stops, and removes what fitting set. */
  stop(): void;
}

// Fits the glass once the page is idle, and again whenever it changes size.
function refitting(element: HTMLElement, fit: () => void, properties: string[]): Fitting {
  let cancel: (() => void) | undefined;
  let fitted = false;
  const observer = new ResizeObserver(() => {
    cancel?.();
    cancel = whenIdle(() => {
      fitted = true;
      fit();
    });
  });
  observer.observe(element);
  return {
    refit: () => {
      if (fitted) fit();
    },
    stop: () => {
      cancel?.();
      observer.disconnect();
      for (const name of properties) element.style.removeProperty(name);
    },
  };
}

/** Only Chromium applies SVG filters to the live backdrop. */
export const refractsBackdrop = (): boolean =>
  typeof navigator !== "undefined" ? /Chrom(?:e|ium)\//.test(navigator.userAgent) : false;

const MARK = "data-glisse-backdrop";

// The part of an element that can be seen, cut down by every ancestor that
// clips its overflow (a large image inside a small scroller shows only the scroller).
function visibleBox(element: HTMLElement): DOMRect {
  let { left, top, right, bottom } = element.getBoundingClientRect();
  for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (!/hidden|clip|auto|scroll/.test(`${style.overflow} ${style.overflowX} ${style.overflowY}`)) continue;
    const clip = node.getBoundingClientRect();
    left = Math.max(left, clip.left);
    top = Math.max(top, clip.top);
    right = Math.min(right, clip.right);
    bottom = Math.min(bottom, clip.bottom);
  }
  return new DOMRect(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
}

/** The marked content behind the glass: the closest one whose visible part it overlaps. */
function findBackdrop(element: HTMLElement): HTMLElement | null {
  const box = element.getBoundingClientRect();
  const behind = (candidate: HTMLElement) => {
    if (candidate.contains(element) || element.contains(candidate)) return false;
    const other = visibleBox(candidate);
    return other.left < box.right && other.right > box.left && other.top < box.bottom && other.bottom > box.top;
  };
  for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
    const found = [...node.querySelectorAll<HTMLElement>(`[${MARK}]`)].find(behind);
    if (found) return found;
  }
  return null;
}

// The lenses kept over marked content, by the content. Each frame, one lens
// over each piece of content places them all (see lens.ts), so the bend
// stays under every glass however it or the content moves.
const followed = new Map<HTMLElement, Set<Lens>>();
let following = 0;

function follow(): void {
  for (const lenses of followed.values()) lenses.values().next().value?.update();
  following = followed.size ? requestAnimationFrame(follow) : 0;
}

// Makes the glass a lens over the marked content behind it, as a thumb is
// over its track: the content is filtered with the glass's map placed where
// the glass stands, and the glass frosts it as usual.
function bend(element: HTMLElement, source: HTMLElement): Fitting {
  const lens = createLens(element, source, GLASS);
  let started = false;
  const fitting = refitting(
    element,
    () => {
      paintRim(element);
      if (started) return lens.refit();
      started = true;
      lens.setActive(true);
      let lenses = followed.get(source);
      if (!lenses) followed.set(source, (lenses = new Set()));
      lenses.add(lens);
      following ||= requestAnimationFrame(follow);
    },
    ["--lg-rim"],
  );
  return {
    refit: fitting.refit,
    stop: () => {
      fitting.stop();
      const lenses = followed.get(source);
      lenses?.delete(lens);
      if (lenses && !lenses.size) followed.delete(source);
      lens.destroy();
    },
  };
}

/**
 * Bends what's behind the element. Content marked `data-glisse-backdrop`
 * behind it is filtered, in every browser, with the glass's lens placed
 * where the glass stands. Over anything else, Chromium filters the live
 * backdrop with the same lens, and other browsers keep the frost and the lit
 * rim. `selection` is the tab bar's lifted lens, whose own bend is below;
 * with `bendsBackdrop` false it only takes its rims, and bends its backdrop
 * itself.
 *
 * The glass reads its settings (--lg-glass-bend, --lg-glass-dispersion,
 * --lg-rim-shine) when it fits, and again each time it renders, so settings
 * set from React, on it or above it, take effect at once.
 */
export function useRefraction(ref: RefObject<HTMLElement | null>, selection = false, bendsBackdrop = true): void {
  const refit = useRef<(() => void) | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (selection) {
      const properties = bendsBackdrop ? SELECTION_PROPERTIES : SELECTION_PROPERTIES.filter((name) => name !== "--lg-filter");
      return refitting(element, () => fitSelection(element, bendsBackdrop && refractsBackdrop()), properties).stop;
    }
    const source = findBackdrop(element);
    const fitting = source
      ? bend(element, source)
      : refitting(
          element,
          () => {
            paintRim(element);
            if (refractsBackdrop()) fitBackdropLens(element, GLASS);
          },
          ["--lg-filter", "--lg-rim"],
        );
    refit.current = fitting.refit;
    const stopWatching = onThemeChange(() => paintRim(element));
    return () => {
      refit.current = null;
      stopWatching();
      fitting.stop();
      element.removeAttribute("data-rim");
    };
  }, [ref, selection, bendsBackdrop]);
  // After every render: cheap when nothing changed, as the maps are cached.
  useEffect(() => refit.current?.());
}

// A segmented control's lifted lens, on a light page, bends the track and the
// page behind it where the browser can: by Snell's law through a squircle rim
// (https://kube.io/blog/liquid-glass-css-svg/), pushed outwards, split into
// red, green and blue. Both its and the tab bar's lifted lenses take iOS's
// brighter rim from here; the tab bar bends its backdrop with the same lens
// as its labels (see segments.tsx).

const SELECTION_PROPERTIES = ["--lg-filter", "--lg-rim", "--lg-rim-bright"];

interface Selection {
  filter: string;
  rim: string;
  /** The brighter rim, for a light page. */
  brightRim: string;
}

const selections = new Map<string, Selection>();

function profile(bezel: number, thickness: number): { samples: Float32Array; maximum: number } {
  const samples = new Float32Array(128);
  let maximum = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = Math.max(0.001, i / (samples.length - 1));
    const surface = (1 - (1 - t) ** 4) ** 0.25;
    const incident = Math.atan((1 - t) ** 3 / surface ** 3);
    const refracted = Math.asin(Math.sin(incident) / 1.5);
    samples[i] = Math.tan(incident - refracted) * (thickness + surface * bezel);
    maximum = Math.max(maximum, samples[i]!);
  }
  return { samples, maximum };
}

function selectionMaps(width: number, height: number, radius: number) {
  const density = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const bezel = clamp(Math.min(width, height) * 0.12, 4, 10);
  const thickness = clamp(Math.min(width, height) * 0.2, 8, 24);
  const { samples, maximum } = profile(bezel, thickness);

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * density);
  canvas.height = Math.ceil(height * density);
  const context = canvas.getContext("2d")!;
  const field = context.createImageData(canvas.width, canvas.height);
  const shine = context.createImageData(canvas.width, canvas.height);
  const bright = context.createImageData(canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const px = ((x + 0.5) * width) / canvas.width - width / 2;
      const py = ((y + 0.5) * height) / canvas.height - height / 2;
      const qx = Math.abs(px) - (width / 2 - radius);
      const qy = Math.abs(py) - (height / 2 - radius);
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const length = Math.hypot(ox, oy);
      const distance = radius - (length + Math.min(Math.max(qx, qy), 0));
      const nx = length > 0 ? (ox / length) * Math.sign(px) : qx > qy ? Math.sign(px) : 0;
      const ny = length > 0 ? (oy / length) * Math.sign(py) : qx > qy ? 0 : Math.sign(py);

      let shift = 0;
      if (distance >= 0 && distance < bezel) {
        const sample = (distance / bezel) * (samples.length - 1);
        const lower = Math.floor(sample);
        const a = samples[lower]!;
        const b = samples[Math.min(lower + 1, samples.length - 1)]!;
        shift = a + (b - a) * (sample - lower);
      }

      const i = (y * canvas.width + x) * 4;
      field.data[i] = Math.round(127.5 + ((nx * shift) / maximum) * 127.5);
      field.data[i + 1] = Math.round(127.5 + ((ny * shift) / maximum) * 127.5);
      field.data[i + 2] = 128;
      field.data[i + 3] = 255;

      const light = -(nx + ny) * Math.SQRT1_2;
      const glint = Math.max(light, 0) ** 3;
      const reflected = Math.max(-light, 0) ** 3;
      shine.data[i] = shine.data[i + 1] = shine.data[i + 2] = 255;

      let alpha = 0;
      if (distance >= 0) {
        const bands = [0.18, 0.42, 0.66].map((centre) => Math.exp(-(((distance - centre) / 0.22) ** 2)));
        const peak = Math.max(...bands);
        alpha = peak * (0.06 + 0.8 * glint + 0.35 * reflected) * 0.85;
        for (let channel = 0; channel < 3; channel++) {
          shine.data[i + channel] = Math.round(255 * (0.65 + 0.35 * (peak ? bands[channel]! / peak : 0)));
        }
        // On a light page, iOS 26.1's held lens, measured: a white line about
        // 1.2px wide just inside its edge, lifting what's behind it 60-70% of
        // the way to white on every side, most where the light falls. Drawn
        // for the lens at rest, which a hold enlarges by about 1.3.
        const wide = [0.4, 0.5, 0.6].map((centre) => Math.exp(-(((distance - centre) / 0.4) ** 2)));
        const top = Math.max(...wide);
        for (let channel = 0; channel < 3; channel++) {
          bright.data[i + channel] = Math.round(255 * (0.85 + 0.15 * (top ? wide[channel]! / top : 0)));
        }
        bright.data[i + 3] = Math.round(clamp(top * (0.55 + 0.3 * glint + 0.15 * reflected), 0, 1) * 255);
      }
      shine.data[i + 3] = Math.round(clamp(alpha, 0, 1) * 255);
    }
  }

  context.putImageData(field, 0, 0);
  const displacement = canvas.toDataURL();
  context.putImageData(shine, 0, 0);
  const highlight = canvas.toDataURL();
  context.putImageData(bright, 0, 0);
  const brightHighlight = canvas.toDataURL();
  return { displacement, highlight, brightHighlight, scale: maximum * 2 };
}

// The filter only bends the rim. The rim highlight is applied in CSS, which
// Chromium positions correctly when it repaints part of the glass.
function selectionLens(width: number, height: number, radius: number): Selection {
  const key = [width, height, radius].join("-");
  const cached = selections.get(key);
  if (cached) return cached;

  const { displacement, highlight, brightHighlight, scale } = selectionMaps(width, height, radius);
  const id = `glisse-selection-${selections.size}`;
  const box = { x: 0, y: 0, width, height };
  const filter = svg("filter", {
    id,
    ...box,
    filterUnits: "userSpaceOnUse",
    primitiveUnits: "userSpaceOnUse",
    "color-interpolation-filters": "sRGB",
  });
  filter.append(svg("feImage", { href: displacement, ...box, preserveAspectRatio: "none", result: "field" }));
  const channels = [
    ["r", 1.035, "1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"],
    ["g", 1, "0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"],
    ["b", 0.965, "0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"],
  ] as const;
  for (const [name, factor, values] of channels) {
    filter.append(
      svg("feDisplacementMap", {
        in: "SourceGraphic",
        in2: "field",
        scale: scale * factor,
        xChannelSelector: "R",
        yChannelSelector: "G",
        result: `${name}-ray`,
      }),
      svg("feColorMatrix", { in: `${name}-ray`, type: "matrix", values, result: name }),
    );
  }
  filter.append(
    svg("feComposite", { in: "r", in2: "g", operator: "arithmetic", k2: 1, k3: 1, result: "rg" }),
    svg("feComposite", { in: "rg", in2: "b", operator: "arithmetic", k2: 1, k3: 1 }),
  );
  container().append(filter);

  const result = { filter: `url("#${id}")`, rim: `url("${highlight}")`, brightRim: `url("${brightHighlight}")` };
  selections.set(key, result);
  return result;
}

function fitSelection(element: HTMLElement, filtered: boolean): void {
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  if (!width || !height) return;
  const corner = getComputedStyle(element).borderTopLeftRadius;
  const radius = Math.min(
    width / 2,
    height / 2,
    corner.endsWith("%") ? (Math.min(width, height) * parseFloat(corner)) / 100 : parseFloat(corner),
  );
  const { filter, rim, brightRim } = selectionLens(width, height, radius);
  if (filtered) element.style.setProperty("--lg-filter", filter);
  element.style.setProperty("--lg-rim", rim);
  element.style.setProperty("--lg-rim-bright", brightRim);
}
