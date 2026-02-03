/**
 * Preview Command
 *
 * Starts the development preview server with hot reloading.
 *
 * Usage:
 *   framely preview
 *   framely preview --port 3001
 *   framely preview --no-open
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Main preview command handler.
 */
export async function previewCommand(options) {
  const port = options.port || '3000';
  const shouldOpen = options.open !== false;

  console.log(chalk.cyan('\n🎬 Framely Preview\n'));

  // Find the frontend directory
  const possiblePaths = [
    path.resolve(process.cwd(), 'frontend'),
    path.resolve(process.cwd()),
    path.resolve(__dirname, '../../frontend'),
  ];

  let frontendDir = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(path.join(p, 'package.json'))) {
      const pkg = JSON.parse(fs.readFileSync(path.join(p, 'package.json'), 'utf-8'));
      if (pkg.name === 'framely-frontend' || fs.existsSync(path.join(p, 'src/lib/context.jsx'))) {
        frontendDir = p;
        break;
      }
    }
  }

  if (!frontendDir) {
    console.error(chalk.red('Error: Could not find Framely frontend directory.'));
    console.log(chalk.gray('Make sure you are in a Framely project directory.\n'));
    process.exit(1);
  }

  console.log(chalk.white('  Directory:'), chalk.gray(frontendDir));
  console.log(chalk.white('  Port:      '), chalk.yellow(port));
  console.log(chalk.white('  URL:       '), chalk.green(`http://localhost:${port}`));
  console.log('');

  // Check if node_modules exists
  const nodeModulesPath = path.join(frontendDir, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log(chalk.yellow('  Installing dependencies...'));
    const installProcess = spawn('npm', ['install'], {
      cwd: frontendDir,
      stdio: 'inherit',
    });

    await new Promise((resolve, reject) => {
      installProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`npm install failed with code ${code}`));
      });
    });
    console.log('');
  }

  // Set environment variables
  const env = {
    ...process.env,
    PORT: port,
    BROWSER: shouldOpen ? 'true' : 'false',
  };

  console.log(chalk.cyan('  Starting development server...\n'));

  // Start the dev server
  const devProcess = spawn('npm', ['run', 'dev'], {
    cwd: frontendDir,
    stdio: 'inherit',
    env,
  });

  // Handle process signals
  const cleanup = () => {
    console.log(chalk.gray('\n\n  Shutting down...\n'));
    devProcess.kill('SIGTERM');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  devProcess.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.error(chalk.red(`\n  Dev server exited with code ${code}\n`));
    }
    process.exit(code || 0);
  });

  devProcess.on('error', (error) => {
    console.error(chalk.red(`\n  Failed to start dev server: ${error.message}\n`));
    process.exit(1);
  });
}
