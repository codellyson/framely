/**
 * Logger Utility
 *
 * Simple leveled logger for CLI output.
 */

import chalk from 'chalk';

const LEVELS = { error: 0, warn: 1, info: 2, verbose: 3 };

/**
 * Create a logger with the specified level.
 * @param {string} [level='info'] - Log level
 * @returns {object} Logger with error, warn, info, verbose methods
 */
export function createLogger(level = 'info') {
  const currentLevel = LEVELS[level] ?? LEVELS.info;

  return {
    error: (...args) => {
      if (currentLevel >= LEVELS.error) console.error(chalk.red(...args));
    },
    warn: (...args) => {
      if (currentLevel >= LEVELS.warn) console.warn(chalk.yellow(...args));
    },
    info: (...args) => {
      if (currentLevel >= LEVELS.info) console.log(...args);
    },
    verbose: (...args) => {
      if (currentLevel >= LEVELS.verbose) console.log(chalk.gray(...args));
    },
    level: currentLevel,
    isVerbose: currentLevel >= LEVELS.verbose,
  };
}
