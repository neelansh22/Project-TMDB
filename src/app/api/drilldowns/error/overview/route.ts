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

    // Simplified query following Transfer Rate pattern
    // Categorize errors by severity based on error_count
    let sqlQuery = `
      SELECT 
        CASE 
          WHEN CAST(c.error_count AS INT) >= 5 THEN 'High Frequency Errors'
          WHEN CAST(c.error_count AS INT) >= 3 THEN 'Multiple Errors'
          WHEN CAST(c.error_count AS INT) = 2 THEN 'Moderate Errors'
          ELSE 'Single Error'
        END AS errorType,
        CASE 
          WHEN CAST(c.error_count AS INT) >= 5 THEN 'Critical'
          WHEN CAST(c.error_count AS INT) >= 3 THEN 'High'
          WHEN CAST(c.error_count AS INT) = 2 THEN 'Medium'
          ELSE 'Low'
        END AS errorCategory,
        COUNT(DISTINCT c.call_id) AS callsAffected,
        SUM(CAST(c.error_count AS INT)) AS errorCount,
        CAST(SUM(CASE WHEN c.successful_resolution IN ('True', '1') THEN 1 ELSE 0 END) * 100.0 / 
          NULLIF(COUNT(DISTINCT c.call_id), 0) AS DECIMAL(5,2)) AS recoveryRate,
        AVG(
          CASE 
            WHEN c.avg_satisfaction_score = 'Satisfied' THEN 0.8
            WHEN c.avg_satisfaction_score = 'Happy' THEN 0.9
            WHEN c.avg_satisfaction_score = 'Neutral' THEN 0.5
            WHEN c.avg_satisfaction_score = 'Stressed' THEN 0.3
            WHEN c.avg_satisfaction_score = 'Frustrated' THEN 0.2
            ELSE 0.5
          END
        ) AS avgSentiment,
        AVG(CAST(c.error_count AS FLOAT)) AS avgErrorsPerCall
      FROM [TeneoMemory].[Sessions] c
      WHERE c.has_errors IN ('True', '1')
        AND c.error_count IS NOT NULL
        AND c.error_count != ''
        AND CAST(c.error_count AS INT) > 0
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
      GROUP BY 
        CASE 
          WHEN CAST(c.error_count AS INT) >= 5 THEN 'High Frequency Errors'
          WHEN CAST(c.error_count AS INT) >= 3 THEN 'Multiple Errors'
          WHEN CAST(c.error_count AS INT) = 2 THEN 'Moderate Errors'
          ELSE 'Single Error'
        END,
        CASE 
          WHEN CAST(c.error_count AS INT) >= 5 THEN 'Critical'
          WHEN CAST(c.error_count AS INT) >= 3 THEN 'High'
          WHEN CAST(c.error_count AS INT) = 2 THEN 'Medium'
          ELSE 'Low'
        END
      ORDER BY errorCount DESC
    `;

    const errorTypes = await query(sqlQuery, params);

    // Query Tool Errors (integration failures)
    // Wrap in try-catch in case ToolError table doesn't exist yet
    let toolErrors: any[] = [];
    try {
      let toolErrorQuery = `
        SELECT 
          te.tool_name AS errorType,
          te.impact_level AS errorCategory,
          te.error_type AS errorSubType,
          COUNT(DISTINCT te.call_id) AS callsAffected,
          COUNT(*) AS errorCount,
          CAST(SUM(CASE WHEN te.resolved IN ('True', '1') THEN 1 ELSE 0 END) * 100.0 / 
            NULLIF(COUNT(*), 0) AS DECIMAL(5,2)) AS recoveryRate,
          AVG(
            CASE 
              WHEN c.avg_satisfaction_score = 'Satisfied' THEN 0.8
              WHEN c.avg_satisfaction_score = 'Happy' THEN 0.9
              WHEN c.avg_satisfaction_score = 'Neutral' THEN 0.5
              WHEN c.avg_satisfaction_score = 'Stressed' THEN 0.3
              WHEN c.avg_satisfaction_score = 'Frustrated' THEN 0.2
              ELSE 0.5
            END
          ) AS avgSentiment,
          AVG(CAST(te.retry_count AS FLOAT)) AS avgRetryCount
        FROM [TeneoMemory].[ToolError] te
        LEFT JOIN [TeneoMemory].[Sessions] c ON te.call_id = c.call_id
        WHERE 1=1
      `;

      if (startDate) {
        toolErrorQuery += ` AND TRY_CAST(te.error_timestamp AS DATE) >= @startDate`;
      }
      if (endDate) {
        toolErrorQuery += ` AND TRY_CAST(te.error_timestamp AS DATE) <= @endDate`;
      }
      if (channel) {
        toolErrorQuery += ` AND c.channel = @channel`;
      }

      toolErrorQuery += `
        GROUP BY te.tool_name, te.impact_level, te.error_type
        ORDER BY COUNT(*) DESC
      `;

      toolErrors = await query(toolErrorQuery, params);
    } catch (toolErrorQueryError) {
      console.warn('ToolError table not found or query failed, skipping tool errors:', toolErrorQueryError);
      toolErrors = [];
    }

    // Combine regular errors and tool errors
    const allErrors = [
      ...errorTypes.map((e: any) => ({
        errorType: e.errorType,
        errorCategory: e.errorCategory,
        errorCount: parseInt(e.errorCount || 0),
        callsAffected: parseInt(e.callsAffected || 0),
        recoveryRate: parseFloat(e.recoveryRate || 0),
        avgSentiment: parseFloat(e.avgSentiment || 0.5),
        avgErrorsPerCall: parseFloat(e.avgErrorsPerCall || 0),
        errorSubType: 'General',
        isToolError: false,
      })),
      ...toolErrors.map((e: any) => ({
        errorType: `${e.errorType}`, // Tool name
        errorCategory: e.errorCategory, // Impact level
        errorCount: parseInt(e.errorCount || 0),
        callsAffected: parseInt(e.callsAffected || 0),
        recoveryRate: parseFloat(e.recoveryRate || 0),
        avgSentiment: parseFloat(e.avgSentiment || 0.5),
        avgErrorsPerCall: parseFloat(e.avgRetryCount || 0),
        errorSubType: e.errorSubType, // Timeout, ServerError, etc.
        isToolError: true,
      }))
    ];

    // Calculate percentage and add descriptions
    const totalErrors = allErrors.reduce((sum: number, e: any) => sum + parseInt(e.errorCount || 0), 0);
    const errorTypesWithPercentage = allErrors.map((e: any) => {
      // Generate description based on type
      let errorDescription = '';
      
      if (e.isToolError) {
        // Tool error descriptions
        errorDescription = `${e.errorType} integration failures (${e.errorSubType})`;
      } else {
        // Regular error descriptions
        if (e.errorType === 'High Frequency Errors') errorDescription = 'Calls with 5 or more errors requiring immediate attention';
        else if (e.errorType === 'Multiple Errors') errorDescription = 'Calls with 3-4 errors showing recurring issues';
        else if (e.errorType === 'Moderate Errors') errorDescription = 'Calls with 2 errors indicating minor problems';
        else if (e.errorType === 'Single Error') errorDescription = 'Calls with a single error occurrence';
        else errorDescription = 'Other technical errors';
      }
      
      return {
        errorType: e.errorType,
        errorCategory: e.errorCategory,
        errorDescription: errorDescription,
        errorCount: e.errorCount,
        percentage: totalErrors > 0 ? (e.errorCount / totalErrors) * 100 : 0,
        callsAffected: e.callsAffected,
        recoveryRate: e.recoveryRate,
        avgSentiment: e.avgSentiment,
        avgErrorsPerCall: e.avgErrorsPerCall,
        errorSubType: e.errorSubType,
        isToolError: e.isToolError,
      };
    });

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

    // Get tool errors count (with error handling if table doesn't exist)
    let toolErrorTotals: any[] = [{ callsWithToolErrors: 0, totalToolErrors: 0 }];
    try {
      let toolErrorTotalsQuery = `
        SELECT 
          COUNT(DISTINCT call_id) AS callsWithToolErrors,
          COUNT(*) AS totalToolErrors
        FROM [TeneoMemory].[ToolError]
        WHERE 1=1
      `;

      if (startDate) {
        toolErrorTotalsQuery += ` AND TRY_CAST(error_timestamp AS DATE) >= @startDate`;
      }
      if (endDate) {
        toolErrorTotalsQuery += ` AND TRY_CAST(error_timestamp AS DATE) <= @endDate`;
      }

      toolErrorTotals = await query(toolErrorTotalsQuery, params);
    } catch (toolErrorTotalsQueryError) {
      console.warn('ToolError table not found for totals, using zero counts:', toolErrorTotalsQueryError);
      toolErrorTotals = [{ callsWithToolErrors: 0, totalToolErrors: 0 }];
    }

    const response: DrilldownApiResponse = {
      success: true,
      data: {
        totalCalls: totals[0]?.totalCalls || 0,
        callsWithErrors: totals[0]?.callsWithErrors || 0,
        totalErrors: (totals[0]?.totalErrors || 0) + (toolErrorTotals[0]?.totalToolErrors || 0),
        errorRate: totals[0]?.errorRate || 0,
        errorTypes: errorTypesWithPercentage,
        toolErrorStats: {
          callsWithToolErrors: toolErrorTotals[0]?.callsWithToolErrors || 0,
          totalToolErrors: toolErrorTotals[0]?.totalToolErrors || 0,
        },
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
