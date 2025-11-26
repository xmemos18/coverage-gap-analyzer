/**
 * Hospital Search API Route
 * GET /api/hospitals/search
 *
 * Search for hospital quality ratings using CMS Hospital Compare data.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  searchHospitals,
  getHospitalById,
  calculateQualityScore,
  getRatingDescription,
} from '@/lib/hospitals';
import { safeParseInt, safeParseFloat } from '@/lib/validation/numeric';
import { getCorrelationId, createLoggerContext } from '@/lib/middleware/correlation';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handleGET(request: NextRequest) {
  const correlationId = getCorrelationId(request);
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const providerId = searchParams.get('providerId') || undefined;
    const name = searchParams.get('name') || undefined;
    const city = searchParams.get('city') || undefined;
    const state = searchParams.get('state') || undefined;
    const zipCode = searchParams.get('zipCode') || searchParams.get('zip') || undefined;
    const type = searchParams.get('type') || undefined;

    // Filters
    const minRating = safeParseFloat(searchParams.get('minRating'), {
      min: 1,
      max: 5,
      fieldName: 'minRating',
      throwOnError: false,
    });

    // Pagination
    const limit = safeParseInt(searchParams.get('limit'), {
      min: 1,
      max: 100,
      defaultValue: 20,
      fieldName: 'limit',
      throwOnError: false,
    }) || 20;

    const offset = safeParseInt(searchParams.get('offset'), {
      min: 0,
      max: 1000,
      defaultValue: 0,
      fieldName: 'offset',
      throwOnError: false,
    }) || 0;

    // If provider ID is provided, do a direct lookup
    if (providerId) {
      const hospital = await getHospitalById(providerId);

      if (!hospital) {
        return NextResponse.json(
          {
            success: false,
            error: 'Hospital not found',
            message: `No hospital found with Provider ID ${providerId}`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        hospital: {
          ...hospital,
          qualityScore: calculateQualityScore(hospital),
          ratingDescription: getRatingDescription(hospital.overallRating),
        },
        totalCount: 1,
      });
    }

    // Validate at least one search parameter is provided
    if (!name && !city && !state && !zipCode) {
      return NextResponse.json(
        {
          error: 'Missing search parameters',
          message: 'At least one search parameter is required (name, city, state, or zipCode)',
        },
        { status: 400 }
      );
    }

    // Search for hospitals
    const result = await searchHospitals({
      name,
      city,
      state,
      zipCode,
      type,
      minRating: minRating ?? undefined,
      limit,
      offset,
    });

    // Add quality scores to each hospital
    const hospitalsWithScores = result.hospitals.map((hospital) => ({
      ...hospital,
      qualityScore: calculateQualityScore(hospital),
      ratingDescription: getRatingDescription(hospital.overallRating),
    }));

    logger.info('[Hospital Search] Results', createLoggerContext(correlationId, {
      searchParams: { name, city, state, zipCode, type, minRating },
      resultCount: result.hospitals.length,
      totalCount: result.totalCount,
    }));

    return NextResponse.json({
      success: true,
      hospitals: hospitalsWithScores,
      totalCount: result.totalCount,
      pagination: {
        limit,
        offset,
        hasMore: result.totalCount > offset + result.hospitals.length,
      },
    });
  } catch (error) {
    logger.error('[Hospital Search] Error', createLoggerContext(correlationId, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }));

    // Handle CMS API errors gracefully
    if (error instanceof Error && error.message.includes('CMS API error')) {
      return NextResponse.json(
        {
          error: 'Hospital search service unavailable',
          message: 'The CMS Hospital Compare API is currently unavailable. Please try again later.',
          correlationId,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to search hospitals',
        message: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      },
      { status: 500 }
    );
  }
}

export const GET = handleGET;
