/**
 * Drug Search API Route
 * GET /api/drugs/search
 *
 * Search for drug information using the FDA openFDA API.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  searchDrugs,
  searchDrugsByName,
  getDrugByNDC,
  getDrugInteractions,
  estimateDrugTier,
} from '@/lib/drugs';
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
    const name = searchParams.get('name') || undefined;
    const brandName = searchParams.get('brandName') || undefined;
    const genericName = searchParams.get('genericName') || undefined;
    const ndc = searchParams.get('ndc') || undefined;
    const manufacturer = searchParams.get('manufacturer') || undefined;
    const drugClass = searchParams.get('drugClass') || undefined;
    const includeInteractions = searchParams.get('includeInteractions') === 'true';

    // Pagination
    const limit = safeParseInt(searchParams.get('limit'), {
      min: 1,
      max: 100,
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

    // If NDC is provided, do a direct lookup
    if (ndc) {
      const drug = await getDrugByNDC(ndc);

      if (!drug) {
        return NextResponse.json(
          {
            success: false,
            error: 'Drug not found',
            message: `No drug found with NDC ${ndc}`,
          },
          { status: 404 }
        );
      }

      // Optionally get interactions
      let interactions: string[] = [];
      let warnings: string[] = [];

      if (includeInteractions) {
        const drugName = drug.genericNames[0] || drug.brandNames[0];
        if (drugName) {
          const interactionsData = await getDrugInteractions(drugName);
          interactions = interactionsData.interactions;
          warnings = interactionsData.warnings;
        }
      }

      return NextResponse.json({
        success: true,
        drug: {
          ...drug,
          estimatedTier: estimateDrugTier(drug),
          interactions,
          warnings,
        },
        totalCount: 1,
      });
    }

    // Validate at least one search parameter is provided
    if (!name && !brandName && !genericName && !manufacturer && !drugClass) {
      return NextResponse.json(
        {
          error: 'Missing search parameters',
          message: 'At least one search parameter is required (name, brandName, genericName, manufacturer, or drugClass)',
        },
        { status: 400 }
      );
    }

    // Search for drugs
    let result;

    if (name && !brandName && !genericName && !manufacturer && !drugClass) {
      // Simple name search
      result = await searchDrugsByName(name, limit);
    } else {
      // Advanced search
      result = await searchDrugs({
        name,
        brandName,
        genericName,
        manufacturer,
        drugClass,
        limit,
        skip,
      });
    }

    // Add estimated tier to each drug
    const drugsWithTier = result.drugs.map((drug) => ({
      ...drug,
      estimatedTier: estimateDrugTier(drug),
    }));

    logger.info('[Drug Search] Results', createLoggerContext(correlationId, {
      searchParams: { name, brandName, genericName, manufacturer, drugClass },
      resultCount: result.drugs.length,
      totalCount: result.totalCount,
    }));

    return NextResponse.json({
      success: true,
      drugs: drugsWithTier,
      totalCount: result.totalCount,
      pagination: {
        limit,
        skip,
        hasMore: result.totalCount > skip + result.drugs.length,
      },
    });
  } catch (error) {
    logger.error('[Drug Search] Error', createLoggerContext(correlationId, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }));

    // Handle FDA API errors gracefully
    if (error instanceof Error && error.message.includes('FDA API error')) {
      return NextResponse.json(
        {
          error: 'Drug search service unavailable',
          message: 'The FDA API is currently unavailable. Please try again later.',
          correlationId,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to search drugs',
        message: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      },
      { status: 500 }
    );
  }
}

export const GET = handleGET;
