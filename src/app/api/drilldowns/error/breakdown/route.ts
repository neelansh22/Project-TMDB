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

    // Get error type description
    const errorDescriptions: Record<string, { category: string; description: string }> = {
      'System Error': { category: 'System', description: 'Technical or system-level failures' },
      'Timeout Error': { category: 'Performance', description: 'Request timeouts or processing delays' },
      'Not Found Error': { category: 'Data', description: 'Missing or unavailable data' },
      'Validation Error': { category: 'Input', description: 'Invalid input or incorrect data format' },
      'Connection Error': { category: 'Network', description: 'Network or connectivity issues' },
      'Permission Error': { category: 'Security', description: 'Access denied or authorization failures' },
      'API Error': { category: 'Integration', description: 'External API or service failures' },
      'General Error': { category: 'Other', description: 'Other technical errors' },
    };

    const errorInfo = errorDescriptions[errorType] || { category: 'Other', description: 'Technical errors' };

    // Get calls that have this specific error type
    const callsQuery = `
      WITH ErrorCalls AS (
        SELECT DISTINCT
          ct.call_id,
          CASE 
            WHEN ct.utterance_text LIKE '%system%error%' OR ct.utterance_text LIKE '%technical%issue%' THEN 'System Error'
            WHEN ct.utterance_text LIKE '%timeout%' OR ct.utterance_text LIKE '%timed out%' THEN 'Timeout Error'
            WHEN ct.utterance_text LIKE '%not found%' OR ct.utterance_text LIKE '%cannot find%' THEN 'Not Found Error'
            WHEN ct.utterance_text LIKE '%invalid%' OR ct.utterance_text LIKE '%incorrect%' THEN 'Validation Error'
            WHEN ct.utterance_text LIKE '%connection%' OR ct.utterance_text LIKE '%network%' THEN 'Connection Error'
            WHEN ct.utterance_text LIKE '%permission%' OR ct.utterance_text LIKE '%access denied%' THEN 'Permission Error'
            WHEN ct.utterance_text LIKE '%API%' OR ct.utterance_text LIKE '%service%unavailable%' THEN 'API Error'
            ELSE 'General Error'
          END AS errorType
        FROM [TeneoMemory].[CallTurns] ct
        WHERE ct.is_error IN ('True', '1')
      )
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
      FROM ErrorCalls ec
      INNER JOIN [TeneoMemory].[Sessions] c ON ec.call_id = c.call_id
      WHERE ec.errorType = @errorType
        AND c.has_errors IN ('True', '1')
      ORDER BY c.call_start_timestamp DESC
    `;

    const callsResult = await query(callsQuery, { errorType });

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
