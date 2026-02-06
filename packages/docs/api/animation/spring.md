# spring()

Creates physics-based spring animations that feel natural.

## Syntax

```ts
spring({
  frame: number,
  fps: number,
  from?: number,
  to?: number,
  config?: SpringConfig,
}): number
```

## Basic Usage

```jsx
import { useCurrentFrame, spring } from 'framely';

function MyComponent() {
  const frame = useCurrentFrame();

  const scale = spring({
    frame,
    fps: 30,
    from: 0,
    to: 1,
  });

  return (
    <div style={{ transform: `scale(${scale})` }}>
      Bouncy!
    </div>
  );
}
```

## Spring Config

Customize the spring physics:

```jsx
const scale = spring({
  frame,
  fps: 30,
  from: 0,
  to: 1,
  config: {
    damping: 10,      // How quickly it settles (default: 10)
    mass: 1,          // Weight of the object (default: 1)
    stiffness: 100,   // Spring tension (default: 100)
  },
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `damping` | number | 10 | How quickly the spring settles |
| `mass` | number | 1 | Weight of the object |
| `stiffness` | number | 100 | Spring tension |

## Presets

Use built-in presets:

```jsx
import { spring, springPresets } from 'framely';

// Gentle spring
spring({ frame, fps: 30, config: springPresets.gentle });

// Wobbly spring
spring({ frame, fps: 30, config: springPresets.wobbly });

// Stiff spring
spring({ frame, fps: 30, config: springPresets.stiff });
```
