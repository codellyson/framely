/**
 * Template Discovery
 *
 * Scans src/templates/ for locally added Framely templates and
 * merges them with the remote registry.
 */

import fs from 'fs';
import path from 'path';

/**
 * Discover installed templates in the project's src/templates/ directory.
 *
 * Each subdirectory must contain a framely-template.json with at least
 * an `id` and `name` field, plus a component entry (index.jsx/tsx/js/ts).
 *
 * @param {string} projectDir - The user's project directory
 * @returns {Array<{ meta: object, templateId: string, templateDir: string, componentEntry: string }>}
 */
export function discoverInstalledTemplates(projectDir) {
  const templatesDir = path.join(projectDir, 'src', 'templates');
  if (!fs.existsSync(templatesDir)) return [];

  const installed = [];
  const entries = safeReaddir(templatesDir);

  for (const entry of entries) {
    if (entry.startsWith('.')) continue;

    const templateDir = path.join(templatesDir, entry);
    const stat = safeStatSync(templateDir);
    if (!stat || !stat.isDirectory()) continue;

    const meta = readTemplateMetadata(templateDir);
    if (!meta) continue;

    const componentEntry = resolveComponentEntry(templateDir);
    if (!componentEntry) continue;

    installed.push({
      meta,
      templateId: meta.id,
      templateDir: entry,
      componentEntry,
    });
  }

  return installed;
}

/**
 * Resolve the component entry point in a template directory.
 *
 * @param {string} templateDir - Absolute path to the template directory
 * @returns {string | null} Absolute path to the entry file, or null
 */
function resolveComponentEntry(templateDir) {
  const candidates = ['index.jsx', 'index.tsx', 'index.js', 'index.ts'];
  for (const candidate of candidates) {
    const fullPath = path.join(templateDir, candidate);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  return null;
}

/**
 * Read framely-template.json from a template directory.
 *
 * @param {string} templateDir - Absolute path to the template directory
 * @returns {object | null} Template metadata or null if not found/invalid
 */
export function readTemplateMetadata(templateDir) {
  try {
    const metaPath = path.join(templateDir, 'framely-template.json');
    if (!fs.existsSync(metaPath)) return null;
    const raw = fs.readFileSync(metaPath, 'utf-8');
    const meta = JSON.parse(raw);
    if (!meta || !meta.id || !meta.name) return null;
    return meta;
  } catch {
    return null;
  }
}

/**
 * Merge installed templates with the remote registry.
 *
 * Registry templates get `installed: true` if a matching local template is found.
 * Installed templates not in the registry are also included.
 *
 * @param {Array} installed - From discoverInstalledTemplates()
 * @param {Array} registry - From fetchRegistry()
 * @returns {Array} Merged template list
 */
export function mergeWithRegistry(installed, registry) {
  const installedById = new Map();
  for (const inst of installed) {
    installedById.set(inst.meta.id, inst);
  }

  const merged = [];
  const seen = new Set();

  // Process registry templates first (they have richer metadata like downloads, rating)
  for (const regTemplate of registry) {
    const inst = installedById.get(regTemplate.id);
    merged.push({
      ...regTemplate,
      installed: !!inst,
    });
    seen.add(regTemplate.id);
  }

  // Add installed templates not in the registry
  for (const inst of installed) {
    if (seen.has(inst.meta.id)) continue;
    merged.push({
      ...inst.meta,
      version: inst.meta.version || '0.0.0',
      installed: true,
    });
  }

  return merged;
}

/**
 * Generate a virtual module source string for all installed templates.
 *
 * The generated module exports `installedTemplates` (a map of id → component)
 * and a `getTemplateComponent(id)` helper.
 *
 * @param {Array} installed - From discoverInstalledTemplates()
 * @returns {string} JavaScript module source
 */
export function generateVirtualModule(installed) {
  if (installed.length === 0) {
    return `
export const installedTemplates = {};
export function getTemplateComponent(id) { return null; }
`;
  }

  const imports = [];
  const entries = [];

  installed.forEach((inst, i) => {
    const absPath = inst.componentEntry.replace(/\\/g, '/');
    const id = inst.meta.id;
    imports.push(`import Comp${i} from '${absPath}';`);
    entries.push(`  '${id}': Comp${i}`);
  });

  return `
${imports.join('\n')}

export const installedTemplates = {
${entries.join(',\n')}
};

export function getTemplateComponent(id) {
  return installedTemplates[id] || null;
}
`;
}

/**
 * Safe readdir that returns empty array on error.
 */
function safeReaddir(dir) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

/**
 * Safe statSync that returns null on error.
 */
function safeStatSync(filepath) {
  try {
    return fs.statSync(filepath);
  } catch {
    return null;
  }
}
