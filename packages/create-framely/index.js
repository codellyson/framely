#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.join(__dirname, 'template');

const projectName = process.argv[2];

if (!projectName) {
  console.error('Usage: create-framely <project-name>');
  console.error('Example: npx create-framely my-video');
  process.exit(1);
}

const targetDir = path.resolve(process.cwd(), projectName);

if (fs.existsSync(targetDir)) {
  console.error(`Error: Directory "${projectName}" already exists.`);
  process.exit(1);
}

/**
 * Recursively copy a directory, replacing {{PROJECT_NAME}} in file contents.
 */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      let content = fs.readFileSync(srcPath, 'utf-8');
      content = content.replace(/\{\{PROJECT_NAME\}\}/g, projectName);
      fs.writeFileSync(destPath, content);
    }
  }
}

console.log(`\nCreating a new Framely project in ${targetDir}\n`);

copyDir(templateDir, targetDir);

console.log('Done! To get started:\n');
console.log(`  cd ${projectName}`);
console.log('  npm install');
console.log('  npx framely preview\n');
