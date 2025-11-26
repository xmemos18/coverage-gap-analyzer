/**
 * Provider Search API Route
 * GET /api/providers/search
 *
 * Search for healthcare providers using the CMS NPPES API.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  searchProviders,
  getProviderByNPI,
  searchProvidersBySpecialty,
  validateNPIChecksum,
} from '@/lib/providers';
import { safeParseInt } from '@/lib/validation/numeric';
import { getCorrelationId, createLoggerContext } from '@/lib/middleware/correlation';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handleGET(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const npi = searchParams.get('npi') || undefined;
    const firstName = searchParams.get('firstName') || undefined;
    const lastName = searchParams.get('lastName') || undefined;
    const organizationName = searchParams.get('organizationName') || undefined;
    const specialty = searchParams.get('specialty') || undefined;
    const city = searchParams.get('city') || undefined;
    const state = searchParams.get('state') || undefined;
    const postalCode = searchParams.get('postalCode') || searchParams.get('zipCode') || undefined;

    // Pagination
    const limit = safeParseInt(searchParams.get('limit'), {
      min: 1,
      max: 200,
      defaultValue: 20,
      fieldName: 'limit',
      throwOnError: false,
    }) || 20;

    const skip = safeParseInt(searchParams.get('skip'), {
      min: 0,
      max: 1000,
      defaultValue: 0,
      fieldName: 'skip',
      throwOnError: false,
    }) || 0;

    // If NPI is provided, do a direct lookup
    if (npi) {
      // Validate NPI format
      if (!/^\d{10}$/.test(npi)) {
        return NextResponse.json(
          {
            error: 'Invalid NPI format',
            message: 'NPI must be exactly 10 digits',
          },
          { status: 400 }
        );
      }

      // Validate NPI checksum
      if (!validateNPIChecksum(npi)) {
        return NextResponse.json(
          {
            error: 'Invalid NPI checksum',
            message: 'The NPI provided does not have a valid checksum',
          },
          { status: 400 }
        );
      }

      const provider = await getProviderByNPI(npi);

      if (!provider) {
        return NextResponse.json(
          {
            success: false,
            error: 'Provider not found',
            message: `No provider found with NPI ${npi}`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        provider,
        totalCount: 1,
      });
    }

    // Validate at least one search parameter is provided
    if (!firstName && !lastName && !organizationName && !specialty && !city && !state && !postalCode) {
      return NextResponse.json(
        {
          error: 'Missing search parameters',
          message: 'At least one search parameter is required (firstName, lastName, organizationName, specialty, city, state, or postalCode)',
        },
        { status: 400 }
      );
    }

    // Search for providers
    let result;

    if (specialty && !firstName && !lastName && !organizationName) {
      // Specialty-only search
      result = await searchProvidersBySpecialty(specialty, state, city, limit);
    } else {
      // General search
      result = await searchProviders({
        firstName,
        lastName,
        organizationName,
        taxonomyDescription: specialty,
        city,
        state,
        postalCode,
        limit,
        skip,
      });
    }

    logger.info('[Provider Search] Results', createLoggerContext(correlationId, {
      searchParams: { firstName, lastName, organizationName, specialty, city, state, postalCode },
      resultCount: result.providers.length,
      totalCount: result.totalCount,
    }));

    return NextResponse.json({
      success: true,
      providers: result.providers,
      totalCount: result.totalCount,
      pagination: {
        limit,
        skip,
        hasMore: result.totalCount > skip + result.providers.length,
      },
    });
  } catch (error) {
    logger.error('[Provider Search] Error', createLoggerContext(correlationId, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }));

    // Handle NPPES API errors gracefully
    if (error instanceof Error && error.message.includes('NPPES API error')) {
      return NextResponse.json(
        {
          error: 'Provider search service unavailable',
          message: 'The NPPES API is currently unavailable. Please try again later.',
          correlationId,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to search providers',
        message: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      },
      { status: 500 }
    );
  }
}

export const GET = handleGET;
