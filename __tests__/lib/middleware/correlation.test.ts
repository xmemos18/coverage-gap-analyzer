// Mock next/server before importing anything that uses it
jest.mock('next/server', () => {
  // Create a mock Headers class
  class MockHeaders extends Map<string, string> {
    constructor(init?: Record<string, string> | [string, string][]) {
      super();
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.set(key.toLowerCase(), value));
        } else {
          Object.entries(init).forEach(([key, value]) => this.set(key.toLowerCase(), value));
        }
      }
    }
    get(key: string): string | undefined {
      return super.get(key.toLowerCase());
    }
    set(key: string, value: string): this {
      super.set(key.toLowerCase(), value);
      return this;
    }
    has(key: string): boolean {
      return super.has(key.toLowerCase());
    }
  }

  // Create a mock NextRequest class
  class MockNextRequest {
    url: string;
    method: string;
    headers: MockHeaders;
    nextUrl: { pathname: string };
    cookies: { get: jest.Mock };

    constructor(url: string, init?: { method?: string; headers?: Record<string, string> }) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new MockHeaders(init?.headers);
      this.nextUrl = { pathname: new URL(url).pathname };
      this.cookies = { get: jest.fn() };
    }
  }

  // Create mock NextResponse
  const MockNextResponse = {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => {
      const headers = new MockHeaders(init?.headers);
      return {
        status: init?.status || 200,
        headers,
        json: async () => body,
      };
    },
    next: () => ({
      status: 200,
      headers: new MockHeaders(),
    }),
    redirect: (url: URL) => ({
      status: 302,
      headers: new MockHeaders({ location: url.toString() }),
    }),
  };

  return {
    NextRequest: MockNextRequest,
    NextResponse: MockNextResponse,
  };
});

import { NextRequest, NextResponse } from 'next/server';
import {
  getCorrelationId,
  addCorrelationIdToResponse,
  withCorrelationId,
  createLoggerContext,
  extractCorrelationIdFromResponse,
  formatCorrelationId,
  createCorrelationContext,
  CORRELATION_ID_HEADER,
} from '@/lib/middleware/correlation';

// Mock crypto
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Correlation Middleware', () => {
  describe('getCorrelationId', () => {
    it('returns existing correlation ID from headers', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          [CORRELATION_ID_HEADER]: 'existing-id-123',
        },
      });

      const correlationId = getCorrelationId(request);
      expect(correlationId).toBe('existing-id-123');
    });

    it('generates new correlation ID when none exists', () => {
      const request = new NextRequest('http://localhost/api/test');

      const correlationId = getCorrelationId(request);
      expect(correlationId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('generates valid UUID format', () => {
      const request = new NextRequest('http://localhost/api/test');

      const correlationId = getCorrelationId(request);
      expect(correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });

  describe('addCorrelationIdToResponse', () => {
    it('adds correlation ID to response headers', () => {
      const response = NextResponse.json({ data: 'test' });
      const correlationId = '550e8400-e29b-41d4-a716-446655440000';

      const modifiedResponse = addCorrelationIdToResponse(response, correlationId);

      expect(modifiedResponse.headers.get(CORRELATION_ID_HEADER)).toBe(correlationId);
    });

    it('overwrites existing correlation ID', () => {
      const response = NextResponse.json({ data: 'test' });
      response.headers.set(CORRELATION_ID_HEADER, 'old-id');

      const newId = 'new-id-123';
      const modifiedResponse = addCorrelationIdToResponse(response, newId);

      expect(modifiedResponse.headers.get(CORRELATION_ID_HEADER)).toBe(newId);
    });
  });

  describe('withCorrelationId', () => {
    it('wraps handler and adds correlation ID to response', async () => {
      const handler = jest.fn(async () => NextResponse.json({ data: 'test' }));
      const wrappedHandler = withCorrelationId(handler);

      const request = new NextRequest('http://localhost/api/test');
      const response = await wrappedHandler(request);

      expect(handler).toHaveBeenCalledWith(request, undefined);
      expect(response.headers.get(CORRELATION_ID_HEADER)).toBeTruthy();
    });

    it('uses existing correlation ID from request', async () => {
      const handler = jest.fn(async () => NextResponse.json({ data: 'test' }));
      const wrappedHandler = withCorrelationId(handler);

      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          [CORRELATION_ID_HEADER]: 'existing-id-456',
        },
      });
      const response = await wrappedHandler(request);

      expect(response.headers.get(CORRELATION_ID_HEADER)).toBe('existing-id-456');
    });

    it('catches errors and includes correlation ID in error response', async () => {
      const error = new Error('Test error');
      const handler = jest.fn(async () => {
        throw error;
      });
      const wrappedHandler = withCorrelationId(handler);

      const request = new NextRequest('http://localhost/api/test');
      const response = await wrappedHandler(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Internal server error');
      expect(body.correlationId).toBeTruthy();
      expect(response.headers.get(CORRELATION_ID_HEADER)).toBeTruthy();
    });

    it('logs errors with correlation ID', async () => {
      const logger = require('@/lib/logger').logger;
      const error = new Error('Test error');
      const handler = jest.fn(async () => {
        throw error;
      });
      const wrappedHandler = withCorrelationId(handler);

      const request = new NextRequest('http://localhost/api/test');
      await wrappedHandler(request);

      expect(logger.error).toHaveBeenCalledWith(
        'API handler error',
        expect.objectContaining({
          correlationId: expect.any(String),
          error: 'Test error',
          path: '/api/test',
          method: 'GET',
        })
      );
    });

    it('passes context to handler', async () => {
      const handler = jest.fn(async (_req, context) => {
        return NextResponse.json({ params: context?.params });
      });
      const wrappedHandler = withCorrelationId(handler);

      const request = new NextRequest('http://localhost/api/test');
      const context = { params: { id: '123' } };
      await wrappedHandler(request, context);

      expect(handler).toHaveBeenCalledWith(request, context);
    });
  });

  describe('createLoggerContext', () => {
    it('creates context with correlation ID', () => {
      const context = createLoggerContext('test-id-789');

      expect(context).toEqual({
        correlationId: 'test-id-789',
      });
    });

    it('includes additional context', () => {
      const context = createLoggerContext('test-id-789', {
        userId: '123',
        action: 'update',
      });

      expect(context).toEqual({
        correlationId: 'test-id-789',
        userId: '123',
        action: 'update',
      });
    });

    it('handles empty additional context', () => {
      const context = createLoggerContext('test-id-789', {});

      expect(context).toEqual({
        correlationId: 'test-id-789',
      });
    });
  });

  describe('extractCorrelationIdFromResponse', () => {
    it('extracts correlation ID from response headers', () => {
      // Create a mock response with proper headers
      const response = {
        headers: {
          get: (name: string) => name === CORRELATION_ID_HEADER ? 'response-id-123' : null
        }
      } as unknown as Response;

      const correlationId = extractCorrelationIdFromResponse(response);
      expect(correlationId).toBe('response-id-123');
    });

    it('returns null when correlation ID is not present', () => {
      // Create a mock response with empty headers
      const response = {
        headers: {
          get: () => null
        }
      } as unknown as Response;

      const correlationId = extractCorrelationIdFromResponse(response);
      expect(correlationId).toBeNull();
    });
  });

  describe('formatCorrelationId', () => {
    it('shortens UUID to first 8 characters', () => {
      const fullId = '550e8400-e29b-41d4-a716-446655440000';
      const shortId = formatCorrelationId(fullId);

      expect(shortId).toBe('550e8400');
    });

    it('handles short IDs', () => {
      const shortId = formatCorrelationId('abc123');
      expect(shortId).toBe('abc123');
    });

    it('handles empty string', () => {
      const shortId = formatCorrelationId('');
      expect(shortId).toBe('');
    });
  });

  describe('createCorrelationContext', () => {
    it('creates context from response', () => {
      // Create a mock response with proper headers
      const response = {
        headers: {
          get: (name: string) => name === CORRELATION_ID_HEADER ? '550e8400-e29b-41d4-a716-446655440000' : null
        }
      } as unknown as Response;

      const context = createCorrelationContext(response);

      expect(context).toEqual({
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        shortId: '550e8400',
      });
    });

    it('returns null when correlation ID is not present', () => {
      // Create a mock response with empty headers
      const response = {
        headers: {
          get: () => null
        }
      } as unknown as Response;

      const context = createCorrelationContext(response);
      expect(context).toBeNull();
    });
  });

  describe('CORRELATION_ID_HEADER', () => {
    it('has correct header name', () => {
      expect(CORRELATION_ID_HEADER).toBe('x-correlation-id');
    });
  });

  describe('Integration', () => {
    it('complete flow: generate ID, add to response, extract, format', async () => {
      // Create handler
      const handler = withCorrelationId(async (request) => {
        const correlationId = getCorrelationId(request);
        return NextResponse.json({ correlationId });
      });

      // Make request
      const request = new NextRequest('http://localhost/api/test');
      const response = await handler(request);

      // Extract correlation ID
      const correlationId = extractCorrelationIdFromResponse(response);
      expect(correlationId).toBeTruthy();

      // Format for display
      const shortId = formatCorrelationId(correlationId!);
      expect(shortId).toHaveLength(8);

      // Verify response body includes ID
      const body = await response.json();
      expect(body.correlationId).toBe(correlationId);
    });

    it('preserves correlation ID across multiple operations', async () => {
      const initialId = '550e8400-e29b-41d4-a716-446655440000';

      // First handler
      const handler1 = withCorrelationId(async (request) => {
        const correlationId = getCorrelationId(request);
        return NextResponse.json({ step: 1, correlationId });
      });

      // Second handler (simulating chained request)
      const handler2 = withCorrelationId(async (request) => {
        const correlationId = getCorrelationId(request);
        return NextResponse.json({ step: 2, correlationId });
      });

      // First request with explicit ID
      const request1 = new NextRequest('http://localhost/api/step1', {
        headers: {
          [CORRELATION_ID_HEADER]: initialId,
        },
      });
      const response1 = await handler1(request1);
      const id1 = extractCorrelationIdFromResponse(response1);

      // Second request using ID from first response
      const request2 = new NextRequest('http://localhost/api/step2', {
        headers: {
          [CORRELATION_ID_HEADER]: id1!,
        },
      });
      const response2 = await handler2(request2);
      const id2 = extractCorrelationIdFromResponse(response2);

      // Correlation ID should be preserved
      expect(id1).toBe(initialId);
      expect(id2).toBe(initialId);
    });
  });
});
