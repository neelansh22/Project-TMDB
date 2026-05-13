import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const channel = searchParams.get('channel');

    let sqlQuery = `
      SELECT 
        intentName,
        intentCategory,
        intentDescription,
        SUM(callCount) as callCount,
        SUM(totalOccurrences) as totalOccurrences,
        AVG(avgConfidence) as avgConfidence,
        SUM(primaryIntentCount) as primaryIntentCount,
        AVG(callPercentage) as callPercentage
      FROM [TeneoMemory].[vw_TopicsBreakdown]
      WHERE 1=1
    `;

    const params: any[] = [];

    if (startDate) {
      sqlQuery += ` AND callDate >= @startDate`;
      params.push({ name: 'startDate', type: 'Date', value: new Date(startDate) });
    }

    if (endDate) {
      sqlQuery += ` AND callDate <= @endDate`;
      params.push({ name: 'endDate', type: 'Date', value: new Date(endDate) });
    }

    if (channel) {
      sqlQuery += ` AND channel = @channel`;
      params.push({ name: 'channel', type: 'NVarChar', value: channel });
    }

    sqlQuery += `
      GROUP BY intentName, intentCategory, intentDescription
      ORDER BY SUM(callCount) DESC
    `;

    const results = await query(sqlQuery, params);

    // Calculate total for percentages
    const totalCalls = results.reduce((sum: number, row: any) => sum + (row.callCount || 0), 0);
    
    // Enrich with actual percentage
    const enrichedResults = results.map((row: any) => ({
      ...row,
      percentage: totalCalls > 0 ? ((row.callCount / totalCalls) * 100).toFixed(1) : 0
    }));

    return NextResponse.json({
      success: true,
      data: enrichedResults,
      totalCalls,
      cached: false
    });
  } catch (error: any) {
    console.error('Topics API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch topics data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
