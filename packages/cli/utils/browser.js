/**
 * Browser Utilities
 *
 * Manages headless browser instances for rendering.
 */

import { chromium } from 'playwright';

/**
 * Default browser launch arguments for rendering.
 *
 * Security-related flags:
 * - `--no-sandbox` / `--disable-setuid-sandbox`: Required in Docker/CI environments
 *   where Chrome's sandbox cannot be set up. The browser is only loading trusted
 *   local content (localhost), so the sandbox provides minimal additional protection.
 * - `--disable-web-security`: Allows the renderer to load cross-origin resources
 *   (fonts, images, video) without CORS restrictions. Necessary because compositions
 *   may reference assets from CDNs or local file:// paths during rendering.
 * - `--disable-features=IsolateOrigins` / `--disable-site-isolation-trials`:
 *   Reduces memory overhead by not isolating each origin into its own process.
 *   Only one origin (localhost) is loaded during rendering.
 *
 * Performance-related flags:
 * - `--disable-gpu`: Headless rendering doesn't benefit from GPU compositing
 *   and GPU initialization can cause issues in server environments.
 * - `--disable-dev-shm-usage`: Uses /tmp instead of /dev/shm which may be too
 *   small in Docker containers, preventing crashes on large pages.
 * - `--disable-background-timer-throttling` / `--disable-backgrounding-occluded-windows`
 *   / `--disable-renderer-backgrounding`: Prevents Chrome from throttling timers
 *   and rendering in background tabs, ensuring consistent frame timing.
 * - `--disable-ipc-flooding-protection`: Allows rapid frame updates without
 *   Chrome's IPC rate limiting interfering with the capture loop.
 * - `--autoplay-policy=no-user-gesture-required`: Allows audio/video elements
 *   to play automatically for compositions that include media.
 */
const DEFAULT_ARGS = [
  '--disable-web-security',
  '--disable-features=IsolateOrigins',
  '--disable-site-isolation-trials',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--disable-ipc-flooding-protection',
  '--autoplay-policy=no-user-gesture-required',
];

/**
 * Create a new browser instance configured for rendering.
 *
 * @param {object} options
 * @param {number} [options.width=1920] - Viewport width
 * @param {number} [options.height=1080] - Viewport height
 * @param {number} [options.scale=1] - Device scale factor
 * @param {string} [options.executablePath] - Custom browser executable
 * @param {boolean} [options.headless=true] - Run in headless mode
 * @returns {Promise<{ browser: Browser, page: Page }>}
 */
export async function createBrowser({
  width = 1920,
  height = 1080,
  scale = 1,
  executablePath,
  headless = true,
} = {}) {
  const launchOptions = {
    args: DEFAULT_ARGS,
    headless,
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  const browser = await chromium.launch(launchOptions);

  const context = await browser.newContext({
    viewport: {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
    },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  return { browser, page };
}

/**
 * Close a browser instance.
 *
 * @param {Browser} browser
 */
export async function closeBrowser(browser) {
  if (browser) {
    try {
      await browser.close();
    } catch (e) {
      // Ignore close errors
    }
  }
}

/**
 * Create multiple browser instances for parallel rendering.
 *
 * @param {number} count - Number of browser instances
 * @param {object} options - Browser options (same as createBrowser)
 * @returns {Promise<Array<{ browser: Browser, page: Page }>>}
 */
export async function createBrowserPool(count, options = {}) {
  const browsers = await Promise.all(
    Array.from({ length: count }, () => createBrowser(options))
  );
  return browsers;
}

/**
 * Close all browsers in a pool.
 *
 * @param {Array<{ browser: Browser }>} pool
 */
export async function closeBrowserPool(pool) {
  await Promise.all(pool.map(({ browser }) => closeBrowser(browser)));
}

/**
 * Wait for all pending delay renders to complete.
 *
 * @param {Page} page - Playwright page
 * @param {number} timeout - Timeout in milliseconds
 */
export async function waitForDelayRenders(page, timeout = 30000) {
  await page.waitForFunction(
    () => {
      const dr = window.__FRAMELY_DELAY_RENDER;
      return !dr || dr.pendingCount === 0;
    },
    { timeout }
  );
}

/** Default timeout for waiting on delayRender and page readiness (ms). */
export const DEFAULT_TIMEOUT = 30000;

/**
 * Set the current frame and wait for render to complete.
 *
 * @param {Page} page - Playwright page
 * @param {number} frame - Frame number to render
 * @param {number} [timeout=30000] - Timeout in ms for delayRender
 */
export async function setFrame(page, frame, timeout = DEFAULT_TIMEOUT) {
  // Set frame and check delayRender in a single evaluate round-trip
  const hasDelayRender = await page.evaluate((f) => {
    window.__setFrame(f);
    const dr = window.__FRAMELY_DELAY_RENDER;
    return dr && dr.pendingCount > 0;
  }, frame);

  // Only wait for delayRender if something is actually pending
  if (hasDelayRender) {
    try {
      await page.waitForFunction(
        () => {
          const dr = window.__FRAMELY_DELAY_RENDER;
          return !dr || dr.pendingCount === 0;
        },
        { timeout }
      );
    } catch (e) {
      // Continue even if delayRender check fails
    }
  }
}

export default {
  createBrowser,
  closeBrowser,
  createBrowserPool,
  closeBrowserPool,
  waitForDelayRenders,
  setFrame,
};
