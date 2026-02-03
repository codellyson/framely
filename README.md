# 🎬 Framely

**Programmatic video creation with React.** Define videos as React components, preview them in the browser, and render to MP4 with a Dockerized backend.

---

## Architecture

```
┌──────────────────────────────┐     ┌──────────────────────────────┐
│   Frontend (React + Vite)    │     │  Backend (Docker Container)  │
│                              │     │                              │
│  ┌────────────────────────┐  │     │  Express API                 │
│  │  Your Compositions     │  │     │     │                        │
│  │  (React components)    │  │     │     ▼                        │
│  └──────────┬─────────────┘  │     │  Playwright (headless        │
│             │                │     │  Chromium)                   │
│             ▼                │     │     │  screenshots each      │
│  ┌────────────────────────┐  │     │     │  frame                 │
│  │  Preview Player        │◄─┼─────┼─────┘                        │
│  │  (play, pause, scrub)  │  │     │     │                        │
│  └────────────────────────┘  │     │     ▼                        │
│                              │     │  FFmpeg (PNG → H.264 MP4)    │
│  Core Library:               │     │     │                        │
│  • useCurrentFrame()         │     │     ▼                        │
│  • interpolate()             │     │  output.mp4                  │
│  • <Sequence>                │     │                              │
│  • <AbsoluteFill>            │     └──────────────────────────────┘
└──────────────────────────────┘
```

## Quick Start

### 1. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** — you'll see the editor with a preview player.

### 2. Start the Renderer (Docker)

```bash
# From the project root
docker compose up --build
```

This builds a container with Playwright + FFmpeg and starts the render server on **http://localhost:4000**.

### 3. Render a Video

Click the **"Render Video"** button in the UI, or call the API directly:

```bash
curl -X POST http://localhost:4000/api/render \
  -H "Content-Type: application/json" \
  -d '{
    "compositionId": "sample-video",
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "durationInFrames": 300
  }'
```

The rendered MP4 appears in the `./outputs/` directory.

---

## Core Concepts

### Every frame is a React component

Your video is a function of time. The `useCurrentFrame()` hook gives you the current frame number, and you use it to drive everything:

```jsx
import { useCurrentFrame, interpolate, AbsoluteFill } from './lib';

function MyVideo() {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 30], [0, 1]);
  const scale = interpolate(frame, [0, 30], [0.8, 1]);

  return (
    <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>
      <h1>Hello, Video!</h1>
    </AbsoluteFill>
  );
}
```

### `interpolate(value, inputRange, outputRange, options?)`

Maps a value from one range to another. The workhorse of animation.

```jsx
// Fade in over frames 0-30
const opacity = interpolate(frame, [0, 30], [0, 1]);

// Move from left to right over frames 10-60
const x = interpolate(frame, [10, 60], [-200, 200]);

// Multi-segment: fade in, hold, fade out
const opacity = interpolate(frame, [0, 20, 80, 100], [0, 1, 1, 0]);

// With easing
import { Easing } from './lib';
const y = interpolate(frame, [0, 30], [100, 0], {
  easing: Easing.easeOutCubic,
});
```

### `spring(frame, options?)`

Spring-physics animation for natural-feeling motion:

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

Sequences can overlap for crossfades.

### `<AbsoluteFill>`

A full-size positioned container — the building block for layering:

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

Access the composition's metadata:

```jsx
const { fps, width, height, durationInFrames } = useVideoConfig();
```

---

## Creating a New Composition

1. Create a file in `frontend/src/compositions/`:

```jsx
// MyVideo.jsx
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

function TitleCard({ title }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1]);

  return (
    <AbsoluteFill style={{ opacity, justifyContent: 'center', alignItems: 'center' }}>
      <h1 style={{ color: 'white', fontSize: 80 }}>{title}</h1>
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
  },
  // ... other compositions
};
```

3. Select it in the sidebar and preview. Hit "Render Video" when ready.

---

## Available Easing Functions

```
Easing.linear        Easing.easeIn         Easing.easeOut
Easing.easeInOut     Easing.easeInCubic    Easing.easeOutCubic
Easing.easeInOutCubic  Easing.easeInBack   Easing.easeOutBack
Easing.bounce        Easing.spring
```

---

## Player Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` / `→` | Previous / Next frame |
| `Shift+←` / `Shift+→` | Skip 10 frames |
| `Home` / `End` | Jump to start / end |

---

## Render API

### `POST /api/render`

```json
{
  "compositionId": "sample-video",
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "durationInFrames": 300,
  "frontendUrl": "http://host.docker.internal:3000"
}
```

Response:

```json
{
  "outputPath": "/app/outputs/sample-video-1706000000.mp4",
  "downloadUrl": "http://localhost:4000/outputs/sample-video-1706000000.mp4",
  "durationMs": 45230
}
```

---

## Project Structure

```
framely/
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── lib/            # ← THE FRAMEWORK
│   │   │   ├── context.jsx     # TimelineContext & provider
│   │   │   ├── hooks.js        # useCurrentFrame, useVideoConfig
│   │   │   ├── interpolate.js  # interpolate(), spring(), Easing
│   │   │   ├── Sequence.jsx    # Timeline sequencing
│   │   │   ├── AbsoluteFill.jsx
│   │   │   ├── Composition.jsx
│   │   │   └── index.js        # Barrel export
│   │   ├── player/
│   │   │   ├── Player.jsx      # Preview player
│   │   │   └── Player.css
│   │   ├── compositions/
│   │   │   └── SampleVideo.jsx # Demo composition
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/                # Node.js render server
│   ├── server.js           # Express API
│   ├── renderer.js         # Playwright + FFmpeg engine
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## How Rendering Works

1. The frontend Vite app serves your React compositions
2. The backend opens headless Chromium (Playwright) and navigates to `?renderMode=true`
3. In render mode, the app shows the bare composition at native resolution
4. The backend calls `window.__setFrame(n)` for each frame and waits for React to re-render
5. It takes a PNG screenshot of the composition container
6. Each PNG is piped directly to FFmpeg's stdin (no temp files on disk)
7. FFmpeg encodes the stream to H.264 MP4

---

## Extending the Framework

Ideas for next steps:

- **Audio support**: Define audio tracks with time offsets, mux with FFmpeg
- **Parallel rendering**: Split frames across N browser instances (see `renderParallel` stub)
- **Data-driven videos**: Pass dynamic props (API data, user input) to compositions
- **Transitions library**: Pre-built fade, slide, zoom transitions
- **Asset preloading**: Ensure images/fonts are loaded before capturing each frame
- **WebCodecs rendering**: Client-side rendering without Docker, using the browser's VideoEncoder API
- **CLI tool**: `framely render --composition my-video --output out.mp4`

---

## License

MIT
