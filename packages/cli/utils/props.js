/**
 * Props Loading Utility
 *
 * Shared function for loading input props from JSON string or file.
 */

import fs from 'fs';

/**
 * Load props from JSON string or file path.
 * @param {string} [propsJson] - JSON string
 * @param {string} [propsFile] - Path to JSON file
 * @returns {object} parsed props
 */
export function loadProps(propsJson, propsFile) {
  if (propsFile) {
    let content;
    try {
      content = fs.readFileSync(propsFile, 'utf-8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error(`Props file not found: ${propsFile}`);
      }
      throw new Error(`Could not read props file ${propsFile}: ${err.message}`);
    }
    try {
      return JSON.parse(content);
    } catch (err) {
      throw new Error(`Invalid JSON in props file ${propsFile}: ${err.message}`);
    }
  }

  if (propsJson) {
    try {
      return JSON.parse(propsJson);
    } catch (err) {
      throw new Error(`Invalid JSON in --props argument: ${err.message}`);
    }
  }

  return {};
}
