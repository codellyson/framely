# Series

Arranges sequences back-to-back without manually calculating offsets.

## Usage

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

## Props

### `<Series>`

No required props. Wraps `<Series.Sequence>` children.

### `<Series.Sequence>`

| Prop | Type | Description |
|------|------|-------------|
| `durationInFrames` | number | Duration of this segment |
| `offset` | number | Shift the start time by N frames (can be negative for overlap) |
