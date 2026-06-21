const { performHttpCheck } = require('../engine/httpChecker');

/**
 * Standalone check service — wraps httpChecker for use outside the engine
 * Useful for testing connections, one-off checks, etc.
 */
const runCheck = async (monitor) => {
  return performHttpCheck(monitor);
};

module.exports = { runCheck };
