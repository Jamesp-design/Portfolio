/** @typedef {"text" | "rings" | "checker" | "bars" | "columns" | "boxes"} SceneKind */
/** @typedef {"wipe" | "ripple" | "scatter" | "collapse" | "columns"} TransitionKind */
/** @typedef {"drift" | "grain" | "swell" | "streak" | null} StyleKind */

/**
 * @typedef {object} Scene
 * @property {SceneKind} kind
 * @property {string} [value]
 * @property {TransitionKind} transition
 * @property {number} palette
 * @property {StyleKind} [style]
 */

/** @param {TransitionKind} kind @param {number} t @param {number} dir @param {number} rand */
export function cellMotion(kind, t, dir, rand) {
  const u = Math.sin(Math.min(1, Math.max(0, t)) * Math.PI);
  switch (kind) {
    case "wipe":
      return { scale: 1, dx: u * 0.16 * -dir, dy: 0, spin: 0 };
    case "ripple":
      return { scale: 1 - u * 0.1, dx: 0, dy: u * -0.13, spin: 0 };
    case "scatter":
      return {
        scale: 1,
        dx: u * 0.18 * Math.cos(rand * Math.PI * 2),
        dy: u * 0.18 * Math.sin(rand * Math.PI * 2),
        spin: 0,
      };
    case "collapse":
      return { scale: 1 - u * 0.18, dx: 0, dy: 0, spin: 0 };
    case "columns":
      return { scale: 1, dx: 0, dy: u * 0.22, spin: 0 };
  }
}

/** @param {number} v @param {number} e0 @param {number} e1 */
function smooth01(v, e0, e1) {
  const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** @param {number} x @param {number} y */
function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** @type {Scene[]} */
export const SCENES = [
  { kind: "text", value: "J", transition: "wipe", palette: 0, style: "drift" },
  { kind: "rings", transition: "ripple", palette: 1, style: "grain" },
  { kind: "columns", transition: "columns", palette: 2, style: "streak" },
  { kind: "checker", transition: "scatter", palette: 3, style: "swell" },
  { kind: "boxes", transition: "collapse", palette: 4, style: "grain" },
  { kind: "bars", transition: "wipe", palette: 5, style: "drift" },
];

/**
 * @param {Scene} scene
 * @param {number} cols
 * @param {number} rows
 * @param {number} t
 * @param {Float32Array} out
 * @param {Scene} [prev]
 */
export function styleField(scene, cols, rows, t, out, prev) {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const maxR = Math.hypot(cols, rows) / 2;
  const FLIP = 0.32;

  /** @param {StyleKind | undefined} style @param {number} x @param {number} y */
  const stateOf = (style, x, y) => {
    switch (style) {
      case "drift": {
        const a = Math.sin(x * 0.41 + y * 0.23);
        const b = Math.sin(x * 0.17 - y * 0.53 + 2.1);
        return smooth01((a + b) * 0.5, -0.15, 0.75);
      }
      case "grain": {
        const n =
          hash2(x, y) * 0.55 +
          hash2(x + 1, y) * 0.15 +
          hash2(x, y + 1) * 0.15 +
          hash2(x + 1, y + 1) * 0.15;
        return smooth01(n, 0.34, 0.86);
      }
      case "swell": {
        const d = Math.hypot(x - cx, y - cy) / maxR;
        const warp = Math.sin(Math.atan2(y - cy, x - cx) * 3.0) * 0.14;
        return smooth01(1 - (d + warp), 0.28, 0.92);
      }
      case "streak": {
        const s = Math.sin(x * 0.28 + y * 0.62);
        const cut = Math.sin(x * 0.09 - y * 0.11 + 1.3) * 0.5 + 0.5;
        return smooth01(s * cut, -0.05, 0.7);
      }
      default:
        return 0;
    }
  };

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let order = 0;
      switch (scene.style) {
        case "drift":
          order = (x / cols) * 0.75 + Math.sin(y * 0.5) * 0.12 + 0.12;
          break;
        case "grain":
          order = (x / cols) * 0.55 + (y / rows) * 0.25 + hash2(x, y) * 0.2;
          break;
        case "swell":
          order = Math.hypot(x - cx, y - cy) / maxR;
          break;
        case "streak":
          order = (x / cols) * 0.8 + (y / rows) * 0.2;
          break;
      }

      const from = stateOf(prev?.style ?? scene.style, x, y);
      const to = stateOf(scene.style, x, y);
      const u = Math.min(1, Math.max(0, (t - order * (1 - FLIP)) / FLIP));
      const eased = u * u * (3 - 2 * u);
      out[y * cols + x] = from + (to - from) * eased;
    }
  }
}

/** Brand-aligned two-tone pairs: [circle, background] */
export const PALETTES = [
  ["#3dd4b0", "#0a2e26"],
  ["#9b8cf0", "#2a1f5c"],
  ["#7ee8c8", "#0f9d7d"],
  ["#c4b5fd", "#4338ca"],
  ["#f0ede4", "#16141f"],
  ["#ffd166", "#3d2208"],
];

/**
 * @param {Scene} scene
 * @param {number} cols
 * @param {number} rows
 * @param {string} fontFamily
 */
export function rasterize(scene, cols, rows, fontFamily) {
  const out = new Uint8Array(cols * rows).fill(1);
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;

  if (scene.kind === "checker") {
    const b = Math.max(2, Math.round(cols / 14));
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if ((Math.floor(x / b) + Math.floor(y / b)) % 2 === 0) out[y * cols + x] = 0;
      }
    }
    return out;
  }

  if (scene.kind === "bars") {
    const period = 3;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (Math.floor((x + y) / period) % 2 === 0) out[y * cols + x] = 0;
      }
    }
    return out;
  }

  if (scene.kind === "columns") {
    const bw = 4;
    const bh = 3;
    for (let y = 0; y < rows; y++) {
      const band = Math.floor(y / bh);
      const shift = band % 2 === 0 ? 0 : bw / 2;
      for (let x = 0; x < cols; x++) {
        if (Math.floor((x + shift) / bw) % 2 === 0) out[y * cols + x] = 0;
      }
    }
    return out;
  }

  if (scene.kind === "boxes") {
    const period = 2.5;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const d = Math.max(Math.abs(x - cx), Math.abs(y - cy));
        if (Math.floor(d / period) % 2 === 0) out[y * cols + x] = 0;
      }
    }
    return out;
  }

  if (scene.kind === "rings") {
    const maxR = Math.hypot(cols, rows) / 2;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const d = Math.hypot(x - cx, y - cy) / maxR;
        if (Math.floor(d * 6.0) % 2 === 0) out[y * cols + x] = 0;
      }
    }
    return out;
  }

  const cv = document.createElement("canvas");
  cv.width = cols;
  cv.height = rows;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  if (!ctx) return out;

  const text = (scene.value || "").trim();
  if (!text) return out;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cols, rows);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let size = rows * 0.8;
  ctx.font = `600 ${size}px ${fontFamily}`;
  const maxW = cols * 0.36;
  const m = ctx.measureText(text);
  if (m.width > maxW) {
    size *= maxW / m.width;
    ctx.font = `600 ${size}px ${fontFamily}`;
  }

  const maxH = rows * 0.58;
  const mm = ctx.measureText(text);
  const gh = mm.actualBoundingBoxAscent + mm.actualBoundingBoxDescent;
  if (gh > maxH) {
    size *= maxH / gh;
    ctx.font = `600 ${size}px ${fontFamily}`;
  }
  ctx.fillText(text, cols / 2, rows / 2 + rows * 0.02);

  const data = ctx.getImageData(0, 0, cols, rows).data;
  for (let i = 0; i < cols * rows; i++) {
    if (data[i * 4] > 110) out[i] = 0;
  }
  return out;
}

/**
 * @param {TransitionKind} kind
 * @param {number} x
 * @param {number} y
 * @param {number} cols
 * @param {number} rows
 * @param {number} rand
 */
export function cellDelay(kind, x, y, cols, rows, rand) {
  const fx = cols > 1 ? x / (cols - 1) : 0;
  const fy = rows > 1 ? y / (rows - 1) : 0;
  switch (kind) {
    case "wipe":
      return Math.min(1, Math.max(0, (fx * 0.75 + fy * 0.25) * 0.85 + rand * 0.15));
    case "ripple": {
      const d = Math.hypot(fx - 0.5, fy - 0.5) / 0.707;
      return Math.min(1, d * 0.9 + rand * 0.1);
    }
    case "scatter":
      return rand;
    case "collapse": {
      const d = Math.hypot(fx - 0.5, fy - 0.5) / 0.707;
      return Math.min(1, (1 - d) * 0.85 + rand * 0.15);
    }
    case "columns":
      return Math.min(1, fx * 0.9 + rand * 0.1);
  }
}
