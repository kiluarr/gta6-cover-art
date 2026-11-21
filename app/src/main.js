// Wires the page: photos in (FileReader, local only), layout and grade
// pickers, per-panel crop sliders, live preview, and PNG export in the
// three post sizes. A `?shot=` query sets up a fixed scene for screenshots.
import { drawCover, LAYOUTS, GRADES, panelRects } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const $ = (id) => document.getElementById(id);

const state = {
  photos: [],
  photoNames: [],
  panelPhotos: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  crops: Array.from({ length: 9 }, () => ({ zoom: 100, panX: 0, panY: 0 })),
  layout: 'hero-three',
  grade: 'sunset',
  grain: true,
  vignette: true,
  title: 'VICE CITY NIGHTS',
  subtitle: 'chasing the sunset',
  titleSize: 110,
  selectedPanel: 0,
  size: '1920x1080',
};

function redraw() {
  drawCover(canvas, state);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Choice buttons for layouts and grades, one row each.
function buildChoices(el, items, key, onPick) {
  items.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = item.name;
    b.dataset.id = item.id;
    if (state[key] === item.id) b.classList.add('on');
    b.addEventListener('click', () => {
      state[key] = item.id;
      el.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      onPick();
    });
    el.appendChild(b);
  });
}

function refreshPhotoList() {
  const list = $('photolist');
  list.innerHTML = '';
  state.photoNames.forEach((name, i) => {
    const thumb = document.createElement('img');
    thumb.src = state.photos[i].src;
    thumb.alt = name;
    thumb.title = name;
    thumb.addEventListener('click', () => {
      state.panelPhotos[state.selectedPanel] = i;
      $('panelphoto').value = String(i);
      redraw();
    });
    list.appendChild(thumb);
  });
  const sel = $('panelphoto');
  sel.innerHTML = '';
  state.photoNames.forEach((name, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `${i + 1}. ${name}`;
    sel.appendChild(opt);
  });
  if (!state.photoNames.length) {
    const opt = document.createElement('option');
    opt.value = '0';
    opt.textContent = 'Sample photo';
    sel.appendChild(opt);
  }
  sel.value = String(state.panelPhotos[state.selectedPanel] ?? 0);
}

function syncCropControls() {
  const crop = state.crops[state.selectedPanel];
  $('zoom').value = crop.zoom;
  $('panx').value = crop.panX;
  $('pany').value = crop.panY;
  $('zoomval').textContent = `${crop.zoom}%`;
  $('panelphoto').value = String(state.panelPhotos[state.selectedPanel] ?? 0);
}

$('photos').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    if (state.photos.length >= 4) break;
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
    const img = await loadImage(dataUrl);
    state.photos.push(img);
    state.photoNames.push(file.name);
  }
  refreshPhotoList();
  redraw();
});

$('panelphoto').addEventListener('change', (e) => {
  state.panelPhotos[state.selectedPanel] = Number(e.target.value);
  redraw();
});
$('zoom').addEventListener('input', (e) => {
  state.crops[state.selectedPanel].zoom = Number(e.target.value);
  $('zoomval').textContent = `${e.target.value}%`;
  redraw();
});
$('panx').addEventListener('input', (e) => {
  state.crops[state.selectedPanel].panX = Number(e.target.value);
  redraw();
});
$('pany').addEventListener('input', (e) => {
  state.crops[state.selectedPanel].panY = Number(e.target.value);
  redraw();
});
$('grain').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
$('vignette').addEventListener('change', (e) => { state.vignette = e.target.checked; redraw(); });
$('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
$('titlesize').addEventListener('input', (e) => { state.titleSize = Number(e.target.value); redraw(); });
$('exportsize').addEventListener('change', (e) => { state.size = e.target.value; });

// Clicking the preview picks the panel under the cursor.
canvas.addEventListener('click', (e) => {
  const box = canvas.getBoundingClientRect();
  const fx = (e.clientX - box.left) / box.width;
  const fy = (e.clientY - box.top) / box.height;
  const rects = panelRects(state.layout, 1, 1);
  const hit = rects.findIndex(([x, y, w, h]) => fx >= x && fx <= x + w && fy >= y && fy <= y + h);
  if (hit >= 0) {
    state.selectedPanel = hit;
    syncCropControls();
    redraw();
  }
});

// Export: redraw the same cover at the chosen post size, then save it.
$('export').addEventListener('click', async () => {
  const [w, h] = state.size.split('x').map(Number);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  await document.fonts.ready;
  drawCover(out, state);
  out.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${state.size}.png`;
    a.click();
    $('status').textContent = `Saved vice-cover-${state.size}.png`;
  }, 'image/png');
});

buildChoices($('layouts'), LAYOUTS, 'layout', redraw);
buildChoices($('grades'), GRADES, 'grade', redraw);
refreshPhotoList();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), async (sample, text, opts) => {
    // A shot may load several photos (opts.photos) and assign each panel
    // its own photo (opts.panelPhotos) and crop (opts.pan / opts.zoom).
    const names = opts.photos ?? [sample.replace('samples/', '').replace('.jpg', '')];
    const imgs = [];
    for (const name of names) imgs.push(await loadImage(`samples/${name}.jpg`));
    state.photos = imgs;
    state.photoNames = names;
    if (opts.panelPhotos) {
      state.panelPhotos = Array.from({ length: 9 }, (_, i) => opts.panelPhotos[i] ?? 0);
    }
    if (opts.pan || opts.zoom) {
      state.crops = Array.from({ length: 9 }, (_, i) => ({
        zoom: opts.zoom ? (opts.zoom[i] ?? opts.zoom[0] ?? 100) : 100,
        panX: 0,
        panY: opts.pan ? (opts.pan[i] ?? opts.pan[0] ?? 0) : 0,
      }));
    }
    if (opts.layout) state.layout = opts.layout;
    if (opts.grade) state.grade = opts.grade;
    if (opts.size) {
      const [w, h] = opts.size.split('x').map(Number);
      canvas.width = w;
      canvas.height = h;
    }
    state.title = text;
    state.subtitle = opts.subtitle ?? state.subtitle;
    $('title').value = text;
    refreshPhotoList();
    await document.fonts.ready;
    redraw();
  });
} else {
  // Default scene: both bundled sample photos, hero + three panels.
  Promise.all([loadImage('samples/boulevard.jpg'), loadImage('samples/pier.jpg')]).then(([a, b]) => {
    state.photos = [a, b];
    state.photoNames = ['boulevard.jpg', 'pier.jpg'];
    state.panelPhotos = [0, 1, 0, 1, 0, 0, 0, 0, 0];
    refreshPhotoList();
    redraw();
  }).catch(() => redraw());
  redraw();
}
