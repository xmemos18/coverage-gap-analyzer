/**
 * Scenario Sharing API Route
 *
 * Provides endpoints for encoding/decoding shareable scenarios.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  encodeScenario,
  decodeScenario,
  isValidEncodedScenario,
  getScenarioSummary,
  ShareableScenarioSchema,
  type ShareableScenario,
} from '@/lib/sharing';
import { logger } from '@/lib/logger';

/**
 * POST /api/share
 * Encode a scenario to a shareable string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate scenario
    const parseResult = ShareableScenarioSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid scenario data',
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const scenario: ShareableScenario = {
      ...parseResult.data,
      ts: parseResult.data.ts || Date.now(),
    };

    const encoded = encodeScenario(scenario);
    const baseUrl = request.headers.get('origin') || '';
    const shareUrl = `${baseUrl}/share/${encoded}`;

    logger.info('[Share API] Scenario encoded', {
      summary: getScenarioSummary(scenario),
      urlLength: shareUrl.length,
    });

    return NextResponse.json({
      success: true,
      encoded,
      shareUrl,
      summary: getScenarioSummary(scenario),
    });
  } catch (error) {
    logger.error('[Share API] Encoding failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to encode scenario' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/share?code={encoded}
 * Decode a shareable string to scenario data
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'Missing code parameter' },
      { status: 400 }
    );
  }

  if (!isValidEncodedScenario(code)) {
    return NextResponse.json(
      { error: 'Invalid or expired share code' },
      { status: 400 }
    );
  }

  try {
    const scenario = decodeScenario(code);

    logger.info('[Share API] Scenario decoded', {
      summary: getScenarioSummary(scenario),
    });

    return NextResponse.json({
      success: true,
      scenario,
      summary: getScenarioSummary(scenario),
    });
  } catch (error) {
    logger.error('[Share API] Decoding failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to decode scenario' },
      { status: 500 }
    );
  }
}
