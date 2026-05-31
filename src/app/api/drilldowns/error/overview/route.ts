/**
 * Error Drilldown API - Overview (Level 1)
 * 
 * Returns aggregated error data by type with metrics
 * Extracts error patterns from CallTurns where is_error = True
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DrilldownApiResponse } from '@/types/drilldown';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const channel = searchParams.get('channel');

    // Query to get error types with aggregated metrics
    // We'll categorize errors by extracting patterns from utterance text
    let sqlQuery = `
      WITH ErrorTurns AS (
        SELECT 
          ct.call_id,
          ct.utterance_text,
          ct.turn_id,
          c.call_start_timestamp,
          c.channel,
          c.successful_resolution,
          c.avg_satisfaction_score,
          -- Categorize error types based on utterance patterns
          CASE 
            WHEN ct.utterance_text LIKE '%system%error%' OR ct.utterance_text LIKE '%technical%issue%' THEN 'System Error'
            WHEN ct.utterance_text LIKE '%timeout%' OR ct.utterance_text LIKE '%timed out%' THEN 'Timeout Error'
            WHEN ct.utterance_text LIKE '%not found%' OR ct.utterance_text LIKE '%cannot find%' THEN 'Not Found Error'
            WHEN ct.utterance_text LIKE '%invalid%' OR ct.utterance_text LIKE '%incorrect%' THEN 'Validation Error'
            WHEN ct.utterance_text LIKE '%connection%' OR ct.utterance_text LIKE '%network%' THEN 'Connection Error'
            WHEN ct.utterance_text LIKE '%permission%' OR ct.utterance_text LIKE '%access denied%' THEN 'Permission Error'
            WHEN ct.utterance_text LIKE '%API%' OR ct.utterance_text LIKE '%service%unavailable%' THEN 'API Error'
            ELSE 'General Error'
          END AS errorType,
          CASE 
            WHEN ct.utterance_text LIKE '%system%error%' OR ct.utterance_text LIKE '%technical%issue%' THEN 'System'
            WHEN ct.utterance_text LIKE '%timeout%' OR ct.utterance_text LIKE '%timed out%' THEN 'Performance'
            WHEN ct.utterance_text LIKE '%not found%' OR ct.utterance_text LIKE '%cannot find%' THEN 'Data'
            WHEN ct.utterance_text LIKE '%invalid%' OR ct.utterance_text LIKE '%incorrect%' THEN 'Input'
            WHEN ct.utterance_text LIKE '%connection%' OR ct.utterance_text LIKE '%network%' THEN 'Network'
            WHEN ct.utterance_text LIKE '%permission%' OR ct.utterance_text LIKE '%access denied%' THEN 'Security'
            WHEN ct.utterance_text LIKE '%API%' OR ct.utterance_text LIKE '%service%unavailable%' THEN 'Integration'
            ELSE 'Other'
          END AS errorCategory
        FROM [TeneoMemory].[CallTurns] ct
        INNER JOIN [TeneoMemory].[Sessions] c ON ct.call_id = c.call_id
        WHERE ct.is_error IN ('True', '1')
    `;

    const params: Record<string, any> = {};

    if (startDate) {
      sqlQuery += ` AND TRY_CAST(c.call_start_timestamp AS DATE) >= @startDate`;
      params.startDate = startDate;
    }
    if (endDate) {
      sqlQuery += ` AND TRY_CAST(c.call_start_timestamp AS DATE) <= @endDate`;
      params.endDate = endDate;
    }
    if (channel) {
      sqlQuery += ` AND c.channel = @channel`;
      params.channel = channel;
    }

    sqlQuery += `
      )
      SELECT 
        errorType,
        errorCategory,
        CASE errorType
          WHEN 'System Error' THEN 'Technical or system-level failures'
          WHEN 'Timeout Error' THEN 'Request timeouts or processing delays'
          WHEN 'Not Found Error' THEN 'Missing or unavailable data'
          WHEN 'Validation Error' THEN 'Invalid input or incorrect data format'
          WHEN 'Connection Error' THEN 'Network or connectivity issues'
          WHEN 'Permission Error' THEN 'Access denied or authorization failures'
          WHEN 'API Error' THEN 'External API or service failures'
          ELSE 'Other technical errors'
        END AS errorDescription,
        COUNT(*) AS errorCount,
        COUNT(DISTINCT call_id) AS callsAffected,
        CAST(SUM(CASE WHEN successful_resolution IN ('True', '1') THEN 1 ELSE 0 END) * 100.0 / 
          NULLIF(COUNT(DISTINCT call_id), 0) AS DECIMAL(5,2)) AS recoveryRate,
        AVG(
          CASE 
            WHEN avg_satisfaction_score = 'Satisfied' THEN 0.8
            WHEN avg_satisfaction_score = 'Happy' THEN 0.9
            WHEN avg_satisfaction_score = 'Neutral' THEN 0.5
            WHEN avg_satisfaction_score = 'Stressed' THEN 0.3
            WHEN avg_satisfaction_score = 'Frustrated' THEN 0.2
            ELSE 0.5
          END
        ) AS avgSentiment,
        CAST(COUNT(*) * 1.0 / NULLIF(COUNT(DISTINCT call_id), 0) AS DECIMAL(5,2)) AS avgErrorsPerCall
      FROM ErrorTurns
      GROUP BY errorType, errorCategory
      ORDER BY errorCount DESC
    `;

    const errorTypes = await query(sqlQuery, params);

    // Calculate percentage of each error type
    const totalErrors = errorTypes.reduce((sum: number, e: any) => sum + parseInt(e.errorCount), 0);
    const errorTypesWithPercentage = errorTypes.map((e: any) => ({
      errorType: e.errorType,
      errorCategory: e.errorCategory,
      errorDescription: e.errorDescription,
      errorCount: parseInt(e.errorCount),
      percentage: totalErrors > 0 ? (parseInt(e.errorCount) / totalErrors) * 100 : 0,
      callsAffected: parseInt(e.callsAffected),
      recoveryRate: parseFloat(e.recoveryRate || 0),
      avgSentiment: parseFloat(e.avgSentiment || 0.5),
      avgErrorsPerCall: parseFloat(e.avgErrorsPerCall || 0),
    }));

    // Get totals
    let totalsQuery = `
      SELECT 
        COUNT(*) AS totalCalls,
        SUM(CASE WHEN has_errors IN ('True', '1') THEN 1 ELSE 0 END) AS callsWithErrors,
        CAST(SUM(CASE WHEN has_errors IN ('True', '1') THEN 1 ELSE 0 END) * 100.0 / 
          NULLIF(COUNT(*), 0) AS DECIMAL(5,2)) AS errorRate,
        SUM(CAST(error_count AS INT)) AS totalErrors
      FROM [TeneoMemory].[Sessions]
      WHERE 1=1
    `;

    if (startDate) {
      totalsQuery += ` AND TRY_CAST(call_start_timestamp AS DATE) >= @startDate`;
    }
    if (endDate) {
      totalsQuery += ` AND TRY_CAST(call_start_timestamp AS DATE) <= @endDate`;
    }
    if (channel) {
      totalsQuery += ` AND channel = @channel`;
    }

    const totals = await query(totalsQuery, params);

    const response: DrilldownApiResponse = {
      success: true,
      data: {
        totalCalls: totals[0]?.totalCalls || 0,
        callsWithErrors: totals[0]?.callsWithErrors || 0,
        totalErrors: totals[0]?.totalErrors || 0,
        errorRate: totals[0]?.errorRate || 0,
        errorTypes: errorTypesWithPercentage,
      },
      metadata: {
        totalCount: errorTypesWithPercentage.length,
        cached: false,
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error overview API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch error overview',
        data: null,
      } as DrilldownApiResponse,
      { status: 500 }
    );
  }
}
