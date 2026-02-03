/**
 * ColorInterpolationTest Composition
 *
 * Tests interpolateColors with various color formats and multi-color transitions.
 */

import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  interpolateColors,
  Easing,
  AbsoluteFill,
} from '../lib';

export default function ColorInterpolationTest() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Background gradient that shifts through colors
  const bgColor1 = interpolateColors(
    frame,
    [0, durationInFrames / 2, durationInFrames],
    ['#1e1b4b', '#4c1d95', '#1e3a5f']
  );

  const bgColor2 = interpolateColors(
    frame,
    [0, durationInFrames / 2, durationInFrames],
    ['#0f172a', '#831843', '#134e4a']
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${bgColor1}, ${bgColor2})`,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 48, fontWeight: 700, color: 'white', margin: 0 }}>
          Color Interpolation
        </h1>
      </div>

      {/* Color demos */}
      <div
        style={{
          position: 'absolute',
          top: 140,
          left: 60,
          right: 60,
          bottom: 100,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 30,
        }}
      >
        {/* Demo 1: Hex colors */}
        <ColorDemo
          title="Hex Colors"
          frame={frame}
          inputRange={[0, durationInFrames]}
          colors={['#ef4444', '#3b82f6']}
        />

        {/* Demo 2: RGB colors */}
        <ColorDemo
          title="RGB Colors"
          frame={frame}
          inputRange={[0, durationInFrames]}
          colors={['rgb(236, 72, 153)', 'rgb(34, 211, 238)']}
        />

        {/* Demo 3: Multi-color gradient */}
        <ColorDemo
          title="Multi-Color"
          frame={frame}
          inputRange={[0, durationInFrames / 3, (durationInFrames * 2) / 3, durationInFrames]}
          colors={['#ef4444', '#f59e0b', '#10b981', '#3b82f6']}
        />

        {/* Demo 4: With easing */}
        <ColorDemo
          title="With Easing"
          frame={frame}
          inputRange={[0, durationInFrames]}
          colors={['#8b5cf6', '#f472b6']}
          easing={Easing.easeInOutCubic}
        />

        {/* Demo 5: HSL colors */}
        <ColorDemo
          title="HSL Colors"
          frame={frame}
          inputRange={[0, durationInFrames]}
          colors={['hsl(0, 100%, 50%)', 'hsl(240, 100%, 50%)']}
        />

        {/* Demo 6: With alpha */}
        <ColorDemo
          title="With Alpha"
          frame={frame}
          inputRange={[0, durationInFrames]}
          colors={['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0.2)']}
          showAlpha
        />
      </div>

      {/* Rainbow bar at bottom */}
      <RainbowBar frame={frame} durationInFrames={durationInFrames} />

      {/* Frame counter */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 14,
          fontFamily: 'monospace',
        }}
      >
        Frame: {frame} / {durationInFrames}
      </div>
    </AbsoluteFill>
  );
}

function ColorDemo({ title, frame, inputRange, colors, easing, showAlpha }) {
  const color = interpolateColors(frame, inputRange, colors, { easing });

  // Calculate progress for display
  const progress = interpolate(
    frame,
    [inputRange[0], inputRange[inputRange.length - 1]],
    [0, 100]
  );

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'white',
          marginBottom: 12,
        }}
      >
        {title}
      </div>

      {/* Color preview */}
      <div
        style={{
          flex: 1,
          background: showAlpha
            ? `linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)`
            : undefined,
          backgroundSize: showAlpha ? '20px 20px' : undefined,
          backgroundPosition: showAlpha ? '0 0, 0 10px, 10px -10px, -10px 0px' : undefined,
          borderRadius: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: 'white',
              fontSize: 12,
              fontFamily: 'monospace',
              background: 'rgba(0,0,0,0.4)',
              padding: '4px 8px',
              borderRadius: 4,
            }}
          >
            {color}
          </span>
        </div>
      </div>

      {/* Input colors */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginTop: 12,
        }}
      >
        {colors.map((c, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 24,
              background: c,
              borderRadius: 4,
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>

      {/* Progress */}
      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          color: 'rgba(255,255,255,0.6)',
          textAlign: 'center',
        }}
      >
        {Math.round(progress)}%
      </div>
    </div>
  );
}

function RainbowBar({ frame, durationInFrames }) {
  // Create a gradient with many color stops
  const stops = 20;
  const gradientStops = [];

  for (let i = 0; i <= stops; i++) {
    const position = i / stops;
    const adjustedPosition = (position + frame / durationInFrames) % 1;

    // Generate rainbow colors using HSL
    const hue = adjustedPosition * 360;
    gradientStops.push(`hsl(${hue}, 80%, 60%)`);
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 50,
        left: 60,
        right: 60,
        height: 8,
        borderRadius: 4,
        background: `linear-gradient(90deg, ${gradientStops.join(', ')})`,
        boxShadow: '0 0 20px rgba(255,255,255,0.2)',
      }}
    />
  );
}
