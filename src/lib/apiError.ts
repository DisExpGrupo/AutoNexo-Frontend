import type { ErrorResponse, ErrorCode } from '@/modules/iam/models/auth.model';

interface AxiosErrorShape {
  response?: {
    data?: Record<string, unknown>
    status?: number
  }
  config?: {
    url?: string
  }
  code?: string
  message?: string
}

export function parseApiError(error: unknown): ErrorResponse {
  const defaultError: ErrorResponse = {
    timestamp: new Date().toISOString(),
    status: 500,
    error: 'Internal Server Error',
    errorCode: 'INTERNAL_ERROR' as ErrorCode,
    message: 'An unexpected error occurred. Please try again.',
    path: '',
  };

  if (!error || typeof error !== 'object') {
    return defaultError;
  }

  const err = error as AxiosErrorShape;

  if (err.response?.data && typeof err.response.data === 'object') {
    const data = err.response.data;
    return {
      timestamp: (data.timestamp as string) || defaultError.timestamp,
      status: err.response.status || defaultError.status,
      error: (data.error as string) || defaultError.error,
      errorCode: (data.errorCode as ErrorCode) || defaultError.errorCode,
      message: (data.message as string) || defaultError.message,
      path: (data.path as string) || err.config?.url || '',
    };
  }

  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return {
      ...defaultError,
      status: 0,
      error: 'Network Error',
      errorCode: 'INTERNAL_ERROR' as ErrorCode,
      message: 'Unable to reach the server. Check your connection.',
      path: err.config?.url || '',
    };
  }

  return defaultError;
}