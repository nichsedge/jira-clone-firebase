// Comprehensive error handling and logging system
import { NextRequest, NextResponse } from 'next/server';

export enum ErrorCode {
  // Database errors
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',

  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Business logic errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',

  // System errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // File operation errors
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: any;
  statusCode: number;
  timestamp: Date;
  requestId?: string;
  userId?: string;
  stack?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private isProduction = process.env.NODE_ENV === 'production';

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Create a standardized error object
  createError(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    originalError?: Error
  ): AppError {
    const error: AppError = {
      code,
      message,
      details,
      statusCode,
      timestamp: new Date(),
      stack: this.isProduction ? undefined : originalError?.stack,
    };

    // Log the error
    this.logError(error, originalError);

    return error;
  }

  // Handle database errors
  handleDatabaseError(error: any): AppError {
    if (error?.code === 'P2002') {
      return this.createError(
        ErrorCode.DUPLICATE_RECORD,
        'A record with this information already exists',
        409,
        { constraint: error.meta?.target }
      );
    }

    if (error?.code === 'P2025') {
      return this.createError(
        ErrorCode.RECORD_NOT_FOUND,
        'The requested record was not found',
        404
      );
    }

    if (error?.code?.startsWith('P')) {
      return this.createError(
        ErrorCode.DATABASE_QUERY_ERROR,
        'Database operation failed',
        500,
        { prismaCode: error.code }
      );
    }

    return this.createError(
      ErrorCode.DATABASE_CONNECTION_ERROR,
      'Database connection failed',
      500
    );
  }

  // Handle validation errors
  handleValidationError(error: any): AppError {
    if (error?.name === 'ZodError') {
      return this.createError(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        400,
        error.errors
      );
    }

    return this.createError(
      ErrorCode.INVALID_FORMAT,
      'Invalid data format',
      400,
      error.message
    );
  }

  // Handle authentication errors
  handleAuthError(error: any): AppError {
    if (error?.name === 'JsonWebTokenError') {
      return this.createError(
        ErrorCode.UNAUTHORIZED,
        'Invalid authentication token',
        401
      );
    }

    if (error?.name === 'TokenExpiredError') {
      return this.createError(
        ErrorCode.TOKEN_EXPIRED,
        'Authentication token has expired',
        401
      );
    }

    return this.createError(
      ErrorCode.UNAUTHORIZED,
      'Authentication failed',
      401
    );
  }

  // Handle permission errors
  handlePermissionError(resource?: string, action?: string): AppError {
    return this.createError(
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      `Insufficient permissions${action ? ` to ${action}` : ''}${resource ? ` ${resource}` : ''}`,
      403,
      { resource, action }
    );
  }

  // Handle file upload errors
  handleFileError(error: any): AppError {
    if (error?.code === 'LIMIT_FILE_SIZE') {
      return this.createError(
        ErrorCode.FILE_TOO_LARGE,
        'File is too large',
        413,
        { maxSize: process.env.MAX_FILE_SIZE || '5MB' }
      );
    }

    if (error?.code === 'LIMIT_UNEXPECTED_FILE') {
      return this.createError(
        ErrorCode.FILE_UPLOAD_ERROR,
        'Invalid file type',
        400,
        { allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') }
      );
    }

    return this.createError(
      ErrorCode.FILE_UPLOAD_ERROR,
      'File upload failed',
      500
    );
  }

  // Handle external service errors
  handleExternalServiceError(service: string, error: any): AppError {
    return this.createError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `${service} service unavailable`,
      503,
      {
        service,
        originalError: this.isProduction ? undefined : error.message,
      }
    );
  }

  // Handle rate limiting
  handleRateLimit(request: NextRequest): AppError {
    return this.createError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many requests',
      429,
      {
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      }
    );
  }

  // Convert error to response
  toResponse(error: AppError): NextResponse {
    const responseBody = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp,
        requestId: error.requestId,
      },
    };

    // Add stack trace in development
    if (!this.isProduction && error.stack) {
      (responseBody.error as any).stack = error.stack;
    }

    return NextResponse.json(responseBody, {
      status: error.statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...(error.requestId && { 'X-Request-ID': error.requestId }),
      },
    });
  }

  // Log error to console/file
  private logError(error: AppError, originalError?: Error) {
    const logLevel = this.getLogLevel(error.statusCode);
    const logData = {
      level: logLevel,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      timestamp: error.timestamp,
      requestId: error.requestId,
      userId: error.userId,
      details: error.details,
      stack: error.stack,
      originalError: originalError?.message,
    };

    // In production, you might want to send to a logging service
    // like DataDog, LogRocket, or your own logging endpoint
    if (this.isProduction) {
      // Send to production logging service
      console.error(JSON.stringify(logData));
    } else {
      // Development logging with colors
      console.error(`❌ [${logLevel.toUpperCase()}] ${error.code}:`, {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        stack: error.stack,
      });
    }
  }

  // Determine log level based on status code
  private getLogLevel(statusCode: number): string {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    if (statusCode >= 300) return 'info';
    return 'debug';
  }

  // Add request context to error
  addRequestContext(error: AppError, request: NextRequest, userId?: string): AppError {
    error.requestId = request.headers.get('x-request-id') ||
                      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    error.userId = userId;

    return error;
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Helper functions
export function createDatabaseError(error: any): AppError {
  return errorHandler.handleDatabaseError(error);
}

export function createValidationError(error: any): AppError {
  return errorHandler.handleValidationError(error);
}

export function createAuthError(error: any): AppError {
  return errorHandler.handleAuthError(error);
}

export function createPermissionError(resource?: string, action?: string): AppError {
  return errorHandler.handlePermissionError(resource, action);
}

export function createFileError(error: any): AppError {
  return errorHandler.handleFileError(error);
}

export function createExternalServiceError(service: string, error: any): AppError {
  return errorHandler.handleExternalServiceError(service, error);
}

export function createRateLimitError(request: NextRequest): AppError {
  return errorHandler.handleRateLimit(request);
}

// Generic error wrapper for API routes
export function withErrorHandling(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      let appError: AppError;

      if (error instanceof Error && 'code' in error) {
        // Already an AppError
        appError = error as unknown as AppError;
      } else if ((error as any)?.name === 'ZodError') {
        appError = createValidationError(error);
      } else if ((error as any)?.code?.startsWith('P')) {
        appError = createDatabaseError(error);
      } else {
        appError = errorHandler.createError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          'An unexpected error occurred',
          500,
          undefined,
          error as Error
        );
      }

      // Add request context
      errorHandler.addRequestContext(appError, request);

      return errorHandler.toResponse(appError);
    }
  };
}

// Error boundary for React components
export class AppErrorBoundary {
  static captureException(error: Error, context?: any) {
    const appError = errorHandler.createError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      error.message,
      500,
      context,
      error
    );

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service like Sentry
      console.error('Error captured:', appError);
    } else {
      console.error('Error boundary caught:', error);
    }

    return appError;
  }
}