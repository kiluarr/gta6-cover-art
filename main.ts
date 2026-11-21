// Vice Cover Lab — the entry program (Node 22, standard library only).
//
// It hands the app in: it copies this repository's app/ and screenshots/
// folders into the output directory and writes dossier.json there, using
// the vendored make.fun library (vendor/makefun-app.ts) to build the
// dossier the judge reads. The grader runs it twice and both runs must
// write identical bytes. Outside the grader, MAKEFUN_OUTPUT_DIR stands
// in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The app itself is plain static files under app/ (index.html plus its
// scripts, styles, fonts and sample photos) that run offline in a desktop
// browser with no network request.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The gate's own caps from the kit (reference/gate.json): the dossier text
// is capped at 160 KiB, at most 4 screenshots of at most 256 KiB each, and
// app/ holds at most 993 files totalling at most 48 MiB, with no path
// longer than 1000 bytes. These numbers mirror the scorer so a build that
// passes here is shaped the way the gate expects.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
