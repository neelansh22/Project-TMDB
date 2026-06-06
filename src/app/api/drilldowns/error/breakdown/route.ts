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
    const isToolError = searchParams.get('isToolError') === 'true';

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

    let calls: DrilldownCallData[] = [];
    let errorInfo: { category: string; description: string };

    // Check if this is a tool error or regular error
    if (isToolError) {
      // Tool error - query ToolErrors table
      const toolErrorQuery = `
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
          COUNT(DISTINCT te.error_id) AS errorCount,
          STRING_AGG(te.error_type, ', ') WITHIN GROUP (ORDER BY te.error_timestamp) AS errorTypes,
          STRING_AGG(te.impact_level, ', ') WITHIN GROUP (ORDER BY te.error_timestamp) AS impactLevels,
          SUM(CASE WHEN te.resolved IN ('True', '1') THEN 1 ELSE 0 END) AS resolvedToolErrors
        FROM [TeneoMemory].[ToolErrors] te
        INNER JOIN [TeneoMemory].[Sessions] c ON te.call_id = c.call_id
        WHERE te.tool_name = @errorType
        GROUP BY 
          c.call_id, 
          c.call_start_timestamp, 
          c.channel, 
          c.duration_seconds, 
          c.total_turns,
          c.avg_satisfaction_score,
          c.initial_sentiment_category,
          c.final_sentiment_category,
          c.successful_resolution
        ORDER BY c.call_start_timestamp DESC
      `;

      const callsResult = await query(toolErrorQuery, { errorType });

      // Get tool error category for description
      const categoryQuery = await query(
        `SELECT TOP 1 impact_level, error_type FROM [TeneoMemory].[ToolErrors] WHERE tool_name = @errorType`,
        { errorType }
      );

      errorInfo = {
        category: categoryQuery[0]?.impact_level || 'Unknown',
        description: `${errorType} integration failures (${categoryQuery[0]?.error_type || 'Various'} errors)`,
      };

      // Transform to DrilldownCallData format
      calls = callsResult.map((row: any) => ({
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
          errorTypes: row.errorTypes,
          impactLevels: row.impactLevels,
          resolvedToolErrors: row.resolvedToolErrors || 0,
          isToolError: true,
          sentimentJourney: `${row.initialSentiment || 'Unknown'} → ${row.finalSentiment || 'Unknown'}`,
        },
      }));
    } else {
      // Regular error - existing logic
      const getErrorInfo = (errorType: string): { category: string; description: string } => {
        if (errorType === 'High Frequency Errors') 
          return { category: 'Critical', description: 'Calls with 5 or more errors requiring immediate attention' };
        if (errorType === 'Multiple Errors') 
          return { category: 'High', description: 'Calls with 3-4 errors showing recurring issues' };
        if (errorType === 'Moderate Errors') 
          return { category: 'Medium', description: 'Calls with 2 errors indicating minor problems' };
        if (errorType === 'Single Error') 
          return { category: 'Low', description: 'Calls with a single error occurrence' };
        return { category: 'Other', description: 'Other technical errors' };
      };

      errorInfo = getErrorInfo(errorType);

      // Get calls with this error severity level - match the grouping from overview
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
        WHERE c.has_errors IN ('True', '1')
          AND c.error_count IS NOT NULL
          AND c.error_count != ''
          AND CAST(c.error_count AS INT) > 0
          AND CASE 
            WHEN CAST(c.error_count AS INT) >= 5 THEN 'High Frequency Errors'
            WHEN CAST(c.error_count AS INT) >= 3 THEN 'Multiple Errors'
            WHEN CAST(c.error_count AS INT) = 2 THEN 'Moderate Errors'
            ELSE 'Single Error'
          END = @errorType
        ORDER BY c.call_start_timestamp DESC
      `;

      const callsResult = await query(callsQuery, { errorType });

      // Transform to DrilldownCallData format
      calls = callsResult.map((row: any) => ({
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
          isToolError: false,
          sentimentJourney: `${row.initialSentiment || 'Unknown'} → ${row.finalSentiment || 'Unknown'}`,
        },
      }));
    }


    const response: DrilldownApiResponse = {
      success: true,
      data: {
        errorType: errorType,
        errorCategory: errorInfo.category,
        errorDescription: errorInfo.description,
        errorCount: calls.reduce((sum, c) => sum + (c.metadata?.errorCount || 0), 0),
        calls,
        isToolError: isToolError,
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
