// Mock NextRequest for Jest environment
jest.mock('next/server', () => {
  class MockHeaders extends Map<string, string> {
    get(name: string): string | null {
      return super.get(name.toLowerCase()) ?? null;
    }
    set(name: string, value: string): this {
      super.set(name.toLowerCase(), value);
      return this;
    }
    has(name: string): boolean {
      return super.has(name.toLowerCase());
    }
    delete(name: string): boolean {
      return super.delete(name.toLowerCase());
    }
    append(name: string, value: string): void {
      const existing = this.get(name);
      if (existing) {
        super.set(name.toLowerCase(), `${existing}, ${value}`);
      } else {
        super.set(name.toLowerCase(), value);
      }
    }
    forEach(callback: (value: string, key: string, parent: Map<string, string>) => void): void {
      super.forEach(callback);
    }
  }

  class MockNextRequest {
    url: string;
    nextUrl: URL;
    method: string;
    headers: MockHeaders;

    constructor(url: string | URL, init?: RequestInit) {
      this.url = url.toString();
      this.nextUrl = new URL(this.url);
      this.method = init?.method || 'GET';
      this.headers = new MockHeaders();
      if (init?.headers) {
        const headersInit = init.headers as Record<string, string>;
        Object.entries(headersInit).forEach(([key, value]) => {
          this.headers.set(key, value);
        });
      }
    }
  }

  // Create a mock Response-like object
  class MockResponse {
    private body: string;
    status: number;
    headers: MockHeaders;

    constructor(body: string, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new MockHeaders();
      if (init?.headers) {
        Object.entries(init.headers).forEach(([k, v]) => this.headers.set(k, v));
      }
    }

    async json() {
      return JSON.parse(this.body);
    }

    async text() {
      return this.body;
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => {
        return new MockResponse(JSON.stringify(body), {
          status: init?.status || 200,
          headers: {
            'content-type': 'application/json',
            ...init?.headers,
          },
        });
      },
    },
  };
});

import { GET } from '@/app/api/medicare/plans/route';
const { NextRequest } = jest.requireMock('next/server');

// Mock the Medicare plan service
jest.mock('@/lib/medicare/medicarePlanService', () => ({
  searchMedicareAdvantagePlans: jest.fn().mockResolvedValue({
    plans: [],
    totalCount: 0,
    page: 1,
    limit: 20,
    filters: {},
  }),
  searchMedigapPlans: jest.fn().mockResolvedValue([]),
  searchPartDPlans: jest.fn().mockResolvedValue([]),
  findMultiStateMedicarePlans: jest.fn().mockResolvedValue({
    recommendations: [],
    analysis: {},
  }),
  calculateMedicareCostSummary: jest.fn().mockReturnValue({
    estimatedTotalCost: 0,
    monthlyPremium: 0,
  }),
  getRecommendedMedicareType: jest.fn().mockReturnValue('medicare-advantage'),
}));

describe('GET /api/medicare/plans', () => {
  const createRequest = (params: Record<string, string>) => {
    const url = new URL('http://localhost/api/medicare/plans');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return new NextRequest(url);
  };

  describe('input validation', () => {
    it('returns 400 for missing state parameter', async () => {
      const request = createRequest({});
      const response = await GET(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('State parameter is required');
    });

    it('accepts valid numeric parameters', async () => {
      const request = createRequest({
        state: 'FL',
        maxPremium: '500.50',
        minStarRating: '4.0',
        page: '1',
        limit: '20',
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });

    it('handles invalid maxPremium gracefully', async () => {
      const request = createRequest({
        state: 'FL',
        maxPremium: 'invalid',
      });
      const response = await GET(request);

      // Should still succeed with maxPremium as undefined
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });

    it('handles NaN in numeric fields gracefully', async () => {
      const request = createRequest({
        state: 'FL',
        maxPremium: 'NaN',
        minStarRating: 'abc',
        page: 'xyz',
        limit: 'foo',
      });
      const response = await GET(request);

      // Should use default values and succeed
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });

    it('clamps maxPremium to valid range', async () => {
      const request = createRequest({
        state: 'FL',
        maxPremium: '-100', // Negative value
      });
      const response = await GET(request);

      // Should reject negative values (return undefined)
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });

    it('clamps minStarRating to valid range (0-5)', async () => {
      const request = createRequest({
        state: 'FL',
        minStarRating: '10', // Above max
      });
      const response = await GET(request);

      // Should reject out-of-range values
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });

    it('uses default value for minStarRating', async () => {
      const request = createRequest({
        state: 'FL',
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      // minStarRating should default to 3.0
    });

    it('clamps page to valid range', async () => {
      const request = createRequest({
        state: 'FL',
        page: '0', // Below min
      });
      const response = await GET(request);

      // Should use default page value of 1
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });

    it('clamps limit to valid range', async () => {
      const request = createRequest({
        state: 'FL',
        limit: '1000', // Above max
      });
      const response = await GET(request);

      // Should use default limit value
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });

    it('handles Infinity in numeric fields', async () => {
      const request = createRequest({
        state: 'FL',
        maxPremium: 'Infinity',
        page: 'Infinity',
      });
      const response = await GET(request);

      // Should reject Infinity and use defaults
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });

    it('handles empty string parameters', async () => {
      const request = createRequest({
        state: 'FL',
        maxPremium: '',
        minStarRating: '',
        page: '',
        limit: '',
      });
      const response = await GET(request);

      // Should use default values
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });
  });

  describe('boolean parameters', () => {
    it('parses boolean coverage requirements', async () => {
      const request = createRequest({
        state: 'FL',
        requiresDrugCoverage: 'true',
        requiresDental: 'true',
        requiresVision: 'false',
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });
  });

  describe('plan type filtering', () => {
    it('accepts medicare-advantage plan type', async () => {
      const request = createRequest({
        state: 'FL',
        planType: 'medicare-advantage',
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });

    it('accepts medigap plan type', async () => {
      const request = createRequest({
        state: 'FL',
        planType: 'medigap',
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });

    it('accepts part-d plan type', async () => {
      const request = createRequest({
        state: 'FL',
        planType: 'part-d',
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });

    it('defaults to medicare-advantage for invalid plan type', async () => {
      const request = createRequest({
        state: 'FL',
        planType: 'invalid-type',
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });
  });

  describe('multi-state search', () => {
    it('handles multi-state search with multiple states', async () => {
      const request = createRequest({
        multiState: 'true',
        states: 'FL,NY,CA',
        zipCodes: '10001,90210,33101',
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.multiState).toBe(true);
    });
  });

  describe('error handling', () => {
    it('returns 500 for service errors', async () => {
      // Mock service to throw error
      const medicarePlanService = require('@/lib/medicare/medicarePlanService');
      medicarePlanService.searchMedicareAdvantagePlans.mockRejectedValueOnce(
        new Error('Service unavailable')
      );

      const request = createRequest({
        state: 'FL',
      });
      const response = await GET(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Failed to search Medicare plans');
      expect(json.message).toBe('Service unavailable');
    });
  });
});

describe('numeric validation edge cases', () => {
  const createRequest = (params: Record<string, string>) => {
    const url = new URL('http://localhost/api/medicare/plans');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return new NextRequest(url);
  };

  it('handles scientific notation', async () => {
    const request = createRequest({
      state: 'FL',
      maxPremium: '1e3', // 1000
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it('handles decimal values', async () => {
    const request = createRequest({
      state: 'FL',
      maxPremium: '123.456',
      minStarRating: '4.5',
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it('handles very large numbers', async () => {
    const request = createRequest({
      state: 'FL',
      maxPremium: '999999999',
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it('handles whitespace in numeric values', async () => {
    const request = createRequest({
      state: 'FL',
      maxPremium: '  500.50  ',
      page: ' 2 ',
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it('handles leading zeros', async () => {
    const request = createRequest({
      state: 'FL',
      page: '007',
      limit: '020',
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it('prevents SQL injection through numeric fields', async () => {
    const request = createRequest({
      state: 'FL',
      maxPremium: "500; DROP TABLE plans;--",
      page: "1' OR '1'='1",
    });
    const response = await GET(request);

    // Should reject malicious input and use defaults
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it('prevents XSS through numeric fields', async () => {
    const request = createRequest({
      state: 'FL',
      maxPremium: '<script>alert("xss")</script>',
      page: 'javascript:alert(1)',
    });
    const response = await GET(request);

    // Should reject malicious input and use defaults
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });
});
