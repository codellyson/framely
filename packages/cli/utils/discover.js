/**
 * Template Discovery
 *
 * Scans node_modules for installed Framely template packages and
 * merges them with the remote registry.
 */

import fs from 'fs';
import path from 'path';

/**
 * Discover installed template packages in node_modules.
 *
 * Looks for packages whose package.json contains:
 *   { "framely": { "type": "template" } }
 *
 * @param {string} projectDir - The user's project directory
 * @returns {Array<{ meta: object, packageName: string, version: string, componentEntry: string }>}
 */
export function discoverInstalledTemplates(projectDir) {
  const nodeModules = path.join(projectDir, 'node_modules');
  if (!fs.existsSync(nodeModules)) return [];

  const installed = [];

  // Scan top-level and scoped (@org/) directories
  const entries = safeReaddir(nodeModules);
  for (const entry of entries) {
    if (entry.startsWith('.')) continue;

    if (entry.startsWith('@')) {
      // Scoped package — scan subdirectory
      const scopeDir = path.join(nodeModules, entry);
      const scopeEntries = safeReaddir(scopeDir);
      for (const scopeEntry of scopeEntries) {
        const result = checkPackage(path.join(scopeDir, scopeEntry), `${entry}/${scopeEntry}`);
        if (result) installed.push(result);
      }
    } else {
      const result = checkPackage(path.join(nodeModules, entry), entry);
      if (result) installed.push(result);
    }
  }

  return installed;
}

/**
 * Check if a directory is a Framely template package.
 *
 * @param {string} packageDir - Absolute path to the package directory
 * @param {string} packageName - The npm package name
 * @returns {{ meta: object, packageName: string, version: string, componentEntry: string } | null}
 */
function checkPackage(packageDir, packageName) {
  try {
    const pkgJsonPath = path.join(packageDir, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) return null;

    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));

    // Check for the framely template marker
    if (!pkgJson.framely || pkgJson.framely.type !== 'template') return null;

    // Read template metadata
    const meta = readTemplateMetadata(packageDir);
    if (!meta) return null;

    // Resolve the component entry point
    const mainField = pkgJson.main || 'src/index.jsx';
    const componentEntry = path.join(packageDir, mainField);

    return {
      meta,
      packageName,
      version: pkgJson.version || '0.0.0',
      componentEntry,
    };
  } catch {
    return null;
  }
}

/**
 * Read framely-template.json from a package directory.
 *
 * @param {string} packageDir - Absolute path to the package
 * @returns {object | null} Template metadata or null if not found/invalid
 */
export function readTemplateMetadata(packageDir) {
  try {
    const metaPath = path.join(packageDir, 'framely-template.json');
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
 * Registry templates get `installed: true` if the package is found locally.
 * Installed templates not in the registry are also included.
 *
 * @param {Array} installed - From discoverInstalledTemplates()
 * @param {Array} registry - From fetchRegistry()
 * @returns {Array} Merged template list
 */
export function mergeWithRegistry(installed, registry) {
  // Build a lookup of installed packages by their template ID
  const installedById = new Map();
  const installedByPkg = new Map();
  for (const inst of installed) {
    installedById.set(inst.meta.id, inst);
    installedByPkg.set(inst.packageName, inst);
  }

  const merged = [];
  const seen = new Set();

  // Process registry templates first (they have richer metadata like downloads, rating)
  for (const regTemplate of registry) {
    const inst = installedByPkg.get(regTemplate.package) || installedById.get(regTemplate.id);
    merged.push({
      ...regTemplate,
      installed: !!inst,
      installedVersion: inst ? inst.version : undefined,
    });
    seen.add(regTemplate.id);
    if (inst) seen.add(inst.meta.id);
  }

  // Add installed templates not in the registry
  for (const inst of installed) {
    if (seen.has(inst.meta.id)) continue;
    merged.push({
      ...inst.meta,
      package: inst.packageName,
      version: inst.version,
      installed: true,
      installedVersion: inst.version,
    });
  }

  return merged;
}

/**
 * Generate a virtual module source string for all installed template packages.
 *
 * The generated module exports `installedTemplates` (a map of id → { component, meta })
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
    const pkgName = inst.packageName;
    const id = inst.meta.id;
    imports.push(`import Comp${i} from '${pkgName}';`);
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
