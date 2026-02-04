/**
 * Still Command
 *
 * Renders a single frame from a composition as an image.
 *
 * Usage:
 *   framely still my-video --frame 100 --format png
 *   framely still my-video output.jpg --frame 50 --quality 90
 */

import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { createBrowser, closeBrowser, setFrame } from '../utils/browser.js';
import { loadProps } from '../utils/props.js';
import {
  validateScale,
  validateQuality,
  validateFrontendUrl,
  validateDimension,
} from '../utils/validate.js';

/**
 * Main still command handler.
 */
export async function stillCommand(compositionId, output, options) {
  const spinner = ora();

  try {
    const frame = parseInt(options.frame, 10);
    const format = options.format || 'png';
    const quality = validateQuality(parseInt(options.quality, 10));
    const scale = validateScale(parseFloat(options.scale));
    const inputProps = loadProps(options.props, options.propsFile);
    validateFrontendUrl(options.frontendUrl, options.allowRemote);
    if (options.width) validateDimension(options.width, 'width');
    if (options.height) validateDimension(options.height, 'height');

    // Validate format
    if (!['png', 'jpeg', 'jpg'].includes(format)) {
      console.error(chalk.red(`Invalid format: ${format}`));
      console.log(chalk.gray('Available formats: png, jpeg'));
      process.exit(1);
    }

    const actualFormat = format === 'jpg' ? 'jpeg' : format;

    // ─── Determine Output Path ───
    let outputPath;
    if (output) {
      outputPath = path.resolve(output);
    } else {
      const ext = actualFormat === 'jpeg' ? 'jpg' : actualFormat;
      outputPath = path.resolve(`${compositionId}-frame${frame}.${ext}`);
    }

    // Ensure output directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // ─── Print Configuration ───
    console.log(chalk.cyan('\n📸 Framely Still\n'));
    console.log(chalk.white('  Composition:'), chalk.yellow(compositionId));
    console.log(chalk.white('  Frame:      '), chalk.yellow(frame));
    console.log(chalk.white('  Format:     '), chalk.yellow(actualFormat));
    if (actualFormat === 'jpeg') {
      console.log(chalk.white('  Quality:    '), chalk.yellow(`${quality}%`));
    }
    if (options.width || options.height) {
      console.log(chalk.white('  Resolution: '), chalk.yellow(`${options.width || 'auto'}x${options.height || 'auto'}`));
    }
    if (scale !== 1) {
      console.log(chalk.white('  Scale:      '), chalk.yellow(`${scale}x`));
    }
    if (Object.keys(inputProps).length > 0) {
      console.log(chalk.white('  Props:      '), chalk.gray(JSON.stringify(inputProps)));
    }
    console.log(chalk.white('  Output:     '), chalk.green(outputPath));
    console.log('');

    // ─── Launch Browser ───
    spinner.start('Launching browser...');
    const { browser, page } = await createBrowser({
      width: options.width ? parseInt(options.width, 10) : undefined,
      height: options.height ? parseInt(options.height, 10) : undefined,
      scale,
    });
    spinner.succeed('Browser ready');

    // ─── Load Composition ───
    spinner.start('Loading composition...');
    const renderUrl = buildRenderUrl(options.frontendUrl, compositionId, inputProps);
    await page.goto(renderUrl, { waitUntil: 'domcontentloaded' });

    // Wait for app to be ready
    await page.waitForFunction('window.__ready === true', { timeout: 30000 });

    // Get composition metadata
    const metadata = await page.evaluate(() => ({
      width: window.__compositionWidth || 1920,
      height: window.__compositionHeight || 1080,
      fps: window.__compositionFps || 30,
      durationInFrames: window.__compositionDurationInFrames || 300,
    }));

    spinner.succeed(`Composition loaded: ${metadata.width}x${metadata.height}`);

    // Validate frame number
    if (frame < 0 || frame >= metadata.durationInFrames) {
      console.error(chalk.red(`\nError: Frame ${frame} is out of range (0-${metadata.durationInFrames - 1})\n`));
      await closeBrowser(browser);
      process.exit(1);
    }

    // ─── Capture Frame ───
    spinner.start(`Capturing frame ${frame}...`);

    // Set the frame (handles delayRender automatically)
    await setFrame(page, frame);

    // Capture the frame
    const element = page.locator('#render-container');

    const screenshotOptions = {
      type: actualFormat,
      path: outputPath,
    };

    if (actualFormat === 'jpeg') {
      screenshotOptions.quality = quality;
    }

    await element.screenshot(screenshotOptions);

    spinner.succeed('Frame captured');

    // ─── Report Success ───
    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(1);

    console.log(`\n${chalk.green('✓')} Still saved (${sizeKB} KB)`);
    console.log(chalk.gray(`  Output: ${outputPath}\n`));

    // ─── Cleanup ───
    await closeBrowser(browser);
    process.exit(0);
  } catch (error) {
    spinner.fail('Capture failed');
    console.error(chalk.red(`\nError: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Build render URL with props.
 */
function buildRenderUrl(baseUrl, compositionId, props) {
  const url = new URL(baseUrl);
  url.searchParams.set('renderMode', 'true');
  url.searchParams.set('composition', compositionId);
  if (Object.keys(props).length > 0) {
    url.searchParams.set('props', encodeURIComponent(JSON.stringify(props)));
  }
  return url.toString();
}
