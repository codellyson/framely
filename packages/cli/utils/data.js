/**
 * Data Loading Utility
 *
 * Loads batch data from CSV or JSON files for data-driven video generation.
 */

import fs from 'fs';
import path from 'path';

/**
 * Load data from a CSV or JSON file.
 *
 * @param {string} filePath - Path to the data file
 * @returns {Array<object>} Array of data objects (one per row/item)
 */
export function loadDataFile(filePath) {
  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`Data file not found: ${filePath}`);
  }

  const content = fs.readFileSync(resolved, 'utf-8').trim();
  if (!content) {
    throw new Error(`Data file is empty: ${filePath}`);
  }

  const ext = path.extname(filePath).toLowerCase();

  let data;
  if (ext === '.csv') {
    data = parseCSV(content);
  } else if (ext === '.json') {
    data = parseJSON(content, filePath);
  } else {
    throw new Error(`Unsupported data file format "${ext}". Use .csv or .json`);
  }

  if (data.length === 0) {
    throw new Error(`Data file contains no rows: ${filePath}`);
  }

  return data;
}

/**
 * Parse CSV content into an array of objects.
 * Handles quoted fields, commas inside quotes, and escaped quotes.
 *
 * @param {string} content - Raw CSV string
 * @returns {Array<object>}
 */
function parseCSV(content) {
  const lines = splitCSVLines(content);
  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one data row');
  }

  const headers = parseCSVRow(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVRow(line);
    const obj = {};

    for (let j = 0; j < headers.length; j++) {
      const key = headers[j].trim();
      const val = j < values.length ? values[j] : '';
      // Auto-convert numbers and booleans
      obj[key] = autoConvert(val);
    }

    rows.push(obj);
  }

  return rows;
}

/**
 * Split CSV content into lines, respecting quoted fields that span lines.
 *
 * @param {string} content
 * @returns {string[]}
 */
function splitCSVLines(content) {
  const lines = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];

    if (ch === '"') {
      if (inQuotes && content[i + 1] === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && content[i + 1] === '\n') i++; // Skip \r\n
      lines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }

  if (current) lines.push(current);
  return lines;
}

/**
 * Parse a single CSV row into an array of field values.
 *
 * @param {string} line
 * @returns {string[]}
 */
function parseCSVRow(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Auto-convert string values to appropriate types.
 *
 * @param {string} val
 * @returns {string|number|boolean}
 */
function autoConvert(val) {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === '') return '';
  // Check for number (but not strings like "007" or phone numbers)
  if (/^-?\d+(\.\d+)?$/.test(val) && !val.startsWith('0', val.startsWith('-') ? 1 : 0)) {
    const num = Number(val);
    if (!isNaN(num) && isFinite(num)) return num;
  }
  // Allow single zero
  if (val === '0') return 0;
  return val;
}

/**
 * Parse JSON content as an array of objects.
 *
 * @param {string} content
 * @param {string} filePath - For error messages
 * @returns {Array<object>}
 */
function parseJSON(content, filePath) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error(`Invalid JSON in data file ${filePath}: ${err.message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`JSON data file must contain a top-level array, got ${typeof parsed}`);
  }

  for (let i = 0; i < parsed.length; i++) {
    if (typeof parsed[i] !== 'object' || parsed[i] === null || Array.isArray(parsed[i])) {
      throw new Error(`Each item in JSON data must be an object (row ${i} is ${typeof parsed[i]})`);
    }
  }

  return parsed;
}

export default { loadDataFile };
