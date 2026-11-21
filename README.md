# Vice Cover Lab

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/kiluarr/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/kiluarr/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline cover maker that turns any photo into GTA-style poster art: pick up to 4 photos (they never leave your machine), choose one of 6 multi-panel layouts, crop and position each panel, pick one of 5 sunset/neon colour grades, write a bold title with a neon script subtitle, and export a PNG in 1080×1080, 1080×1350 or 1920×1080.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network request — every script, font and sample photo lives under `app/`. Fonts are Anton and Pacifico under the SIL Open Font License (`app/fonts/OFL.txt`). All art and lettering is original; no Rockstar logo, artwork or font.

## How it works

- `app/index.html` — the editor: photo picker, per-panel crop sliders, layout and grade pickers, title/subtitle fields, export size.
- `app/src/cover.js` — the cover engine: panel geometry for 6 layouts, gradient-map grades, grain, vignette, and gradient-filled Anton lettering with a glowing Pacifico subtitle, all drawn on canvas.
- `app/src/main.js` — wires the page, reads photos with FileReader, and exports the cover at the chosen post size.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`.
