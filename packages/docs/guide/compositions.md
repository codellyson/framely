# Compositions

A composition is the top-level container for a video. It defines the video's dimensions, frame rate, and duration.

## Defining a Composition

```jsx
import { Composition } from 'framely';
import { MyVideo } from './MyVideo';

export function Root() {
  return (
    <Composition
      id="my-video"
      component={MyVideo}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={150}
    />
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `id` | string | Unique identifier for the composition |
| `component` | React.FC | The component to render |
| `width` | number | Video width in pixels |
| `height` | number | Video height in pixels |
| `fps` | number | Frames per second |
| `durationInFrames` | number | Total number of frames |
| `defaultProps` | object | Default props passed to the component |

## Multiple Compositions

You can define multiple compositions in a single project:

```jsx
export function Root() {
  return (
    <>
      <Composition id="intro" component={Intro} width={1920} height={1080} fps={30} durationInFrames={90} />
      <Composition id="main" component={Main} width={1920} height={1080} fps={30} durationInFrames={300} />
      <Composition id="outro" component={Outro} width={1920} height={1080} fps={30} durationInFrames={60} />
    </>
  );
}
```

Each composition appears in the studio sidebar and can be rendered independently.
