---
layout: home
hero:
  name: Framely
  text: Programmatic Video Creation
  tagline: Build videos with React components. Frame-perfect animations, deterministic rendering, and a powerful studio.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/codellyson/framely

features:
  - icon: 💻
    title: Code-First
    details: Define videos as React components. Full TypeScript support with autocomplete.
  - icon: 🎯
    title: Frame-Perfect
    details: Every frame is deterministic. Animations sync exactly to your timeline.
  - icon: 📦
    title: Export Anywhere
    details: Render to MP4, WebM, GIF, or image sequences using FFmpeg.
  - icon: ⚡
    title: Fast Preview
    details: Hot reload your compositions. See changes instantly in the browser studio.
  - icon: 🧩
    title: Templates
    details: Browse the marketplace for pre-built templates. Customize and render.
  - icon: 🎨
    title: Animations
    details: Spring physics, easing functions, and interpolation built-in.
---

## Quick Example

```jsx
import { useCurrentFrame, spring, AbsoluteFill, Composition } from 'framely';

function MyVideo() {
  const frame = useCurrentFrame();
  const scale = spring({ frame, fps: 30, from: 0, to: 1 });

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <h1 style={{ transform: `scale(${scale})` }}>
        Hello, Framely!
      </h1>
    </AbsoluteFill>
  );
}

export const Root = () => (
  <Composition
    id="my-video"
    component={MyVideo}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={150}
  />
);
```
