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

    // Query using vw_ConversationTurnsEnriched to extract actual error patterns
    // This follows the Transfer Rate pattern with proper categorization
    let sqlQuery = `
      WITH ErrorTurns AS (
        SELECT 
          ct.callId,
          ct.callDate,
          ct.channel,
          ct.intentCategory,
          ct.intentName,
          ct.botOutput,
          -- Categorize error types based on intent or response patterns
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
    `;

    const params: Record<string, any> = {};

    if (startDate) {
      sqlQuery += ` AND TRY_CAST(ct.callDate AS DATE) >= @startDate`;
      params.startDate = startDate;
    }
    if (endDate) {
      sqlQuery += ` AND TRY_CAST(ct.callDate AS DATE) <= @endDate`;
      params.endDate = endDate;
    }
    if (channel) {
      sqlQuery += ` AND ct.channel = @channel`;
      params.channel = channel;
    }

    sqlQuery += `
      ),
      ErrorTypeSummary AS (
        SELECT 
          et.errorType,
          CASE 
            WHEN et.errorType = 'System Error' THEN 'System'
            WHEN et.errorType = 'Understanding Error' THEN 'Intent'
            WHEN et.errorType = 'Data Error' THEN 'Data'
            WHEN et.errorType = 'Performance Error' THEN 'Performance'
            WHEN et.errorType LIKE '%Fallback%' OR et.errorType LIKE '%Unknown%' THEN 'Understanding'
            ELSE 'Other'
          END AS errorCategory,
          COUNT(*) AS errorCount,
          COUNT(DISTINCT et.callId) AS callsAffected
        FROM ErrorTurns et
        GROUP BY et.errorType
      )
      SELECT 
        ets.errorType,
        ets.errorCategory,
        CASE 
          WHEN ets.errorCategory = 'System' THEN 'Technical or system-level failures'
          WHEN ets.errorCategory = 'Intent' THEN 'Bot failed to understand user input'
          WHEN ets.errorCategory = 'Data' THEN 'Missing or unavailable data'
          WHEN ets.errorCategory = 'Performance' THEN 'Timeout or performance issues'
          WHEN ets.errorCategory = 'Understanding' THEN 'Intent recognition failures'
          ELSE 'Other technical errors'
        END AS errorDescription,
        ets.errorCount,
        ets.callsAffected,
        CAST(
          (SELECT SUM(CASE WHEN s.successful_resolution IN ('True', '1') THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)
           FROM [TeneoMemory].[Sessions] s
           WHERE s.call_id IN (SELECT DISTINCT callId FROM ErrorTurns WHERE errorType = ets.errorType)
          ) AS DECIMAL(5,2)
        ) AS recoveryRate,
        (
          SELECT AVG(
            CASE 
              WHEN s.avg_satisfaction_score = 'Satisfied' THEN 0.8
              WHEN s.avg_satisfaction_score = 'Happy' THEN 0.9
              WHEN s.avg_satisfaction_score = 'Neutral' THEN 0.5
              WHEN s.avg_satisfaction_score = 'Stressed' THEN 0.3
              WHEN s.avg_satisfaction_score = 'Frustrated' THEN 0.2
              ELSE 0.5
            END
          )
          FROM [TeneoMemory].[Sessions] s
          WHERE s.call_id IN (SELECT DISTINCT callId FROM ErrorTurns WHERE errorType = ets.errorType)
        ) AS avgSentiment,
        CAST(ets.errorCount * 1.0 / NULLIF(ets.callsAffected, 0) AS DECIMAL(5,2)) AS avgErrorsPerCall
      FROM ErrorTypeSummary ets
      ORDER BY ets.errorCount DESC
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
