/**
 * Route parameters safety utility
 * Helps safely access route params with defaults and validation
 */

/**
 * Safely get route parameter with default value
 * @param {Object} route - React Navigation route object
 * @param {string} paramName - Name of the parameter
 * @param {*} defaultValue - Default value if param not found
 * @returns {*} Parameter value or default
 */
export const getRouteParam = (route, paramName, defaultValue = null) => {
  if (!route || typeof route !== 'object') {
    return defaultValue;
  }

  const value = route.params?.[paramName];
  return value !== undefined && value !== null ? value : defaultValue;
};

/**
 * Safely get multiple route parameters at once
 * @param {Object} route - React Navigation route object
 * @param {Object} paramSchema - Object mapping param names to default values
 * @returns {Object} Object with all requested params and their defaults
 */
export const getRouteParams = (route, paramSchema = {}) => {
  if (!route || typeof route !== 'object') {
    return paramSchema;
  }

  const result = {};
  Object.entries(paramSchema).forEach(([key, defaultValue]) => {
    result[key] = route.params?.[key] ?? defaultValue;
  });
  return result;
};

/**
 * Validate required route parameters
 * @param {Object} route - React Navigation route object
 * @param {Array} requiredParams - Array of required parameter names
 * @returns {Object} Object with isValid boolean and missing array
 */
export const validateRouteParams = (route, requiredParams = []) => {
  const missing = [];

  if (!route || typeof route !== 'object') {
    return { isValid: false, missing: requiredParams };
  }

  requiredParams.forEach(param => {
    if (route.params?.[param] === undefined || route.params?.[param] === null) {
      missing.push(param);
    }
  });

  return { isValid: missing.length === 0, missing };
};

export default {
  getRouteParam,
  getRouteParams,
  validateRouteParams,
};

