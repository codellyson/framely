# Introduction

Framely is a programmatic video creation framework built on React. It allows you to create videos using familiar React patterns — components, hooks, and props.

## Why Framely?

- **Code-First**: Define videos as code, not timelines
- **React-Based**: Use components you already know
- **Deterministic**: Every render produces identical output
- **Type-Safe**: Full TypeScript support

## How It Works

In Framely, a video is a React component that receives the current frame number. You use this frame number to animate your content.

```jsx
function MyVideo() {
  const frame = useCurrentFrame();
  const opacity = frame / 30; // Fade in over 1 second at 30fps

  return (
    <div style={{ opacity }}>
      Hello, World!
    </div>
  );
}
```

The renderer captures each frame as an image and stitches them together into a video using FFmpeg.

## How Rendering Works

1. The Vite dev server serves React compositions
2. The CLI opens headless Chromium (Playwright) and navigates to `?renderMode=true`
3. In render mode, the app shows the bare composition at native resolution
4. The CLI calls `window.__setFrame(n)` for each frame and waits for React to re-render
5. It takes a JPEG screenshot of the composition container
6. Screenshots are piped directly to FFmpeg's stdin (no temp files)
7. FFmpeg encodes the stream to the selected codec
