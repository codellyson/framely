# Sequences

Sequences let you arrange content over time. They offset the time for their children and optionally limit how long they're visible.

## Basic Usage

```jsx
import { Sequence, AbsoluteFill } from 'framely';

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

## Time Offset

Children of a Sequence see time starting from 0. This means `useCurrentFrame()` returns 0 at the moment the sequence starts:

```jsx
<Sequence from={60}>
  {/* useCurrentFrame() returns 0 at global frame 60 */}
  <FadeIn />
</Sequence>
```

This makes compositions more reusable — your components don't need to know when they appear in the timeline.

## Series

Use `<Series>` to arrange sequences back-to-back without calculating offsets:

```jsx
import { Series, AbsoluteFill } from 'framely';

function MyVideo() {
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence durationInFrames={60}>
          <Intro />
        </Series.Sequence>
        <Series.Sequence durationInFrames={120}>
          <MainContent />
        </Series.Sequence>
        <Series.Sequence durationInFrames={60}>
          <Outro />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
}
```

See the full API docs for [Sequence](/api/components/sequence) and [Series](/api/components/series).
