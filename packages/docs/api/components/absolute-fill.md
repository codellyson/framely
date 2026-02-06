# AbsoluteFill

A component that fills its parent completely. The most common layout component in Framely.

## Usage

```jsx
import { AbsoluteFill } from '@codellyson/framely';

function MyVideo() {
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <h1>Hello</h1>
    </AbsoluteFill>
  );
}
```

## Layering

Stack multiple AbsoluteFills to create layers:

```jsx
function MyVideo() {
  return (
    <AbsoluteFill>
      {/* Background layer */}
      <AbsoluteFill style={{ background: 'blue' }} />

      {/* Content layer */}
      <AbsoluteFill style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <h1>Hello</h1>
      </AbsoluteFill>

      {/* Overlay layer */}
      <AbsoluteFill style={{
        background: 'rgba(0,0,0,0.3)'
      }} />
    </AbsoluteFill>
  );
}
```

## Props

Accepts all standard `<div>` props plus:

| Prop | Type | Description |
|------|------|-------------|
| `style` | CSSProperties | Additional styles |
| `className` | string | CSS class name |
