import { useState, useEffect } from 'react';
import './DocsPage.css';

const docsSections = [
  {
    title: 'Getting Started',
    items: [
      { id: 'introduction', title: 'Introduction' },
      { id: 'installation', title: 'Installation' },
      { id: 'quick-start', title: 'Quick Start' },
      { id: 'project-structure', title: 'Project Structure' },
    ],
  },
  {
    title: 'Core Concepts',
    items: [
      { id: 'compositions', title: 'Compositions' },
      { id: 'timeline', title: 'Timeline & Frames' },
      { id: 'animations', title: 'Animations' },
      { id: 'sequences', title: 'Sequences' },
    ],
  },
  {
    title: 'Components',
    items: [
      { id: 'absolute-fill', title: 'AbsoluteFill' },
      { id: 'sequence', title: 'Sequence' },
      { id: 'series', title: 'Series' },
      { id: 'loop', title: 'Loop' },
      { id: 'img', title: 'Img' },
      { id: 'video', title: 'Video' },
      { id: 'audio', title: 'Audio' },
    ],
  },
  {
    title: 'Hooks',
    items: [
      { id: 'use-current-frame', title: 'useCurrentFrame' },
      { id: 'use-video-config', title: 'useVideoConfig' },
    ],
  },
  {
    title: 'Animation',
    items: [
      { id: 'interpolate', title: 'interpolate()' },
      { id: 'spring', title: 'spring()' },
      { id: 'easing', title: 'Easing Functions' },
    ],
  },
  {
    title: 'Rendering',
    items: [
      { id: 'render-video', title: 'Rendering Video' },
      { id: 'render-still', title: 'Rendering Stills' },
      { id: 'codecs', title: 'Codecs & Formats' },
    ],
  },
  {
    title: 'CLI',
    items: [
      { id: 'cli-init', title: 'framely init' },
      { id: 'cli-preview', title: 'framely preview' },
      { id: 'cli-render', title: 'framely render' },
    ],
  },
];

const docsContent = {
  introduction: {
    title: 'Introduction',
    content: `
# Introduction

Framely is a programmatic video creation framework built on React. It allows you to create videos using familiar React patterns - components, hooks, and props.

## Why Framely?

- **Code-First**: Define videos as code, not timelines
- **React-Based**: Use components you already know
- **Deterministic**: Every render produces identical output
- **Type-Safe**: Full TypeScript support

## How It Works

In Framely, a video is a React component that receives the current frame number. You use this frame number to animate your content.

\`\`\`jsx
function MyVideo() {
  const frame = useCurrentFrame();
  const opacity = frame / 30; // Fade in over 1 second at 30fps

  return (
    <div style={{ opacity }}>
      Hello, World!
    </div>
  );
}
\`\`\`

The renderer captures each frame as an image and stitches them together into a video using FFmpeg.
    `,
  },
  installation: {
    title: 'Installation',
    content: `
# Installation

## Quick Start

The fastest way to get started is using the CLI:

\`\`\`bash
npx framely init my-video
cd my-video
npm run dev
\`\`\`

This creates a new project with a sample composition.

## Manual Installation

If you prefer to set up manually:

\`\`\`bash
npm install framely
\`\`\`

Then create a root file that registers your compositions:

\`\`\`jsx
// src/Root.jsx
import { Composition } from 'framely';
import { MyVideo } from './MyVideo';

export const Root = () => (
  <Composition
    id="my-video"
    component={MyVideo}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={150}
  />
);
\`\`\`

## Requirements

- Node.js 18 or higher
- FFmpeg (for rendering)
    `,
  },
  'quick-start': {
    title: 'Quick Start',
    content: `
# Quick Start

Let's create your first video in 5 minutes.

## 1. Create a Project

\`\`\`bash
npx framely init my-first-video
cd my-first-video
\`\`\`

## 2. Start the Preview Server

\`\`\`bash
npm run dev
\`\`\`

Open http://localhost:3000 to see the studio.

## 3. Edit Your Composition

Open \`src/compositions/SampleVideo.jsx\`:

\`\`\`jsx
import { AbsoluteFill, useCurrentFrame, spring } from 'framely';

export function SampleVideo() {
  const frame = useCurrentFrame();
  const scale = spring({ frame, fps: 30, from: 0, to: 1 });

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <h1 style={{
        fontSize: 80,
        color: 'white',
        transform: \`scale(\${scale})\`
      }}>
        Hello, Framely!
      </h1>
    </AbsoluteFill>
  );
}
\`\`\`

## 4. Render Your Video

Click the "Render" button in the studio, or use the CLI:

\`\`\`bash
npx framely render my-video --output video.mp4
\`\`\`
    `,
  },
  compositions: {
    title: 'Compositions',
    content: `
# Compositions

A composition is the top-level container for a video. It defines the video's dimensions, frame rate, and duration.

## Defining a Composition

\`\`\`jsx
import { Composition } from 'framely';
import { MyVideo } from './MyVideo';

export const Root = () => (
  <Composition
    id="my-video"
    component={MyVideo}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={150}
  />
);
\`\`\`

## Props

| Prop | Type | Description |
|------|------|-------------|
| \`id\` | string | Unique identifier for the composition |
| \`component\` | React.FC | The component to render |
| \`width\` | number | Video width in pixels |
| \`height\` | number | Video height in pixels |
| \`fps\` | number | Frames per second |
| \`durationInFrames\` | number | Total number of frames |
| \`defaultProps\` | object | Default props passed to the component |

## Multiple Compositions

You can define multiple compositions in a single project:

\`\`\`jsx
export const Root = () => (
  <>
    <Composition id="intro" component={Intro} ... />
    <Composition id="main" component={Main} ... />
    <Composition id="outro" component={Outro} ... />
  </>
);
\`\`\`
    `,
  },
  'use-current-frame': {
    title: 'useCurrentFrame',
    content: `
# useCurrentFrame

Returns the current frame number. This is the primary hook for creating animations.

## Usage

\`\`\`jsx
import { useCurrentFrame } from 'framely';

function MyComponent() {
  const frame = useCurrentFrame();

  return <div>Frame: {frame}</div>;
}
\`\`\`

## Return Value

- **Type**: \`number\`
- **Range**: \`0\` to \`durationInFrames - 1\`

## Example: Fade In

\`\`\`jsx
function FadeIn({ children }) {
  const frame = useCurrentFrame();
  const opacity = Math.min(1, frame / 30); // Fade in over 30 frames

  return (
    <div style={{ opacity }}>
      {children}
    </div>
  );
}
\`\`\`

## Example: Move Across Screen

\`\`\`jsx
function MovingBox() {
  const frame = useCurrentFrame();
  const x = frame * 10; // Move 10px per frame

  return (
    <div style={{
      transform: \`translateX(\${x}px)\`,
      width: 100,
      height: 100,
      background: 'red',
    }} />
  );
}
\`\`\`
    `,
  },
  interpolate: {
    title: 'interpolate()',
    content: `
# interpolate()

Maps a value from one range to another. Essential for creating smooth animations.

## Syntax

\`\`\`ts
interpolate(
  value: number,
  inputRange: [number, number],
  outputRange: [number, number],
  options?: InterpolateOptions
): number
\`\`\`

## Basic Usage

\`\`\`jsx
import { useCurrentFrame, interpolate } from 'framely';

function MyComponent() {
  const frame = useCurrentFrame();

  // Map frames 0-30 to opacity 0-1
  const opacity = interpolate(frame, [0, 30], [0, 1]);

  // Map frames 0-60 to x position 0-500
  const x = interpolate(frame, [0, 60], [0, 500]);

  return (
    <div style={{
      opacity,
      transform: \`translateX(\${x}px)\`
    }}>
      Hello
    </div>
  );
}
\`\`\`

## Clamping

By default, values outside the input range are extrapolated. Use \`extrapolateLeft\` and \`extrapolateRight\` to clamp:

\`\`\`jsx
const opacity = interpolate(
  frame,
  [0, 30],
  [0, 1],
  { extrapolateRight: 'clamp' }
);
// opacity stays at 1 after frame 30
\`\`\`

## Easing

Apply an easing function:

\`\`\`jsx
import { Easing } from 'framely';

const scale = interpolate(
  frame,
  [0, 30],
  [0, 1],
  { easing: Easing.bezier(0.25, 0.1, 0.25, 1) }
);
\`\`\`
    `,
  },
  spring: {
    title: 'spring()',
    content: `
# spring()

Creates physics-based spring animations that feel natural.

## Syntax

\`\`\`ts
spring({
  frame: number,
  fps: number,
  from?: number,
  to?: number,
  config?: SpringConfig,
}): number
\`\`\`

## Basic Usage

\`\`\`jsx
import { useCurrentFrame, spring } from 'framely';

function MyComponent() {
  const frame = useCurrentFrame();

  const scale = spring({
    frame,
    fps: 30,
    from: 0,
    to: 1,
  });

  return (
    <div style={{ transform: \`scale(\${scale})\` }}>
      Bouncy!
    </div>
  );
}
\`\`\`

## Spring Config

Customize the spring physics:

\`\`\`jsx
const scale = spring({
  frame,
  fps: 30,
  from: 0,
  to: 1,
  config: {
    damping: 10,      // How quickly it settles (default: 10)
    mass: 1,          // Weight of the object (default: 1)
    stiffness: 100,   // Spring tension (default: 100)
  },
});
\`\`\`

## Presets

Use built-in presets:

\`\`\`jsx
import { spring, springPresets } from 'framely';

// Gentle spring
spring({ frame, fps: 30, config: springPresets.gentle });

// Wobbly spring
spring({ frame, fps: 30, config: springPresets.wobbly });

// Stiff spring
spring({ frame, fps: 30, config: springPresets.stiff });
\`\`\`
    `,
  },
  'absolute-fill': {
    title: 'AbsoluteFill',
    content: `
# AbsoluteFill

A component that fills its parent completely. The most common layout component in Framely.

## Usage

\`\`\`jsx
import { AbsoluteFill } from 'framely';

function MyVideo() {
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <h1>Hello</h1>
    </AbsoluteFill>
  );
}
\`\`\`

## Layering

Stack multiple AbsoluteFills to create layers:

\`\`\`jsx
function MyVideo() {
  return (
    <AbsoluteFill>
      {/* Background layer */}
      <AbsoluteFill style={{ background: 'blue' }} />

      {/* Content layer */}
      <AbsoluteFill style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <h1>Hello</h1>
      </AbsoluteFill>

      {/* Overlay layer */}
      <AbsoluteFill style={{
        background: 'rgba(0,0,0,0.3)'
      }} />
    </AbsoluteFill>
  );
}
\`\`\`

## Props

Accepts all standard div props plus:

| Prop | Type | Description |
|------|------|-------------|
| \`style\` | CSSProperties | Additional styles |
| \`className\` | string | CSS class name |
    `,
  },
  sequence: {
    title: 'Sequence',
    content: `
# Sequence

Offsets the time for its children. Use it to delay when content appears.

## Usage

\`\`\`jsx
import { Sequence, AbsoluteFill } from 'framely';

function MyVideo() {
  return (
    <AbsoluteFill>
      {/* Appears immediately */}
      <Sequence from={0} durationInFrames={30}>
        <Title>First</Title>
      </Sequence>

      {/* Appears at frame 30 */}
      <Sequence from={30} durationInFrames={30}>
        <Title>Second</Title>
      </Sequence>

      {/* Appears at frame 60 */}
      <Sequence from={60}>
        <Title>Third</Title>
      </Sequence>
    </AbsoluteFill>
  );
}
\`\`\`

## Props

| Prop | Type | Description |
|------|------|-------------|
| \`from\` | number | Frame to start at |
| \`durationInFrames\` | number | How long to show (optional) |
| \`name\` | string | Label in timeline (optional) |

## Time Offset

Children of Sequence see time starting from 0:

\`\`\`jsx
<Sequence from={60}>
  {/* useCurrentFrame() returns 0 at global frame 60 */}
  <FadeIn />
</Sequence>
\`\`\`
    `,
  },
  'render-video': {
    title: 'Rendering Video',
    content: `
# Rendering Video

Export your composition as a video file.

## Using the Studio

1. Select a composition in the sidebar
2. Click the "Render" button
3. Choose your output settings
4. Click "Start Render"

## Using the CLI

\`\`\`bash
npx framely render <composition-id> [options]
\`\`\`

### Options

| Option | Description | Default |
|--------|-------------|---------|
| \`--output\` | Output file path | output.mp4 |
| \`--codec\` | Video codec (h264, h265, vp8, vp9) | h264 |
| \`--crf\` | Quality (0-51, lower is better) | 18 |
| \`--start-frame\` | First frame to render | 0 |
| \`--end-frame\` | Last frame to render | durationInFrames - 1 |

### Examples

\`\`\`bash
# Render with default settings
npx framely render my-video

# High quality H.265
npx framely render my-video --codec h265 --crf 15 --output hq.mp4

# WebM format
npx framely render my-video --codec vp9 --output video.webm

# Render only frames 0-60
npx framely render my-video --start-frame 0 --end-frame 60
\`\`\`

## Programmatic Rendering

\`\`\`js
import { renderMedia } from 'framely/renderer';

await renderMedia({
  compositionId: 'my-video',
  outputLocation: 'out.mp4',
  codec: 'h264',
  crf: 18,
});
\`\`\`
    `,
  },
};

// Generate content for sections that don't have specific content
Object.values(docsSections).forEach(section => {
  section.items.forEach(item => {
    if (!docsContent[item.id]) {
      docsContent[item.id] = {
        title: item.title,
        content: `
# ${item.title}

Documentation for ${item.title} is coming soon.

Check back later or contribute to the docs on GitHub!
        `,
      };
    }
  });
});

export function DocsPage({ onNavigate }) {
  const [activeSection, setActiveSection] = useState('introduction');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentContent = docsContent[activeSection] || docsContent.introduction;

  return (
    <div className="docs-page">
      {/* Header */}
      <header className="docs-header glass">
        <div className="docs-header-content">
          <div className="docs-header-left">
            <button
              className="docs-menu-btn show-mobile"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>

            <div className="docs-logo" onClick={() => onNavigate?.('home')}>
              <span className="docs-logo-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </span>
              <span className="docs-logo-text">Framely</span>
            </div>

            <span className="docs-header-divider hide-mobile">/</span>
            <span className="docs-header-section hide-mobile">Documentation</span>
          </div>

          <div className="docs-header-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate?.('studio')}>
              Open Studio
            </button>
            <a
              href="https://github.com/framely/framely"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm hide-mobile"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <div className="docs-layout">
        {/* Sidebar */}
        <aside className={`docs-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="docs-sidebar-content">
            {docsSections.map((section) => (
              <div key={section.title} className="docs-nav-section">
                <h3 className="docs-nav-title">{section.title}</h3>
                <ul className="docs-nav-list">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <button
                        className={`docs-nav-link ${activeSection === item.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveSection(item.id);
                          setSidebarOpen(false);
                        }}
                      >
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div
            className="docs-sidebar-overlay show-mobile"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="docs-main">
          <article className="docs-content">
            <div
              className="docs-markdown"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(currentContent.content) }}
            />
          </article>

          {/* Navigation */}
          <nav className="docs-nav-footer">
            {getPrevNext(activeSection).prev && (
              <button
                className="docs-nav-prev"
                onClick={() => setActiveSection(getPrevNext(activeSection).prev.id)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <div>
                  <span className="docs-nav-label">Previous</span>
                  <span className="docs-nav-title">{getPrevNext(activeSection).prev.title}</span>
                </div>
              </button>
            )}
            {getPrevNext(activeSection).next && (
              <button
                className="docs-nav-next"
                onClick={() => setActiveSection(getPrevNext(activeSection).next.id)}
              >
                <div>
                  <span className="docs-nav-label">Next</span>
                  <span className="docs-nav-title">{getPrevNext(activeSection).next.title}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </nav>
        </main>
      </div>
    </div>
  );
}

function getPrevNext(currentId) {
  const allItems = docsSections.flatMap(s => s.items);
  const currentIndex = allItems.findIndex(item => item.id === currentId);

  return {
    prev: currentIndex > 0 ? allItems[currentIndex - 1] : null,
    next: currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null,
  };
}

function renderMarkdown(content) {
  return content
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      const highlighted = highlightCode(code.trim(), lang);
      return `<div class="docs-code-block"><pre><code>${highlighted}</code></pre></div>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="docs-inline-code">$1</code>')
    // Tables
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      if (cells.every(c => /^-+$/.test(c.trim()))) {
        return ''; // Skip separator row
      }
      const isHeader = match.includes('---');
      const tag = 'td';
      return `<tr>${cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('')}</tr>`;
    })
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Paragraphs (simple)
    .split('\n\n')
    .map(p => {
      if (p.startsWith('<h') || p.startsWith('<div') || p.startsWith('<tr')) {
        return p;
      }
      if (p.trim()) {
        return `<p>${p}</p>`;
      }
      return '';
    })
    .join('\n');
}

function highlightCode(code, lang) {
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
  escaped = escaped.replace(/\b(import|export|from|const|let|var|return|function|if|else|async|await|true|false|null|new)\b/g, '<span class="keyword">$1</span>');

  // 5. React/Framely functions and components
  escaped = escaped.replace(/\b(AbsoluteFill|Composition|Sequence|Series|Loop|Img|Video|Audio|useCurrentFrame|useVideoConfig|interpolate|spring|Easing|React|useState|useEffect)\b/g, '<span class="function">$1</span>');

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

export default DocsPage;
