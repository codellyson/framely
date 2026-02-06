# Sequence

Offsets the time for its children. Use it to delay when content appears.

## Usage

```jsx
import { Sequence, AbsoluteFill } from '@codellyson/framely';

function MyVideo() {
  return (
    <AbsoluteFill>
      {/* Appears immediately */}
      <Sequence from={0} durationInFrames={30}>
        <Title>First</Title>
      </Sequence>

      {/* Appears at frame 30 */}
      <Sequence from={30} durationInFrames={30}>
        <Title>Second</Title>
      </Sequence>

      {/* Appears at frame 60 */}
      <Sequence from={60}>
        <Title>Third</Title>
      </Sequence>
    </AbsoluteFill>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `from` | number | Frame to start at |
| `durationInFrames` | number | How long to show (optional) |
| `name` | string | Label in timeline (optional) |

## Time Offset

Children of Sequence see time starting from 0:

```jsx
<Sequence from={60}>
  {/* useCurrentFrame() returns 0 at global frame 60 */}
  <FadeIn />
</Sequence>
```
