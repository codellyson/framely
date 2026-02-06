import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from '@codellyson/framely';

/**
 * Modern Social Intro Template
 * Clean intro animation for social media videos
 */
export function SocialIntro({
  title = 'Your Title Here',
  subtitle = 'Subtitle text',
  accentColor = '#6366f1',
}) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Background gradient animation
  const gradientProgress = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: 'clamp' });

  // Title animation
  const titleSpring = spring({ frame, fps, config: { damping: 15, stiffness: 100 } });
  const titleY = interpolate(titleSpring, [0, 1], [100, 0]);
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  // Subtitle animation (delayed)
  const subtitleSpring = spring({ frame: frame - 15, fps, config: { damping: 15, stiffness: 100 } });
  const subtitleY = interpolate(subtitleSpring, [0, 1], [50, 0]);
  const subtitleOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: 'clamp' });

  // Accent line animation
  const lineWidth = interpolate(frame, [30, 60], [0, 200], { extrapolateRight: 'clamp' });

  // Exit animation
  const exitProgress = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(exitProgress, [0, 1], [1, 0.8]);
  const overallOpacity = interpolate(exitProgress, [0, 1], [1, 0]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, #0a0a0f ${gradientProgress * 30}%, ${accentColor}22 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${scale})`,
        opacity: overallOpacity,
      }}
    >
      {/* Background particles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {[...Array(20)].map((_, i) => {
          const delay = i * 3;
          const particleY = interpolate(
            frame - delay,
            [0, 90],
            [height + 50, -50],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          const particleX = (i * 97) % width;
          const size = 4 + (i % 3) * 2;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: particleX,
                top: particleY,
                width: size,
                height: size,
                borderRadius: '50%',
                background: accentColor,
                opacity: 0.3,
              }}
            />
          );
        })}
      </div>

      {/* Content */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <h1
          style={{
            fontSize: Math.min(width, height) * 0.08,
            fontWeight: 700,
            color: '#fff',
            margin: 0,
            transform: `translateY(${titleY}px)`,
            opacity: titleOpacity,
            textShadow: `0 4px 30px ${accentColor}66`,
          }}
        >
          {title}
        </h1>

        {/* Accent line */}
        <div
          style={{
            width: lineWidth,
            height: 4,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            margin: '20px auto',
            borderRadius: 2,
          }}
        />

        <p
          style={{
            fontSize: Math.min(width, height) * 0.035,
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
            transform: `translateY(${subtitleY}px)`,
            opacity: subtitleOpacity,
          }}
        >
          {subtitle}
        </p>
      </div>
    </AbsoluteFill>
  );
}

export default SocialIntro;
