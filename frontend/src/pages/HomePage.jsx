import { useState } from 'react';
import './HomePage.css';

// SVG Icons as components for better rendering
const Icons = {
  code: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  frame: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  ),
  download: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  zap: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  grid: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  sparkles: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M5 19l.5 1.5L7 21l-1.5.5L5 23l-.5-1.5L3 21l1.5-.5L5 19z" />
      <path d="M19 5l.5 1.5L21 7l-1.5.5L19 9l-.5-1.5L17 7l1.5-.5L19 5z" />
    </svg>
  ),
};

const features = [
  {
    icon: Icons.code,
    title: 'Code-First',
    description: 'Define videos as React components. Full TypeScript support with autocomplete.',
  },
  {
    icon: Icons.frame,
    title: 'Frame-Perfect',
    description: 'Every frame is deterministic. Animations sync exactly to your timeline.',
  },
  {
    icon: Icons.download,
    title: 'Export Anywhere',
    description: 'Render to MP4, WebM, GIF, or image sequences. Use your own ffmpeg.',
  },
  {
    icon: Icons.zap,
    title: 'Fast Preview',
    description: 'Hot reload your compositions. See changes instantly in the browser.',
  },
  {
    icon: Icons.grid,
    title: 'Templates',
    description: 'Browse the marketplace for pre-built templates. Customize and render.',
  },
  {
    icon: Icons.sparkles,
    title: 'Animations',
    description: 'Spring physics, easing functions, and interpolation built-in.',
  },
];

const codeExample = `import { Composition, AbsoluteFill, useCurrentFrame, spring } from 'framely';

function MyVideo() {
  const frame = useCurrentFrame();
  const scale = spring({ frame, fps: 30, from: 0, to: 1 });

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <h1 style={{ transform: \`scale(\${scale})\` }}>
        Hello, Framely!
      </h1>
    </AbsoluteFill>
  );
}

export const Root = () => (
  <Composition
    id="my-video"
    component={MyVideo}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={150}
  />
);`;

const stats = [
  { value: '60', label: 'FPS Rendering' },
  { value: '4K', label: 'Resolution' },
  { value: '100%', label: 'Deterministic' },
];

export function HomePage({ onNavigate }) {
  const [copied, setCopied] = useState(false);

  const copyCommand = () => {
    navigator.clipboard.writeText('npx framely init my-video');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="home-page">
      {/* Navigation */}
      <nav className="home-nav glass">
        <div className="container flex items-center justify-between">
          <div className="home-nav-logo" onClick={() => onNavigate?.('home')}>
            <span className="home-logo-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </span>
            <span className="home-logo-text">Framely</span>
          </div>

          <div className="home-nav-links hide-mobile">
            <a href="#features" className="nav-link">Features</a>
            <a href="#code" className="nav-link">Code</a>
            <button className="nav-link" onClick={() => onNavigate?.('docs')}>Docs</button>
          </div>

          <div className="home-nav-actions">
            <a
              href="https://github.com/framely/framely"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span className="hide-mobile">GitHub</span>
            </a>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate?.('studio')}>
              Open Studio
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-bg">
          <div className="home-hero-gradient" />
          <div className="home-hero-grid grid-pattern" />
          <div className="home-hero-glow" />
        </div>

        <div className="container home-hero-content">
          <div className="home-hero-badge badge badge-primary">
            <span className="badge-dot" />
            Programmatic Video Creation
          </div>

          <h1 className="home-hero-title">
            Create videos with{' '}
            <span className="gradient-text-shimmer">React</span>
          </h1>

          <p className="home-hero-subtitle">
            Build videos programmatically using React components.
            Frame-perfect animations, deterministic rendering, and a powerful timeline.
          </p>

          <div className="home-hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => onNavigate?.('studio')}>
              Try the Studio
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => onNavigate?.('docs')}>
              Read the Docs
            </button>
          </div>

          {/* Install Command */}
          <div className="home-hero-install">
            <div className="terminal home-install-terminal">
              <div className="terminal-header">
                <span className="terminal-dot red" />
                <span className="terminal-dot yellow" />
                <span className="terminal-dot green" />
                <span className="terminal-title">Terminal</span>
              </div>
              <div className="terminal-body">
                <span className="prompt">$</span>{' '}
                <span className="command">npx framely init my-video</span>
                <button
                  className="home-copy-btn"
                  onClick={copyCommand}
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="home-hero-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="home-stat">
                <span className="home-stat-value">{stat.value}</span>
                <span className="home-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="home-features">
        <div className="container">
          <div className="home-section-header text-center">
            <span className="section-label">
              <span className="section-label-dot" />
              Features
            </span>
            <h2 className="section-title">Everything you need</h2>
            <p className="section-subtitle mx-auto">
              A complete toolkit for creating professional videos with code.
            </p>
          </div>

          <div className="home-features-grid">
            {features.map((feature) => (
              <div key={feature.title} className="home-feature-card card">
                <div className="home-feature-icon">{feature.icon}</div>
                <h3 className="home-feature-title">{feature.title}</h3>
                <p className="home-feature-desc">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example Section */}
      <section id="code" className="home-code-section">
        <div className="container">
          <div className="home-code-layout">
            <div className="home-code-info">
              <span className="section-label">
                <span className="section-label-dot" />
                Developer Experience
              </span>
              <h2 className="section-title">Write videos like you write apps</h2>
              <p className="section-subtitle">
                Use familiar React patterns to create dynamic video content.
                Components, hooks, props \u2014 it all works.
              </p>

              <ul className="home-code-benefits">
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Full TypeScript support
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Hot module replacement
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Frame-perfect animations
                </li>
                <li>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Deterministic output
                </li>
              </ul>

              <button className="btn btn-secondary" onClick={() => onNavigate?.('docs')}>
                View Documentation
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="home-code-example">
              <div className="terminal">
                <div className="terminal-header">
                  <span className="terminal-dot red" />
                  <span className="terminal-dot yellow" />
                  <span className="terminal-dot green" />
                  <span className="terminal-title">MyVideo.jsx</span>
                </div>
                <pre className="code-block home-code-block">
                  <code dangerouslySetInnerHTML={{ __html: highlightCode(codeExample) }} />
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="home-cta">
        <div className="container">
          <div className="home-cta-card glass">
            <div className="home-cta-glow" />
            <h2 className="home-cta-title">Ready to create?</h2>
            <p className="home-cta-subtitle">
              Start building videos with React today. It's free and open source.
            </p>
            <div className="home-cta-actions">
              <button className="btn btn-primary btn-lg" onClick={() => onNavigate?.('studio')}>
                Open Studio
              </button>
              <a
                href="https://github.com/framely/framely"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-lg"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Star on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="container">
          <div className="home-footer-content">
            <div className="home-footer-brand">
              <div className="home-logo-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <span>Framely</span>
            </div>
            <p className="home-footer-copy">
              Open source video creation framework.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function highlightCode(code) {
  // First escape HTML entities
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Use placeholders to protect already-highlighted sections
  const placeholders = [];
  const placeholder = (content, className) => {
    const id = `__HIGHLIGHT_${placeholders.length}__`;
    placeholders.push({ id, html: `<span class="${className}">${content}</span>` });
    return id;
  };

  // 1. Comments first - protect them with placeholders
  escaped = escaped.replace(/(\/\/.*)/g, (match) => placeholder(match, 'comment'));

  // 2. Strings - protect with placeholders
  escaped = escaped.replace(/('.*?'|".*?")/g, (match) => placeholder(match, 'string'));

  // 3. Template literals
  escaped = escaped.replace(/(`[^`]*`)/g, (match) => placeholder(match, 'string'));

  // 4. Keywords (with word boundaries)
  escaped = escaped.replace(/\b(import|export|from|const|let|var|return|function|if|else|true|false|null)\b/g, '<span class="keyword">$1</span>');

  // 5. React/Framely functions and components
  escaped = escaped.replace(/\b(AbsoluteFill|Composition|useCurrentFrame|spring|React|useState|useEffect)\b/g, '<span class="function">$1</span>');

  // 6. JSX tags
  escaped = escaped.replace(/(&lt;\/?)([\w]+)/g, '$1<span class="keyword">$2</span>');

  // 7. Numbers
  escaped = escaped.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');

  // 8. Restore placeholders
  placeholders.forEach(({ id, html }) => {
    escaped = escaped.replace(id, html);
  });

  return escaped;
}

export default HomePage;
