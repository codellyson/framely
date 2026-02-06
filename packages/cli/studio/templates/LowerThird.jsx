import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'framely';

/**
 * Clean Lower Third Template
 */
export function LowerThird({
  name = 'John Doe',
  title = 'CEO & Founder',
  social = '@johndoe',
  accentColor = '#3b82f6',
}) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Entry animation
  const entrySpring = spring({ frame, fps, config: { damping: 15, stiffness: 120 } });

  // Line animation
  const lineWidth = interpolate(frame, [0, 25], [0, 100], { extrapolateRight: 'clamp' });

  // Text slide in
  const nameX = interpolate(entrySpring, [0, 1], [-300, 0]);
  const nameOpacity = interpolate(frame, [5, 20], [0, 1], { extrapolateRight: 'clamp' });

  const titleX = interpolate(frame, [15, 35], [-200, 0], { extrapolateRight: 'clamp' });
  const titleOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: 'clamp' });

  // Exit animation
  const exitStart = durationInFrames - 30;
  const exitProgress = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const exitX = interpolate(exitProgress, [0, 1], [0, -400]);
  const exitOpacity = interpolate(exitProgress, [0, 0.5], [1, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: 'transparent' }}>
      {/* Lower third container */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 60,
          transform: `translateX(${exitX}px)`,
          opacity: exitOpacity,
        }}
      >
        {/* Background shape */}
        <div
          style={{
            position: 'relative',
            padding: '16px 24px',
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            borderRadius: 4,
            borderLeft: `4px solid ${accentColor}`,
          }}
        >
          {/* Accent line animation */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${lineWidth}%`,
              height: 2,
              background: `linear-gradient(90deg, ${accentColor}, transparent)`,
            }}
          />

          {/* Name */}
          <h2
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 600,
              color: '#fff',
              transform: `translateX(${nameX}px)`,
              opacity: nameOpacity,
              letterSpacing: '0.02em',
            }}
          >
            {name}
          </h2>

          {/* Title */}
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 16,
              fontWeight: 400,
              color: accentColor,
              transform: `translateX(${titleX}px)`,
              opacity: titleOpacity,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {title}
          </p>

          {/* Social handle */}
          {social && (
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 14,
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.6)',
                transform: `translateX(${titleX}px)`,
                opacity: titleOpacity * 0.8,
              }}
            >
              {social}
            </p>
          )}
        </div>

        {/* Decorative element */}
        <div
          style={{
            position: 'absolute',
            right: -20,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 40,
            height: 40,
            border: `2px solid ${accentColor}`,
            borderRadius: '50%',
            opacity: interpolate(frame, [30, 45], [0, 0.5], { extrapolateRight: 'clamp' }),
          }}
        />
      </div>
    </AbsoluteFill>
  );
}

export default LowerThird;
