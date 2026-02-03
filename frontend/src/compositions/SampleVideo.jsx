import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
  Sequence,
  AbsoluteFill,
} from '../lib';

/**
 * A demo composition showing off the framework's capabilities.
 * 10 seconds at 30fps = 300 frames.
 *
 * Timeline:
 *   0–90:    Intro scene (title + animated bg)
 *   90–180:  Features scene (animated list)
 *   180–270: Code scene (typewriter effect)
 *   270–300: Outro
 */
export default function SampleVideo() {
  return (
    <AbsoluteFill style={{ background: '#0f0f13' }}>
      <Sequence from={0} duration={100} name="intro">
        <IntroScene />
      </Sequence>

      <Sequence from={90} duration={100} name="features">
        <FeaturesScene />
      </Sequence>

      <Sequence from={180} duration={100} name="code">
        <CodeScene />
      </Sequence>

      <Sequence from={270} duration={30} name="outro">
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
}

/* ─── Scene 1: Intro ─── */
function IntroScene() {
  const frame = useCurrentFrame();

  const titleY = interpolate(frame, [0, 30], [80, 0], {
    easing: Easing.easeOutCubic,
  });
  const titleOpacity = interpolate(frame, [0, 20], [0, 1]);
  const subtitleOpacity = interpolate(frame, [20, 40], [0, 1]);
  const subtitleY = interpolate(frame, [20, 45], [30, 0], {
    easing: Easing.easeOutCubic,
  });

  // Exit
  const exitOpacity = interpolate(frame, [80, 100], [1, 0]);

  // Animated background orbs
  const orb1X = interpolate(frame, [0, 100], [-200, 200]);
  const orb2X = interpolate(frame, [0, 100], [200, -100]);
  const orb1Y = Math.sin(frame * 0.05) * 50;
  const orb2Y = Math.cos(frame * 0.04) * 60;

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      {/* Background gradient orbs */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%)',
          left: `calc(30% + ${orb1X}px)`,
          top: `calc(40% + ${orb1Y}px)`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.25), transparent 70%)',
          left: `calc(65% + ${orb2X}px)`,
          top: `calc(55% + ${orb2Y}px)`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          opacity: interpolate(frame, [0, 30], [0, 1]),
        }}
      />

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: 0,
          right: 0,
          textAlign: 'center',
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
        }}
      >
        <h1
          style={{
            fontSize: 120,
            fontWeight: 800,
            color: 'white',
            margin: 0,
            letterSpacing: '-0.04em',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            background: 'linear-gradient(135deg, #fff 40%, #818cf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Framely
        </h1>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: 'absolute',
          top: '55%',
          left: 0,
          right: 0,
          textAlign: 'center',
          transform: `translateY(${subtitleY}px)`,
          opacity: subtitleOpacity,
        }}
      >
        <p
          style={{
            fontSize: 32,
            color: 'rgba(255,255,255,0.5)',
            margin: 0,
            fontWeight: 400,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Programmatic Video with React
        </p>
      </div>
    </AbsoluteFill>
  );
}

/* ─── Scene 2: Features ─── */
function FeaturesScene() {
  const frame = useCurrentFrame();

  const features = [
    { icon: '⚛️', text: 'React Components as Frames' },
    { icon: '🎬', text: 'Timeline & Sequencing' },
    { icon: '✨', text: 'Spring Animations' },
    { icon: '🎞️', text: 'Server-Side Rendering' },
  ];

  // Scene enter
  const enterOpacity = interpolate(frame, [0, 15], [0, 1]);
  const exitOpacity = interpolate(frame, [85, 100], [1, 0]);

  return (
    <AbsoluteFill
      style={{
        opacity: enterOpacity * exitOpacity,
        background: 'linear-gradient(160deg, #0f0f13 0%, #1a1025 100%)',
      }}
    >
      {/* Section title */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: 'white',
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            opacity: interpolate(frame, [5, 20], [0, 1]),
            transform: `translateY(${interpolate(frame, [5, 25], [30, 0], { easing: Easing.easeOutCubic })}px)`,
          }}
        >
          Built for Developers
        </h2>
      </div>

      {/* Feature cards */}
      <div
        style={{
          position: 'absolute',
          top: 260,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 40,
          padding: '0 100px',
        }}
      >
        {features.map((feature, i) => {
          const delay = 15 + i * 10;
          const cardScale = spring(frame, { from: 0.5, to: 1, delay, fps: 30 });
          const cardOpacity = interpolate(frame, [delay, delay + 10], [0, 1]);

          return (
            <div
              key={i}
              style={{
                flex: 1,
                maxWidth: 350,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 20,
                padding: '48px 32px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.06)',
                opacity: cardOpacity,
                transform: `scale(${cardScale})`,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 20 }}>{feature.icon}</div>
              <div
                style={{
                  fontSize: 22,
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 500,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  lineHeight: 1.4,
                }}
              >
                {feature.text}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

/* ─── Scene 3: Code ─── */
function CodeScene() {
  const frame = useCurrentFrame();

  const codeLines = [
    'function MyVideo() {',
    '  const frame = useCurrentFrame();',
    '  const opacity = interpolate(',
    '    frame, [0, 30], [0, 1]',
    '  );',
    '',
    '  return (',
    '    <AbsoluteFill style={{ opacity }}>',
    '      <h1>Hello, Video!</h1>',
    '    </AbsoluteFill>',
    '  );',
    '}',
  ];

  const enterOpacity = interpolate(frame, [0, 15], [0, 1]);
  const exitOpacity = interpolate(frame, [85, 100], [1, 0]);

  // How many characters to show (typewriter)
  const totalChars = codeLines.join('\n').length;
  const charsVisible = Math.floor(
    interpolate(frame, [10, 75], [0, totalChars])
  );

  // Build visible text
  let charCount = 0;
  const visibleLines = codeLines.map((line) => {
    const lineChars = line.length + 1; // +1 for newline
    const start = charCount;
    charCount += lineChars;
    if (start >= charsVisible) return '';
    if (charCount <= charsVisible) return line;
    return line.slice(0, charsVisible - start);
  });

  const showCursor = frame % 30 < 20; // blinking cursor

  return (
    <AbsoluteFill
      style={{
        opacity: enterOpacity * exitOpacity,
        background: '#0f0f13',
      }}
    >
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            margin: 0,
            opacity: interpolate(frame, [0, 15], [0, 1]),
          }}
        >
          Simple API
        </h2>
      </div>

      {/* Code block */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: '50%',
          transform: `translateX(-50%) scale(${interpolate(frame, [5, 20], [0.9, 1], { easing: Easing.easeOutCubic })})`,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 16,
          padding: '40px 48px',
          border: '1px solid rgba(255,255,255,0.06)',
          minWidth: 700,
          opacity: interpolate(frame, [5, 15], [0, 1]),
        }}
      >
        <pre
          style={{
            fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
            fontSize: 24,
            lineHeight: 1.7,
            color: '#e2e8f0',
            margin: 0,
            whiteSpace: 'pre',
          }}
        >
          {visibleLines.map((line, i) => (
            <div key={i}>
              <span style={{ color: 'rgba(255,255,255,0.2)', marginRight: 24, fontSize: 16 }}>
                {String(i + 1).padStart(2, ' ')}
              </span>
              <SyntaxHighlightLine text={line} />
              {i === visibleLines.findLastIndex((l) => l.length > 0) &&
                showCursor && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 2,
                      height: '1.1em',
                      background: '#818cf8',
                      verticalAlign: 'text-bottom',
                      marginLeft: 2,
                    }}
                  />
                )}
            </div>
          ))}
        </pre>
      </div>
    </AbsoluteFill>
  );
}

/** Very simple syntax highlighting */
function SyntaxHighlightLine({ text }) {
  const keywords = ['function', 'const', 'return'];
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    let matched = false;

    // Keywords
    for (const kw of keywords) {
      if (remaining.startsWith(kw) && (remaining.length === kw.length || /\W/.test(remaining[kw.length]))) {
        parts.push(
          <span key={key++} style={{ color: '#c084fc' }}>
            {kw}
          </span>
        );
        remaining = remaining.slice(kw.length);
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Strings
    const stringMatch = remaining.match(/^(['"`])(.*?)\1/);
    if (stringMatch) {
      parts.push(
        <span key={key++} style={{ color: '#34d399' }}>
          {stringMatch[0]}
        </span>
      );
      remaining = remaining.slice(stringMatch[0].length);
      continue;
    }

    // Numbers
    const numMatch = remaining.match(/^\d+/);
    if (numMatch) {
      parts.push(
        <span key={key++} style={{ color: '#f59e0b' }}>
          {numMatch[0]}
        </span>
      );
      remaining = remaining.slice(numMatch[0].length);
      continue;
    }

    // JSX tags
    const tagMatch = remaining.match(/^<\/?[A-Z]\w*/);
    if (tagMatch) {
      parts.push(
        <span key={key++} style={{ color: '#60a5fa' }}>
          {tagMatch[0]}
        </span>
      );
      remaining = remaining.slice(tagMatch[0].length);
      continue;
    }

    // Braces/parens
    if ('(){}[]'.includes(remaining[0])) {
      parts.push(
        <span key={key++} style={{ color: 'rgba(255,255,255,0.4)' }}>
          {remaining[0]}
        </span>
      );
      remaining = remaining.slice(1);
      continue;
    }

    // Default: next char
    parts.push(<span key={key++}>{remaining[0]}</span>);
    remaining = remaining.slice(1);
  }

  return <>{parts}</>;
}

/* ─── Scene 4: Outro ─── */
function OutroScene() {
  const frame = useCurrentFrame();

  const scale = spring(frame, { from: 0.8, to: 1, fps: 30 });
  const opacity = interpolate(frame, [0, 15], [0, 1]);
  const exitOpacity = interpolate(frame, [20, 30], [1, 0]);

  return (
    <AbsoluteFill
      style={{
        background: '#0f0f13',
        opacity: opacity * exitOpacity,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          transform: `scale(${scale})`,
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #818cf8, #c084fc, #f472b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '-0.03em',
          }}
        >
          Start Creating
        </div>
        <div
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.4)',
            marginTop: 20,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          framely • react • video
        </div>
      </div>
    </AbsoluteFill>
  );
}
