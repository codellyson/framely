/**
 * Text Component
 *
 * Motion-graphics-grade text with character-level animation support.
 * Automatically waits for font loading via delayRender.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { delayRender, continueRender } from './delayRender';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

/** Props accepted by the per-character `<Span>` component. */
export interface CharSpanProps {
  style?: React.CSSProperties;
  className?: string;
}

/** Metadata for a single character produced by `splitText`. */
export interface CharData {
  char: string;
  index: number;
  wordIndex: number;
  lineIndex: number;
  isWhitespace: boolean;
  isNewline: boolean;
  /** A component that renders this character inside a styleable `<span>`. */
  Span: React.ComponentType<CharSpanProps>;
}

/** Text stroke configuration. */
export interface StrokeConfig {
  color: string;
  width: number;
}

/** Text shadow configuration. */
export interface ShadowConfig {
  color: string;
  blur?: number;
  x?: number;
  y?: number;
}

/** Word boundary descriptor returned by `getWords`. */
export interface WordData {
  word: string;
  startIndex: number;
  endIndex: number;
  wordIndex: number;
}

/** Props for the `<Text>` component. */
export interface TextProps {
  /** The text to render. */
  text: string;
  /** Font size in pixels. @default 40 */
  fontSize?: number;
  /** Font family. @default 'sans-serif' */
  fontFamily?: string;
  /** Font weight. @default 400 */
  fontWeight?: number | string;
  /** Text color. @default 'white' */
  color?: string;
  /** Letter spacing in pixels. @default 0 */
  letterSpacing?: number;
  /** Line height multiplier. @default 1.2 */
  lineHeight?: number;
  /** Text alignment. @default 'left' */
  textAlign?: 'left' | 'center' | 'right';
  /** CSS text-transform value. @default 'none' */
  textTransform?: React.CSSProperties['textTransform'];
  /** CSS white-space value. @default 'pre-wrap' */
  whiteSpace?: React.CSSProperties['whiteSpace'];
  /** Text stroke configuration. */
  stroke?: StrokeConfig;
  /** Text shadow configuration. */
  shadow?: ShadowConfig;
  /** Additional container styles. */
  style?: React.CSSProperties;
  /** Container class name. */
  className?: string;
  /**
   * Render function receiving character data.
   *
   * When provided as a function the component splits the text into
   * individually styleable `<Span>` components, enabling per-character
   * animation.
   */
  children?: (chars: CharData[]) => React.ReactNode;
}

// ---------------------------------------------------------------------------
// Internal character data (without the Span component)
// ---------------------------------------------------------------------------

interface RawCharData {
  char: string;
  index: number;
  wordIndex: number;
  lineIndex: number;
  isWhitespace: boolean;
  isNewline: boolean;
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Split text into character, word, and line metadata.
 *
 * @param text - Text to split
 * @returns Array of per-character metadata objects
 */
export function splitText(text: string): RawCharData[] {
  const chars: RawCharData[] = [];
  let wordIndex = 0;
  let lineIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isNewline = char === '\n';
    const isWhitespace = /\s/.test(char);

    chars.push({
      char,
      index: i,
      wordIndex,
      lineIndex,
      isWhitespace,
      isNewline,
    });

    if (isNewline) {
      lineIndex++;
      wordIndex++;
    } else if (isWhitespace) {
      wordIndex++;
    }
  }

  return chars;
}

/**
 * Get word boundaries from split text.
 *
 * @param chars - Output of `splitText()`
 * @returns Array of word boundary descriptors
 */
export function getWords(chars: RawCharData[]): WordData[] {
  const words: WordData[] = [];
  let currentWord = '';
  let startIndex = 0;
  let currentWordIndex = -1;

  for (const c of chars) {
    if (c.isWhitespace || c.isNewline) {
      if (currentWord.length > 0) {
        words.push({
          word: currentWord,
          startIndex,
          endIndex: c.index - 1,
          wordIndex: currentWordIndex,
        });
        currentWord = '';
      }
    } else {
      if (currentWord.length === 0) {
        startIndex = c.index;
        currentWordIndex = c.wordIndex;
      }
      currentWord += c.char;
    }
  }

  if (currentWord.length > 0) {
    words.push({
      word: currentWord,
      startIndex,
      endIndex: chars[chars.length - 1].index,
      wordIndex: currentWordIndex,
    });
  }

  return words;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Generic font families that never need to be loaded. */
const GENERIC_FONTS: ReadonlySet<string> = new Set([
  'sans-serif',
  'serif',
  'monospace',
]);

/**
 * Create a character span component for per-character styling.
 */
function createCharSpan(
  charInfo: RawCharData,
  _baseStyle: React.CSSProperties,
): React.FC<CharSpanProps> {
  const CharSpan: React.FC<CharSpanProps> = ({
    style: charStyle,
    className: charClassName,
  }) => {
    if (charInfo.isNewline) {
      return <br />;
    }

    return (
      <span
        className={charClassName}
        style={{
          display: 'inline-block',
          whiteSpace: charInfo.isWhitespace ? 'pre' : undefined,
          ...charStyle,
        }}
      >
        {charInfo.char}
      </span>
    );
  };

  CharSpan.displayName = `Char(${charInfo.char === ' ' ? 'space' : charInfo.char})`;
  return CharSpan;
}

// ---------------------------------------------------------------------------
// Text component
// ---------------------------------------------------------------------------

/**
 * Text component with character-level animation.
 *
 * Renders text with each character wrapped in an individually styleable span.
 * Waits for fonts to load before rendering (via delayRender).
 *
 * @example
 * // Simple text
 * <Text text="Hello World" fontSize={80} color="white" />
 *
 * @example
 * // Character-by-character animation
 * <Text text="Animate Me" fontSize={60} fontFamily="Inter">
 *   {(chars) => chars.map((c, i) => (
 *     <c.Span key={i} style={{
 *       opacity: interpolate(frame, [i * 2, i * 2 + 10], [0, 1], { extrapolateRight: 'clamp' }),
 *     }} />
 *   ))}
 * </Text>
 */
export function Text({
  text,
  fontSize = 40,
  fontFamily = 'sans-serif',
  fontWeight = 400,
  color = 'white',
  letterSpacing = 0,
  lineHeight = 1.2,
  textAlign = 'left',
  textTransform = 'none',
  whiteSpace = 'pre-wrap',
  stroke,
  shadow,
  style,
  className,
  children,
}: TextProps): React.ReactElement {
  const delayHandle = useRef<number | null>(null);

  // Wait for font to load
  useEffect(() => {
    if (GENERIC_FONTS.has(fontFamily)) {
      return;
    }

    const handle = delayRender(`Loading font: ${fontFamily}`);
    delayHandle.current = handle;

    document.fonts.ready
      .then(() => {
        continueRender(handle);
        delayHandle.current = null;
      })
      .catch(() => {
        // Continue even if font check fails
        continueRender(handle);
        delayHandle.current = null;
      });

    return () => {
      if (delayHandle.current !== null) {
        continueRender(delayHandle.current);
        delayHandle.current = null;
      }
    };
  }, [fontFamily]);

  // Build base styles
  const baseStyle = useMemo((): React.CSSProperties => {
    const s: Record<string, unknown> = {
      fontSize,
      fontFamily,
      fontWeight,
      color,
      letterSpacing: letterSpacing !== 0 ? `${letterSpacing}px` : undefined,
      lineHeight,
      textAlign,
      textTransform,
      whiteSpace,
      margin: 0,
      padding: 0,
      ...style,
    };

    if (stroke) {
      s.WebkitTextStroke = `${stroke.width}px ${stroke.color}`;
    }

    if (shadow) {
      s.textShadow = `${shadow.x || 0}px ${shadow.y || 0}px ${shadow.blur || 0}px ${shadow.color}`;
    }

    return s as React.CSSProperties;
  }, [
    fontSize, fontFamily, fontWeight, color, letterSpacing,
    lineHeight, textAlign, textTransform, whiteSpace,
    stroke?.color, stroke?.width,
    shadow?.color, shadow?.blur, shadow?.x, shadow?.y,
    style,
  ]);

  // Split text and create character data with Span components
  const charData: CharData[] = useMemo(() => {
    const chars = splitText(text);

    return chars.map((c): CharData => ({
      ...c,
      Span: createCharSpan(c, baseStyle),
    }));
  }, [text, baseStyle]);

  // If no children function, render simple text
  if (typeof children !== 'function') {
    return (
      <div className={className} style={baseStyle}>
        {text}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        ...baseStyle,
        // Reset text properties on container — chars handle their own
        display: 'inline',
      }}
    >
      {children(charData)}
    </div>
  );
}

Text.displayName = 'Text';

export default Text;
