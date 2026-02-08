# Codecs & Formats

Framely supports multiple video codecs and formats through FFmpeg.

## Supported Codecs

| Codec | Extension | Description |
|-------|-----------|-------------|
| `h264` | .mp4 | Most compatible. Default codec. |
| `h265` | .mp4 | Better compression, less compatible |
| `vp8` | .webm | Open format, good browser support |
| `vp9` | .webm | Better quality than VP8 |
| `prores` | .mov | Professional editing format |
| `gif` | .gif | Animated GIF |

## Quality (CRF)

The Constant Rate Factor (CRF) controls quality vs file size:

| CRF | Quality | Use Case |
|-----|---------|----------|
| 0 | Lossless | Archival |
| 15 | Very high | Final delivery |
| 18 | High | Default, good balance |
| 23 | Medium | Drafts |
| 28+ | Low | Quick previews |

Lower CRF = higher quality = larger file size.

## Examples

```bash
# Default H.264
npx framely render my-video video.mp4

# High quality H.265
npx framely render my-video hq.mp4 --codec h265 --crf 15

# WebM for web
npx framely render my-video web.webm --codec vp9

# Animated GIF
npx framely render my-video animation.gif --codec gif

# ProRes for editing
npx framely render my-video edit.mov --codec prores
```
