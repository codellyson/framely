import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from '@codellyson/framely';

/**
 * YouTube Subscribe Animation Template
 */
export function SubscribeAnimation({
  channelName = 'Your Channel',
  buttonColor = '#FF0000',
  showBell = true,
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Button entrance
  const buttonSpring = spring({ frame, fps, config: { damping: 12, stiffness: 150 } });
  const buttonScale = interpolate(buttonSpring, [0, 1], [0, 1]);
  const buttonY = interpolate(buttonSpring, [0, 1], [50, 0]);

  // Subscribe text morph
  const textProgress = interpolate(frame, [40, 50], [0, 1], { extrapolateRight: 'clamp' });
  const showSubscribed = textProgress > 0.5;

  // Bell animation
  const bellDelay = 60;
  const bellSpring = spring({ frame: frame - bellDelay, fps, config: { damping: 8, stiffness: 200 } });
  const bellScale = interpolate(bellSpring, [0, 1], [0, 1]);
  const bellRotate = interpolate(
    frame - bellDelay,
    [0, 10, 20, 30, 40],
    [0, -20, 20, -10, 0],
    { extrapolateRight: 'clamp' }
  );

  // Cursor animation
  const cursorX = interpolate(frame, [0, 30, 35], [400, 0, 0], { extrapolateRight: 'clamp' });
  const cursorY = interpolate(frame, [0, 30, 35], [200, 0, 5], { extrapolateRight: 'clamp' });
  const cursorOpacity = interpolate(frame, [0, 10, 100, 120], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  const cursorClick = frame >= 35 && frame <= 45;

  // Channel name
  const nameOpacity = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: 'clamp' });
  const nameY = interpolate(frame, [70, 90], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30,
      }}
    >
      {/* Subscribe Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          transform: `scale(${buttonScale}) translateY(${buttonY}px)`,
        }}
      >
        <button
          style={{
            padding: '16px 32px',
            fontSize: 24,
            fontWeight: 600,
            color: '#fff',
            background: showSubscribed ? '#666' : buttonColor,
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            transition: 'background 0.2s',
            minWidth: 200,
          }}
        >
          {showSubscribed ? 'SUBSCRIBED' : 'SUBSCRIBE'}
        </button>

        {/* Bell */}
        {showBell && (
          <div
            style={{
              width: 50,
              height: 50,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${bellScale}) rotate(${bellRotate}deg)`,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
            </svg>
          </div>
        )}
      </div>

      {/* Channel Name */}
      <div
        style={{
          opacity: nameOpacity,
          transform: `translateY(${nameY}px)`,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 18,
            color: 'rgba(255, 255, 255, 0.6)',
            margin: 0,
          }}
        >
          Thanks for subscribing to
        </p>
        <p
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: '#fff',
            margin: '8px 0 0',
          }}
        >
          {channelName}
        </p>
      </div>

      {/* Cursor */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(${cursorX}px, ${cursorY}px)`,
          opacity: cursorOpacity,
          pointerEvents: 'none',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          style={{
            transform: cursorClick ? 'scale(0.9)' : 'scale(1)',
            transition: 'transform 0.1s',
          }}
        >
          <path
            d="M4 4l16 12-6.5 1.5L12 24 4 4z"
            fill="#fff"
            stroke="#000"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Particles on subscribe */}
      {showSubscribed && [...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const distance = interpolate(frame - 45, [0, 30], [0, 150], { extrapolateRight: 'clamp' });
        const particleOpacity = interpolate(frame - 45, [0, 20, 30], [0, 1, 0], { extrapolateRight: 'clamp' });
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '45%',
              width: 8,
              height: 8,
              background: buttonColor,
              borderRadius: '50%',
              transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
              opacity: particleOpacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

export default SubscribeAnimation;
