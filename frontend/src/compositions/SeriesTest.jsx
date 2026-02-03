/**
 * SeriesTest Composition
 *
 * Tests the Series component with auto-calculated timing and offsets.
 */

import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  AbsoluteFill,
  Series,
} from '../lib';

export default function SeriesTest() {
  return (
    <AbsoluteFill style={{ background: '#0f0f13' }}>
      <Series>
        {/* Scene 1: 60 frames */}
        <Series.Sequence durationInFrames={60} name="intro">
          <IntroScene />
        </Series.Sequence>

        {/* Scene 2: 60 frames, starts right after scene 1 */}
        <Series.Sequence durationInFrames={60} name="features">
          <FeaturesScene />
        </Series.Sequence>

        {/* Scene 3: 60 frames with -10 offset (overlaps with previous) */}
        <Series.Sequence durationInFrames={60} offset={-10} name="stats">
          <StatsScene />
        </Series.Sequence>

        {/* Scene 4: 30 frames with +10 offset (gap after previous) */}
        <Series.Sequence durationInFrames={30} offset={10} name="outro">
          <OutroScene />
        </Series.Sequence>
      </Series>

      {/* Timeline visualization at bottom */}
      <TimelineVisualization />
    </AbsoluteFill>
  );
}

function IntroScene() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const titleY = spring(frame, { from: 100, to: 0, fps: 30 });
  const opacity = interpolate(frame, [0, 15], [0, 1]);
  const exitOpacity = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0]);

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #1e3a5f, #0f172a)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: opacity * exitOpacity,
      }}
    >
      <div
        style={{
          transform: `translateY(${titleY}px)`,
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h1 style={{ fontSize: 80, fontWeight: 800, color: 'white', margin: 0 }}>
          Series Test
        </h1>
        <p style={{ fontSize: 24, color: '#94a3b8', marginTop: 16 }}>
          Auto-calculated timing
        </p>
        <FrameBadge frame={frame} total={durationInFrames} color="#3b82f6" />
      </div>
    </AbsoluteFill>
  );
}

function FeaturesScene() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const features = ['Sequential', 'Auto-timed', 'Offset Support'];

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #3b1e5f, #1e1b4b)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 48, fontWeight: 700, color: 'white', marginBottom: 40 }}>
          Features
        </h2>
        <div style={{ display: 'flex', gap: 24 }}>
          {features.map((feature, i) => {
            const delay = 10 + i * 12;
            const scale = spring(frame, { from: 0, to: 1, delay, fps: 30 });
            const opacity = interpolate(frame, [delay, delay + 10], [0, 1]);

            return (
              <div
                key={i}
                style={{
                  padding: '24px 40px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: 'white',
                  fontSize: 24,
                  fontWeight: 500,
                  transform: `scale(${scale})`,
                  opacity,
                }}
              >
                {feature}
              </div>
            );
          })}
        </div>
        <FrameBadge frame={frame} total={durationInFrames} color="#8b5cf6" />
      </div>
    </AbsoluteFill>
  );
}

function StatsScene() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const stats = [
    { value: '60', label: 'Frames per scene' },
    { value: '-10', label: 'Offset overlap' },
    { value: '3', label: 'Total scenes' },
  ];

  const enterOpacity = interpolate(frame, [0, 15], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #5f1e3a, #4a1942)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        opacity: enterOpacity,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 48, fontWeight: 700, color: 'white', marginBottom: 40 }}>
          Offset: -10 (overlapping)
        </h2>
        <div style={{ display: 'flex', gap: 60 }}>
          {stats.map((stat, i) => {
            const countUp = interpolate(
              frame,
              [10 + i * 8, 25 + i * 8],
              [0, parseFloat(stat.value) || 0]
            );

            return (
              <div key={i} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 72,
                    fontWeight: 800,
                    color: 'white',
                    fontFamily: 'monospace',
                  }}
                >
                  {stat.value.startsWith('-') ? stat.value : Math.round(countUp)}
                </div>
                <div style={{ fontSize: 18, color: '#f9a8d4', marginTop: 8 }}>
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
        <FrameBadge frame={frame} total={durationInFrames} color="#ec4899" />
      </div>
    </AbsoluteFill>
  );
}

function OutroScene() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const scale = spring(frame, { from: 0.8, to: 1, fps: 30 });
  const opacity = interpolate(frame, [0, 10], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #1e5f3a, #134e2a)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        opacity,
      }}
    >
      <div style={{ textAlign: 'center', transform: `scale(${scale})` }}>
        <h1 style={{ fontSize: 64, fontWeight: 800, color: 'white', margin: 0 }}>
          Offset: +10
        </h1>
        <p style={{ fontSize: 24, color: '#86efac', marginTop: 16 }}>
          (gap after previous scene)
        </p>
        <FrameBadge frame={frame} total={durationInFrames} color="#10b981" />
      </div>
    </AbsoluteFill>
  );
}

function FrameBadge({ frame, total, color }) {
  return (
    <div
      style={{
        marginTop: 40,
        padding: '8px 20px',
        background: color,
        borderRadius: 20,
        display: 'inline-block',
        color: 'white',
        fontSize: 16,
        fontWeight: 500,
        fontFamily: 'monospace',
      }}
    >
      Frame {frame} / {total}
    </div>
  );
}

function TimelineVisualization() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Define the scenes with their actual timings
  const scenes = [
    { name: 'Intro', start: 0, duration: 60, color: '#3b82f6' },
    { name: 'Features', start: 60, duration: 60, color: '#8b5cf6' },
    { name: 'Stats', start: 110, duration: 60, color: '#ec4899' }, // 60+60-10 = 110
    { name: 'Outro', start: 180, duration: 30, color: '#10b981' }, // 110+60+10 = 180
  ];

  const totalFrames = 210; // Total duration

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        background: 'rgba(0,0,0,0.8)',
        padding: '12px 40px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Scene bars */}
      <div
        style={{
          position: 'relative',
          height: 24,
          background: '#1f2937',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {scenes.map((scene, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(scene.start / totalFrames) * 100}%`,
              width: `${(scene.duration / totalFrames) * 100}%`,
              height: '100%',
              background: scene.color,
              opacity: 0.7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: 'white',
              fontWeight: 500,
            }}
          >
            {scene.name}
          </div>
        ))}

        {/* Playhead */}
        <div
          style={{
            position: 'absolute',
            left: `${(frame / totalFrames) * 100}%`,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'white',
            boxShadow: '0 0 8px white',
          }}
        />
      </div>

      {/* Frame counter */}
      <div
        style={{
          marginTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          color: '#9ca3af',
          fontSize: 12,
        }}
      >
        <span>0</span>
        <span style={{ color: 'white', fontWeight: 500 }}>
          Global Frame: {frame} / {durationInFrames}
        </span>
        <span>{totalFrames}</span>
      </div>
    </div>
  );
}
