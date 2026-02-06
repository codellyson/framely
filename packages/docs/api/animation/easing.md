# Easing Functions

Easing functions control the rate of change over time. Use them with `interpolate()` for non-linear animations.

## Usage

```jsx
import { Easing, interpolate, useCurrentFrame } from '@codellyson/framely';

function EasedAnimation() {
  const frame = useCurrentFrame();

  const y = interpolate(frame, [0, 30], [100, 0], {
    easing: Easing.easeOutCubic,
  });

  return <div style={{ transform: `translateY(${y}px)` }} />;
}
```

## Available Functions

| Function | Description |
|----------|-------------|
| `Easing.linear` | No easing, constant speed |
| `Easing.easeIn` | Slow start |
| `Easing.easeOut` | Slow end |
| `Easing.easeInOut` | Slow start and end |
| `Easing.easeInCubic` | Cubic slow start |
| `Easing.easeOutCubic` | Cubic slow end |
| `Easing.easeInOutCubic` | Cubic slow start and end |
| `Easing.easeInBack` | Slight overshoot at start |
| `Easing.easeOutBack` | Slight overshoot at end |
| `Easing.bounce` | Bouncing effect |
| `Easing.spring` | Spring-like motion |

## Custom Bezier

Create custom easing with `Easing.bezier()`:

```jsx
const easing = Easing.bezier(0.25, 0.1, 0.25, 1);

const value = interpolate(frame, [0, 60], [0, 1], { easing });
```
