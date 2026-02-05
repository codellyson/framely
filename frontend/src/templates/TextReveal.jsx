import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from '../lib';

/**
 * Kinetic Text Reveal Template
 */
export function TextReveal({
  text = 'Your text here',
  fontSize = 120,
  color = '#ffffff',
  backgroundColor = '#000000',
}) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const characters = text.split('');
  const charDelay = 3; // frames between each character

  return (
    <AbsoluteFill
      style={{
        background: backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Background animated lines */}
      {[...Array(5)].map((_, i) => {
        const lineY = interpolate(
          frame,
          [i * 10, i * 10 + 60],
          [-50, 110],
          { extrapolateRight: 'clamp' }
        );
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${lineY}%`,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${color}22, transparent)`,
            }}
          />
        );
      })}

      {/* Text container */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: width * 0.9,
          gap: '0 0.05em',
        }}
      >
        {characters.map((char, i) => {
          const charFrame = frame - i * charDelay;

          // Character animations
          const y = interpolate(charFrame, [0, 15], [100, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          const opacity = interpolate(charFrame, [0, 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          const scale = interpolate(charFrame, [0, 10, 15], [0.5, 1.2, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          const rotate = interpolate(charFrame, [0, 15], [-20, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          // Glow effect
          const glowIntensity = interpolate(charFrame, [10, 20, 30], [0, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          if (char === ' ') {
            return <span key={i} style={{ width: fontSize * 0.3 }} />;
          }

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontSize,
                fontWeight: 700,
                color,
                transform: `translateY(${y}px) scale(${scale}) rotate(${rotate}deg)`,
                opacity,
                textShadow: glowIntensity > 0
                  ? `0 0 ${20 * glowIntensity}px ${color}, 0 0 ${40 * glowIntensity}px ${color}`
                  : 'none',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {char}
            </span>
          );
        })}
      </div>

      {/* Scan line effect */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          top: `${interpolate(frame, [0, 60], [-10, 110], { extrapolateRight: 'clamp' })}%`,
          opacity: 0.5,
          filter: 'blur(2px)',
        }}
      />
    </AbsoluteFill>
  );
}

export default TextReveal;
