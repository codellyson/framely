# Framely

Programmatic video creation with React. Define videos as React components, preview them in a visual studio, and render to MP4/WebM/GIF with the CLI.

---

## Quick Start

```bash
# Install dependencies (pnpm workspace)
pnpm install

# Start the studio (Vite dev server + render API)
pnpm preview

# Or just start the frontend dev server
pnpm dev
```

Open **http://localhost:3000** to use the studio with timeline, props editor, and render dialog.

### Render from CLI

```bash
# Render a video
node cli/index.js render sample-video out.mp4

# Render a still frame
node cli/index.js still sample-video frame.png --frame 60

# List compositions
node cli/index.js compositions
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Studio UI (React + Vite)                  │
│                                                             │
│  ┌─────────┐  ┌──────────────────────┐  ┌──────────────┐   │
│  │ Comps   │  │  Player viewport     │  │ Props editor │   │
│  │ sidebar │  │  (live preview)      │  │ (edit props) │   │
│  │         │  ├──────────────────────┤  │              │   │
│  │         │  │  Timeline            │  │              │   │
│  │         │  │  (sequences, seek)   │  │              │   │
│  └─────────┘  └──────────────────────┘  └──────────────┘   │
│                                                             │
│  [Render] → POST /api/render → CLI render pipeline          │
│  [Share]  → CLI command / URL / config download             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    CLI (@framely/cli)                        │
│                                                             │
│  Playwright (headless Chromium)                             │
│       │  screenshots each frame as JPEG                     │
│       ▼                                                     │
│  FFmpeg (JPEG → H.264/H.265/VP9/ProRes/GIF)               │
│       │                                                     │
│       ▼                                                     │
│  output.mp4                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### Every frame is a React component

```jsx
import { useCurrentFrame, interpolate, AbsoluteFill } from './lib';

function MyVideo() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1]);

  return (
    <AbsoluteFill style={{ opacity }}>
      <h1>Hello, Video!</h1>
    </AbsoluteFill>
  );
}
```

### `interpolate(value, inputRange, outputRange, options?)`

Maps a value from one range to another.

```jsx
const opacity = interpolate(frame, [0, 30], [0, 1]);
const x = interpolate(frame, [10, 60], [-200, 200]);
const opacity = interpolate(frame, [0, 20, 80, 100], [0, 1, 1, 0]);

import { Easing } from './lib';
const y = interpolate(frame, [0, 30], [100, 0], {
  easing: Easing.easeOutCubic,
});
```

### `spring(frame, options?)`

Spring-physics animation:

```jsx
import { spring } from './lib';
const scale = spring(frame, { from: 0, to: 1, fps: 30, delay: 10 });
```

### `<Sequence from={frame} duration={frames}>`

Mounts children at a specific time and offsets their frame counter:

```jsx
<Sequence from={0} duration={90}>
  <IntroScene />    {/* Sees frames 0-89 */}
</Sequence>
<Sequence from={90} duration={90}>
  <MainScene />     {/* Sees frames 0-89 (offset!) */}
</Sequence>
```

### `<AbsoluteFill>`

Full-size positioned container for layering:

```jsx
<AbsoluteFill style={{ background: '#000' }}>
  <AbsoluteFill style={{ opacity: 0.5 }}>
    <BackgroundEffect />
  </AbsoluteFill>
  <AbsoluteFill>
    <ForegroundContent />
  </AbsoluteFill>
</AbsoluteFill>
```

### `useVideoConfig()`

```jsx
const { fps, width, height, durationInFrames } = useVideoConfig();
```

---

## Creating a New Composition

1. Create a file in `frontend/src/compositions/`:

```jsx
import { useCurrentFrame, interpolate, AbsoluteFill, Sequence } from '../lib';

export default function MyVideo({ title = "Hello" }) {
  return (
    <AbsoluteFill style={{ background: '#1a1a2e' }}>
      <Sequence from={0} duration={60}>
        <TitleCard title={title} />
      </Sequence>
      <Sequence from={50} duration={60}>
        <ContentSlide />
      </Sequence>
    </AbsoluteFill>
  );
}
```

2. Register it in `frontend/src/App.jsx`:

```jsx
import MyVideo from './compositions/MyVideo';

const compositions = {
  'my-video': {
    id: 'my-video',
    component: MyVideo,
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 120,
    defaultProps: { title: 'My First Video' },
    sequences: [
      { name: 'Title', from: 0, durationInFrames: 60 },
      { name: 'Content', from: 50, durationInFrames: 60 },
    ],
  },
};
```

3. Open the studio, select it in the sidebar, and preview. Click **Render** when ready.

---

## CLI Commands

```bash
# Render video
node cli/index.js render <composition-id> <output> [options]
  --codec <codec>    h264 | h265 | vp9 | prores | gif (default: h264)
  --crf <number>     Quality 0-51, lower = better (default: 18)
  --scale <number>   Resolution multiplier (default: 1)
  --fps <number>     Override FPS

# Render still frame
node cli/index.js still <composition-id> <output> [options]
  --frame <number>   Frame to capture (default: 0)
  --format <format>  png | jpeg (default: png)

# List available compositions
node cli/index.js compositions

# Start studio preview
node cli/index.js preview [options]
  --port <number>    Dev server port (default: 3000)
  --no-open          Don't open browser
```

---

## Easing Functions

```
Easing.linear          Easing.easeIn           Easing.easeOut
Easing.easeInOut       Easing.easeInCubic      Easing.easeOutCubic
Easing.easeInOutCubic  Easing.easeInBack       Easing.easeOutBack
Easing.bounce          Easing.spring
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `Arrow Left` / `Arrow Right` | Previous / Next frame |
| `Shift + Arrow Left` / `Shift + Arrow Right` | Skip 10 frames |
| `Home` / `End` | Jump to start / end |

---

## Project Structure

```
framely/
├── package.json            # Root workspace config
├── pnpm-workspace.yaml     # Workspace packages
├── cli/                    # @framely/cli
│   ├── index.js            # CLI entry point
│   ├── commands/
│   │   ├── render.js       # Video rendering
│   │   ├── still.js        # Still frame capture
│   │   ├── compositions.js # List compositions
│   │   └── preview.js      # Dev server + render API
│   ├── utils/
│   │   ├── browser.js      # Playwright browser management
│   │   ├── render.js       # Frame capture + FFmpeg pipeline
│   │   └── codecs.js       # Codec configurations
│   └── package.json
├── frontend/               # @framely/frontend
│   ├── src/
│   │   ├── lib/            # Core framework
│   │   │   ├── context.jsx     # TimelineContext & provider
│   │   │   ├── hooks.js        # useCurrentFrame, useVideoConfig
│   │   │   ├── interpolate.js  # interpolate(), spring(), Easing
│   │   │   ├── Sequence.jsx    # Sequence component
│   │   │   ├── AbsoluteFill.jsx
│   │   │   └── index.js        # Barrel export
│   │   ├── player/
│   │   │   └── Player.jsx      # Preview player + PlayerView
│   │   ├── studio/
│   │   │   ├── Timeline.jsx    # Zoomable timeline with tracks
│   │   │   ├── PropsEditor.jsx # Schema-driven prop editor
│   │   │   ├── RenderDialog.jsx# Render config modal
│   │   │   └── ShareDialog.jsx # Share/export modal
│   │   ├── compositions/       # Your video compositions
│   │   ├── App.jsx             # Studio layout
│   │   └── App.css
│   ├── vite.config.js
│   └── package.json
└── outputs/                # Rendered files (gitignored)
```

---

## How Rendering Works

1. The frontend Vite app serves React compositions
2. The CLI opens headless Chromium (Playwright) and navigates to `?renderMode=true`
3. In render mode, the app shows the bare composition at native resolution
4. The CLI calls `window.__setFrame(n)` for each frame and waits for React to re-render
5. It takes a JPEG screenshot of the composition container
6. Screenshots are piped directly to FFmpeg's stdin (no temp files)
7. FFmpeg encodes the stream to the selected codec

---

## License

MIT
