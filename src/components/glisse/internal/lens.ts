import { container, svg } from "./svg";

// A lens is glass over content of its own, like a switch's thumb over its
// track, or a panel over the content marked as its backdrop. As in Aave's web
// glass, the content itself is filtered: a displacement map drawn for the
// lens's shape is placed where the glass stands, so only what's under the
// glass bends. Filtering the content rather than the backdrop works in every
// browser and needs no copy of anything. Several lenses over one piece of
// content share its filter, each bending only within its own box.
//
// Moving a lens redraws the filter over the whole content, which Safari does
// on the CPU: about 40ms a frame for content 1200 by 800 at 2x, so a lens
// that moves over its content in Safari wants that content small. Still
// lenses cost nothing after their first frame.
//
// A lens can also show a stand-in for what's under it, as Aave's slider shows
// a thicker track inside its thumb: the stand-in is filtered to show only
// within the lens, and what it replaces is hidden there.
//
// The map is greys, one for each direction of pull, each displaced by in a
// pass of its own. On a wide-gamut display Chrome converts a map's colours to
// the display's before displacing by them, so a coloured map, with the pull
// across in red and down in green, bends a pull straight down sideways too,
// and differently from one straight up. Greys come through unchanged, and
// alpha isn't converted at all, so each pass reads its own grey and takes the
// other direction from an alpha of one half, which is no pull.
//
// WebKit (Safari, and every browser on iOS) draws an SVG filter on HTML only
// in bounding-box units, where it scales a displacement by the box's width
// across and its height down, so there each pass gets its own scale.
// It paints none of a filter's output outside the element, so the content
// needs room for the whole lens, and nothing inside it may be clipped round
// its corners. And it keeps showing a filter's old output until the filter's
// id changes, so each move gets a new id.

/** How a lens bends what's under it. */
export interface LensOptions {
  /**
   * How far in the rim reaches for what it shows, as a share of the lens's
   * shorter side.
   */
  strength: number;
  /** A custom property on the glass that, when set, overrides the strength. */
  strengthProperty?: string;
  /** The strength on a dark page, if it differs. */
  darkStrength?: number;
  /** How strongly the rim catches the light, if not the page's `--lg-lens-shine`. */
  shine?: number;
  /** Width of the lit edge, in px, if not the page's. */
  edgeWidth?: number;
  /** How much further red bends than blue: at 1, a fifth further. */
  dispersion: number;
  /** A custom property on the glass that, when set, overrides the dispersion. */
  dispersionProperty?: string;
  /** Width of the band around the rim that bends, in px. */
  depth: number;
  /** Sag of the dome whose slope sets the bend along the rim, in px. */
  dome: number;
  /** How far the bend near each side keeps to that side's own direction, from 0 to 1. */
  splay: number;
  /** Whether `depth` and `dome` are shares of the lens's shorter side, for glass of any size, rather than px. */
  relative?: boolean;
  /**
   * Whether the glass paints the light on its rim itself, rather than the
   * filter lighting the content. Glass with a frost of its own paints it, so
   * the frost doesn't blur it.
   */
  paintsLight?: boolean;
  /**
   * Whether the content is ink, such as labels, over whatever is under it.
   * Ink's colour is mostly its alpha, which red, green and blue share, so
   * split as it is it only blurs. As ink, each colour keeps its own coverage
   * (see `graph`), so its edges fringe as through glass.
   */
  ink?: boolean;
  /** Softens what the rim bends, as iOS's tab bar lens does, by a Gaussian blur of this deviation in px. */
  blur?: number;
}

/** The page ink lies on, which its fringes are made up for: see `graph`. */
type Ink = "light" | "dark";

/** Where the light catches the rim. */
export interface Light {
  /** Direction of the light, in degrees. */
  angle: number;
  glow: number;
  spread: number;
  glowPower: number;
  edge: number;
  edgeWidth: number;
  edgePower: number;
}

// Aave's light for dark and light surroundings.
const DARK: Light = { angle: 45, glow: 0.4, spread: 0.5, glowPower: 1.5, edge: 0.5, edgeWidth: 2, edgePower: 1.5 };
const LIGHT: Light = { angle: 30, glow: 0.4, spread: 0.5, glowPower: 2, edge: 0.5, edgeWidth: 1.5, edgePower: 1 };

export interface Shape {
  width: number;
  height: number;
  radius: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// erf(x) ≈ tanh(√π x)
const erf = (x: number) => Math.tanh(1.7724538509 * x);

// Signed distance to a rounded rectangle centred on the origin; negative inside.
export function distance(x: number, y: number, halfWidth: number, halfHeight: number, radius: number): number {
  const qx = Math.abs(x) - halfWidth + radius;
  const qy = Math.abs(y) - halfHeight + radius;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}

interface Arc {
  radius: number;
  scale: number;
}

// The circular arc that sags by `sag` across `half`, scaled so its slope
// averages a half over that span.
function arc(sag: number, half: number): Arc {
  const radius = (half * half + sag * sag) / (2 * sag);
  let sum = 0;
  for (let i = 0; i <= 200; i++) {
    const x = (i / 200) * half;
    const slope = x / Math.sqrt(radius * radius - x * x);
    sum += i === 0 || i === 200 ? slope / 2 : slope;
  }
  const mean = sum / 200;
  return { radius, scale: mean > 0 ? 0.5 / mean : 1 };
}

const slope = (x: number, { radius, scale }: Arc) => {
  const inside = Math.min(x, 0.999 * radius);
  return (inside / Math.sqrt(radius * radius - inside * inside)) * scale;
};

/** A lens's map, sized in device pixels. */
export interface LensMap {
  columns: number;
  rows: number;
  /** Greys of the pull across: 128 is none, lighter pulls from the right. */
  across: Uint8ClampedArray;
  /** Greys of the pull down: 128 is none, lighter pulls from below. */
  down: Uint8ClampedArray;
  /** Greys of the light caught (128 is none), with alpha covering where the lens bends at all. */
  light: Uint8ClampedArray;
  /** Greys of how much the rim bends, lightest at the rim, with alpha covering the lens's whole shape. */
  shape: Uint8ClampedArray;
}

/**
 * Draws a lens's map, after Aave's: within a band about `depth` wide around
 * the rim, each point shows content from further in, by the slope of a
 * shallow dome there, and the rest is left as it is. The light is a glow
 * along the light's axis and a thin lit edge. Its alpha fades out where the
 * bend does, so the middle shows the content exactly: a displacement map
 * can't hold "none" exactly in a byte, and WebKit, which stretches the map
 * across a long box, would otherwise shift the middle by a pixel.
 */
export function lensMap(shape: Shape, options: LensOptions, light: Light, density: number): LensMap {
  const { width, height } = shape;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const radius = clamp(shape.radius, 0, Math.min(halfWidth, halfHeight));
  const columns = Math.max(1, Math.round(width * density));
  const rows = Math.max(1, Math.round(height * density));
  const pullAcross = new Uint8ClampedArray(columns * rows * 4);
  const pullDown = new Uint8ClampedArray(columns * rows * 4);
  const caught = new Uint8ClampedArray(columns * rows * 4);
  const shapeMask = new Uint8ClampedArray(columns * rows * 4);
  const grey = (data: Uint8ClampedArray, i: number, value: number, alpha = 255) => {
    data[i] = data[i + 1] = data[i + 2] = value;
    data[i + 3] = alpha;
  };

  const share = options.relative ? Math.min(width, height) : 1;
  const depth = options.depth * share;
  const dome = options.dome * share;
  const { splay } = options;
  const innerWidth = Math.max(0, halfWidth - depth);
  const innerHeight = Math.max(0, halfHeight - depth);
  const innerRadius = clamp(radius, 0, Math.min(innerWidth, innerHeight));
  const ramp = depth > 0 ? 1 / (depth * Math.SQRT2) : 1e6;
  const sag = Math.max(0.01, Math.min(dome, Math.min(halfWidth, halfHeight) - 1));
  const across = dome > 0 ? arc(sag, halfWidth) : null;
  const down = dome > 0 ? arc(sag, halfHeight) : null;
  const reach = 0.5 * Math.min(halfWidth, halfHeight);
  const cos = Math.cos((light.angle * Math.PI) / 180);
  const sin = Math.sin((light.angle * Math.PI) / 180);
  const glowStart = (1 - light.spread) * Math.SQRT2;
  const glowRange = light.spread * Math.SQRT2;

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const i = (row * columns + column) * 4;
      const x = ((column + 0.5) / columns) * width - halfWidth;
      const y = ((row + 0.5) / rows) * height - halfHeight;
      const edge = distance(x, y, halfWidth, halfHeight, radius);
      // Smoothed over the last pixel at the edge.
      const inside = Math.round(255 * clamp(-edge, 0, 1));
      grey(shapeMask, i, 0, inside);
      if (edge >= 0) {
        grey(pullAcross, i, 128);
        grey(pullDown, i, 128);
        grey(caught, i, 128, 0);
        continue;
      }

      const ax = Math.abs(x);
      const ay = Math.abs(y);
      let dx = across ? Math.sign(x) * slope(ax, across) : clamp(x / halfWidth, -1, 1);
      let dy = down ? Math.sign(y) * slope(ay, down) : clamp(y / halfHeight, -1, 1);

      // Near the top and bottom the pull turns towards straight down and up,
      // near the sides towards straight across, keeping its strength.
      if (splay < 1 && reach > 0) {
        const keepX = Math.max(0, 1 - (halfHeight - ay) / reach) * (1 - splay);
        const keepY = Math.max(0, 1 - (halfWidth - ax) / reach) * (1 - splay);
        if (keepX > 0.001 || keepY > 0.001) {
          const before = Math.hypot(dx, dy);
          dx *= 1 - keepX;
          dy *= 1 - keepY;
          const after = Math.hypot(dx, dy);
          if (after > 0.001) {
            dx *= before / after;
            dy *= before / after;
          }
        }
      }

      const falloff = 0.5 * (1 + erf(distance(x, y, innerWidth, innerHeight, innerRadius) * ramp));
      grey(shapeMask, i, Math.round(255 * falloff), inside);
      grey(pullAcross, i, Math.round((0.5 - 0.5 * dx * falloff) * 255));
      grey(pullDown, i, Math.round((0.5 - 0.5 * dy * falloff) * 255));

      const facing = Math.abs(clamp(x / halfWidth, -1, 1) * cos + clamp(y / halfHeight, -1, 1) * sin);
      const glow =
        glowRange > 0.001 ? light.glow * clamp((facing - glowStart) / glowRange, 0, 1) ** light.glowPower * falloff : 0;
      const rim = light.edge * Math.max(0, 1 + edge / light.edgeWidth) * facing ** light.edgePower;
      const amount = Math.min(1, glow + rim);
      // Fully in once the pull reaches about a twentieth of its strength, and
      // smoothed over the last pixel at the edge.
      const bends = Math.min(1, falloff * 20, -edge);
      grey(caught, i, Math.round(127 * amount + 128), Math.round(255 * bends));
    }
  }
  return { columns, rows, across: pullAcross, down: pullDown, light: caught, shape: shapeMask };
}

/** PNG data URLs of a lens's map. */
interface Encoded {
  across: string;
  down: string;
  light: string;
  shape: string;
}

const encoded = new Map<string, Encoded>();

function encode(key: string, draw: () => LensMap): Encoded | null {
  const cached = encoded.get(key);
  if (cached) return cached;
  const map = draw();
  const canvas = document.createElement("canvas");
  canvas.width = map.columns;
  canvas.height = map.rows;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const image = context.createImageData(map.columns, map.rows);
  const png = (data: Uint8ClampedArray) => {
    image.data.set(data);
    context.putImageData(image, 0, 0);
    return canvas.toDataURL();
  };
  const result = {
    across: png(map.across),
    down: png(map.down),
    light: png(map.light),
    shape: png(map.shape),
  };
  encoded.set(key, result);
  return result;
}

/** WebKit needs filters in bounding-box units. */
const boxUnits = (): boolean =>
  typeof navigator !== "undefined"
    ? /AppleWebKit\//.test(navigator.userAgent) && !/Chrom(?:e|ium)\//.test(navigator.userAgent)
    : false;

const CHANNELS = ["1 0 0 0 0  0 0 0 0 0  0 0 0 0 0", "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0", "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0"];

/** One lens's part of a filter. */
interface Part {
  /** Everything kept to the lens's box: its placed maps, and the passes that bend through them. */
  boxed: SVGElement[];
  /** Each colour's pass across, then down. */
  rays: [SVGElement, SVGElement][];
  /** The blur over what the rim bends, if any, sized in place(). */
  soften?: SVGElement;
}

const matrix = (input: string, values: string, result: string) => svg("feColorMatrix", { in: input, type: "matrix", values, result });
const sum = (a: string, b: string, k2: number, k3: number, result: string) =>
  svg("feComposite", { in: a, in2: b, operator: "arithmetic", k2, k3, result });

// Lens k's rays added up as content of its own colour: each colour keeps a
// third of its alpha, so content that's partly transparent adds back up to
// what it was, and its colour is tripled after.
function spread(k: number): SVGElement[] {
  return [
    ...CHANNELS.map((channel, i) => matrix(`ray-${k}-${i}`, `${channel}  0 0 0 0.3333 0`, `light-${k}-${i}`)),
    sum(`light-${k}-0`, `light-${k}-1`, 1, 1, `light-${k}-01`),
    sum(`light-${k}-01`, `light-${k}-2`, 1, 1, `spread-${k}`),
    matrix(`spread-${k}`, "3 0 0 0 0  0 3 0 0 0  0 0 3 0 0  0 0 0 1 0", `bent-${k}`),
  ];
}

// Lens k's rays added up as ink (see graph): with alpha M, the most any colour
// covers, and each colour i, covering a_i in ink of colour c_i, as
// a_i c_i + P (M - a_i), with P the page's white or black. Put together at
// half strength, a colour at a time, so no step runs past full, and doubled.
function inked(k: number, page: Ink): SVGElement[] {
  const white = page === "light" ? 1 : 0;
  const steps: SVGElement[] = [];
  // Colour i alone, over black (its ink colour) or off white (one less it).
  const own = (i: number) =>
    [0, 1, 2]
      .map((r) => (r === i ? `${[0, 1, 2].map((c) => (c === i ? (white ? -1 : 1) : 0)).join(" ")} 0 ${white}` : "0 0 0 0 0"))
      .join("  ") + "  0 0 0 1 0";
  CHANNELS.forEach((_, i) => {
    const ray = `ray-${k}-${i}`;
    steps.push(
      // How much it covers, as an opaque grey, to find the most.
      matrix(ray, "0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 0 1", `cover-${k}-${i}`),
      // Its coverage alone.
      matrix(ray, "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0", `covers-${k}-${i}`),
      // What its colour gives over black, or takes from white.
      matrix(ray, own(i), `inks-${k}-${i}`),
    );
  });
  steps.push(
    svg("feBlend", { in: `cover-${k}-0`, in2: `cover-${k}-1`, mode: "lighten", result: `most-${k}-01` }),
    svg("feBlend", { in: `most-${k}-01`, in2: `cover-${k}-2`, mode: "lighten", result: `most-${k}` }),
    matrix(`most-${k}`, `0 0 0 0 ${white}  0 0 0 0 ${white}  0 0 0 0 ${white}  1 0 0 0 0`, `inked-${k}`),
  );
  let at = `inked-${k}`;
  CHANNELS.forEach((_, i) => {
    // Raise the alpha by the colour's coverage, then take it off again with
    // what the colour gives or takes, so every step stays in range.
    const [gain, loss] = white ? [`covers-${k}-${i}`, `inks-${k}-${i}`] : [`inks-${k}-${i}`, `covers-${k}-${i}`];
    steps.push(
      sum(at, gain, i === 0 ? 0.5 : 1, 0.5, `inked-${k}-${i}a`),
      sum(`inked-${k}-${i}a`, loss, 1, -0.5, `inked-${k}-${i}b`),
    );
    at = `inked-${k}-${i}b`;
  });
  const double = svg("feComponentTransfer", { in: at, result: `bent-${k}` });
  double.append(svg("feFuncA", { type: "linear", slope: 2, intercept: 0 }));
  steps.push(double);
  return steps;
}

/** A lens's filter, for one or more lenses over the same content. */
interface Graph {
  filter: SVGElement;
  parts: Part[];
}

/** How a lens bends and lights what's under it, as its filter needs. */
interface Bend {
  maps: Encoded;
  shine: number;
  ink?: Ink;
  blur?: number;
}

// A filter that leaves the content as it is but for each lens's rim, where
// it's displaced by the lens's map, once for each of red, green and blue as
// the glass disperses, and lit unless the glass paints its own light. Each
// lens's maps and passes are kept to the lens's own box, as Aave's are, so
// moving a lens over large content redraws only the lens, and two passes
// over the whole content put each lens's result in place.
//
// Content that isn't ink is split by keeping a third of each colour's ray
// and adding them up, which suits content of its own colour. Ink's colour is
// mostly its alpha, which that averages, so ink is drawn as it would look:
// with the alpha of whichever colour covers most, and each colour's own
// coverage made up from what's taken to be under it, white on a light page
// and black on a dark one. That's exact wherever the colours cover alike, as
// in the middle of a label and along its antialiased edges; only the fringes
// between them take the page's colour on trust. It's drawn normally, with no
// blend mode, so it looks the same wherever the page puts it.
function graph(lenses: Bend[], box: boolean, standIn: boolean): Graph {
  const unit = box ? "objectBoundingBox" : "userSpaceOnUse";
  const filter = svg("filter", { filterUnits: unit, primitiveUnits: unit, "color-interpolation-filters": "sRGB" });
  if (box) {
    for (const [key, value] of Object.entries({ x: 0, y: 0, width: 1, height: 1 })) filter.setAttribute(key, String(value));
  }

  const single = lenses.length === 1;
  const parts = lenses.map(({ maps, shine, blur, ink }, k): Part => {
    // What's merged across lenses keeps a plain name when there's one lens.
    const merged = (name: string) => (single ? name : `${name}-${k}`);
    const image = (href: string, result: string) => svg("feImage", { href, preserveAspectRatio: "none", result });
    const boxed = [
      image(maps.across, `across-${k}`),
      image(maps.down, `down-${k}`),
      image(maps.light, merged("raw")),
      svg("feFlood", { "flood-color": "rgb(128, 128, 128)", result: `neutral-${k}` }),
    ];
    if (standIn) boxed.push(image(maps.shape, merged("shape")));
    filter.append(...boxed);

    // Each pull, with an alpha of one half for the direction it doesn't pull in.
    for (const pull of ["across", "down"]) {
      const half = svg("feComponentTransfer", { in: `${pull}-grey-${k}`, result: `${pull}-pull-${k}` });
      half.append(svg("feFuncA", { type: "linear", slope: 0, intercept: 0.5 }));
      filter.append(
        svg("feComposite", { in: `${pull}-${k}`, in2: `neutral-${k}`, operator: "over", result: `${pull}-grey-${k}` }),
        half,
      );
    }
    // Each colour's ray: the content displaced as far as that colour bends.
    // The first pass reads the whole content, so it's kept to the box
    // outright; what follows from it stays there.
    const rays = CHANNELS.map((_, i): [SVGElement, SVGElement] => {
      const across = svg("feDisplacementMap", {
        in: "SourceGraphic",
        in2: `across-pull-${k}`,
        xChannelSelector: "R",
        yChannelSelector: "A",
        result: `across-${k}-${i}`,
      });
      const down = svg("feDisplacementMap", {
        in: `across-${k}-${i}`,
        in2: `down-pull-${k}`,
        xChannelSelector: "A",
        yChannelSelector: "R",
        result: `ray-${k}-${i}`,
      });
      boxed.push(across);
      filter.append(across, down);
      return [across, down];
    });
    filter.append(...(ink ? inked(k, ink) : spread(k)));
    // The blur, laid on as far as the rim bends: from the shape map's grey.
    let soften: SVGElement | undefined;
    if (blur) {
      soften = svg("feGaussianBlur", { in: `bent-${k}`, result: `soft-${k}` });
      const weight = image(maps.shape, `weight-${k}`);
      boxed.push(weight);
      filter.append(
        weight,
        svg("feColorMatrix", { in: `weight-${k}`, type: "matrix", values: "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0", result: `bends-${k}` }),
        soften,
        svg("feComposite", { in: `soft-${k}`, in2: `bends-${k}`, operator: "in", result: `soft-in-${k}` }),
        svg("feComposite", { in: `bent-${k}`, in2: `bends-${k}`, operator: "out", result: `sharp-${k}` }),
        svg("feComposite", { in: `soft-in-${k}`, in2: `sharp-${k}`, operator: "arithmetic", k2: 1, k3: 1, result: `softened-${k}` }),
      );
    }
    const bent = blur ? `softened-${k}` : `bent-${k}`;
    // The light on the rim, from its grey: added as white, or on a light page
    // as shade multiplied in.
    let lit = bent;
    if (shine > 0) {
      const white = `0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 1 0 ${-128 / 255}`;
      filter.append(
        svg("feColorMatrix", { in: merged("raw"), type: "matrix", values: white, result: `glint-${k}` }),
        svg("feComposite", { in: `glint-${k}`, in2: bent, operator: "arithmetic", k2: shine, k3: 1, result: `lit-${k}` }),
      );
      lit = `lit-${k}`;
    } else if (shine < 0) {
      const row = `0 0 ${shine} 0 ${1 - (128 * shine) / 255}`;
      filter.append(
        svg("feColorMatrix", { in: merged("raw"), type: "matrix", values: `${row}  ${row}  ${row}  0 0 0 0 1`, result: `shade-${k}` }),
        svg("feComposite", { in: `shade-${k}`, in2: bent, operator: "arithmetic", k1: 1, result: `lit-${k}` }),
      );
      lit = `lit-${k}`;
    }
    // Where the map covers, the bent content, split by the map's own alpha.
    filter.append(svg("feComposite", { in: lit, in2: merged("raw"), operator: "in", result: merged("inside") }));
    return { boxed, rays, soften };
  });
  if (!single) {
    for (const name of ["raw", "inside", ...(standIn ? ["shape"] : [])]) {
      const merge = svg("feMerge", { result: name });
      lenses.forEach((_, k) => merge.append(svg("feMergeNode", { in: `${name}-${k}` })));
      filter.append(merge);
    }
  }
  // Elsewhere the content as it was, split by the maps' alpha the other way,
  // so the two add back up exactly where it fades. A stand-in is then cut to
  // the lens's shape.
  filter.append(
    svg("feComposite", { in: "SourceGraphic", in2: "raw", operator: "out", result: "outside" }),
    svg("feComposite", { in: "inside", in2: "outside", operator: "arithmetic", k2: 1, k3: 1, result: "seen" }),
  );
  if (standIn) filter.append(svg("feComposite", { in: "seen", in2: "shape", operator: "in" }));
  return { filter, parts };
}

/** Where a lens stands over its content, in the content's own px, and how far its rim reaches. */
interface Placed {
  x: number;
  y: number;
  width: number;
  height: number;
  reach: number;
  dispersion: number;
  blur: number;
}

// Places each lens's maps and passes over content `across` by `down` px.
function place(graph: Graph, placed: Placed[], across: number, down: number, box: boolean): void {
  if (!box) {
    for (const [key, value] of Object.entries({ x: 0, y: 0, width: across, height: down })) {
      graph.filter.setAttribute(key, String(value));
    }
  }
  placed.forEach((lens, k) => {
    const part = graph.parts[k]!;
    const spectrum = [1 + 0.2 * lens.dispersion, 1 + 0.1 * lens.dispersion, 1];
    part.rays.forEach(([pullAcross, pullDown], i) => {
      pullAcross.setAttribute("scale", String((box ? lens.reach / across : lens.reach) * spectrum[i]!));
      pullDown.setAttribute("scale", String((box ? lens.reach / down : lens.reach) * spectrum[i]!));
    });
    // A blur of nothing is a tiny one: some browsers draw nothing at all for 0.
    const blur = Math.max(lens.blur, 0.01);
    part.soften?.setAttribute("stdDeviation", box ? `${blur / across} ${blur / down}` : String(blur));
    const rect = box
      ? { x: lens.x / across, y: lens.y / down, width: lens.width / across, height: lens.height / down }
      : { x: lens.x, y: lens.y, width: lens.width, height: lens.height };
    for (const element of part.boxed) {
      for (const [key, value] of Object.entries(rect)) element.setAttribute(key, String(value));
    }
  });
}

interface Fit {
  maps: Encoded;
  /** The maps' key, the light's strength and the page's tone, which together set the filter's shape. */
  key: string;
  shine: number;
  ink?: Ink;
  blur: number;
  strength: number;
  dispersion: number;
  width: number;
  height: number;
}

/** The glass's size and corner radius, in px, or null while it has no size. */
export function shapeOf(glass: HTMLElement, style: CSSStyleDeclaration = getComputedStyle(glass)): Shape | null {
  const width = glass.offsetWidth;
  const height = glass.offsetHeight;
  if (!width || !height) return null;
  const corner = style.borderTopLeftRadius;
  const radius = Math.min(
    width / 2,
    height / 2,
    corner.endsWith("%") ? (Math.min(width, height) * parseFloat(corner)) / 100 : parseFloat(corner) || 0,
  );
  return { width, height, radius };
}

// Draws the map for the glass's size, shape and light, or takes it from the
// cache, along with the strength, dispersion and shine read off the glass.
function fit(glass: HTMLElement, options: LensOptions): Fit | null {
  const style = getComputedStyle(glass);
  const shape = shapeOf(glass, style);
  if (!shape) return null;
  const { width, height, radius } = shape;
  // The page's shine is negative on a light page, where the rim darkens.
  const page = parseFloat(style.getPropertyValue("--lg-lens-shine")) || 0;
  const shine = options.paintsLight ? 0 : options.shine === undefined ? page : Math.sign(page) * options.shine;
  const tuned = options.strengthProperty ? parseFloat(style.getPropertyValue(options.strengthProperty)) : NaN;
  const own = page > 0 ? (options.darkStrength ?? options.strength) : options.strength;
  const strength = Number.isFinite(tuned) ? tuned : own;
  const split = options.dispersionProperty ? parseFloat(style.getPropertyValue(options.dispersionProperty)) : NaN;
  const dispersion = Number.isFinite(split) ? Math.max(0, split) : options.dispersion;
  const density = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  // Glass that paints its own light uses only where the map bends, which is
  // the same on any page.
  const theme = page < 0 && !options.paintsLight ? LIGHT : DARK;
  const light = options.edgeWidth === undefined ? theme : { ...theme, edgeWidth: options.edgeWidth };
  const key = [width, height, radius, density, JSON.stringify(light), JSON.stringify(options)].join("|");
  const maps = encode(key, () => lensMap(shape, options, light, density));
  const blur = options.blur ?? 0;
  // The page's shine is negative on a light page.
  const ink: Ink | undefined = options.ink ? (page < 0 ? "light" : "dark") : undefined;
  return maps ? { maps, key: `${key}|${shine}|${ink}`, shine, ink, blur, strength, dispersion, width, height } : null;
}

/** Glass that moves over content of its own. */
export interface Lens {
  /** Refracts while active, as when the glass is lifted. */
  setActive(active: boolean): void;
  /**
   * Call after moving or scaling the glass, to keep the refraction under it.
   * `amount`, from 0 to 1, is how far it bends now, as when it lifts: its
   * bend and blur grow with it. It stays as it was when left out.
   */
  update(amount?: number): void;
  /** Call after the glass changes size or shape, to draw its map again. */
  refit(): void;
  destroy(): void;
}

interface Member {
  glass: HTMLElement;
  options: LensOptions;
  replaces?: HTMLElement;
  /** How far it bends now, from 0 to 1. */
  amount: number;
  fit?: Fit;
  placed?: Placed;
}

/** Content under one or more lenses, and its filter. */
interface Surface {
  content: HTMLElement;
  /** The lenses made over it, active or not. */
  lenses: number;
  /** The active ones, in the order they became active. */
  members: Member[];
  name: string;
  /** Whether the content is a stand-in, shown only within its lens. */
  standIn: boolean;
  graph?: Graph;
  built: string;
  placed: string;
  version: number;
}

const surfaces = new Map<HTMLElement, Surface>();
let made = 0;

// Filters the content for wherever its active lenses stand now, giving the
// filter a new id whenever any of them has moved.
function render(surface: Surface): void {
  const { content } = surface;
  const across = content.offsetWidth;
  const down = content.offsetHeight;
  const from = content.getBoundingClientRect();
  const shown: Member[] = [];
  if (across && down) {
    // Each lens's box in the content's own pixels, past any scale on either.
    const unit = from.width / across || 1;
    for (const member of surface.members) {
      const at = member.glass.getBoundingClientRect();
      if (!member.fit || !at.width || !at.height) continue;
      const width = at.width / unit;
      const height = at.height / unit;
      const reach = member.fit.strength * Math.min(width, height) * member.amount;
      const { dispersion } = member.fit;
      const blur = member.fit.blur * member.amount;
      member.placed = { x: (at.left - from.left) / unit, y: (at.top - from.top) / unit, width, height, reach, dispersion, blur };
      shown.push(member);
    }
  }
  if (!shown.length) {
    surface.placed = "";
    content.style.removeProperty("filter");
    if (surface.standIn) content.style.removeProperty("visibility");
    surface.standIn = false;
    return;
  }

  const box = boxUnits();
  const standIn = shown.some((member) => member.replaces);
  surface.standIn = standIn;
  const structure = shown.map((member) => member.fit!.key).join("\n") + (standIn ? "\nstand-in" : "");
  if (structure !== surface.built || !surface.graph) {
    surface.graph?.filter.remove();
    surface.graph = graph(
      shown.map((member) => member.fit!),
      box,
      standIn,
    );
    container().append(surface.graph.filter);
    surface.built = structure;
    surface.placed = "";
  }
  const placed = shown.map((member) => member.placed!);
  const next = [
    across,
    down,
    ...placed.flatMap(({ x, y, width, height, reach, dispersion, blur }) => [x, y, width, height, reach, dispersion, blur]),
  ]
    .map((value) => value.toFixed(2))
    .join(" ");
  if (next === surface.placed) return;
  surface.placed = next;
  place(surface.graph, placed, across, down, box);
  surface.graph.filter.id = `${surface.name}-${++surface.version}`;
  content.style.filter = `url("#${surface.graph.filter.id}")`;

  for (const member of shown) {
    if (!member.replaces) continue;
    content.style.visibility = "visible";
    // What's replaced keeps everything but the lens's shape.
    const { x, y, width, height } = member.placed!;
    const behind = member.replaces.getBoundingClientRect();
    const unit = from.width / across || 1;
    mask(member.replaces, {
      image: `url("${member.fit!.maps.shape}"), linear-gradient(#000, #000)`,
      position: `${x + (from.left - behind.left) / unit}px ${y + (from.top - behind.top) / unit}px, 0 0`,
      size: `${width}px ${height}px, 100% 100%`,
    });
  }
}

const MASKING = ["image", "position", "size", "repeat", "composite"] as const;

// Masks an element with its layers excluding each other, or clears its mask.
function mask(element: HTMLElement, layers?: { image: string; position: string; size: string }): void {
  for (const part of MASKING) {
    element.style.removeProperty(`-webkit-mask-${part}`);
    element.style.removeProperty(`mask-${part}`);
  }
  if (!layers) return;
  const values = { ...layers, repeat: "no-repeat", composite: "exclude" };
  for (const part of MASKING) {
    // Older WebKit knows only the prefixed names, and calls exclude xor.
    element.style.setProperty(`-webkit-mask-${part}`, part === "composite" ? "xor" : values[part]);
    element.style.setProperty(`mask-${part}`, values[part]);
  }
}

/**
 * Makes `glass` a lens over `content`, which must have room for the whole
 * lens. Given `replaces`, the content is a stand-in for it under the glass:
 * the content is shown only within the lens (keep it hidden otherwise), and
 * `replaces` is hidden there. Unless the glass paints its own light, the
 * glass's `--lg-lens-shine` sets the light on its rim: above 0 it brightens,
 * below 0 it darkens, as on a light page. Both it and the strength property
 * are read each time the lens becomes active or is refitted.
 */
export function createLens(glass: HTMLElement, content: HTMLElement, options: LensOptions, replaces?: HTMLElement): Lens {
  let surface = surfaces.get(content);
  if (!surface) {
    surface = {
      content,
      lenses: 0,
      members: [],
      name: `glisse-lens-${made++}`,
      standIn: false,
      built: "",
      placed: "",
      version: 0,
    };
    surfaces.set(content, surface);
  }
  const shared = surface;
  shared.lenses++;
  const member: Member = { glass, options, replaces, amount: 1 };
  let active = false;

  const prepare = () => {
    member.fit = fit(glass, options) ?? undefined;
  };

  const lens: Lens = {
    setActive(next) {
      if (next === active) return;
      active = next;
      if (active) {
        shared.members.push(member);
        prepare();
      } else {
        shared.members.splice(shared.members.indexOf(member), 1);
        if (replaces) mask(replaces);
      }
      render(shared);
    },
    update(amount) {
      if (amount !== undefined) member.amount = clamp(amount, 0, 1);
      if (active) render(shared);
    },
    refit() {
      if (!active) return;
      prepare();
      render(shared);
    },
    destroy() {
      lens.setActive(false);
      if (--shared.lenses > 0) return;
      shared.graph?.filter.remove();
      surfaces.delete(content);
    },
  };
  return lens;
}

/** Glass that bends its own backdrop with a lens whose bend grows and shrinks, as only Chromium can. */
export interface BackdropLens {
  /** How far it bends now, from 0 to 1, as when it lifts. */
  update(amount: number): void;
  /** Call when the glass changes size or shape, or its page's theme, to draw its map again. */
  refit(): void;
  destroy(): void;
}

/**
 * Bends the glass's backdrop with the same lens, unlit, as the glass bends
 * content of its own: a filter of its own, set as `--lg-filter` for its
 * `backdrop-filter`, rescaled as its bend grows. Its maps are those of the
 * glass's other lenses with the same options, so cost nothing more.
 */
export function createBackdropLens(glass: HTMLElement, options: LensOptions): BackdropLens {
  const name = `glisse-bend-${made++}`;
  let fitted: Fit | null = null;
  let built: Graph | null = null;
  let key = "";
  let amount = 0;
  let version = 0;
  const draw = () => {
    if (!fitted || !built) return;
    const { width, height, strength, dispersion, blur } = fitted;
    const reach = strength * Math.min(width, height) * amount;
    place(built, [{ x: 0, y: 0, width, height, reach, dispersion, blur: blur * amount }], width, height, false);
    built.filter.id = `${name}-${++version}`;
    glass.style.setProperty("--lg-filter", `url("#${built.filter.id}")`);
  };
  return {
    update(next) {
      // In twentieths: each change rebuilds the backdrop's filter.
      next = Math.round(clamp(next, 0, 1) * 20) / 20;
      if (next === amount) return;
      amount = next;
      draw();
    },
    refit() {
      fitted = fit(glass, options);
      if (!fitted) return;
      if (fitted.key !== key) {
        built?.filter.remove();
        built = graph([{ maps: fitted.maps, shine: 0, blur: fitted.blur }], false, false);
        container().append(built.filter);
        key = fitted.key;
      }
      draw();
    },
    destroy() {
      built?.filter.remove();
      built = null;
      glass.style.removeProperty("--lg-filter");
    },
  };
}

const backdrops = new Map<string, string>();

/**
 * Fits glass that bends its own backdrop, as only Chromium can: a lens's
 * filter drawn for the glass's box, set as `--lg-filter` for its
 * `backdrop-filter`.
 */
export function fitBackdropLens(glass: HTMLElement, options: LensOptions): void {
  const fitted = fit(glass, options);
  if (!fitted) return;
  const { maps, key, shine, strength, dispersion, width, height } = fitted;
  const reach = strength * Math.min(width, height);
  const id = `${key}|${reach}|${dispersion}`;
  let name = backdrops.get(id);
  if (!name) {
    const built = graph([{ maps, shine }], false, false);
    place(built, [{ x: 0, y: 0, width, height, reach, dispersion, blur: 0 }], width, height, false);
    name = `glisse-backdrop-${backdrops.size}`;
    built.filter.id = name;
    container().append(built.filter);
    backdrops.set(id, name);
  }
  glass.style.setProperty("--lg-filter", `url("#${name}") saturate(1.5)`);
}
