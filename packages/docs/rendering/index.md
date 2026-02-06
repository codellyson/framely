# Rendering Video

Export your composition as a video file.

## Using the Studio

1. Select a composition in the sidebar
2. Click the "Render" button
3. Choose your output settings (codec, quality, resolution)
4. Click "Start Render"

## Using the CLI

```bash
npx framely render <composition-id> [options]
```

See the full [CLI render docs](/cli/render) for all options.

## How Rendering Works

1. A Vite dev server serves your React compositions
2. Playwright opens headless Chromium and navigates to the composition in render mode
3. For each frame, the CLI calls `window.__setFrame(n)` and waits for React to re-render
4. A JPEG screenshot is taken of the composition container
5. Screenshots are piped directly to FFmpeg's stdin (no temp files on disk)
6. FFmpeg encodes the stream to the selected codec

This approach means rendering is deterministic — the same composition always produces the same output.
