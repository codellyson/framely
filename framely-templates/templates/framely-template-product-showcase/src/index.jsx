import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from '@codellyson/framely';

/**
 * Product Showcase Template
 */
export function ProductShowcase({
  productName = 'Product Name',
  tagline = 'Amazing features await',
  price = '$99.99',
  ctaText = 'Shop Now',
  brandColor = '#10b981',
}) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const productSpring = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const productScale = interpolate(productSpring, [0, 1], [0, 1]);
  const productRotate = interpolate(frame, [0, 180], [0, 360]);

  const nameY = interpolate(frame, [30, 50], [50, 0], { extrapolateRight: 'clamp' });
  const nameOpacity = interpolate(frame, [30, 45], [0, 1], { extrapolateRight: 'clamp' });
  const taglineY = interpolate(frame, [40, 60], [30, 0], { extrapolateRight: 'clamp' });
  const taglineOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: 'clamp' });

  const priceSpring = spring({ frame: frame - 70, fps, config: { damping: 10, stiffness: 200 } });
  const priceScale = interpolate(priceSpring, [0, 1], [0, 1]);

  const ctaSpring = spring({ frame: frame - 100, fps, config: { damping: 15, stiffness: 150 } });
  const ctaScale = interpolate(ctaSpring, [0, 1], [0, 1]);
  const ctaY = interpolate(ctaSpring, [0, 1], [30, 0]);
  const ctaPulse = frame > 120 ? 1 + Math.sin((frame - 120) * 0.15) * 0.05 : 1;

  const circles = [
    { size: 300, delay: 0, x: '20%', y: '30%' },
    { size: 200, delay: 10, x: '80%', y: '60%' },
    { size: 150, delay: 20, x: '70%', y: '20%' },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, ${brandColor}22 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {circles.map((circle, i) => {
        const circleScale = interpolate(frame - circle.delay, [0, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return <div key={i} style={{ position: 'absolute', left: circle.x, top: circle.y, width: circle.size, height: circle.size, borderRadius: '50%', border: `2px solid ${brandColor}33`, transform: `translate(-50%, -50%) scale(${circleScale})` }} />;
      })}
      <div style={{ width: Math.min(width, height) * 0.35, height: Math.min(width, height) * 0.35, borderRadius: '50%', background: `linear-gradient(135deg, ${brandColor}, ${brandColor}88)`, boxShadow: `0 20px 60px ${brandColor}44`, transform: `scale(${productScale}) rotate(${productRotate}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 30 }}>
        <span style={{ fontSize: 60, filter: 'grayscale(1) brightness(10)' }}>📦</span>
      </div>
      <h1 style={{ fontSize: Math.min(width, height) * 0.07, fontWeight: 700, color: '#fff', margin: 0, transform: `translateY(${nameY}px)`, opacity: nameOpacity, textAlign: 'center' }}>{productName}</h1>
      <p style={{ fontSize: Math.min(width, height) * 0.035, color: 'rgba(255,255,255,0.7)', margin: '10px 0 20px', transform: `translateY(${taglineY}px)`, opacity: taglineOpacity, textAlign: 'center' }}>{tagline}</p>
      <div style={{ fontSize: Math.min(width, height) * 0.08, fontWeight: 700, color: brandColor, transform: `scale(${priceScale})`, marginBottom: 20 }}>{price}</div>
      <button style={{ padding: '16px 40px', fontSize: Math.min(width, height) * 0.035, fontWeight: 600, color: '#fff', background: brandColor, border: 'none', borderRadius: 50, transform: `scale(${ctaScale * ctaPulse}) translateY(${ctaY}px)`, boxShadow: `0 10px 30px ${brandColor}66`, cursor: 'pointer' }}>{ctaText}</button>
    </AbsoluteFill>
  );
}

export default ProductShowcase;
