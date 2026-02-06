/**
 * Compositions Command
 *
 * Lists all available compositions from the Framely project.
 *
 * Usage:
 *   framely compositions
 *   framely compositions --json
 */

import chalk from 'chalk';
import ora from 'ora';
import { createBrowser, closeBrowser } from '../utils/browser.js';

/**
 * Main compositions command handler.
 */
export async function compositionsCommand(options) {
  const spinner = ora();

  try {
    if (!options.json) {
      console.log(chalk.cyan('\n📋 Framely Compositions\n'));
    }

    // ─── Launch Browser to Fetch Compositions ───
    spinner.start('Fetching compositions...');

    const { browser, page } = await createBrowser({
      width: 100,
      height: 100,
    });

    // Navigate to frontend
    await page.goto(options.frontendUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for app to be ready
    try {
      await page.waitForFunction('window.__ready === true || window.__FRAMELY_COMPOSITIONS', {
        timeout: 10000,
      });
    } catch (e) {
      // May not have ready flag in some setups
    }

    // Get compositions from global
    const compositions = await page.evaluate(() => {
      // Try different possible locations
      if (window.__FRAMELY_COMPOSITIONS) {
        return Object.values(window.__FRAMELY_COMPOSITIONS);
      }

      // Try to extract from registry
      if (window.__FRAMELY_ROOT) {
        // This would require traversing the component tree
        return [];
      }

      return [];
    });

    spinner.stop();

    // If no compositions found, try the API endpoint
    if (compositions.length === 0) {
      try {
        const parsed = new URL(options.frontendUrl);
        parsed.port = String(parseInt(parsed.port || '3000', 10) + 1);
        const response = await fetch(`${parsed.origin}/api/compositions`);
        if (response.ok) {
          const data = await response.json();
          compositions.push(...(data.compositions || []));
        }
      } catch (e) {
        // API might not be running
      }
    }

    // ─── Output Results ───
    if (options.json) {
      console.log(JSON.stringify(compositions, null, 2));
    } else if (compositions.length === 0) {
      console.log(chalk.yellow('  No compositions found.\n'));
      console.log(chalk.gray('  Make sure the frontend is running and has registered compositions.'));
      console.log(chalk.gray('  Use registerRoot() in your entry file to register compositions.\n'));
    } else {
      // Calculate column widths
      const maxIdLength = Math.max(...compositions.map((c) => (c.id && c.id.length) || 0), 2);

      // Header
      console.log(
        chalk.gray('  ') +
          chalk.white('ID'.padEnd(maxIdLength + 2)) +
          chalk.white('Resolution'.padEnd(14)) +
          chalk.white('FPS'.padEnd(6)) +
          chalk.white('Duration')
      );
      console.log(chalk.gray('  ' + '─'.repeat(maxIdLength + 40)));

      // Rows
      for (const comp of compositions) {
        const id = (comp.id || 'unknown').padEnd(maxIdLength + 2);
        const resolution = `${comp.width || '?'}x${comp.height || '?'}`.padEnd(14);
        const fps = String(comp.fps || '?').padEnd(6);
        const frames = comp.durationInFrames || '?';
        const seconds = comp.fps ? (frames / comp.fps).toFixed(1) + 's' : '?';
        const duration = `${frames} frames (${seconds})`;

        console.log(
          chalk.gray('  ') +
            chalk.yellow(id) +
            chalk.white(resolution) +
            chalk.white(fps) +
            chalk.gray(duration)
        );
      }

      console.log(chalk.gray('\n  ' + '─'.repeat(maxIdLength + 40)));
      console.log(chalk.gray(`  ${compositions.length} composition(s) found\n`));
    }

    await closeBrowser(browser);
    process.exit(0);
  } catch (error) {
    spinner.fail('Failed to fetch compositions');
    console.error(chalk.red(`\nError: ${error.message}\n`));

    if (!options.json) {
      console.log(chalk.gray('  Make sure the frontend dev server is running:'));
      console.log(chalk.cyan('    framely preview\n'));
    }

    process.exit(1);
  }
}
