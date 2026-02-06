# Audio

Adds audio that syncs with the Framely timeline.

## Usage

```jsx
import { Audio, AbsoluteFill } from '@codellyson/framely';

function MyVideo() {
  return (
    <AbsoluteFill>
      <Audio src="/music.mp3" />
      <h1>My Video</h1>
    </AbsoluteFill>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `src` | string | Audio source URL |
| `startFrom` | number | Start playback from this frame |
| `endAt` | number | End playback at this frame |
| `volume` | number \| function | Volume (0-1) or a function of frame |

## Volume Fade

```jsx
import { interpolate, useCurrentFrame, Audio } from '@codellyson/framely';

function WithFade() {
  const frame = useCurrentFrame();

  return (
    <Audio
      src="/music.mp3"
      volume={(f) => interpolate(f, [0, 30], [0, 1], { extrapolateRight: 'clamp' })}
    />
  );
}
```
