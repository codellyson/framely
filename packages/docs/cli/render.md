# framely render

Renders a composition to a video file.

## Usage

```bash
npx framely render <composition-id> [output] [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `[output]` | Output file path (positional) | `outputs/<id>-<timestamp>.mp4` |
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
npx framely render my-video hq.mp4 --codec h265 --crf 15

# WebM format
npx framely render my-video video.webm --codec vp9

# Render only frames 0-60
npx framely render my-video --start-frame 0 --end-frame 60
```

## Programmatic Rendering

```js
import { renderMedia } from '@codellyson/framely/renderer';

await renderMedia({
  compositionId: 'my-video',
  outputLocation: 'out.mp4',
  codec: 'h264',
  crf: 18,
});
```
