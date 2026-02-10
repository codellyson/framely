/**
 * Templates Command
 *
 * CLI subcommands for managing Framely templates:
 *   framely templates list     — List available templates from the registry
 *   framely templates install  — Install a template package
 *   framely templates remove   — Remove a template package
 */

import { spawn, execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fetchRegistry, getRegistryUrl } from '../utils/registry.js';
import { discoverInstalledTemplates } from '../utils/discover.js';

/**
 * Detect which package manager the project uses.
 *
 * @param {string} projectDir
 * @returns {'pnpm' | 'yarn' | 'npm'}
 */
export function detectPackageManager(projectDir) {
  if (fs.existsSync(path.join(projectDir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(projectDir, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

/**
 * Run a package manager command and stream output.
 *
 * @param {string} pm - Package manager name
 * @param {string[]} args - Command arguments
 * @param {string} cwd - Working directory
 * @returns {Promise<void>}
 */
function resolvePMPath(pm) {
  try {
    return execFileSync('which', [pm], { encoding: 'utf8' }).trim();
  } catch {
    return pm;
  }
}

function runPM(pm, args, cwd) {
  const resolvedPM = resolvePMPath(pm);
  return new Promise((resolve, reject) => {
    const proc = spawn(resolvedPM, args, { cwd, stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${pm} ${args.join(' ')} exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

/**
 * framely templates list
 */
export async function templatesListCommand(options) {
  const projectDir = process.cwd();
  const registryUrl = getRegistryUrl(projectDir);

  console.log(chalk.cyan('\nFetching template registry...\n'));

  const registry = await fetchRegistry(registryUrl);
  if (registry.length === 0) {
    console.log(chalk.yellow('No templates found in the registry.'));
    console.log(chalk.gray('Check your network connection or registry URL.\n'));
    return;
  }

  // Check which are installed
  const installed = discoverInstalledTemplates(projectDir);
  const installedIds = new Set(installed.map((i) => i.meta.id));
  const installedPkgs = new Set(installed.map((i) => i.packageName));

  // Print table
  console.log(chalk.white.bold('  Available Templates\n'));

  for (const tmpl of registry) {
    const isInstalled = installedIds.has(tmpl.id) || installedPkgs.has(tmpl.package);
    const badge = isInstalled ? chalk.green(' [installed]') : '';
    const featured = tmpl.featured ? chalk.yellow(' *') : '';

    console.log(
      `  ${chalk.cyan(tmpl.id)}${featured}${badge}`
    );
    console.log(
      `    ${tmpl.name} — ${chalk.gray(tmpl.description)}`
    );
    console.log(
      `    ${chalk.gray(`${tmpl.width}x${tmpl.height} @ ${tmpl.fps}fps | ${tmpl.package}`)}`
    );
    console.log('');
  }

  console.log(chalk.gray(`  ${registry.length} template(s) available\n`));
  console.log(chalk.gray('  Install with: framely templates install <package-name>\n'));
}

/**
 * framely templates install <package>
 */
export async function templatesInstallCommand(packageName, options) {
  const projectDir = process.cwd();
  const pm = detectPackageManager(projectDir);

  console.log(chalk.cyan(`\nInstalling ${packageName} with ${pm}...\n`));

  const installCmd = pm === 'yarn' ? 'add' : 'install';

  try {
    await runPM(pm, [installCmd, packageName], projectDir);
    console.log(chalk.green(`\nTemplate ${packageName} installed successfully.\n`));
    console.log(chalk.gray('Start the studio to use it: npx framely preview\n'));
  } catch (err) {
    console.error(chalk.red(`\nFailed to install ${packageName}: ${err.message}\n`));
    process.exit(1);
  }
}

/**
 * framely templates remove <package>
 */
export async function templatesRemoveCommand(packageName, options) {
  const projectDir = process.cwd();
  const pm = detectPackageManager(projectDir);

  console.log(chalk.cyan(`\nRemoving ${packageName} with ${pm}...\n`));

  const removeCmd = pm === 'yarn' ? 'remove' : 'uninstall';

  try {
    await runPM(pm, [removeCmd, packageName], projectDir);
    console.log(chalk.green(`\nTemplate ${packageName} removed.\n`));
  } catch (err) {
    console.error(chalk.red(`\nFailed to remove ${packageName}: ${err.message}\n`));
    process.exit(1);
  }
}
