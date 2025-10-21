/**
 * Error types from OpenAI API
 */
export interface OpenAIError {
  code?: string;
  message: string;
  param?: string;
  type?: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

/**
 * Parse OpenAI API errors and return a structured error response
 */
export function parseOpenAIError(error: any): ErrorResponse {
  // Handle OpenAI API errors
  if (error?.error) {
    const openaiError = error.error;
    return {
      error: {
        code: openaiError.code || openaiError.type || 'api_error',
        message: openaiError.message || 'An error occurred with the OpenAI API',
      },
    };
  }

  // Handle error responses with status codes
  if (error?.response?.data?.error) {
    const responseError = error.response.data.error;
    return {
      error: {
        code: responseError.code || responseError.type || 'api_error',
        message: responseError.message || 'An error occurred',
      },
    };
  }

  // Handle rate limit errors
  if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
    return {
      error: {
        code: 'rate_limit_exceeded',
        message: 'Rate limit exceeded. Please try again later.',
      },
    };
  }

  // Handle authentication errors
  if (error?.status === 401 || error?.code === 'invalid_api_key') {
    return {
      error: {
        code: 'invalid_api_key',
        message: 'Invalid API key. Please check your API key in settings.',
      },
    };
  }

  // Handle moderation errors
  if (error?.code === 'moderation_blocked' || error?.message?.includes('moderation')) {
    return {
      error: {
        code: 'moderation_blocked',
        message: 'Your request was blocked by our moderation system.',
      },
    };
  }

  // Handle network errors
  if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
    return {
      error: {
        code: 'network_error',
        message: 'Network error. Please check your connection and try again.',
      },
    };
  }

  // Generic error handling
  return {
    error: {
      code: error?.code || 'unknown_error',
      message: error?.message || 'An unexpected error occurred',
    },
  };
}

/**
 * Get HTTP status code from error code
 */
export function getStatusFromErrorCode(code: string): number {
  switch (code) {
    case 'invalid_api_key':
      return 401;
    case 'rate_limit_exceeded':
      return 429;
    case 'moderation_blocked':
      return 400;
    case 'invalid_request':
      return 400;
    case 'network_error':
      return 503;
    default:
      return 500;
  }
}
