# Video

Embeds a video that syncs with the Framely timeline.

## Usage

```jsx
import { Video, AbsoluteFill } from 'framely';

function MyVideo() {
  return (
    <AbsoluteFill>
      <Video src="/background.mp4" style={{ width: '100%' }} />
    </AbsoluteFill>
  );
}
```

## Props

Accepts all standard `<video>` props plus:

| Prop | Type | Description |
|------|------|-------------|
| `src` | string | Video source URL |
| `startFrom` | number | Start playback from this frame |
| `endAt` | number | End playback at this frame |
| `volume` | number \| function | Volume (0-1) or a function of frame |
