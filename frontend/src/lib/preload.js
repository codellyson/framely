/**
 * Asset Preloading Utilities
 *
 * These functions help ensure assets are loaded before they're needed,
 * preventing flickering or missing content in rendered frames.
 *
 * For rendering, assets are typically loaded via the Img/Video/Audio
 * components which use delayRender. These preload functions are useful
 * for the Player/preview mode to ensure smooth playback.
 */

/**
 * Preload an image and return a promise that resolves when loaded.
 *
 * @param {string} src - Image URL
 * @param {number} [timeoutMs=30000] - Timeout in milliseconds
 * @returns {Promise<HTMLImageElement>} Resolves with the loaded image
 *
 * Usage:
 *   await preloadImage('/images/hero.png');
 *   // Image is now cached and will display immediately
 */
export function preloadImage(src, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    const timeoutId = setTimeout(() => {
      reject(new Error(`Image preload timed out: ${src}`));
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to preload image: ${src}`));
    };

    img.src = src;
  });
}

/**
 * Preload a video and return a promise that resolves when loadable.
 *
 * Note: This doesn't fully load the video, just enough metadata to start playing.
 *
 * @param {string} src - Video URL
 * @param {number} [timeoutMs=30000] - Timeout in milliseconds
 * @returns {Promise<HTMLVideoElement>} Resolves with the video element
 *
 * Usage:
 *   await preloadVideo('/videos/intro.mp4');
 */
export function preloadVideo(src, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';

    const timeoutId = setTimeout(() => {
      reject(new Error(`Video preload timed out: ${src}`));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timeoutId);
      video.removeEventListener('canplaythrough', onCanPlay);
      video.removeEventListener('error', onError);
    };

    const onCanPlay = () => {
      cleanup();
      resolve(video);
    };

    const onError = () => {
      cleanup();
      reject(new Error(`Failed to preload video: ${src}`));
    };

    video.addEventListener('canplaythrough', onCanPlay);
    video.addEventListener('error', onError);

    video.src = src;
    video.load();
  });
}

/**
 * Preload an audio file and return a promise that resolves when loadable.
 *
 * @param {string} src - Audio URL
 * @param {number} [timeoutMs=30000] - Timeout in milliseconds
 * @returns {Promise<HTMLAudioElement>} Resolves with the audio element
 *
 * Usage:
 *   await preloadAudio('/audio/background.mp3');
 */
export function preloadAudio(src, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'auto';

    const timeoutId = setTimeout(() => {
      reject(new Error(`Audio preload timed out: ${src}`));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timeoutId);
      audio.removeEventListener('canplaythrough', onCanPlay);
      audio.removeEventListener('error', onError);
    };

    const onCanPlay = () => {
      cleanup();
      resolve(audio);
    };

    const onError = () => {
      cleanup();
      reject(new Error(`Failed to preload audio: ${src}`));
    };

    audio.addEventListener('canplaythrough', onCanPlay);
    audio.addEventListener('error', onError);

    audio.src = src;
    audio.load();
  });
}

/**
 * Preload a font and return a promise that resolves when loaded.
 *
 * @param {string} src - Font URL
 * @param {string} fontFamily - Font family name to register
 * @param {object} [options] - FontFace options (weight, style, etc.)
 * @param {number} [timeoutMs=30000] - Timeout in milliseconds
 * @returns {Promise<FontFace>} Resolves with the loaded FontFace
 *
 * Usage:
 *   await preloadFont('/fonts/custom.woff2', 'CustomFont', { weight: '400' });
 *   // Now you can use font-family: 'CustomFont' in CSS
 */
export function preloadFont(src, fontFamily, options = {}, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Font preload timed out: ${src}`));
    }, timeoutMs);

    const fontFace = new FontFace(fontFamily, `url(${src})`, options);

    fontFace.load()
      .then((loadedFace) => {
        clearTimeout(timeoutId);
        document.fonts.add(loadedFace);
        resolve(loadedFace);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to preload font: ${src} - ${err.message}`));
      });
  });
}

/**
 * Generic prefetch function that uses link[rel=prefetch].
 *
 * This tells the browser to fetch the resource in the background
 * during idle time. Good for assets that will be needed soon but
 * not immediately.
 *
 * @param {string} src - Resource URL
 * @param {string} [as] - Resource type (image, video, audio, font, script, style)
 * @returns {HTMLLinkElement} The created link element
 *
 * Usage:
 *   prefetch('/images/next-slide.png', 'image');
 */
export function prefetch(src, as) {
  // Check if already prefetched
  const existing = document.querySelector(`link[rel="prefetch"][href="${src}"]`);
  if (existing) return existing;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = src;
  if (as) link.as = as;

  document.head.appendChild(link);
  return link;
}

/**
 * Preload multiple assets in parallel.
 *
 * @param {Array<{ type: 'image'|'video'|'audio'|'font', src: string, options?: object }>} assets
 * @param {number} [timeoutMs=30000] - Timeout for each asset
 * @returns {Promise<Array>} Resolves when all assets are loaded
 *
 * Usage:
 *   await preloadAll([
 *     { type: 'image', src: '/images/hero.png' },
 *     { type: 'video', src: '/videos/intro.mp4' },
 *     { type: 'font', src: '/fonts/custom.woff2', options: { fontFamily: 'Custom' } },
 *   ]);
 */
export function preloadAll(assets, timeoutMs = 30000) {
  const promises = assets.map((asset) => {
    switch (asset.type) {
      case 'image':
        return preloadImage(asset.src, timeoutMs);
      case 'video':
        return preloadVideo(asset.src, timeoutMs);
      case 'audio':
        return preloadAudio(asset.src, timeoutMs);
      case 'font':
        return preloadFont(
          asset.src,
          asset.options?.fontFamily || 'PreloadedFont',
          asset.options,
          timeoutMs
        );
      default:
        return Promise.reject(new Error(`Unknown asset type: ${asset.type}`));
    }
  });

  return Promise.all(promises);
}

/**
 * Resolve a callback when the asset at the given URL is loaded.
 * Alternative API for those who prefer callbacks over promises.
 *
 * @param {string} src - Asset URL
 * @param {function} onLoad - Called when loaded
 * @param {function} [onError] - Called on error
 */
export function resolveWhenLoaded(src, onLoad, onError) {
  const img = new Image();
  img.onload = () => onLoad(img);
  img.onerror = (err) => onError?.(new Error(`Failed to load: ${src}`));
  img.src = src;
}

export default {
  preloadImage,
  preloadVideo,
  preloadAudio,
  preloadFont,
  prefetch,
  preloadAll,
  resolveWhenLoaded,
};
