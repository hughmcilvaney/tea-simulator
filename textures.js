// Procedural canvas textures — no external assets needed.
import * as THREE from 'three';

function canvasTexture(w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 4;
  return tex;
}

function addNoise(ctx, w, h, alpha, tone = 128) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 2 * alpha;
    d[i] = Math.min(255, Math.max(0, d[i] + n * (tone / 128)));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n * (tone / 128)));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n * (tone / 128)));
  }
  ctx.putImageData(img, 0, 0);
}

/* Irregular flagstone floor: scattered polygonal stones with grey grout. */
export function flagstoneTexture(repeat = [2, 4]) {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#8f8b83'; // grout
    ctx.fillRect(0, 0, w, h);
    // Poisson-ish scatter of stone centres, then draw irregular polygons.
    const pts = [];
    const N = 42;
    for (let i = 0; i < N; i++) {
      pts.push([Math.random() * w, Math.random() * h]);
    }
    // Also mirror edge points so pattern tiles acceptably.
    const stones = [];
    for (const [cx, cy] of pts) {
      const r = 55 + Math.random() * 85;
      const sides = 5 + Math.floor(Math.random() * 4);
      const rot = Math.random() * Math.PI;
      const poly = [];
      for (let s = 0; s < sides; s++) {
        const a = rot + (s / sides) * Math.PI * 2;
        const rr = r * (0.7 + Math.random() * 0.5);
        poly.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.85]);
      }
      stones.push(poly);
    }
    for (const poly of stones) {
      const g = 175 + Math.random() * 55;
      const warm = Math.random() * 14;
      ctx.fillStyle = `rgb(${g + warm}, ${g + warm * 0.7}, ${g})`;
      ctx.beginPath();
      ctx.moveTo(poly[0][0], poly[0][1]);
      for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(90,88,82,0.55)';
      ctx.lineWidth = 3;
      ctx.stroke();
      // subtle inner shading
      ctx.save();
      ctx.clip();
      const grad = ctx.createLinearGradient(poly[0][0], poly[0][1] - 60, poly[0][0], poly[0][1] + 90);
      grad.addColorStop(0, 'rgba(255,255,255,0.10)');
      grad.addColorStop(1, 'rgba(0,0,0,0.12)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
    addNoise(ctx, w, h, 12);
  }, { repeat });
}

export function plasterTexture(base = '#f4f2ec', repeat = [2, 1]) {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    addNoise(ctx, w, h, 6);
  }, { repeat });
}

export function greenPaintTexture(repeat = [3, 1]) {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#cfdcae';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(${170 + Math.random() * 40}, ${190 + Math.random() * 30}, ${140 + Math.random() * 30}, 0.05)`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 20, 3);
    }
    addNoise(ctx, w, h, 5);
  }, { repeat });
}

export function brushedMetalTexture(repeat = [2, 1], light = 205) {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = `rgb(${light},${light},${light + 2})`;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const y = Math.random() * h;
      const v = light - 40 + Math.random() * 80;
      ctx.strokeStyle = `rgba(${v},${v},${v}, 0.16)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const x = Math.random() * w;
      ctx.moveTo(x, y);
      ctx.lineTo(x + 40 + Math.random() * 120, y);
      ctx.stroke();
    }
  }, { repeat });
}

export function woodTexture(repeat = [1, 1], hue = [150, 110, 70]) {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = `rgb(${hue[0]},${hue[1]},${hue[2]})`;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      const y = Math.random() * h;
      const v = -25 + Math.random() * 45;
      ctx.strokeStyle = `rgba(${hue[0] + v},${hue[1] + v},${hue[2] + v},0.5)`;
      ctx.lineWidth = 2 + Math.random() * 5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + (Math.random() - 0.5) * 22, w * 0.7, y + (Math.random() - 0.5) * 22, w, y);
      ctx.stroke();
    }
    addNoise(ctx, w, h, 8);
  }, { repeat });
}

/* Cabinet front: pale warm white with the faintest sheen variation. */
export function cabinetTexture(repeat = [1, 1]) {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#e9eae6';
    ctx.fillRect(0, 0, w, h);
    addNoise(ctx, w, h, 3);
  }, { repeat });
}

/* Garden view seen through the door: sky, hedge, lawn, a few plants. */
export function gardenTexture() {
  return canvasTexture(512, 768, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    sky.addColorStop(0, '#dfeef7');
    sky.addColorStop(1, '#f2f6ec');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.55);
    // distant house
    ctx.fillStyle = '#b9aa9d';
    ctx.fillRect(w * 0.55, h * 0.18, w * 0.34, h * 0.2);
    ctx.fillStyle = '#8d7f74';
    ctx.beginPath();
    ctx.moveTo(w * 0.52, h * 0.18);
    ctx.lineTo(w * 0.72, h * 0.08);
    ctx.lineTo(w * 0.92, h * 0.18);
    ctx.closePath();
    ctx.fill();
    // hedge line
    ctx.fillStyle = '#6f8f52';
    for (let x = 0; x < w; x += 26) {
      ctx.beginPath();
      ctx.arc(x + 13, h * 0.42, 24 + Math.random() * 10, 0, Math.PI * 2);
      ctx.fill();
    }
    // lawn
    const lawn = ctx.createLinearGradient(0, h * 0.42, 0, h);
    lawn.addColorStop(0, '#7fa35b');
    lawn.addColorStop(1, '#5c7f41');
    ctx.fillStyle = lawn;
    ctx.fillRect(0, h * 0.42, w, h * 0.58);
    // tall grasses near the door (like the video)
    ctx.strokeStyle = '#4f7038';
    ctx.lineWidth = 4;
    for (let i = 0; i < 40; i++) {
      const x = w * 0.05 + Math.random() * w * 0.35;
      const base = h * (0.6 + Math.random() * 0.35);
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.quadraticCurveTo(x + (Math.random() - 0.5) * 30, base - 120 - Math.random() * 90, x + (Math.random() - 0.5) * 70, base - 190 - Math.random() * 110);
      ctx.stroke();
    }
    // potted plants on the step
    for (let i = 0; i < 4; i++) {
      const x = w * (0.15 + i * 0.2);
      const y = h * 0.93;
      ctx.fillStyle = '#a56a45';
      ctx.fillRect(x - 14, y - 18, 28, 20);
      ctx.fillStyle = '#4e7a3a';
      ctx.beginPath();
      ctx.arc(x, y - 30, 18, 0, Math.PI * 2);
      ctx.fill();
    }
    addNoise(ctx, w, h, 5);
  });
}

/* Generic rounded label (used for milk, sugar, jars). */
export function labelTexture(lines, bg, fg, { font = 'bold 54px Georgia, serif', sub = null } = {}) {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font;
    const list = Array.isArray(lines) ? lines : [lines];
    const step = h / (list.length + 1);
    list.forEach((t, i) => ctx.fillText(t, w / 2, step * (i + 1)));
    if (sub) {
      ctx.font = 'italic 22px Georgia, serif';
      ctx.fillText(sub, w / 2, h * 0.82);
    }
  });
}

/* The red enamel "Tea" canister wrap. */
export function teaCanisterTexture() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#c8322b';
    ctx.fillRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0.0)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.16)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fdf6ea';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'italic bold 92px Georgia, serif';
    ctx.fillText('Tea', w * 0.5, h * 0.52);
  });
}

/* Barry's Tea box face. */
export function barrysTexture() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#3e8f3e';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2e6e2e';
    ctx.fillRect(0, 0, w, h * 0.30);
    ctx.fillStyle = '#f4f0dd';
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px Verdana, sans-serif';
    ctx.fillText('ORIGINAL BLEND', w / 2, h * 0.2);
    ctx.font = 'bold 72px Georgia, serif';
    ctx.fillText("BARRY'S TEA", w / 2, h * 0.62);
    ctx.font = 'italic 24px Georgia, serif';
    ctx.fillText('every day should have its moments', w / 2, h * 0.86);
  });
}

/* Milk bottle label. */
export function milkTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f7f7f2';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2f7fb8';
    ctx.fillRect(0, h * 0.36, w, h * 0.3);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 52px Verdana, sans-serif';
    ctx.fillText('MILK', w / 2, h * 0.51);
    ctx.fillStyle = '#57a15c';
    ctx.font = 'bold 20px Verdana, sans-serif';
    ctx.fillText('whole · 2 pints', w / 2, h * 0.74);
  });
}

/* Frosted glass-block pane. */
export function frostedTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.72);
    g.addColorStop(0, '#eef3f6');
    g.addColorStop(1, '#c9d4da');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    addNoise(ctx, w, h, 9);
  });
}

/* Slate clock face on driftwood. */
export function clockTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#3a3d40';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d8d8d2';
    ctx.fillStyle = '#d8d8d2';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 30px Georgia, serif';
    for (let i = 1; i <= 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
      ctx.fillText(String(i), w / 2 + Math.cos(a) * 82, h / 2 + Math.sin(a) * 82);
    }
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2);
    ctx.lineTo(w / 2 + 52, h / 2 + 34);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2);
    ctx.lineTo(w / 2 - 20, h / 2 - 62);
    ctx.stroke();
  });
}

/* Round soft particle sprite used for steam. */
export function steamSpriteTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.28)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }, { srgb: false });
}
