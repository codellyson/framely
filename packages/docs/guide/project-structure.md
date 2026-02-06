# Project Structure

A typical Framely project looks like this:

```
my-video/
├── package.json
├── framely.config.js
├── src/
│   ├── index.jsx          # Entry point — calls registerRoot()
│   ├── Root.jsx            # Declares <Composition> components
│   └── compositions/
│       └── HelloWorld.jsx  # Your video compositions
├── public/                 # Static assets (images, fonts, etc.)
└── outputs/                # Rendered files (gitignored)
```

## Key Files

### `src/index.jsx`

The entry point. It imports your Root component and registers it:

```jsx
import { registerRoot } from '@codellyson/framely';
import { Root } from './Root';

registerRoot(Root);
```

### `src/Root.jsx`

Declares all your compositions:

```jsx
import { Composition } from '@codellyson/framely';
import { HelloWorld } from './compositions/HelloWorld';
import { Intro } from './compositions/Intro';

export function Root() {
  return (
    <>
      <Composition
        id="hello-world"
        component={HelloWorld}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={150}
      />
      <Composition
        id="intro"
        component={Intro}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={300}
      />
    </>
  );
}
```

### `framely.config.js`

Optional configuration file:

```js
export default {
  port: 3000,
  outputDir: './outputs',
};
```
