/**
 * Templates Command
 *
 * CLI subcommands for managing Framely templates:
 *   framely templates list      — List available templates from the registry
 *   framely templates add       — Add a template to your project
 *   framely templates remove    — Remove a template from your project
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fetchRegistry, fetchTemplateFile, getRegistryUrl } from '../utils/registry.js';
import { discoverInstalledTemplates } from '../utils/discover.js';

/**
 * framely templates list
 */
export async function templatesListCommand(options) {
  const projectDir = process.cwd();
  const registryUrl = getRegistryUrl(projectDir);

  console.log(chalk.cyan('\nFetching template registry...\n'));

  const { templates: registry } = await fetchRegistry(registryUrl);
  if (registry.length === 0) {
    console.log(chalk.yellow('No templates found in the registry.'));
    console.log(chalk.gray('Check your network connection or registry URL.\n'));
    return;
  }

  // Check which are installed
  const installed = discoverInstalledTemplates(projectDir);
  const installedIds = new Set(installed.map((i) => i.meta.id));

  // Print table
  console.log(chalk.white.bold('  Available Templates\n'));

  for (const tmpl of registry) {
    const isInstalled = installedIds.has(tmpl.id);
    const badge = isInstalled ? chalk.green(' [added]') : '';
    const featured = tmpl.featured ? chalk.yellow(' *') : '';

    console.log(
      `  ${chalk.cyan(tmpl.id)}${featured}${badge}`
    );
    console.log(
      `    ${tmpl.name} — ${chalk.gray(tmpl.description)}`
    );
    console.log(
      `    ${chalk.gray(`${tmpl.width}x${tmpl.height} @ ${tmpl.fps}fps`)}`
    );
    console.log('');
  }

  console.log(chalk.gray(`  ${registry.length} template(s) available\n`));
  console.log(chalk.gray('  Add with: framely templates add <template-id>\n'));
}

/**
 * framely templates add <template-id>
 */
export async function templatesInstallCommand(templateId, options) {
  const projectDir = process.cwd();
  const registryUrl = getRegistryUrl(projectDir);

  console.log(chalk.cyan(`\nAdding template ${templateId}...\n`));

  const { templates: registry, baseUrl } = await fetchRegistry(registryUrl);
  const template = registry.find(t => t.id === templateId);

  if (!template) {
    console.error(chalk.red(`Template "${templateId}" not found in registry.`));
    process.exit(1);
  }

  if (!template.registryDir || !template.files || template.files.length === 0) {
    console.error(chalk.red('Template has no files listed in the registry.'));
    process.exit(1);
  }

  const targetDir = path.join(projectDir, 'src', 'templates', templateId);
  fs.mkdirSync(targetDir, { recursive: true });

  for (const filePath of template.files) {
    console.log(chalk.gray(`  Fetching ${filePath}...`));
    const content = await fetchTemplateFile(baseUrl, template.registryDir, filePath);

    // Flatten src/ prefix: "src/index.jsx" -> "index.jsx"
    const targetPath = filePath.startsWith('src/') ? filePath.slice(4) : filePath;
    const fullTargetPath = path.join(targetDir, targetPath);
    fs.mkdirSync(path.dirname(fullTargetPath), { recursive: true });
    fs.writeFileSync(fullTargetPath, content, 'utf-8');
    console.log(chalk.green(`  Wrote ${targetPath}`));
  }

  console.log(chalk.green(`\nTemplate ${templateId} added to src/templates/${templateId}/`));
  console.log(chalk.gray('You can customize the template files directly.\n'));
}

/**
 * framely templates remove <template-id>
 */
export async function templatesRemoveCommand(templateId, options) {
  const projectDir = process.cwd();
  const targetDir = path.join(projectDir, 'src', 'templates', templateId);

  if (!fs.existsSync(targetDir)) {
    console.error(chalk.red(`Template "${templateId}" not found at src/templates/${templateId}/`));
    process.exit(1);
  }

  console.log(chalk.cyan(`\nRemoving template ${templateId}...\n`));
  fs.rmSync(targetDir, { recursive: true, force: true });
  console.log(chalk.green(`Template ${templateId} removed.\n`));
}
