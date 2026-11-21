// Fixed scenes for screenshots: ?shot=editor shows the page with a sample
// photo loaded; ?shot=cover shows the exported cover alone, at the size the
// `size` query names. `photo` picks the sample, `caption` the title words,
// `layout` and `grade` the look. `photo2` loads a second sample so a cover
// can fill its panels with several photos; `panels` maps each panel to a
// photo index ("0,1,0,1"). `pan` and `zoom` are per-panel crop values,
// comma-separated per panel ("250,100,100,100") or one value for all —
// the hero panel of a wide cover needs a big downward pan to keep a face
// in frame, while the small panels below it need only a little.
// window.__shotReady is set once painted.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const opts = {
    layout: query.get('layout') ?? undefined,
    grade: query.get('grade') ?? undefined,
    size: query.get('size') ?? undefined,
    subtitle: query.get('subtitle') ?? undefined,
  };
  const photos = [query.get('photo') ?? 'pier'];
  if (query.get('photo2')) photos.push(query.get('photo2'));
  opts.photos = photos;
  const numbers = (value) => (value == null ? undefined : value.split(',').map(Number));
  opts.panelPhotos = numbers(query.get('panels'));
  opts.pan = numbers(query.get('pan'));
  opts.zoom = numbers(query.get('zoom'));
  await load(`samples/${photos[0]}.jpg`, query.get('caption') ?? 'Sunset Heist', opts);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
