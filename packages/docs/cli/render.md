# framely render

Renders a composition to a video file.

## Usage

```bash
npx framely render <composition-id> [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--output <path>` | Output file path | output.mp4 |
| `--codec <codec>` | Video codec (h264, h265, vp8, vp9) | h264 |
| `--crf <number>` | Quality (0-51, lower is better) | 18 |
| `--scale <number>` | Resolution multiplier | 1 |
| `--fps <number>` | Override FPS | — |
| `--start-frame <n>` | First frame to render | 0 |
| `--end-frame <n>` | Last frame to render | durationInFrames - 1 |

## Examples

```bash
# Render with default settings
npx framely render my-video

# High quality H.265
npx framely render my-video --codec h265 --crf 15 --output hq.mp4

# WebM format
npx framely render my-video --codec vp9 --output video.webm

# Render only frames 0-60
npx framely render my-video --start-frame 0 --end-frame 60
```

## Programmatic Rendering

```js
import { renderMedia } from 'framely/renderer';

await renderMedia({
  compositionId: 'my-video',
  outputLocation: 'out.mp4',
  codec: 'h264',
  crf: 18,
});
```
