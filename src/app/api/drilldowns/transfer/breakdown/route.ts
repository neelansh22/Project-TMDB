/**
 * Transfer Drilldown API - Breakdown (Level 2)
 * 
 * Returns calls for a specific transfer reason with detailed context
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DrilldownApiResponse, DrilldownCallData } from '@/types/drilldown';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reasonId = searchParams.get('reasonId');

    if (!reasonId) {
      return NextResponse.json(
        {
          success: false,
          error: 'reasonId parameter is required',
          data: null,
        } as DrilldownApiResponse,
        { status: 400 }
      );
    }

    // Get transfer reason details
    const reasonQuery = `
      SELECT 
        transfer_reason_id AS reasonId,
        reason_name AS reasonName,
        reason_category AS reasonCategory,
        description AS reasonDescription
      FROM [TeneoMemory].[TransferReasons]
      WHERE transfer_reason_id = @reasonId
    `;

    const reasonResult = await query(reasonQuery, { reasonId });

    if (reasonResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transfer reason not found',
          data: null,
        } as DrilldownApiResponse,
        { status: 404 }
      );
    }

    const reason = reasonResult[0];

    // Get calls for this transfer reason with enriched details
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
        c.duration_seconds AS timeBeforeTransfer,
        tr.reason_name AS transferReason,
        tr.reason_category AS transferCategory
      FROM [TeneoMemory].[Sessions] c
      LEFT JOIN [TeneoMemory].[TransferReasons] tr ON c.transfer_reason_id = tr.transfer_reason_id
      WHERE c.transfer_reason_id = @reasonId
      ORDER BY c.call_start_timestamp DESC
    `;

    const callsResult = await query(callsQuery, { reasonId });

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
      wasTransferred: true,
      transferReason: row.transferReason,
      timeBeforeTransfer: row.timeBeforeTransfer ? parseInt(row.timeBeforeTransfer) : undefined,
      metadata: {
        sentimentBeforeTransfer: row.initialSentiment,
        sentimentAfterTransfer: row.finalSentiment,
        sentimentJourney: `${row.initialSentiment || 'Unknown'} → ${row.finalSentiment || 'Unknown'}`,
        timeBeforeTransfer: row.timeBeforeTransfer ? parseInt(row.timeBeforeTransfer) : 0,
      },
    }));

    const response: DrilldownApiResponse = {
      success: true,
      data: {
        reasonName: reason.reasonName,
        reasonCategory: reason.reasonCategory,
        reasonDescription: reason.reasonDescription,
        transferCount: calls.length,
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
    console.error('Transfer breakdown API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transfer breakdown',
        data: null,
      } as DrilldownApiResponse,
      { status: 500 }
    );
  }
}
