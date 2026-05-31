/**
 * Error Drilldown API - Breakdown (Level 2)
 * 
 * Returns calls for a specific error type with detailed context
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DrilldownApiResponse, DrilldownCallData } from '@/types/drilldown';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const errorType = searchParams.get('errorType');

    if (!errorType) {
      return NextResponse.json(
        {
          success: false,
          error: 'errorType parameter is required',
          data: null,
        } as DrilldownApiResponse,
        { status: 400 }
      );
    }

    // Get error type info - should match the categorization in overview API
    const getErrorInfo = (errorType: string): { category: string; description: string } => {
      if (errorType === 'System Error') return { category: 'System', description: 'Technical or system-level failures' };
      if (errorType === 'Understanding Error') return { category: 'Intent', description: 'Bot failed to understand user input' };
      if (errorType === 'Data Error') return { category: 'Data', description: 'Missing or unavailable data' };
      if (errorType === 'Performance Error') return { category: 'Performance', description: 'Timeout or performance issues' };
      if (errorType.includes('Fallback') || errorType.includes('Unknown')) return { category: 'Understanding', description: 'Intent recognition failures' };
      return { category: 'Other', description: 'Other technical errors' };
    };

    const errorInfo = getErrorInfo(errorType);

    // Get distinct call IDs that have this specific error type
    // Using the same categorization logic as overview
    const errorCallsQuery = `
      WITH ErrorTurns AS (
        SELECT DISTINCT
          ct.callId,
          COALESCE(
            NULLIF(ct.intentCategory, ''),
            CASE 
              WHEN ct.botOutput LIKE '%error%' OR ct.botOutput LIKE '%issue%' THEN 'System Error'
              WHEN ct.botOutput LIKE '%not understand%' OR ct.botOutput LIKE '%unclear%' THEN 'Understanding Error'
              WHEN ct.botOutput LIKE '%not found%' OR ct.botOutput LIKE '%cannot find%' THEN 'Data Error'
              WHEN ct.botOutput LIKE '%timeout%' OR ct.botOutput LIKE '%slow%' THEN 'Performance Error'
              ELSE 'General Error'
            END
          ) AS errorType
        FROM TeneoMemory.vw_ConversationTurnsEnriched ct
        WHERE ct.isError IN ('True', '1', 1)
      )
      SELECT DISTINCT callId
      FROM ErrorTurns
      WHERE errorType = @errorType
    `;

    const errorCalls = await query(errorCallsQuery, { errorType });
    
    if (errorCalls.length === 0) {
      // Return empty result if no calls found
      const response: DrilldownApiResponse = {
        success: true,
        data: {
          errorType: errorType,
          errorCategory: errorInfo.category,
          errorDescription: errorInfo.description,
          errorCount: 0,
          calls: [],
        },
        metadata: {
          totalCount: 0,
          cached: false,
          timestamp: new Date().toISOString(),
        },
      };
      return NextResponse.json(response);
    }

    // Get call details for these callIds
    const callIds = errorCalls.map((row: any) => row.callId);
    const placeholders = callIds.map((_, i) => `@callId${i}`).join(',');
    
    const callDetailsParams: Record<string, any> = {};
    callIds.forEach((id: string, i: number) => {
      callDetailsParams[`callId${i}`] = id;
    });

    const callsQuery = `
      SELECT 
        c.call_id AS callId,
        c.call_id AS sessionId,
        TRY_CAST(c.call_start_timestamp AS DATE) AS callDate,
        c.call_start_timestamp AS callStartTime,
        c.channel AS channel,
        CAST(c.duration_seconds AS INT) AS duration,
        CAST(c.total_turns AS INT) AS totalTurns,
        c.avg_satisfaction_score AS customerSentiment,
        c.initial_sentiment_category AS initialSentiment,
        c.final_sentiment_category AS finalSentiment,
        CASE WHEN c.successful_resolution IN ('True', '1') THEN 'Resolved' ELSE 'Unresolved' END AS resolutionStatus,
        CASE WHEN c.successful_resolution IN ('True', '1') THEN 1 ELSE 0 END AS successfulResolution,
        CAST(c.error_count AS INT) AS errorCount
      FROM [TeneoMemory].[Sessions] c
      WHERE c.call_id IN (${placeholders})
      ORDER BY c.call_start_timestamp DESC
    `;

    const callsResult = await query(callsQuery, callDetailsParams);

    // Transform to DrilldownCallData format
    const calls: DrilldownCallData[] = callsResult.map((row: any) => ({
      callId: row.callId,
      sessionId: row.sessionId,
      callDate: row.callDate,
      callStartTime: row.callStartTime,
      channel: row.channel,
      duration: row.duration || 0,
      totalTurns: row.totalTurns || 0,
      customerSentiment: row.customerSentiment || 'Neutral',
      initialSentiment: row.initialSentiment,
      finalSentiment: row.finalSentiment,
      callOutcome: row.resolutionStatus || 'Unknown',
      resolutionStatus: row.resolutionStatus,
      successfulResolution: row.successfulResolution === 1,
      metadata: {
        errorCount: row.errorCount || 0,
        errorType: errorType,
        sentimentJourney: `${row.initialSentiment || 'Unknown'} → ${row.finalSentiment || 'Unknown'}`,
      },
    }));

    const response: DrilldownApiResponse = {
      success: true,
      data: {
        errorType: errorType,
        errorCategory: errorInfo.category,
        errorDescription: errorInfo.description,
        errorCount: calls.reduce((sum, c) => sum + (c.metadata?.errorCount || 0), 0),
        calls,
      },
      metadata: {
        totalCount: calls.length,
        cached: false,
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error breakdown API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch error breakdown',
        data: null,
      } as DrilldownApiResponse,
      { status: 500 }
    );
  }
}
