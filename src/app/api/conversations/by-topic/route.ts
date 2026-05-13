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

    // Get all distinct calls that contain this intent from conversation turns
    const sql = `
      SELECT 
        callId,
        channel,
        callDate,
        callStartTime,
        sentimentCategory as customerSentiment,
        COUNT(*) as totalTurns
      FROM TeneoMemory.vw_ConversationTurnsEnriched
      WHERE intentName = @intentName
      GROUP BY callId, channel, callDate, callStartTime, sentimentCategory
      ORDER BY callDate DESC
    `;

    const results = await query(sql, { intentName: intentName });

    // Enrich with additional calculated fields
    const enrichedResults = results.map((row: any) => ({
      ...row,
      duration: row.totalTurns * 30, // Estimate 30 seconds per turn
      callOutcome: 'Completed',
      resolutionStatus: 'Resolved',
      transferCount: 0,
      agentName: 'Agent',
      intentName: intentName
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
