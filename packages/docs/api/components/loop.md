# Loop

Repeats its children for a given duration.

## Usage

```jsx
import { Loop, AbsoluteFill } from 'framely';

function MyVideo() {
  return (
    <AbsoluteFill>
      <Loop durationInFrames={30} times={5}>
        <PulsingDot />
      </Loop>
    </AbsoluteFill>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `durationInFrames` | number | Duration of one loop iteration |
| `times` | number | Number of times to repeat (optional, defaults to infinite) |

## Example

`useCurrentFrame()` inside a Loop resets to 0 at the start of each iteration:

```jsx
function PulsingDot() {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 15, 30], [1, 1.5, 1]);

  return (
    <div style={{
      width: 50,
      height: 50,
      borderRadius: '50%',
      background: 'red',
      transform: `scale(${scale})`,
    }} />
  );
}
```
