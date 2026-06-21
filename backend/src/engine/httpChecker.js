const axios = require('axios');
const logger = require('../config/logger');

const HTTP_TIMEOUT = 30000; // 30 seconds max timeout

/**
 * Perform an HTTP check against a monitor URL
 * Returns structured result with timing, status, and error info
 */
const performHttpCheck = async (monitor) => {
  const startTime = Date.now();

  try {
    const monitorHeaders = monitor.headers || {};
    const headersObj = (monitorHeaders instanceof Map)
      ? Object.fromEntries(monitorHeaders)
      : (typeof monitorHeaders.entries === 'function'
        ? Object.fromEntries(monitorHeaders.entries())
        : monitorHeaders);

    const requestConfig = {
      method: monitor.method || 'GET',
      url: monitor.url,
      timeout: HTTP_TIMEOUT,
      headers: {
        'User-Agent': 'UptimeMonitor/1.0',
        ...headersObj,
      },
      validateStatus: () => true, // Don't throw on any status code — we handle it
      maxRedirects: 5,
    };

    const response = await axios(requestConfig);
    const responseTime = Date.now() - startTime;
    const statusCode = response.status;

    const isServerError = statusCode >= 500;
    const isSuccess = !isServerError && statusCode < 500;

    return {
      success: isSuccess,
      responseTime,
      statusCode,
      errorMessage: isServerError ? `HTTP ${statusCode} Server Error` : null,
      result: isSuccess ? 'up' : 'down',
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return {
        success: false,
        responseTime,
        statusCode: null,
        errorMessage: `Request timeout after ${responseTime}ms`,
        result: 'timeout',
      };
    }

    if (
      error.code === 'ENOTFOUND' ||
      error.code === 'EAI_AGAIN' ||
      error.code === 'ESERVFAIL'
    ) {
      return {
        success: false,
        responseTime,
        statusCode: null,
        errorMessage: `DNS resolution failed: ${error.message}`,
        result: 'dns_error',
      };
    }

    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        responseTime,
        statusCode: null,
        errorMessage: `Connection refused by host`,
        result: 'down',
      };
    }

    logger.error(`HTTP check error for ${monitor.url}: ${error.message}`);

    return {
      success: false,
      responseTime,
      statusCode: null,
      errorMessage: error.message || 'Unknown error',
      result: 'error',
    };
  }
};

module.exports = { performHttpCheck };
