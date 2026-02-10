#!/usr/bin/env node

// Check Node.js version before importing anything
var nodeVersion = process.versions.node.split('.').map(Number);
if (nodeVersion[0] < 18) {
  console.error('Error: Framely CLI requires Node.js 18 or later.');
  console.error('Current version: ' + process.version);
  console.error('Please upgrade Node.js: https://nodejs.org/');
  process.exit(1);
}

/**
 * Framely CLI
 *
 * Commands:
 *   framely render <composition-id> [output] - Render a composition to video
 *   framely still <composition-id> [output]  - Render a single frame as image
 *   framely preview                          - Start the preview server
 *   framely compositions                     - List available compositions
 *   framely templates list                   - List available templates
 *   framely templates install <package>      - Install a template package
 *   framely templates remove <package>       - Remove a template package
 */

import { program } from 'commander';
import { renderCommand } from './commands/render.js';
import { stillCommand } from './commands/still.js';
import { previewCommand } from './commands/preview.js';
import { compositionsCommand } from './commands/compositions.js';
import { templatesListCommand, templatesInstallCommand, templatesRemoveCommand } from './commands/templates.js';

program
  .name('framely')
  .description('Framely CLI - Programmatic video creation')
  .version('0.1.0');

// ─── Render Command ───────────────────────────────────────────────────────────
program
  .command('render <composition-id>')
  .description('Render a composition to video')
  .argument('[output]', 'Output file path')
  .option('--codec <codec>', 'Video codec (h264, h265, vp8, vp9, prores, gif)', 'h264')
  .option('--crf <number>', 'Constant Rate Factor (0-51, lower = better quality)', '18')
  .option('--fps <number>', 'Frames per second')
  .option('--width <number>', 'Video width in pixels')
  .option('--height <number>', 'Video height in pixels')
  .option('--frames <range>', 'Frame range to render (e.g., "0-100")')
  .option('--props <json>', 'Input props as JSON string')
  .option('--props-file <path>', 'Path to JSON file with input props')
  .option('--concurrency <number>', 'Number of parallel browser instances', '2')
  .option('--output-dir <path>', 'Output directory', './outputs')
  .option('--sequence', 'Output as image sequence instead of video')
  .option('--image-format <format>', 'Image format for sequence (png, jpeg)', 'png')
  .option('--quality <number>', 'JPEG quality (0-100)', '80')
  .option('--scale <number>', 'Scale factor for output dimensions', '1')
  .option('--preset <preset>', 'FFmpeg encoding preset (ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow)', 'fast')
  .option('--timeout <ms>', 'Timeout in ms for delayRender and page readiness', '30000')
  .option('--muted', 'Disable audio in output')
  .option('--frontend-url <url>', 'Frontend URL for rendering', 'http://localhost:3000')
  .option('--allow-remote', 'Allow rendering from non-localhost URLs')
  .option('--log-level <level>', 'Log level (error, warn, info, verbose)', 'info')
  .action(renderCommand);

// ─── Still Command ────────────────────────────────────────────────────────────
program
  .command('still <composition-id>')
  .description('Render a single frame as an image')
  .argument('[output]', 'Output file path')
  .option('--frame <number>', 'Frame number to render', '0')
  .option('--format <format>', 'Image format (png, jpeg)', 'png')
  .option('--quality <number>', 'JPEG quality (0-100)', '80')
  .option('--width <number>', 'Image width in pixels')
  .option('--height <number>', 'Image height in pixels')
  .option('--scale <number>', 'Scale factor for output dimensions', '1')
  .option('--props <json>', 'Input props as JSON string')
  .option('--props-file <path>', 'Path to JSON file with input props')
  .option('--frontend-url <url>', 'Frontend URL for rendering', 'http://localhost:3000')
  .option('--allow-remote', 'Allow rendering from non-localhost URLs')
  .action(stillCommand);

// ─── Preview Command ──────────────────────────────────────────────────────────
program
  .command('preview')
  .description('Start the development preview server')
  .option('--port <number>', 'Server port', '3000')
  .option('--no-open', 'Do not open browser automatically')
  .action(previewCommand);

// ─── Compositions Command ─────────────────────────────────────────────────────
program
  .command('compositions')
  .description('List all available compositions')
  .option('--json', 'Output as JSON')
  .option('--frontend-url <url>', 'Frontend URL', 'http://localhost:3000')
  .action(compositionsCommand);

// ─── Templates Command ───────────────────────────────────────────────────────
const templates = program
  .command('templates')
  .description('Manage Framely templates from the registry');

templates
  .command('list')
  .description('List available templates from the registry')
  .action(templatesListCommand);

templates
  .command('install <package>')
  .description('Install a template package')
  .action(templatesInstallCommand);

templates
  .command('remove <package>')
  .description('Remove an installed template package')
  .action(templatesRemoveCommand);

program.parse();
