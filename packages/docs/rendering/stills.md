# Rendering Stills

Render a single frame of your composition as an image.

## Using the CLI

```bash
npx framely still <composition-id> [output] [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `[output]` | Output file path (positional) | output.png |
| `--frame <number>` | Frame to capture | 0 |
| `--format <format>` | Image format (png, jpeg) | png |
| `--scale <number>` | Resolution multiplier | 1 |

## Examples

```bash
# Capture frame 0
npx framely still my-video thumbnail.png

# Capture frame 60
npx framely still my-video frame60.png --frame 60

# JPEG format
npx framely still my-video thumb.jpg --format jpeg
```
