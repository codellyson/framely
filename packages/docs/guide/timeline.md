# Timeline & Frames

In Framely, time is measured in frames. Every video has a fixed frame rate (FPS) and a total duration in frames.

## Frame Basics

- At 30 FPS, frame 0 is `t=0s`, frame 30 is `t=1s`, frame 60 is `t=2s`
- Your component re-renders for every frame
- Use `useCurrentFrame()` to get the current frame number

```jsx
import { useCurrentFrame, useVideoConfig } from 'framely';

function MyVideo() {
  const frame = useCurrentFrame();           // 0, 1, 2, ...
  const { fps, durationInFrames } = useVideoConfig();

  const seconds = frame / fps;

  return <div>Time: {seconds.toFixed(2)}s</div>;
}
```

## Duration

A composition with `fps={30}` and `durationInFrames={150}` plays for exactly 5 seconds.

```
Duration in seconds = durationInFrames / fps
150 / 30 = 5 seconds
```

## Keyboard Shortcuts

When using the studio:

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `Arrow Left` / `Arrow Right` | Previous / Next frame |
| `Shift + Arrow Left` / `Shift + Arrow Right` | Skip 10 frames |
| `Home` / `End` | Jump to start / end |
