// Production configuration and utilities
import { PrismaClient } from '../generated/prisma';

// Prisma client with environment-specific configuration
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;


// Environment validation
export const validateEnvironment = () => {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate database URL format
  if (process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.DATABASE_URL.startsWith('postgresql://') &&
          !process.env.DATABASE_URL.startsWith('postgres://')) {
        throw new Error('Production DATABASE_URL must use PostgreSQL');
      }
    }
  }
};

// Security headers for production
export const getSecurityHeaders = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    return {};
  }

  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  };
};

// Rate limiting configuration for production
export const getRateLimitConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: isProduction ? 100 : 1000, // More permissive in development
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  };
};

// Logging configuration
export const getLoggingConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    level: isProduction ? 'warn' : 'info',
    format: isProduction ? 'json' : 'dev',
    enableConsole: !isProduction,
    enableFile: isProduction,
    logDirectory: process.env.LOG_DIR || './logs',
  };
};

// Feature flags
export const getFeatureFlags = () => {
  return {
    enableAuditLog: process.env.ENABLE_AUDIT_LOG === 'true',
    enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
    enableRealTimeUpdates: process.env.ENABLE_REALTIME === 'true',
    enableFileUploads: process.env.ENABLE_FILE_UPLOADS === 'true',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'application/pdf'],
  };
};

// Database connection health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

// Graceful shutdown
export const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);

  try {
    await prisma.$disconnect();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
  }

  process.exit(0);
};

// Set up graceful shutdown handlers
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}