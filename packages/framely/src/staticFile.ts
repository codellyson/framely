/**
 * Returns the URL for a static file in the public directory.
 *
 * In Vite, files in the `public/` folder are served at the root URL.
 * This function ensures consistent path resolution across dev and production.
 *
 * @param {string} path - Relative path from the public folder (e.g., 'images/logo.png')
 * @returns {string} The full URL to the asset
 *
 * Usage:
 *   <Img src={staticFile('images/hero.png')} />
 *   <Video src={staticFile('videos/intro.mp4')} />
 *   <Audio src={staticFile('audio/background.mp3')} />
 *
 * Directory structure:
 *   public/
 *     images/
 *       hero.png      → staticFile('images/hero.png')
 *     videos/
 *       intro.mp4     → staticFile('videos/intro.mp4')
 *     fonts/
 *       custom.woff2  → staticFile('fonts/custom.woff2')
 */
export function staticFile(path: string): string {
  if (!path) {
    throw new Error('staticFile() requires a path argument');
  }

  // Remove leading slash if present (normalize input)
  const normalizedPath: string = path.startsWith('/') ? path.slice(1) : path;

  // In Vite, public files are served from the root
  // The base URL can be configured in vite.config.js
  const base: string = (import.meta as any).env?.BASE_URL || '/';

  // Construct the full URL
  const url: string = `${base}${normalizedPath}`;

  return url;
}

/**
 * Check if a URL is a static file path (from public folder).
 *
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isStaticFile(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  // Check if it's a relative path (not http/https/data/blob)
  return !url.match(/^(https?|data|blob):/i);
}

/**
 * Get the file extension from a path.
 *
 * @param {string} path - File path
 * @returns {string} Lowercase extension without dot, or empty string
 */
export function getFileExtension(path: string): string {
  if (!path || typeof path !== 'string') return '';
  const match: RegExpMatchArray | null = path.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Determine the MIME type from a file path.
 *
 * @param {string} path - File path
 * @returns {string|null} MIME type or null if unknown
 */
export function getMimeType(path: string): string | null {
  const ext: string = getFileExtension(path);

  const mimeTypes: Record<string, string> = {
    // Images
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
    avif: 'image/avif',

    // Video
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',

    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    aac: 'audio/aac',
    flac: 'audio/flac',
    m4a: 'audio/mp4',

    // Fonts
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
    eot: 'application/vnd.ms-fontobject',

    // Documents
    pdf: 'application/pdf',
    json: 'application/json',
  };

  return mimeTypes[ext] || null;
}

export default staticFile;
