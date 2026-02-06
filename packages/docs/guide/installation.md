# Installation

## Quick Start

The fastest way to get started is using the scaffolding tool:

```bash
npx create-framely my-video
cd my-video
npm install
npx framely preview
```

This creates a new project with a sample composition and opens the studio.

## Manual Installation

If you prefer to set up manually:

```bash
npm install framely @framely/cli react react-dom
```

Then create an entry file that registers your compositions:

```jsx
// src/index.jsx
import { registerRoot } from 'framely';
import { Root } from './Root';

registerRoot(Root);
```

```jsx
// src/Root.jsx
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

## Requirements

- Node.js 18 or higher
- FFmpeg (for rendering)
