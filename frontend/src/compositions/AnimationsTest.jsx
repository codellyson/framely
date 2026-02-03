/**
 * AnimationsTest Composition
 *
 * Tests spring animations, Freeze component, and various easing functions.
 */

import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  AbsoluteFill,
  Freeze,
} from '../lib';

export default function AnimationsTest() {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0c0a1d, #1a0a2e)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 30,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 42, fontWeight: 700, color: 'white', margin: 0 }}>
          Animation Showcase
        </h1>
      </div>

      {/* Spring animations section */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 40,
          right: 40,
        }}
      >
        <h2 style={{ fontSize: 20, color: '#a78bfa', marginBottom: 16 }}>
          Spring Physics
        </h2>
        <div style={{ display: 'flex', gap: 20 }}>
          <SpringDemo
            title="Default"
            frame={frame}
            fps={fps}
            config={{}}
          />
          <SpringDemo
            title="Bouncy"
            frame={frame}
            fps={fps}
            config={{ damping: 8 }}
          />
          <SpringDemo
            title="Stiff"
            frame={frame}
            fps={fps}
            config={{ stiffness: 300, damping: 20 }}
          />
          <SpringDemo
            title="Slow"
            frame={frame}
            fps={fps}
            config={{ mass: 3, stiffness: 100 }}
          />
        </div>
      </div>

      {/* Easing functions section */}
      <div
        style={{
          position: 'absolute',
          top: 320,
          left: 40,
          right: 40,
        }}
      >
        <h2 style={{ fontSize: 20, color: '#f472b6', marginBottom: 16 }}>
          Easing Functions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          <EasingDemo title="Linear" frame={frame} easing={Easing.linear} duration={durationInFrames} />
          <EasingDemo title="Ease In" frame={frame} easing={Easing.easeInCubic} duration={durationInFrames} />
          <EasingDemo title="Ease Out" frame={frame} easing={Easing.easeOutCubic} duration={durationInFrames} />
          <EasingDemo title="Ease In/Out" frame={frame} easing={Easing.easeInOutCubic} duration={durationInFrames} />
          <EasingDemo title="Bounce" frame={frame} easing={Easing.easeOutBounce} duration={durationInFrames} />
          <EasingDemo title="Elastic" frame={frame} easing={Easing.easeOutElastic} duration={durationInFrames} />
        </div>
      </div>

      {/* Freeze component section */}
      <div
        style={{
          position: 'absolute',
          top: 540,
          left: 40,
          right: 40,
        }}
      >
        <h2 style={{ fontSize: 20, color: '#34d399', marginBottom: 16 }}>
          Freeze Component
        </h2>
        <div style={{ display: 'flex', gap: 30, alignItems: 'flex-start' }}>
          {/* Normal animation */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 200,
                height: 120,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RotatingBox frame={frame} />
            </div>
            <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>
              Normal (Frame: {frame})
            </div>
          </div>

          {/* Frozen at frame 0 */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 200,
                height: 120,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Freeze frame={0}>
                <RotatingBox frame={frame} />
              </Freeze>
            </div>
            <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>
              Frozen at Frame 0
            </div>
          </div>

          {/* Frozen at frame 45 */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 200,
                height: 120,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Freeze frame={45}>
                <RotatingBox frame={frame} />
              </Freeze>
            </div>
            <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>
              Frozen at Frame 45
            </div>
          </div>

          {/* Frozen at frame 90 */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 200,
                height: 120,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Freeze frame={90}>
                <RotatingBox frame={frame} />
              </Freeze>
            </div>
            <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>
              Frozen at Frame 90
            </div>
          </div>

          {/* Conditional freeze */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 200,
                height: 120,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Freeze frame={60} active={frame > 60}>
                <RotatingBox frame={frame} />
              </Freeze>
            </div>
            <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>
              Freeze after Frame 60
            </div>
          </div>
        </div>
      </div>

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

function SpringDemo({ title, frame, fps, config }) {
  const x = spring(frame, {
    from: -60,
    to: 60,
    fps,
    ...config,
  });

  return (
    <div
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        textAlign: 'center',
      }}
    >
      <div style={{ color: 'white', fontSize: 14, marginBottom: 12 }}>
        {title}
      </div>
      <div
        style={{
          height: 80,
          position: 'relative',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* Track line */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 20,
            right: 20,
            height: 2,
            background: 'rgba(255,255,255,0.1)',
            transform: 'translateY(-50%)',
          }}
        />
        {/* Ball */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#a78bfa',
            transform: `translate(calc(-50% + ${x}px), -50%)`,
            boxShadow: '0 0 20px #a78bfa80',
          }}
        />
      </div>
    </div>
  );
}

function EasingDemo({ title, frame, easing, duration }) {
  const progress = interpolate(frame, [0, duration], [0, 1], { easing });
  const y = progress * 60;

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 12,
        textAlign: 'center',
      }}
    >
      <div style={{ color: 'white', fontSize: 11, marginBottom: 8 }}>
        {title}
      </div>
      <div
        style={{
          height: 80,
          position: 'relative',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 4,
        }}
      >
        {/* Ball */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: '50%',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#f472b6',
            transform: `translate(-50%, -${y}px)`,
            boxShadow: '0 0 10px #f472b680',
          }}
        />
      </div>
      <div style={{ color: '#9ca3af', fontSize: 10, marginTop: 4 }}>
        {(progress * 100).toFixed(0)}%
      </div>
    </div>
  );
}

function RotatingBox({ frame }) {
  const rotation = interpolate(frame, [0, 120], [0, 360]);
  const scale = interpolate(frame, [0, 60, 120], [0.5, 1, 0.5]);
  const hue = interpolate(frame, [0, 120], [0, 360]);

  return (
    <div
      style={{
        width: 50,
        height: 50,
        borderRadius: 8,
        background: `hsl(${hue}, 70%, 60%)`,
        transform: `rotate(${rotation}deg) scale(${scale})`,
        boxShadow: `0 0 20px hsl(${hue}, 70%, 60%, 0.5)`,
      }}
    />
  );
}
