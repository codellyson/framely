# useCurrentFrame

Returns the current frame number. This is the primary hook for creating animations.

## Usage

```jsx
import { useCurrentFrame } from '@codellyson/framely';

function MyComponent() {
  const frame = useCurrentFrame();

  return <div>Frame: {frame}</div>;
}
```

## Return Value

- **Type**: `number`
- **Range**: `0` to `durationInFrames - 1`

## Example: Fade In

```jsx
function FadeIn({ children }) {
  const frame = useCurrentFrame();
  const opacity = Math.min(1, frame / 30); // Fade in over 30 frames

  return (
    <div style={{ opacity }}>
      {children}
    </div>
  );
}
```

## Example: Move Across Screen

```jsx
function MovingBox() {
  const frame = useCurrentFrame();
  const x = frame * 10; // Move 10px per frame

  return (
    <div style={{
      transform: `translateX(${x}px)`,
      width: 100,
      height: 100,
      background: 'red',
    }} />
  );
}
```
