# Animations

Framely provides two main approaches to animation: `interpolate()` for value mapping and `spring()` for physics-based motion.

## interpolate()

Maps a value from one range to another. The most common way to create animations:

```jsx
import { useCurrentFrame, interpolate } from '@codellyson/framely';

function FadeIn() {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1]);

  return <div style={{ opacity }}>Hello</div>;
}
```

See the full [interpolate() API](/api/animation/interpolate) for details.

## spring()

Creates natural-feeling, physics-based spring animations:

```jsx
import { useCurrentFrame, spring } from '@codellyson/framely';

function BounceIn() {
  const frame = useCurrentFrame();
  const scale = spring({ frame, fps: 30, from: 0, to: 1 });

  return (
    <div style={{ transform: `scale(${scale})` }}>
      Bouncy!
    </div>
  );
}
```

See the full [spring() API](/api/animation/spring) for details.

## Easing Functions

Use easing functions with `interpolate()` for non-linear motion:

```jsx
import { Easing, interpolate, useCurrentFrame } from '@codellyson/framely';

function EasedAnimation() {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, 30], [100, 0], {
    easing: Easing.easeOutCubic,
  });

  return <div style={{ transform: `translateY(${y}px)` }}>Eased</div>;
}
```

Available easing functions:

```
Easing.linear          Easing.easeIn           Easing.easeOut
Easing.easeInOut       Easing.easeInCubic      Easing.easeOutCubic
Easing.easeInOutCubic  Easing.easeInBack       Easing.easeOutBack
Easing.bounce          Easing.spring
```

See the full [Easing API](/api/animation/easing) for details.
