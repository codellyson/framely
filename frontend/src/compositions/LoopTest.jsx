/**
 * LoopTest Composition
 *
 * Tests the Loop component with different loop configurations.
 */

import {
  useCurrentFrame,
  interpolate,
  spring,
  Easing,
  AbsoluteFill,
  Sequence,
  Loop,
  useLoop,
} from '../lib';

export default function LoopTest() {
  return (
    <AbsoluteFill style={{ background: '#0f172a' }}>
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h1
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
            margin: 0,
          }}
        >
          Loop Component Test
        </h1>
      </div>

      {/* Three looping animations side by side */}
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 0,
          right: 0,
          bottom: 100,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '0 60px',
        }}
      >
        {/* Loop 1: Infinite pulse */}
        <div style={{ textAlign: 'center' }}>
          <Loop durationInFrames={30}>
            <PulseCircle color="#3b82f6" />
          </Loop>
          <div style={{ color: '#94a3b8', marginTop: 20, fontSize: 14 }}>
            Infinite Loop (30 frames)
          </div>
        </div>

        {/* Loop 2: 5 times bounce */}
        <div style={{ textAlign: 'center' }}>
          <Loop durationInFrames={45} times={5}>
            <BounceSquare color="#8b5cf6" />
          </Loop>
          <div style={{ color: '#94a3b8', marginTop: 20, fontSize: 14 }}>
            5x Loop (45 frames each)
          </div>
        </div>

        {/* Loop 3: Spinning with iteration display */}
        <div style={{ textAlign: 'center' }}>
          <Loop durationInFrames={60}>
            <SpinnerWithIteration color="#ec4899" />
          </Loop>
          <div style={{ color: '#94a3b8', marginTop: 20, fontSize: 14 }}>
            Spinner with useLoop()
          </div>
        </div>
      </div>

      {/* Global frame counter */}
      <GlobalFrameDisplay />
    </AbsoluteFill>
  );
}

function PulseCircle({ color }) {
  const frame = useCurrentFrame();

  const scale = interpolate(frame, [0, 15, 30], [0.5, 1.2, 0.5], {
    easing: Easing.easeInOutSine,
  });

  const opacity = interpolate(frame, [0, 15, 30], [0.3, 1, 0.3]);

  return (
    <div
      style={{
        width: 150,
        height: 150,
        borderRadius: '50%',
        background: color,
        transform: `scale(${scale})`,
        opacity,
        boxShadow: `0 0 40px ${color}80`,
      }}
    />
  );
}

function BounceSquare({ color }) {
  const frame = useCurrentFrame();

  const y = interpolate(frame, [0, 22, 45], [0, -80, 0], {
    easing: Easing.easeOutBounce,
  });

  const rotation = interpolate(frame, [0, 45], [0, 180]);

  return (
    <div
      style={{
        width: 120,
        height: 120,
        borderRadius: 16,
        background: color,
        transform: `translateY(${y}px) rotate(${rotation}deg)`,
        boxShadow: `0 10px 30px ${color}60`,
      }}
    />
  );
}

function SpinnerWithIteration({ color }) {
  const frame = useCurrentFrame();
  const loop = useLoop();

  const rotation = interpolate(frame, [0, 60], [0, 360]);

  return (
    <div
      style={{
        position: 'relative',
        width: 150,
        height: 150,
      }}
    >
      {/* Spinning ring */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: `8px solid ${color}30`,
          borderTopColor: color,
          transform: `rotate(${rotation}deg)`,
          boxSizing: 'border-box',
        }}
      />

      {/* Iteration number in center */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {loop ? loop.iteration + 1 : '-'}
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#94a3b8',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          iteration
        </div>
      </div>
    </div>
  );
}

function GlobalFrameDisplay() {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: 'monospace',
        fontSize: 18,
        color: '#64748b',
      }}
    >
      Global Frame: {frame}
    </div>
  );
}
