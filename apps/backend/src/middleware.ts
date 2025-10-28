import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

// Request ID middleware
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.requestId = uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
}

// Custom logging format with request ID
morgan.token('request-id', (req: Request) => req.requestId || 'unknown');
morgan.token('body', (req: Request) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const body = { ...req.body };
    // Redact sensitive fields
    if (body.apiKey) body.apiKey = '[REDACTED]';
    if (body.password) body.password = '[REDACTED]';
    return JSON.stringify(body);
  }
  return '';
});

// Request logging middleware
export const requestLogger = morgan(
  ':request-id :method :url :status :response-time ms - :res[content-length] :body',
  {
    skip: req => {
      // Skip logging for health checks and SSE connections
      return req.url === '/health' || req.url.startsWith('/progress/');
    },
  },
);

// Rate limiting middleware
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: req => {
    // Skip rate limiting for health checks and SSE progress endpoints
    return req.url === '/health' || req.url?.startsWith('/progress/');
  },
});

// Stricter rate limiting for research endpoint
export const researchRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 research requests per hour
  message: {
    error: 'Too many research requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Error handling middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const requestId = req.requestId || 'unknown';

  console.error(`[${requestId}] Error:`, err);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'An unexpected error occurred',
    requestId,
    ...(isDevelopment && { stack: err.stack }),
  });
}

// 404 handler
export function notFoundHandler(req: Request, res: Response) {
  const requestId = req.requestId || 'unknown';

  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.url} not found`,
    requestId,
  });
}

// Input validation middleware factory
export function validateBody(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: 'Validation error',
          details: result.error.errors,
          requestId: req.requestId,
        });
      }

      // Replace body with validated data
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// CORS configuration
export const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3051',
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
};
