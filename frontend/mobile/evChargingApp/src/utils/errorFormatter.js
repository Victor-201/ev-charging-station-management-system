/**
 * Standardized error formatting utility
 * Ensures consistent error messages and codes across all services
 */

export const ErrorCodes = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',
  
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Authorization errors
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  CONFLICT: 'CONFLICT',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  NO_CONNECTION: 'NO_CONNECTION',
  
  // Server errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Custom errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

/**
 * Error message translations (Vietnamese)
 */
const errorMessages = {
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
  INVALID_INPUT: 'Thông tin nhập vào không chính xác',
  MISSING_FIELD: 'Vui lòng điền đầy đủ thông tin',
  UNAUTHORIZED: 'Bạn cần đăng nhập để tiếp tục',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không chính xác',
  TOKEN_EXPIRED: 'Phiên của bạn đã hết hạn. Vui lòng đăng nhập lại',
  TOKEN_INVALID: 'Token không hợp lệ',
  SESSION_EXPIRED: 'Phiên làm việc đã hết hạn',
  FORBIDDEN: 'Bạn không có quyền thực hiện hành động này',
  INSUFFICIENT_PERMISSIONS: 'Bạn không có đủ quyền hạn',
  NOT_FOUND: 'Không tìm thấy dữ liệu',
  RESOURCE_NOT_FOUND: 'Tài nguyên không tồn tại',
  CONFLICT: 'Dữ liệu bị xung đột',
  ALREADY_EXISTS: 'Đã tồn tại trong hệ thống',
  NETWORK_ERROR: 'Lỗi kết nối mạng',
  CONNECTION_TIMEOUT: 'Kết nối hết thời gian chờ',
  NO_CONNECTION: 'Không có kết nối Internet',
  INTERNAL_SERVER_ERROR: 'Lỗi server. Vui lòng thử lại sau',
  SERVICE_UNAVAILABLE: 'Dịch vụ tạm thời không có sẵn',
  UNKNOWN_ERROR: 'Có lỗi xảy ra. Vui lòng thử lại',
};

/**
 * Format error response with consistent structure
 * @param {Error|string|Object} error - Error object, message, or API response
 * @returns {Object} Formatted error object
 */
export const formatError = (error) => {
  // Handle API error responses
  if (error?.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    return {
      message: data?.message || errorMessages.INTERNAL_SERVER_ERROR,
      error: data?.error || getErrorCodeFromStatus(status),
      statusCode: status,
      details: data?.details || null,
    };
  }
  
  // Handle network errors
  if (error?.isNetworkError) {
    return {
      message: error.message || errorMessages.NETWORK_ERROR,
      error: ErrorCodes.NETWORK_ERROR,
      statusCode: 0,
      details: null,
    };
  }
  
  // Handle string messages
  if (typeof error === 'string') {
    return {
      message: error,
      error: ErrorCodes.UNKNOWN_ERROR,
      statusCode: null,
      details: null,
    };
  }
  
  // Handle generic error objects
  if (error instanceof Error) {
    return {
      message: error.message || errorMessages.UNKNOWN_ERROR,
      error: ErrorCodes.UNKNOWN_ERROR,
      statusCode: null,
      details: null,
    };
  }
  
  // Fallback for unknown error types
  return {
    message: errorMessages.UNKNOWN_ERROR,
    error: ErrorCodes.UNKNOWN_ERROR,
    statusCode: null,
    details: null,
  };
};

/**
 * Get human-readable error message
 */
export const getErrorMessage = (errorCode) => {
  return errorMessages[errorCode] || errorMessages.UNKNOWN_ERROR;
};

/**
 * Map HTTP status codes to error codes
 */
const getErrorCodeFromStatus = (status) => {
  const statusMap = {
    400: ErrorCodes.VALIDATION_ERROR,
    401: ErrorCodes.UNAUTHORIZED,
    403: ErrorCodes.FORBIDDEN,
    404: ErrorCodes.NOT_FOUND,
    409: ErrorCodes.CONFLICT,
    500: ErrorCodes.INTERNAL_SERVER_ERROR,
    503: ErrorCodes.SERVICE_UNAVAILABLE,
  };
  
  return statusMap[status] || ErrorCodes.UNKNOWN_ERROR;
};

export default {
  formatError,
  getErrorMessage,
  ErrorCodes,
};

