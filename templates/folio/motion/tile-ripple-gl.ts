// Liquid hover on project tiles (work plan 6.9, guide §12 "Image distortion / WebGL hover").
// Loaded by TileRipple.tsx with import() on the first pointer entry into a tile, never before.
//
// One WebGL context for the whole page: its canvas is moved into the hovered tile's media box
// (absolutely over the <img>, aria-hidden, pointer-events none; .f-tile-gl in folio.css) and draws
// that same <img> (its currentSrc, already decoded: no second download) with a small fragment
// shader: a soft lens under the cursor, rings while it moves, and a drag that trails the motion.
// At rest the canvas is pixel-for-pixel the image (the CSS zoom included: the shader maps through
// the <img>'s live box), so attaching and detaching it never shows a jump.
//
// It renders only while something moves: the hover fade (--dur-slow, power3.inOut ≈ --ease-inout),
// the pointer catching up, the rings decaying, or the CSS zoom running. Then the loop stops; after
// the pointer leaves and everything settles the canvas is removed, and 10 s later the context is
// released. A lost context is dropped and made again on the next hover; after three unexpected
// losses, or with no WebGL at all, the effect turns itself off and the CSS hover is all there is.

const VERT = `attribute vec2 a;varying vec2 v;
void main(){v=vec2(a.x*.5+.5,.5-a.y*.5);gl_Position=vec4(a,0.,1.);}`;

const FRAG = `precision mediump float;
uniform sampler2D uTex;
uniform vec4 uImg;     // the <img>'s box in canvas uv (CSS zoom included): xy origin, zw size
uniform vec4 uFit;     // object-fit: cover in texture uv: xy offset, zw scale
uniform vec2 uMouse;   // smoothed pointer, canvas uv
uniform vec2 uDrag;    // pointer minus smoothed pointer: how fast it moves, and which way
uniform float uAspect; // canvas width / height
uniform float uHover;  // 0..1, eased in and out
uniform float uWave;   // 0..1, ring energy; decays when the pointer rests
uniform float uTime;
varying vec2 v;

vec4 img(vec2 p) {
  return texture2D(uTex, clamp(uFit.xy + (p - uImg.xy) / uImg.zw * uFit.zw, 0., 1.));
}

void main() {
  vec2 k = vec2(uAspect, 1.);
  vec2 d = (v - uMouse) * k;
  float r = length(d);
  float fall = 1. - smoothstep(0., .55, r);
  fall *= fall;
  vec2 off = -d * fall * .045 * uHover; // lens
  off += d / max(r, 1e-4) * sin(r * 34. - uTime * 5.) * fall * .005 * uWave * uHover; // rings
  vec2 p = v + off / k - uDrag * fall * .12 * uHover; // drag
  vec2 s = uDrag * fall * .02 * uHover; // a hint of colour split along the drag
  vec4 c = img(p);
  c.r = img(p + s).r;
  c.b = img(p - s).b;
  gl_FragColor = c;
}`;

const UNIFORMS = ["uTex", "uImg", "uFit", "uMouse", "uDrag", "uAspect", "uHover", "uWave", "uTime"] as const;
type Uniform = (typeof UNIFORMS)[number];

type Renderer = {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  u: Record<Uniform, WebGLUniformLocation | null>;
  /** currentSrc of the image in the texture, so hovering the same tile again skips the upload. */
  src: string;
};

const IDLE_RELEASE_MS = 10_000;
const MAX_LOSSES = 3;
const DPR_CAP = 2;
const MAX_DRAG = 0.2;

let r: Renderer | null = null;
let disabled = false; // no WebGL, or it keeps getting lost
let losses = 0;
let idle: ReturnType<typeof setTimeout> | undefined;

// The tile the canvas is in.
let tile: HTMLElement | null = null;
let media: HTMLElement | null = null;
let img: HTMLImageElement | null = null;
let fit = [0, 0, 1, 1];

// Motion state. Pointer in client px (tracked through scrolling); smoothed pointer in media uv.
let px = 0;
let py = 0;
let mx = 0;
let my = 0;
let wave = 0;
let time = 0;
let hoverFrom = 0;
let hoverTo = 0;
let hoverT0 = 0;
let hoverMs = 900;
let raf = 0;
let last = 0;
let imgKey = "";

/** power3.inOut, the JS twin of --ease-inout (cubic-bezier(.7, 0, .3, 1)). */
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function hoverAt(now: number) {
  const t = Math.min(1, (now - hoverT0) / hoverMs);
  return { value: hoverFrom + (hoverTo - hoverFrom) * ease(t), done: t >= 1 };
}

function retarget(to: number) {
  const now = performance.now();
  hoverFrom = hoverAt(now).value;
  hoverTo = to;
  hoverT0 = now;
}

/** The --dur-slow token in ms (the image zoom's duration), so the fade and the zoom move together. */
function tokenMs(el: Element, name: string, fallback: number) {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallback;
  return raw.endsWith("ms") ? n : n * 1000;
}

function createRenderer(): Renderer | null {
  const canvas = document.createElement("canvas");
  canvas.className = "f-tile-gl";
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
    // Software GL would cost more than the effect is worth: skip it.
    failIfMajorPerformanceCaveat: true,
  });
  if (!gl) return null;

  const shader = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = shader(gl.VERTEX_SHADER, VERT);
  const fs = shader(gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  // One triangle that covers the canvas.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

  const u = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(prog, n)])) as Renderer["u"];
  gl.uniform1i(u.uTex, 0);

  const renderer: Renderer = { canvas, gl, u, src: "" };
  canvas.addEventListener("webglcontextlost", () => {
    // Our own release() clears `r` first; anything else is the browser taking the GPU back.
    if (r !== renderer) return;
    detach(); // the <img> shows again
    r = null;
    clearTimeout(idle);
    if (++losses >= MAX_LOSSES) disabled = true;
  });
  return renderer;
}

function release() {
  clearTimeout(idle);
  const old = r;
  r = null;
  old?.gl.getExtension("WEBGL_lose_context")?.loseContext();
}

/** Same-origin (next/image's /_next/image) or CORS-approved, so the canvas can't be tainted. */
function readable(el: HTMLImageElement) {
  if (!el.complete || !el.naturalWidth || !el.currentSrc) return false;
  return el.crossOrigin !== null || new URL(el.currentSrc, location.href).origin === location.origin;
}

/** object-fit: cover + object-position as a texture-uv offset and scale, for a box of `aspect`. */
function coverFit(el: HTMLImageElement, aspect: number) {
  const pos = getComputedStyle(el).objectPosition.split(" ");
  const pct = (s: string | undefined) => (s?.endsWith("%") ? parseFloat(s) / 100 : 0.5);
  const tex = el.naturalWidth / el.naturalHeight;
  const sx = Math.min(1, aspect / tex);
  const sy = Math.min(1, tex / aspect);
  return [(1 - sx) * pct(pos[0]), (1 - sy) * pct(pos[1]), sx, sy];
}

function onMove(e: PointerEvent) {
  px = e.clientX;
  py = e.clientY;
  kick();
}

function onLeave() {
  retarget(0);
  kick();
}

function kick() {
  if (!raf) raf = requestAnimationFrame(frame);
}

function detach() {
  cancelAnimationFrame(raf);
  raf = 0;
  last = 0;
  tile?.removeEventListener("pointermove", onMove);
  tile?.removeEventListener("pointerleave", onLeave);
  window.removeEventListener("scroll", kick);
  r?.canvas.remove();
  tile = media = img = null;
  clearTimeout(idle);
  if (r) idle = setTimeout(release, IDLE_RELEASE_MS);
}

function frame(now: number) {
  raf = 0;
  if (!r || !media || !img || !media.isConnected) return detach();
  const { gl, canvas, u } = r;
  const box = media.getBoundingClientRect();
  // Hidden by a filter or the list/grid toggle while hovered.
  if (!box.width || !box.height) return detach();

  const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
  last = now;

  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
  const w = Math.round(box.width * dpr);
  const h = Math.round(box.height * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }

  // The pointer in media uv, and a smoothed copy that trails it; the gap between them is the drag.
  const tx = (px - box.left) / box.width;
  const ty = (py - box.top) / box.height;
  const follow = 1 - Math.exp(-dt * 7);
  mx += (tx - mx) * follow;
  my += (ty - my) * follow;
  let dx = tx - mx;
  let dy = ty - my;
  const drag = Math.hypot(dx, dy);
  if (drag > MAX_DRAG) {
    dx *= MAX_DRAG / drag;
    dy *= MAX_DRAG / drag;
  }
  wave = Math.max(wave * Math.exp(-dt * 2), Math.min(1, drag * 8));
  time += dt;
  const hover = hoverAt(now);

  // Where the <img> is now (its CSS zoom moves it), and how it fills that box.
  const ib = img.getBoundingClientRect();
  const key = `${ib.left.toFixed(1)},${ib.top.toFixed(1)},${ib.width.toFixed(1)},${ib.height.toFixed(1)}`;
  const zooming = key !== imgKey;
  imgKey = key;
  if (zooming) fit = coverFit(img, ib.width / ib.height);

  gl.uniform4f(u.uImg, (ib.left - box.left) / box.width, (ib.top - box.top) / box.height, ib.width / box.width, ib.height / box.height);
  gl.uniform4f(u.uFit, fit[0], fit[1], fit[2], fit[3]);
  gl.uniform2f(u.uMouse, mx, my);
  gl.uniform2f(u.uDrag, dx, dy);
  gl.uniform1f(u.uAspect, box.width / box.height);
  gl.uniform1f(u.uHover, hover.value);
  gl.uniform1f(u.uWave, wave);
  gl.uniform1f(u.uTime, time);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // Every term is scaled by uHover: once it's back to 0 (and the zoom is home) the canvas is
  // just the image, so it can go. Otherwise stop drawing when the offsets are under a pixel.
  if (hoverTo === 0 && hover.done && !zooming) return detach();
  const moving = Math.abs(dx) + Math.abs(dy) > 1e-3;
  if (!hover.done || moving || wave > 0.02 || zooming) {
    raf = requestAnimationFrame(frame);
    return;
  }
  last = 0;
}

/** Pointer entered `el` (a [data-ripple] tile) at client (x, y). */
export function enter(el: HTMLElement, x: number, y: number) {
  px = x;
  py = y;
  // The first entry waits for this module to load; the pointer may have left meanwhile.
  if (disabled || !el.matches(":hover")) return;
  if (el === tile) {
    retarget(1);
    kick();
    return;
  }

  const m = el.querySelector<HTMLElement>(".f-tile-media");
  const i = m?.querySelector("img");
  if (!m || !i) return;
  if (!i.complete) {
    // Lazy and still loading (e.g. just shown by the list/grid toggle): start once it's in,
    // from wherever the pointer is by then, if it's still over the tile.
    let at = [x, y];
    const track = (e: PointerEvent) => (at = [e.clientX, e.clientY]);
    el.addEventListener("pointermove", track, { passive: true });
    i.addEventListener("load", () => {
      el.removeEventListener("pointermove", track);
      enter(el, at[0], at[1]);
    }, { once: true });
    return;
  }
  if (!readable(i)) return;

  clearTimeout(idle);
  r ??= createRenderer();
  if (!r) {
    disabled = true;
    return;
  }
  const { gl } = r;
  if (r.src !== i.currentSrc) {
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, i);
      r.src = i.currentSrc;
    } catch {
      // A source that would taint the canvas: leave this tile to the CSS hover.
      r.src = "";
      return;
    }
  }

  detach();
  clearTimeout(idle);
  tile = el;
  media = m;
  img = i;
  imgKey = "";
  hoverMs = tokenMs(el, "--dur-slow", 900);
  hoverFrom = hoverTo = 0;
  retarget(1);
  const box = m.getBoundingClientRect();
  mx = (x - box.left) / box.width;
  my = (y - box.top) / box.height;
  wave = 0;

  el.addEventListener("pointermove", onMove, { passive: true });
  el.addEventListener("pointerleave", onLeave);
  window.addEventListener("scroll", kick, { passive: true });
  m.append(r.canvas);
  // Draw now, before the browser paints: a moved canvas still holds the last tile's frame.
  frame(performance.now());
}

/** The page's tiles are going away (route change): drop the canvas and the context. */
export function reset() {
  detach();
  release();
}
