import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from '@codellyson/framely';

/**
 * Slide Transition Template
 */
export function SlideTransition({
  transitionType = 'slide',
  direction = 'left',
  fromContent = 'Slide 1',
  toContent = 'Slide 2',
  backgroundColor = '#1a1a2e',
  slideColor = '#16213e',
  textColor = '#ffffff',
}) {
  const frame = useCurrentFrame();
  const { fps, width, durationInFrames } = useVideoConfig();

  const midpoint = durationInFrames / 2;
  const progress = frame / durationInFrames;

  const transitionSpring = spring({ frame: frame - midpoint / 2, fps, config: { damping: 15, stiffness: 100 } });

  const getTransform = (isOutgoing) => {
    const springValue = isOutgoing ? transitionSpring : 1 - transitionSpring;
    switch (transitionType) {
      case 'slide': {
        const slideOffset = interpolate(springValue, [0, 1], [0, 100]);
        if (direction === 'left') return isOutgoing ? `translateX(${-slideOffset}%)` : `translateX(${100 - slideOffset}%)`;
        if (direction === 'right') return isOutgoing ? `translateX(${slideOffset}%)` : `translateX(${-100 + slideOffset}%)`;
        if (direction === 'up') return isOutgoing ? `translateY(${-slideOffset}%)` : `translateY(${100 - slideOffset}%)`;
        return isOutgoing ? `translateY(${slideOffset}%)` : `translateY(${-100 + slideOffset}%)`;
      }
      case 'zoom': {
        const zoomScale = isOutgoing ? interpolate(springValue, [0, 1], [1, 0.5]) : interpolate(springValue, [0, 1], [1.5, 1]);
        const zoomOpacity = isOutgoing ? interpolate(springValue, [0, 1], [1, 0]) : interpolate(springValue, [0, 1], [0, 1]);
        return { transform: `scale(${zoomScale})`, opacity: zoomOpacity };
      }
      case 'fade': {
        const fadeOpacity = isOutgoing ? interpolate(springValue, [0, 1], [1, 0]) : interpolate(springValue, [0, 1], [0, 1]);
        return { opacity: fadeOpacity };
      }
      case 'flip': {
        const flipRotation = isOutgoing ? interpolate(springValue, [0, 1], [0, -90]) : interpolate(springValue, [0, 1], [90, 0]);
        return { transform: `perspective(1000px) rotateY(${flipRotation}deg)`, opacity: Math.abs(flipRotation) > 85 ? 0 : 1 };
      }
      default: return {};
    }
  };

  const outgoingTransform = getTransform(true);
  const incomingTransform = getTransform(false);

  const SlideContent = ({ content, style }) => (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: slideColor, ...(typeof style === 'string' ? { transform: style } : style) }}>
      <div style={{ fontSize: width * 0.06, fontWeight: 700, color: textColor, textAlign: 'center', padding: 40 }}>{content}</div>
      {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
        <div key={corner} style={{
          position: 'absolute', width: 60, height: 60, borderColor: textColor, borderStyle: 'solid', borderWidth: 0, opacity: 0.3,
          ...(corner.includes('top') ? { top: 40 } : { bottom: 40 }),
          ...(corner.includes('left') ? { left: 40 } : { right: 40 }),
          ...(corner.includes('top') && corner.includes('left') && { borderTopWidth: 3, borderLeftWidth: 3 }),
          ...(corner.includes('top') && corner.includes('right') && { borderTopWidth: 3, borderRightWidth: 3 }),
          ...(corner.includes('bottom') && corner.includes('left') && { borderBottomWidth: 3, borderLeftWidth: 3 }),
          ...(corner.includes('bottom') && corner.includes('right') && { borderBottomWidth: 3, borderRightWidth: 3 }),
        }} />
      ))}
    </div>
  );

  const progressWidth = interpolate(progress, [0, 1], [0, 100]);

  return (
    <AbsoluteFill style={{ background: backgroundColor, overflow: 'hidden' }}>
      <SlideContent content={fromContent} style={outgoingTransform} />
      <SlideContent content={toContent} style={incomingTransform} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.1)' }}>
        <div style={{ width: `${progressWidth}%`, height: '100%', background: textColor, opacity: 0.5 }} />
      </div>
      <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 14, color: textColor, opacity: 0.5, fontFamily: 'monospace', textTransform: 'uppercase' }}>{transitionType} • {direction}</div>
    </AbsoluteFill>
  );
}

export default SlideTransition;
