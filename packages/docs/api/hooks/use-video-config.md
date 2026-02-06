# useVideoConfig

Returns the configuration of the current composition.

## Usage

```jsx
import { useVideoConfig } from '@codellyson/framely';

function MyComponent() {
  const { fps, width, height, durationInFrames } = useVideoConfig();

  return (
    <div>
      {width}x{height} @ {fps}fps — {durationInFrames} frames
    </div>
  );
}
```

## Return Value

| Property | Type | Description |
|----------|------|-------------|
| `fps` | number | Frames per second |
| `width` | number | Video width in pixels |
| `height` | number | Video height in pixels |
| `durationInFrames` | number | Total number of frames |

## Example: Responsive Sizing

```jsx
function ResponsiveText() {
  const { width } = useVideoConfig();
  const fontSize = width / 20;

  return (
    <h1 style={{ fontSize }}>
      Scales with video size
    </h1>
  );
}
```
