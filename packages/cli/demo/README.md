# CLI recordings

[VHS](https://github.com/charmbracelet/vhs) tapes live beside the CLI examples.
Shared terminal settings are included with `Source packages/cli/demo/settings.tape`.
Run all commands from the repository root so source and output paths resolve consistently.

## Record the quickstart

Install VHS, ffmpeg, ttyd, Chromium/Chrome, and the JetBrains Mono font. Install the
workspace dependencies with `bun install --frozen-lockfile`, then run:

```sh
vhs validate packages/cli/demo/quickstart.tape
bash packages/cli/demo/record-quickstart.sh
```

This updates the versioned website assets:

- `docs/public/demos/quickstart.webm`
- `docs/public/demos/quickstart.png` — edit-preview poster

The shared settings render a 900 × 600 logical terminal at **2× pixel density**
(1800 × 1200 pixels), scaling the font and padding too. The recording script exports
VHS's original PNG frames and encodes lossless VP9 with full-resolution color
(`yuv444p`), avoiding the softened colored text in VHS's default lossy WebM output.
Temporary frames are removed automatically. Keep the script's frame rate in sync
with `settings.tape`. Running VHS directly still works for a quick preview, but use
the script for the versioned website video.

The clip starts zaly with `--yolo`, references a file with `@`, fixes a small
calculation bug, and runs its tests. The model responses are **scripted**, not live
inference; the CLI, streaming renderer, file reads, edit, and `bun test` are real.
The demo refuses to report success if a tool fails or the tests exit unsuccessfully.

`quickstart.ts` creates a fresh temporary project and isolates zaly's config,
credentials, plugins, and sessions. No API key or model service is needed. The
project is removed when the CLI exits. To explore it interactively:

```sh
bun packages/cli/demo/quickstart.ts --yolo
```

## Updating recordings

Regenerate manually when the demonstrated UI or workflow changes; there is no CI
recording job. Watch the video before committing both the sources and generated
assets. Keep clips focused, retain fixed terminal settings, and use `Wait+Screen`
for milestones rather than guessing how long commands take.

Only the final video and poster belong in `docs/public/demos`; keep intermediate
frames and debugging captures outside the repository. The website video autoplays
muted once, without playback controls, then stays on the last frame. Visitors who
prefer reduced motion see the static poster instead.
