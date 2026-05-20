import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const intentName = searchParams.get('intentName');

    if (!intentName) {
      return NextResponse.json(
        { error: 'intentName parameter is required' },
        { status: 400 }
      );
    }

    // Get all calls that contain this intent from CallIntents table
    const sql = `
      SELECT DISTINCT
        c.call_id AS callId,
        c.channel AS channel,
        CAST(c.call_start_timestamp AS DATE) AS callDate,
        c.call_start_timestamp AS callStartTime,
        c.duration_seconds AS duration,
        c.avg_satisfaction_score AS customerSentiment,
        c.total_turns AS totalTurns,
        cs.status_name AS callOutcome,
        CASE WHEN c.successful_resolution IN ('True', '1') THEN 'Resolved' ELSE 'Unresolved' END AS resolutionStatus,
        CASE WHEN c.transfer_reason_id IS NOT NULL AND c.transfer_reason_id != '' THEN 1 ELSE 0 END AS transferCount,
        i.intent_name AS intentName,
        ci.confidence_score AS intentConfidence,
        i.intent_category AS intentCategory
      FROM [TeneoMemory].[CallIntents] ci
      JOIN [TeneoMemory].[Intents] i ON ci.intent_id = i.intent_id
      JOIN [TeneoMemory].[Sessions] c ON ci.call_id = c.call_id
      LEFT JOIN [TeneoMemory].[CallStatuses] cs ON c.call_status_id = cs.call_status_id
      WHERE i.intent_name = @intentName
      ORDER BY c.call_start_timestamp DESC
    `;

    const results = await query(sql, { intentName: intentName });

    // Return results as-is (already enriched from the SQL query)
    const enrichedResults = results.map((row: any) => ({
      ...row,
      agentName: 'Agent',
      intentConfidence: parseFloat(row.intentConfidence || 0)
    }));

    return NextResponse.json({
      success: true,
      data: enrichedResults,
      totalCalls: results.length,
      intentName
    });
  } catch (error: any) {
    console.error('Get Calls by Topic Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch calls by topic',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
