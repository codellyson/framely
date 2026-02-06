# interpolate()

Maps a value from one range to another. Essential for creating smooth animations.

## Syntax

```ts
interpolate(
  value: number,
  inputRange: [number, number],
  outputRange: [number, number],
  options?: InterpolateOptions
): number
```

## Basic Usage

```jsx
import { useCurrentFrame, interpolate } from 'framely';

function MyComponent() {
  const frame = useCurrentFrame();

  // Map frames 0-30 to opacity 0-1
  const opacity = interpolate(frame, [0, 30], [0, 1]);

  // Map frames 0-60 to x position 0-500
  const x = interpolate(frame, [0, 60], [0, 500]);

  return (
    <div style={{
      opacity,
      transform: `translateX(${x}px)`
    }}>
      Hello
    </div>
  );
}
```

## Multi-step Ranges

Use more than two values to create multi-step animations:

```jsx
const opacity = interpolate(frame, [0, 20, 80, 100], [0, 1, 1, 0]);
// Fade in from 0-20, stay visible 20-80, fade out 80-100
```

## Clamping

By default, values outside the input range are extrapolated. Use `extrapolateLeft` and `extrapolateRight` to clamp:

```jsx
const opacity = interpolate(
  frame,
  [0, 30],
  [0, 1],
  { extrapolateRight: 'clamp' }
);
// opacity stays at 1 after frame 30
```

## Easing

Apply an easing function for non-linear interpolation:

```jsx
import { Easing } from 'framely';

const scale = interpolate(
  frame,
  [0, 30],
  [0, 1],
  { easing: Easing.bezier(0.25, 0.1, 0.25, 1) }
);
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `easing` | function | linear | Easing function |
| `extrapolateLeft` | `'extend'` \| `'clamp'` \| `'identity'` | `'extend'` | Behavior below input range |
| `extrapolateRight` | `'extend'` \| `'clamp'` \| `'identity'` | `'extend'` | Behavior above input range |
