# Img

Renders an image. Use this instead of `<img>` to ensure images are loaded before rendering frames.

## Usage

```jsx
import { Img, AbsoluteFill } from 'framely';

function MyVideo() {
  return (
    <AbsoluteFill>
      <Img src="/my-image.png" style={{ width: '100%' }} />
    </AbsoluteFill>
  );
}
```

## Props

Accepts all standard `<img>` props. The component delays rendering until the image is fully loaded.
