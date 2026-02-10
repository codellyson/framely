import { AbsoluteFill, useCurrentFrame, useVideoConfig } from '@codellyson/framely';

/**
 * Animated Gradient Background Template
 */
export function AnimatedGradient({
  colors = ['#6366f1', '#8b5cf6', '#d946ef'],
  speed = 1,
  angle = 45,
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = (frame * speed) / fps;
  const gradientAngle = angle + Math.sin(progress * 0.5) * 30;
  const shift1 = (Math.sin(progress * 0.8) + 1) * 25;
  const shift2 = 50 + Math.sin(progress * 0.6) * 20;
  const shift3 = 100 - (Math.cos(progress * 0.7) + 1) * 15;

  const gradient = `linear-gradient(${gradientAngle}deg, ${colors[0]} ${shift1}%, ${colors[1] || colors[0]} ${shift2}%, ${colors[2] || colors[1] || colors[0]} ${shift3}%)`;

  const orbs = colors.map((color, i) => {
    const orbProgress = progress + i * 2;
    return {
      color,
      x: 50 + Math.sin(orbProgress * 0.3 + i) * 40,
      y: 50 + Math.cos(orbProgress * 0.4 + i * 0.5) * 40,
      scale: 0.8 + Math.sin(orbProgress * 0.5) * 0.3,
    };
  });

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: -100, background: gradient }} />
      {orbs.map((orb, i) => (
        <div key={i} style={{ position: 'absolute', left: `${orb.x}%`, top: `${orb.y}%`, width: '60%', height: '60%', background: `radial-gradient(circle, ${orb.color}66 0%, transparent 70%)`, transform: `translate(-50%, -50%) scale(${orb.scale})`, filter: 'blur(60px)' }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, opacity: 0.05, mixBlendMode: 'overlay' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)' }} />
    </AbsoluteFill>
  );
}

export default AnimatedGradient;
