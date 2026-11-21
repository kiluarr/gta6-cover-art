// The cover engine: draws the multi-panel poster onto any canvas at any
// export size, with a sunset/neon colour grade, bold Anton lettering, a
// neon Pacifico subtitle, grain and a vignette. Everything is drawn with
// the canvas 2D API; no image ever leaves the machine.

export const LAYOUTS = [
  { id: 'hero', name: 'Hero' },
  { id: 'hero-three', name: 'Hero + 3' },
  { id: 'grid4', name: 'Grid 4' },
  { id: 'grid9', name: 'Grid 9' },
  { id: 'full', name: 'Full bleed' },
  { id: 'tilt', name: 'Tilted stack' },
];

export const GRADES = [
  { id: 'sunset', name: 'Vice Sunset', stops: ['#ff6a00', '#ff2e88', '#7b2ff7'], tint: 'rgba(255,110,60,0.22)' },
  { id: 'neon', name: 'Neon Nights', stops: ['#00f0ff', '#ff2e88', '#7b2ff7'], tint: 'rgba(0,240,255,0.16)' },
  { id: 'gold', name: 'Palm Gold', stops: ['#ffd76a', '#ff8a00', '#b34700'], tint: 'rgba(255,190,60,0.20)' },
  { id: 'teal', name: 'Teal Noir', stops: ['#00c9a7', '#005f73', '#0a1931'], tint: 'rgba(0,180,160,0.18)' },
  { id: 'rose', name: 'Rose Dusk', stops: ['#ff9a9e', '#f6416c', '#3d1a5c'], tint: 'rgba(246,65,108,0.20)' },
];

// Panel rectangles for one layout, as fractions of the cover (x, y, w, h).
export function panelRects(layout, w, h) {
  const g = 0.012; // thin gap between panels, as a fraction of the width
  const gap = w * g;
  const full = [[0, 0, 1, 1]];
  switch (layout) {
    case 'hero-three': {
      const top = 0.62, side = (1 - gap / w - 0) / 3;
      return [
        [0, 0, 1, top],
        [0, top + gap / h, side, 1 - top - gap / h],
        [side + gap / w, top + gap / h, side, 1 - top - gap / h],
        [2 * (side + gap / w), top + gap / h, side, 1 - top - gap / h],
      ];
    }
    case 'grid4': {
      const half = (1 - gap / w) / 2;
      return [
        [0, 0, half, 0.5 - gap / h / 2],
        [half + gap / w, 0, half, 0.5 - gap / h / 2],
        [0, 0.5 + gap / h / 2, half, 0.5 - gap / h / 2],
        [half + gap / w, 0.5 + gap / h / 2, half, 0.5 - gap / h / 2],
      ];
    }
    case 'grid9': {
      const cellW = (1 - 2 * gap / w) / 3;
      const cellH = (1 - 2 * gap / h) / 3;
      const rows = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          rows.push([c * (cellW + gap / w), r * (cellH + gap / h), cellW, cellH]);
        }
      }
      return rows;
    }
    case 'full':
      return full;
    case 'tilt':
      return full;
    case 'hero':
    default:
      return full;
  }
}

// Paints one photo into one panel rectangle, honouring its zoom and pan.
function paintPanel(ctx, img, rect, crop, w, h) {
  const [fx, fy, fw, fh] = rect;
  const x = fx * w, y = fy * h, pw = fw * w, ph = fh * h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, pw, ph);
  ctx.clip();
  if (img) {
    const zoom = (crop.zoom ?? 100) / 100;
    const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * base;
    const dh = img.naturalHeight * base;
    const dx = x + (pw - dw) / 2 + (crop.panX ?? 0) / 100 * pw * 0.5;
    const dy = y + (ph - dh) / 2 + (crop.panY ?? 0) / 100 * ph * 0.5;
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    const sky = ctx.createLinearGradient(x, y, x, y + ph);
    sky.addColorStop(0, '#3d1a5c');
    sky.addColorStop(1, '#12081f');
    ctx.fillStyle = sky;
    ctx.fillRect(x, y, pw, ph);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = `${Math.round(ph * 0.08)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', x + pw / 2, y + ph / 2);
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.strokeRect(x, y, pw, ph);
}

// A sunset gradient map over the whole cover: warm at the bottom, cool up top.
function gradeWash(ctx, grade, w, h) {
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.stops[2] + '55');
  wash.addColorStop(0.55, grade.stops[1] + '33');
  wash.addColorStop(1, grade.stops[0] + '66');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, w, h);
}

function sprinkleGrain(ctx, w, h) {
  const step = Math.max(3, Math.round(w / 360));
  ctx.save();
  ctx.globalAlpha = 0.07;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const v = Math.floor(Math.random() * 255);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, step, step);
    }
  }
  ctx.restore();
}

function darkenEdges(ctx, w, h) {
  const glow = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  glow.addColorStop(0, 'rgba(0,0,0,0)');
  glow.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
}

function fitFont(ctx, text, family, weight, start, maxWidth) {
  let size = start;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 14) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

// The title block: a gradient-filled Anton title with a dark outline and a
// glowing neon script subtitle underneath.
function drawLettering(ctx, grade, title, subtitle, titleScale, w, h) {
  const text = (title || '').trim().toUpperCase();
  if (!text) return;
  const bandH = h * 0.24;
  const bandY = h - bandH;
  const band = ctx.createLinearGradient(0, bandY, 0, h);
  band.addColorStop(0, 'rgba(10,4,20,0)');
  band.addColorStop(1, 'rgba(10,4,20,0.82)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, w, bandH);

  const size = fitFont(ctx, text, 'Anton, sans-serif', 400, Math.round(h * 0.115 * titleScale), w * 0.92);
  const ty = h - h * 0.085;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const fill = ctx.createLinearGradient(0, ty - size, 0, ty);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(0.55, grade.stops[0]);
  fill.addColorStop(1, grade.stops[1]);
  ctx.lineWidth = Math.max(3, size * 0.07);
  ctx.strokeStyle = '#14081f';
  ctx.lineJoin = 'round';
  ctx.strokeText(text, w / 2, ty);
  ctx.fillStyle = fill;
  ctx.fillText(text, w / 2, ty);

  const sub = (subtitle || '').trim();
  if (sub) {
    const ssize = fitFont(ctx, sub, 'Pacifico, cursive', 400, Math.round(h * 0.045), w * 0.8);
    const sy = ty + ssize * 1.15;
    ctx.font = `${ssize}px Pacifico, cursive`;
    ctx.shadowColor = grade.stops[1];
    ctx.shadowBlur = ssize * 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub, w / 2, Math.min(sy, h - h * 0.015));
    ctx.shadowBlur = 0;
  }
}

export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES.find((g) => g.id === state.grade) ?? GRADES[0];
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, w, h);

  const rects = panelRects(state.layout, w, h);
  const tilt = state.layout === 'tilt';
  ctx.save();
  if (tilt) {
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-0.045);
    ctx.translate(-w / 2, -h / 2);
    ctx.scale(1.06, 1.06);
    ctx.translate(-w * 0.03, -h * 0.03);
  }
  rects.forEach((rect, i) => {
    const photoIndex = state.panelPhotos[i] ?? 0;
    const img = state.photos[photoIndex] ?? null;
    paintPanel(ctx, img, rect, state.crops[i] ?? {}, w, h);
  });
  ctx.restore();

  gradeWash(ctx, grade, w, h);
  if (state.grain) sprinkleGrain(ctx, w, h);
  if (state.vignette) darkenEdges(ctx, w, h);
  drawLettering(ctx, grade, state.title, state.subtitle, (state.titleSize ?? 110) / 100, w, h);
}
