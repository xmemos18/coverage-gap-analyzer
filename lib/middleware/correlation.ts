/**
 * Correlation ID Middleware
 * Adds unique correlation IDs to requests for distributed tracing and debugging
 * @module lib/middleware/correlation
 */

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Correlation ID header name
 */
export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Get or generate correlation ID from request
 *
 * @param request - Next.js request object
 * @returns Correlation ID (existing or newly generated)
 *
 * @example
 * ```typescript
 * const correlationId = getCorrelationId(request);
 * logger.info('Processing request', { correlationId });
 * ```
 */
export function getCorrelationId(request: NextRequest): string {
  // Check if correlation ID already exists in headers
  const existingId = request.headers.get(CORRELATION_ID_HEADER);
  if (existingId) {
    return existingId;
  }

  // Generate new correlation ID
  return randomUUID();
}

/**
 * Add correlation ID to response headers
 *
 * @param response - Next.js response object
 * @param correlationId - Correlation ID to add
 * @returns Modified response with correlation ID header
 *
 * @example
 * ```typescript
 * let response = NextResponse.json({ data: 'value' });
 * response = addCorrelationIdToResponse(response, correlationId);
 * ```
 */
export function addCorrelationIdToResponse(
  response: NextResponse,
  correlationId: string
): NextResponse {
  response.headers.set(CORRELATION_ID_HEADER, correlationId);
  return response;
}

/**
 * Wrap API handler with correlation ID support
 *
 * @param handler - API route handler function
 * @returns Wrapped handler with correlation ID support
 *
 * @example
 * ```typescript
 * export const GET = withCorrelationId(async (request, context) => {
 *   const correlationId = getCorrelationId(request);
 *   logger.info('Processing GET request', { correlationId });
 *
 *   return NextResponse.json({ data: 'value' });
 * });
 * ```
 */
export function withCorrelationId<T = unknown>(
  handler: (
    request: NextRequest,
    context?: { params: T }
  ) => Promise<NextResponse> | NextResponse
) {
  return async (
    request: NextRequest,
    context?: { params: T }
  ): Promise<NextResponse> => {
    const correlationId = getCorrelationId(request);

    try {
      // Call the original handler
      const response = await handler(request, context);

      // Add correlation ID to response
      return addCorrelationIdToResponse(response, correlationId);
    } catch (error) {
      // Log error with correlation ID
      logger.error('API handler error', {
        correlationId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        path: request.nextUrl.pathname,
        method: request.method,
      });

      // Return error response with correlation ID
      const errorResponse = NextResponse.json(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          correlationId,
        },
        { status: 500 }
      );

      return addCorrelationIdToResponse(errorResponse, correlationId);
    }
  };
}

/**
 * Create logger context with correlation ID
 *
 * @param correlationId - Correlation ID
 * @param additionalContext - Additional context to include
 * @returns Logger context object
 *
 * @example
 * ```typescript
 * const context = createLoggerContext(correlationId, { userId: '123' });
 * logger.info('User action', context);
 * ```
 */
export function createLoggerContext(
  correlationId: string,
  additionalContext?: Record<string, unknown>
): Record<string, unknown> {
  return {
    correlationId,
    ...additionalContext,
  };
}

/**
 * Extract correlation ID from error response
 *
 * @param response - Response object
 * @returns Correlation ID if present, null otherwise
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/endpoint');
 * const correlationId = extractCorrelationIdFromResponse(response);
 * console.log('Request failed with correlation ID:', correlationId);
 * ```
 */
export function extractCorrelationIdFromResponse(
  response: Response
): string | null {
  return response.headers.get(CORRELATION_ID_HEADER);
}

/**
 * Format correlation ID for display
 *
 * @param correlationId - Full correlation ID (UUID)
 * @returns Shortened correlation ID for display (first 8 characters)
 *
 * @example
 * ```typescript
 * const fullId = '550e8400-e29b-41d4-a716-446655440000';
 * const shortId = formatCorrelationId(fullId); // '550e8400'
 * ```
 */
export function formatCorrelationId(correlationId: string): string {
  return correlationId.substring(0, 8);
}

/**
 * Correlation ID context for use in React components
 */
export interface CorrelationContext {
  correlationId: string;
  shortId: string;
}

/**
 * Create correlation context from response
 *
 * @param response - Fetch response
 * @returns Correlation context or null
 */
export function createCorrelationContext(
  response: Response
): CorrelationContext | null {
  const correlationId = extractCorrelationIdFromResponse(response);
  if (!correlationId) {
    return null;
  }

  return {
    correlationId,
    shortId: formatCorrelationId(correlationId),
  };
}
