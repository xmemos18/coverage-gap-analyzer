'use server';

/**
 * Server-only database access for SLCSP lookups
 *
 * This file contains database queries that must only run on the server.
 * Separated from slcsp-lookup.ts to avoid webpack bundling issues.
 */

import { getDb } from '@/db/client';
import { counties, zipCodeMappings } from '@/db/schema/state-metadata';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import type { SLCSPResult } from './slcsp-lookup';

/**
 * Get SLCSP from database (imported CMS data)
 */
export async function getSLCSPFromDatabase(
  zipCode: string,
  householdSize: number,
  stateCode?: string
): Promise<SLCSPResult | null> {
  try {
    const db = getDb();

    // First, look up the county and rating area from ZIP code
    const zipMapping = await db
      .select({
        countyFips: zipCodeMappings.countyFips,
        stateCode: zipCodeMappings.stateCode,
      })
      .from(zipCodeMappings)
      .where(eq(zipCodeMappings.zipCode, zipCode))
      .limit(1);

    if (!zipMapping || zipMapping.length === 0) {
      logger.debug('ZIP code not found in database', { zipCode });
      return null;
    }

    const zipData = zipMapping[0];
    if (!zipData) {
      return null;
    }

    const { countyFips, stateCode: dbStateCode } = zipData;
    const effectiveStateCode = stateCode || dbStateCode;

    // Now look up the SLCSP premium for this county
    const countyData = await db
      .select({
        slcspPremium: counties.slcspPremium,
        ratingArea: counties.ratingArea,
        countyName: counties.countyName,
      })
      .from(counties)
      .where(
        and(
          eq(counties.countyFips, countyFips),
          eq(counties.stateCode, effectiveStateCode)
        )
      )
      .limit(1);

    if (!countyData || countyData.length === 0) {
      logger.debug('County SLCSP not found in database', { countyFips, stateCode: effectiveStateCode });
      return null;
    }

    const county = countyData[0];
    if (!county || !county.slcspPremium) {
      logger.debug('County SLCSP premium not available', { countyFips, stateCode: effectiveStateCode });
      return null;
    }

    // SLCSP in database is per-person baseline (age 21)
    // For household, we multiply by household size (this is an approximation)
    // Ideally we'd apply age rating, but that's Phase 3
    const basePremium = parseFloat(county.slcspPremium);
    const monthlyPremium = basePremium * householdSize;

    logger.info('Found SLCSP in database', {
      zipCode,
      countyFips,
      ratingArea: county.ratingArea,
      basePremium,
      monthlyPremium,
      householdSize,
    });

    return {
      monthlyPremium,
      isEstimate: false, // This is real CMS data!
      source: 'database',
      ratingArea: county.ratingArea,
      planName: `${county.countyName} SLCSP (CMS Data)`,
    };
  } catch (error) {
    logger.error('Error querying database for SLCSP', { error, zipCode });
    return null;
  }
}
