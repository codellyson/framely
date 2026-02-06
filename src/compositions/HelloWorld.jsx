import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  AbsoluteFill,
} from '@codellyson/framely';

export function HelloWorld() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const scale = spring({ frame, fps, from: 0.8, to: 1 });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f0f0f',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ opacity, transform: `scale(${scale})`, textAlign: 'center' }}>
        <h1
          style={{
            color: 'white',
            fontSize: 80,
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 700,
            margin: 0,
          }}
        >
          Hello, Framely!
        </h1>
        <p
          style={{
            color: '#888',
            fontSize: 24,
            fontFamily: 'system-ui, sans-serif',
            marginTop: 16,
          }}
        >
          Edit src/compositions/HelloWorld.jsx to get started
        </p>
      </div>
    </AbsoluteFill>
  );
}
