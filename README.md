# PaceOn Post Builder

An evidence-driven workout post builder for PaceOn Coaching's Instagram. Designs Stories and Posts from structured session data — graph, annotations, metrics, and brand-locked typography included.

## Features

- **Cycling (% FTP) and Running (% Threshold Pace)** sport modes with appropriate zone systems
- **Three formats**: Story 9:16, Post 1:1, Post 4:5 — switchable without losing work
- **Three layouts**: Graph-led, Description-led, Athlete spotlight
- **Four graph styles**: Stepped, Block, Gradient, Outlined
- **Repeat blocks** for interval structures (e.g. 3 rounds of 30s/4.5min)
- **Draggable annotations** in four styles (Coach's Tip, Science Note, Common Mistake, Execution Cue)
- **Live metrics**: Duration, IF/rIF, TSS/rTSS — shown as ranges to reflect athlete variability
- **Auto-draft** description and Instagram caption with hashtags
- **Background media**: image or looping video with adjustable tint and gradient overlay
- **Bundled PaceOn logos** (white and black) plus custom upload override
- **Image and video export** at full 1080px resolution
- **Preset library** and project save/load via browser storage

## Brand DNA

| Element | Value |
| --- | --- |
| Colours | `#ffffff`, `#6a714b`, `#c85103`, `#000000` |
| Display font | League Spartan |
| Body font | Roboto |
| Tagline | Evidence-driven performance coaching built for athletes balancing ambition with life |

## Running locally

Requires Node.js 18 or later.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

To create a production build:

```bash
npm run build
npm run preview
```

## Project structure

```
paceon-post-builder/
├── public/
│   └── logos/
│       ├── paceon-black.svg    # bundled — auto-loads
│       └── paceon-white.svg    # bundled — auto-loads
├── src/
│   ├── App.jsx                 # the entire builder
│   ├── main.jsx                # React entry point
│   └── index.css               # Tailwind + global styles
├── index.html                  # Google Fonts pre-loaded
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## Notes on video export

The exporter tries MP4 first (works in modern Chrome and Edge). If only WebM is available, it falls back to that and surfaces a message — Instagram doesn't reliably accept WebM, so convert to MP4 with [CloudConvert](https://cloudconvert.com/webm-to-mp4) or [HandBrake](https://handbrake.fr/) before posting.

## Licence

Internal tool for PaceOn Coaching.
