// Procedural PBR texture generation — colour, normal and roughness maps
// built from height fields. No external assets.
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/* Core helpers                                                        */
/* ------------------------------------------------------------------ */

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function toTexture(canvas, { srgb = true, repeat = [1, 1] } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 8;
  return tex;
}

const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Tileable fractal value noise. */
function fbm(size, octaves = 4, rand = mulberry32(1)) {
  const field = new Float32Array(size * size);
  let amp = 1, total = 0, freq = 4;
  for (let o = 0; o < octaves; o++) {
    const grid = new Float32Array(freq * freq);
    for (let i = 0; i < grid.length; i++) grid[i] = rand();
    for (let y = 0; y < size; y++) {
      const gy = (y / size) * freq;
      const y0 = Math.floor(gy), fy = smooth(gy - y0);
      for (let x = 0; x < size; x++) {
        const gx = (x / size) * freq;
        const x0 = Math.floor(gx), fx = smooth(gx - x0);
        const g = (xx, yy) => grid[((yy % freq) * freq) + (xx % freq)];
        const v = lerp(
          lerp(g(x0, y0), g(x0 + 1, y0), fx),
          lerp(g(x0, y0 + 1), g(x0 + 1, y0 + 1), fx),
          fy
        );
        field[y * size + x] += v * amp;
      }
    }
    total += amp;
    amp *= 0.55;
    freq *= 2;
  }
  for (let i = 0; i < field.length; i++) field[i] /= total;
  return field;
}

/* Sobel height→normal conversion. heights: Float32Array size*size, 0..1 */
function normalFromHeight(heights, size, strength = 1.5) {
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const d = img.data;
  const h = (x, y) => heights[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * strength;
      const dy = (h(x, y + 1) - h(x, y - 1)) * strength;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const i = (y * size + x) * 4;
      d[i] = (-dx * inv * 0.5 + 0.5) * 255;
      d[i + 1] = (dy * inv * 0.5 + 0.5) * 255;
      d[i + 2] = inv * 255;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function grayCanvas(values, size) {
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = clamp01(values[i]) * 255;
    img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/* ------------------------------------------------------------------ */
/* Flagstone floor — toroidal Voronoi so it tiles seamlessly           */
/* ------------------------------------------------------------------ */

export function flagstoneSet(size = 1024, repeat = [1.6, 3.0]) {
  const rand = mulberry32(1234567);
  const GRID = 6;
  const seeds = [];
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      seeds.push({
        x: (gx + 0.18 + rand() * 0.64) / GRID,
        y: (gy + 0.18 + rand() * 0.64) / GRID,
        tone: 0.55 + rand() * 0.4,
        warm: rand() * 0.5,
      });
    }
  }
  const height = new Float32Array(size * size);
  const colorC = makeCanvas(size, size);
  const cctx = colorC.getContext('2d');
  const img = cctx.createImageData(size, size);
  const noise = fbm(size, 4, mulberry32(99));
  const fine = fbm(size, 6, mulberry32(7));

  for (let y = 0; y < size; y++) {
    const py = y / size;
    for (let x = 0; x < size; x++) {
      const px = x / size;
      let d1 = 9, d2 = 9, s1 = seeds[0];
      for (let s = 0; s < seeds.length; s++) {
        const sd = seeds[s];
        let dx = Math.abs(px - sd.x); if (dx > 0.5) dx = 1 - dx;
        let dy = Math.abs(py - sd.y); if (dy > 0.5) dy = 1 - dy;
        const d = Math.sqrt(dx * dx + dy * dy * 1.25);
        if (d < d1) { d2 = d1; d1 = d; s1 = sd; }
        else if (d < d2) { d2 = d; }
      }
      const edge = d2 - d1;
      const groutW = 0.012;
      const idx = y * size + x;
      const n = noise[idx], f = fine[idx];
      const inStone = edge > groutW;
      const bevel = clamp01((edge - groutW) / 0.035);
      height[idx] = clamp01(inStone
        ? 0.35 + bevel * 0.45 + n * 0.18 + f * 0.06
        : 0.08 + f * 0.05);
      const i4 = idx * 4;
      if (inStone) {
        const t = s1.tone * (0.86 + n * 0.24) * (0.94 + f * 0.12);
        const base = 96 * t + 84;
        img.data[i4] = base + s1.warm * 10;
        img.data[i4 + 1] = base + s1.warm * 6;
        img.data[i4 + 2] = base - s1.warm * 4;
      } else {
        const g = 88 + f * 30;
        img.data[i4] = g; img.data[i4 + 1] = g - 3; img.data[i4 + 2] = g - 7;
      }
      img.data[i4 + 3] = 255;
    }
  }
  cctx.putImageData(img, 0, 0);
  const rough = new Float32Array(size * size);
  for (let i = 0; i < rough.length; i++) {
    rough[i] = 0.78 - (height[i] - 0.5) * 0.25 + (noise[i] - 0.5) * 0.2;
  }
  return {
    map: toTexture(colorC, { repeat }),
    normalMap: toTexture(normalFromHeight(height, size, 2.2), { srgb: false, repeat }),
    roughnessMap: toTexture(grayCanvas(rough, size), { srgb: false, repeat }),
  };
}

/* ------------------------------------------------------------------ */
/* Plaster / painted walls                                             */
/* ------------------------------------------------------------------ */

export function plasterSet(size = 512, tint = [244, 242, 235], repeat = [2, 1]) {
  const low = fbm(size, 3, mulberry32(31));
  const hi = fbm(size, 6, mulberry32(77));
  const height = new Float32Array(size * size);
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    height[i] = 0.5 + (low[i] - 0.5) * 0.35 + (hi[i] - 0.5) * 0.3;
    const shade = 0.94 + (low[i] - 0.5) * 0.08 + (hi[i] - 0.5) * 0.05;
    img.data[i * 4] = tint[0] * shade;
    img.data[i * 4 + 1] = tint[1] * shade;
    img.data[i * 4 + 2] = tint[2] * shade;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return {
    map: toTexture(c, { repeat }),
    normalMap: toTexture(normalFromHeight(height, size, 0.9), { srgb: false, repeat }),
  };
}

export function greenPaintSet(size = 512, repeat = [3, 1]) {
  return plasterSet(size, [205, 216, 172], repeat);
}

/* ------------------------------------------------------------------ */
/* Brushed stainless steel                                             */
/* ------------------------------------------------------------------ */

export function brushedSteelSet(size = 512, repeat = [2, 2], vertical = false) {
  const rand = mulberry32(555);
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    let v = rand();
    for (let x = 0; x < size; x++) {
      if (rand() < 0.04) v = rand();
      const idx = vertical ? x * size + y : y * size + x;
      height[idx] = 0.5 + (v - 0.5) * 0.16 + (rand() - 0.5) * 0.05;
    }
  }
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const g = 188 + (height[i] - 0.5) * 70;
    img.data[i * 4] = g; img.data[i * 4 + 1] = g + 1; img.data[i * 4 + 2] = g + 3;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const rough = new Float32Array(size * size);
  for (let i = 0; i < rough.length; i++) rough[i] = 0.32 + (height[i] - 0.5) * 0.5;
  return {
    map: toTexture(c, { repeat }),
    normalMap: toTexture(normalFromHeight(height, size, 0.6), { srgb: false, repeat }),
    roughnessMap: toTexture(grayCanvas(rough, size), { srgb: false, repeat }),
  };
}

/* ------------------------------------------------------------------ */
/* Wood                                                                */
/* ------------------------------------------------------------------ */

export function woodSet(size = 512, base = [132, 102, 74], repeat = [1, 1]) {
  const rand = mulberry32(4242);
  const warp = fbm(size, 3, mulberry32(11));
  const height = new Float32Array(size * size);
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      const ring = Math.sin((y / size * 14 + warp[idx] * 5) * Math.PI * 2);
      const grain = 0.5 + ring * 0.22 + (rand() - 0.5) * 0.08;
      height[idx] = grain;
      const shade = 0.75 + grain * 0.4;
      img.data[idx * 4] = base[0] * shade;
      img.data[idx * 4 + 1] = base[1] * shade;
      img.data[idx * 4 + 2] = base[2] * shade;
      img.data[idx * 4 + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return {
    map: toTexture(c, { repeat }),
    normalMap: toTexture(normalFromHeight(height, size, 0.7), { srgb: false, repeat }),
  };
}

/* ------------------------------------------------------------------ */
/* Small material helpers                                              */
/* ------------------------------------------------------------------ */

export function ceramicNormal(size = 256) {
  const hi = fbm(size, 6, mulberry32(88));
  return toTexture(normalFromHeight(hi, size, 0.25), { srgb: false });
}

export function frostedSet(size = 256) {
  const low = fbm(size, 3, mulberry32(21));
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      const dx = x / size - 0.5, dy = y / size - 0.5;
      const r = Math.sqrt(dx * dx + dy * dy);
      const v = 0.92 - r * 0.35 + (low[idx] - 0.5) * 0.18;
      height[idx] = 0.5 + (low[idx] - 0.5) * 0.8;
      const g = 205 + v * 40;
      img.data[idx * 4] = g - 6; img.data[idx * 4 + 1] = g; img.data[idx * 4 + 2] = g + 5;
      img.data[idx * 4 + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return {
    map: toTexture(c),
    normalMap: toTexture(normalFromHeight(height, size, 1.6), { srgb: false }),
  };
}

export function paintedSet(size = 256, tint = [233, 234, 230]) {
  const hi = fbm(size, 5, mulberry32(3131));
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const shade = 0.97 + (hi[i] - 0.5) * 0.04;
    img.data[i * 4] = tint[0] * shade;
    img.data[i * 4 + 1] = tint[1] * shade;
    img.data[i * 4 + 2] = tint[2] * shade;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return {
    map: toTexture(c),
    normalMap: toTexture(normalFromHeight(hi, size, 0.18), { srgb: false }),
  };
}

/* ------------------------------------------------------------------ */
/* Garden view through the door — layered, soft, overcast              */
/* ------------------------------------------------------------------ */

export function gardenTexture(w = 1024, h = 1536) {
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  sky.addColorStop(0, '#e6edf2');
  sky.addColorStop(1, '#eef2ea');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.5);
  ctx.filter = 'blur(14px)';
  ctx.fillStyle = '#8aa06f';
  for (let x = 0; x < w; x += 60) {
    const r = 60 + Math.sin(x * 0.13) * 22 + Math.random() * 18;
    ctx.beginPath();
    ctx.arc(x + 30, h * 0.33, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#b3a496';
  ctx.fillRect(w * 0.6, h * 0.2, w * 0.32, h * 0.16);
  ctx.fillStyle = '#877a6e';
  ctx.beginPath();
  ctx.moveTo(w * 0.57, h * 0.2);
  ctx.lineTo(w * 0.76, h * 0.1);
  ctx.lineTo(w * 0.95, h * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.filter = 'blur(8px)';
  ctx.fillStyle = '#66854c';
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath();
    ctx.arc(x + 20, h * 0.42, 42 + Math.random() * 14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.filter = 'none';
  const lawn = ctx.createLinearGradient(0, h * 0.42, 0, h);
  lawn.addColorStop(0, '#8aa863');
  lawn.addColorStop(0.6, '#6d8c4c');
  lawn.addColorStop(1, '#597a3e');
  ctx.fillStyle = lawn;
  ctx.fillRect(0, h * 0.42, w, h * 0.58);
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 ? '#ffffff' : '#000000';
    ctx.beginPath();
    ctx.moveTo(w * (0.1 + i * 0.18), h * 0.42);
    ctx.lineTo(w * (0.18 + i * 0.18), h * 0.42);
    ctx.lineTo(w * (0.3 + i * 0.22), h);
    ctx.lineTo(w * (0.05 + i * 0.22), h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(74,105,52,0.85)';
  for (let i = 0; i < 70; i++) {
    ctx.lineWidth = 2 + Math.random() * 4;
    const x = w * 0.02 + Math.random() * w * 0.42;
    const base = h * (0.62 + Math.random() * 0.36);
    ctx.beginPath();
    ctx.moveTo(x, base);
    ctx.quadraticCurveTo(
      x + (Math.random() - 0.5) * 60, base - 200 - Math.random() * 160,
      x + (Math.random() - 0.5) * 150, base - 340 - Math.random() * 200
    );
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(196,180,120,0.8)';
  for (let i = 0; i < 26; i++) {
    const x = w * 0.05 + Math.random() * w * 0.4;
    const y = h * 0.3 + Math.random() * h * 0.25;
    ctx.beginPath();
    ctx.ellipse(x, y, 4, 14, Math.random() * 0.6 - 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 5; i++) {
    const x = w * (0.12 + i * 0.18);
    const y = h * 0.94;
    ctx.fillStyle = '#a56a45';
    ctx.beginPath();
    ctx.moveTo(x - 26, y - 40); ctx.lineTo(x + 26, y - 40);
    ctx.lineTo(x + 20, y); ctx.lineTo(x - 20, y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4e7a3a';
    ctx.beginPath();
    ctx.arc(x, y - 58, 26 + Math.random() * 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = i === 2 ? '#c96a4a' : '#e0c26a';
    for (let f = 0; f < 5; f++) {
      ctx.beginPath();
      ctx.arc(x - 18 + Math.random() * 36, y - 66 + Math.random() * 20, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return toTexture(c);
}

/* ------------------------------------------------------------------ */
/* Labels & printed things                                             */
/* ------------------------------------------------------------------ */

export function labelTexture(lines, bg, fg, { font = 'bold 54px Georgia, serif', sub = null } = {}) {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font;
  const list = Array.isArray(lines) ? lines : [lines];
  const step = 256 / (list.length + 1);
  list.forEach((t, i) => ctx.fillText(t, 128, step * (i + 1)));
  if (sub) {
    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillText(sub, 128, 210);
  }
  return toTexture(c);
}

export function teaCanisterTexture() {
  const c = makeCanvas(512, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c0271f';
  ctx.fillRect(0, 0, 512, 256);
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0.15, 'rgba(255,255,255,0)');
  grad.addColorStop(0.38, 'rgba(255,255,255,0.22)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#fdf6ea';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'italic bold 96px Georgia, serif';
  ctx.fillText('Tea', 256, 132);
  return toTexture(c);
}

export function barrysTexture() {
  const c = makeCanvas(512, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#37953c';
  ctx.fillRect(0, 0, 512, 256);
  const shade = ctx.createLinearGradient(0, 0, 0, 256);
  shade.addColorStop(0, 'rgba(255,255,255,0.12)');
  shade.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#2a742e';
  ctx.fillRect(0, 0, 512, 70);
  ctx.fillStyle = '#f4f0dd';
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px Verdana, sans-serif';
  ctx.fillText('ORIGINAL BLEND', 256, 44);
  ctx.font = 'bold 66px Georgia, serif';
  ctx.fillText("BARRY'S TEA", 256, 150);
  ctx.font = 'italic 23px Georgia, serif';
  ctx.fillText('every day should have its moments', 256, 215);
  return toTexture(c);
}

export function milkTexture() {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f4f4ee';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#2f7fb8';
  ctx.fillRect(0, 96, 256, 72);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 50px Verdana, sans-serif';
  ctx.fillText('MILK', 128, 130);
  ctx.fillStyle = '#57a15c';
  ctx.font = 'bold 19px Verdana, sans-serif';
  ctx.fillText('whole · 2 pints', 128, 190);
  return toTexture(c);
}

export function clockTexture() {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#383b3e';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 1);
  }
  ctx.strokeStyle = '#d8d8d2';
  ctx.fillStyle = '#d8d8d2';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 30px Georgia, serif';
  for (let i = 1; i <= 5; i++) {
    const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
    ctx.fillText(String(i), 128 + Math.cos(a) * 82, 128 + Math.sin(a) * 82);
  }
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(180, 162); ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(108, 66); ctx.stroke();
  return toTexture(c);
}

export function steamSpriteTexture() {
  const c = makeCanvas(128, 128);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.7)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.3)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
