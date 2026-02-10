import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from '@codellyson/framely';

/**
 * Instagram Story Template
 */
export function InstagramStory({
  headline = 'New Post!',
  description = 'Check out our latest update',
  backgroundColor = '#f472b6',
  textColor = '#ffffff',
}) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const bgPulse = 1 + Math.sin(frame * 0.1) * 0.02;

  const stickers = [
    { emoji: '✨', x: '15%', y: '20%', delay: 0, scale: 1.2 },
    { emoji: '🔥', x: '85%', y: '25%', delay: 5, scale: 1.0 },
    { emoji: '💫', x: '20%', y: '75%', delay: 10, scale: 0.9 },
    { emoji: '⭐', x: '80%', y: '70%', delay: 15, scale: 1.1 },
    { emoji: '💖', x: '50%', y: '15%', delay: 8, scale: 1.0 },
  ];

  const headlineSpring = spring({ frame, fps, config: { damping: 12, stiffness: 150 } });
  const headlineScale = interpolate(headlineSpring, [0, 1], [0, 1]);
  const headlineRotate = interpolate(headlineSpring, [0, 1], [-10, 0]);

  const descY = interpolate(frame, [20, 40], [30, 0], { extrapolateRight: 'clamp' });
  const descOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: 'clamp' });

  const swipeY = interpolate(frame % 60, [0, 30, 60], [0, -15, 0]);
  const swipeOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' });

  const gradientAngle = 135 + Math.sin(frame * 0.05) * 20;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(${gradientAngle}deg, ${backgroundColor}, ${backgroundColor}cc, ${backgroundColor}99)`, transform: `scale(${bgPulse})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {[...Array(6)].map((_, i) => {
        const circleProgress = ((frame + i * 20) % 120) / 120;
        const circleScale = interpolate(circleProgress, [0, 0.5, 1], [0, 1.5, 0]);
        const circleOpacity = interpolate(circleProgress, [0, 0.3, 0.7, 1], [0, 0.3, 0.3, 0]);
        return <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', width: width * 0.8, height: width * 0.8, borderRadius: '50%', border: `3px solid ${textColor}`, transform: `translate(-50%, -50%) scale(${circleScale})`, opacity: circleOpacity }} />;
      })}
      {stickers.map((sticker, i) => {
        const stickerSpring = spring({ frame: frame - sticker.delay, fps, config: { damping: 10, stiffness: 200 } });
        const stickerScale = interpolate(stickerSpring, [0, 1], [0, sticker.scale]);
        const stickerRotate = Math.sin((frame + i * 10) * 0.1) * 15;
        const stickerY = Math.sin((frame + i * 5) * 0.08) * 10;
        return <div key={i} style={{ position: 'absolute', left: sticker.x, top: sticker.y, fontSize: width * 0.08, transform: `translate(-50%, -50%) scale(${stickerScale}) rotate(${stickerRotate}deg) translateY(${stickerY}px)` }}>{sticker.emoji}</div>;
      })}
      <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', borderRadius: 30, padding: '40px 50px', textAlign: 'center', border: '2px solid rgba(255,255,255,0.2)' }}>
        <h1 style={{ fontSize: width * 0.08, fontWeight: 800, color: textColor, margin: 0, transform: `scale(${headlineScale}) rotate(${headlineRotate}deg)`, textShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{headline}</h1>
        <p style={{ fontSize: width * 0.04, color: textColor, margin: '15px 0 0', opacity: descOpacity, transform: `translateY(${descY}px)`, fontWeight: 500 }}>{description}</p>
      </div>
      <div style={{ position: 'absolute', bottom: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: swipeOpacity, transform: `translateY(${swipeY}px)` }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill={textColor}><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" /></svg>
        <span style={{ color: textColor, fontSize: 14, fontWeight: 600, marginTop: 5 }}>Swipe Up</span>
      </div>
    </AbsoluteFill>
  );
}

export default InstagramStory;
