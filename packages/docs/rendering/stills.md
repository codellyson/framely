# Rendering Stills

Render a single frame of your composition as an image.

## Using the CLI

```bash
npx framely still <composition-id> [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--output <path>` | Output file path | output.png |
| `--frame <number>` | Frame to capture | 0 |
| `--format <format>` | Image format (png, jpeg) | png |
| `--scale <number>` | Resolution multiplier | 1 |

## Examples

```bash
# Capture frame 0
npx framely still my-video --output thumbnail.png

# Capture frame 60
npx framely still my-video --output frame60.png --frame 60

# JPEG format
npx framely still my-video --output thumb.jpg --format jpeg
```
