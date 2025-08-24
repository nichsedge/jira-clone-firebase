// API middleware for validation, error handling, and security
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Rate limiting store (in-memory for development)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // Limit each IP to 100 requests per windowMs
};

// Zod error formatter
export function formatZodError(error: z.ZodError): ApiError {
  return {
    message: 'Validation error',
    code: 'VALIDATION_ERROR',
    details: error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    })),
  };
}

// Rate limiting middleware
export function rateLimit(request: NextRequest): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'anonymous';

  const now = Date.now();
  const windowStart = now - RATE_LIMIT.windowMs;

  const userRequests = rateLimitStore.get(ip) || { count: 0, resetTime: now + RATE_LIMIT.windowMs };

  // Clean up old entries
  if (userRequests.resetTime < now) {
    userRequests.count = 0;
    userRequests.resetTime = now + RATE_LIMIT.windowMs;
  }

  if (userRequests.count >= RATE_LIMIT.maxRequests) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((userRequests.resetTime - now) / 1000).toString(),
        },
      }
    );
  }

  userRequests.count++;
  rateLimitStore.set(ip, userRequests);

  return null; // Continue to next middleware
}

// CORS middleware
export function corsMiddleware(request: NextRequest): NextResponse | null {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return null; // Continue to handler
}

// Authentication middleware
export function authMiddleware(request: NextRequest): NextResponse | null {
  // For now, we'll allow all requests
  // In production, you'd check for valid sessions/tokens
  return null;
}

// Global error handler
export function handleApiError(error: any): NextResponse {
  console.error('API Error:', error);

  // Handle different types of errors
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { success: false, error: formatZodError(error) },
      { status: 400 }
    );
  }

  if (error?.code === 'P2002') {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'A record with this information already exists',
          code: 'DUPLICATE_RECORD',
        },
      },
      { status: 409 }
    );
  }

  if (error?.code?.startsWith('P')) {
    // Prisma errors
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Database error',
          code: 'DATABASE_ERROR',
        },
      },
      { status: 500 }
    );
  }

  // Generic error
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    },
    { status: 500 }
  );
}

// API response wrapper
export function createApiResponse<T>(
  data: T,
  status: number = 200,
  success: boolean = true
): NextResponse {
  return NextResponse.json(
    { success, data },
    { status }
  );
}

// Middleware chain
export function withMiddleware(
  handler: (request: NextRequest) => Promise<NextResponse>,
  middleware: Array<(request: NextRequest) => NextResponse | null> = []
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Apply middleware in order
      for (const mw of middleware) {
        const response = mw(request);
        if (response) {
          return response;
        }
      }

      // Execute handler
      return await handler(request);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// Common middleware combinations
export const apiMiddleware = [corsMiddleware, rateLimit, authMiddleware];
export const publicApiMiddleware = [corsMiddleware, rateLimit];