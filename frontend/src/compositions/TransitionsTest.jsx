/**
 * TransitionsTest Composition
 *
 * Tests the TransitionSeries component with various transition presets.
 */

import {
  useCurrentFrame,
  AbsoluteFill,
  TransitionSeries,
  fade,
  slide,
  wipe,
  zoom,
  flip,
} from '../lib';

export default function TransitionsTest() {
  return (
    <AbsoluteFill style={{ background: '#0a0a0f' }}>
      <TransitionSeries name="transitions-demo">
        {/* Scene 1: Fade In */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <Scene color="#3b82f6" title="Fade Transition" number={1} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={{ durationInFrames: 20 }}
        />

        {/* Scene 2: Slide */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <Scene color="#8b5cf6" title="Slide Transition" number={2} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-left' })}
          timing={{ durationInFrames: 20 }}
        />

        {/* Scene 3: Wipe */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <Scene color="#ec4899" title="Wipe Transition" number={3} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: 'left' })}
          timing={{ durationInFrames: 20 }}
        />

        {/* Scene 4: Zoom */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <Scene color="#f59e0b" title="Zoom Transition" number={4} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={zoom({ enterDirection: 'in', exitDirection: 'out' })}
          timing={{ durationInFrames: 20 }}
        />

        {/* Scene 5: Flip */}
        <TransitionSeries.Sequence durationInFrames={60}>
          <Scene color="#10b981" title="Flip Transition" number={5} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
}

function Scene({ color, title, number }) {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${color}, ${adjustColor(color, -40)})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Large number */}
      <div
        style={{
          fontSize: 200,
          fontWeight: 900,
          color: 'rgba(255,255,255,0.15)',
          position: 'absolute',
          right: 80,
          bottom: 40,
        }}
      >
        {number}
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: 72,
          fontWeight: 700,
          color: 'white',
          margin: 0,
          textShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        {title}
      </h1>

      {/* Frame counter */}
      <div
        style={{
          fontSize: 24,
          color: 'rgba(255,255,255,0.7)',
          marginTop: 20,
        }}
      >
        Frame: {frame}
      </div>
    </AbsoluteFill>
  );
}

// Helper to darken/lighten a hex color
function adjustColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
