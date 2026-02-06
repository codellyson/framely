# Quick Start

Let's create your first video in 5 minutes.

## 1. Create a Project

```bash
npx create-framely my-first-video
cd my-first-video
npm install
```

## 2. Start the Preview Server

```bash
npx framely preview
```

Open `http://localhost:3000` to see the studio.

## 3. Edit Your Composition

Open `src/compositions/HelloWorld.jsx`:

```jsx
import { AbsoluteFill, useCurrentFrame, spring } from '@codellyson/framely';

export function HelloWorld() {
  const frame = useCurrentFrame();
  const scale = spring({ frame, fps: 30, from: 0, to: 1 });

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <h1 style={{
        fontSize: 80,
        color: 'white',
        transform: `scale(${scale})`
      }}>
        Hello, Framely!
      </h1>
    </AbsoluteFill>
  );
}
```

## 4. Render Your Video

Click the "Render" button in the studio, or use the CLI:

```bash
npx framely render hello-world --output video.mp4
```
