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
        callDate,
        channel,
        useCaseName,
        city,
        totalCalls,
        callsWithErrors,
        errorRate,
        totalErrorCount,
        callsWithMisunderstandings,
        misunderstandingRate,
        callsWithUnsupportedScenarios,
        unsupportedScenarioRate
      FROM [TeneoMemory].[vw_ErrorsAndMisunderstandings]
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

    sqlQuery += ` ORDER BY callDate DESC, totalCalls DESC`;

    const results = await query(sqlQuery, params);

    // Calculate aggregated summary
    const summary = results.reduce((acc: any, row: any) => ({
      totalCalls: acc.totalCalls + (row.totalCalls || 0),
      callsWithErrors: acc.callsWithErrors + (row.callsWithErrors || 0),
      totalErrorCount: acc.totalErrorCount + (row.totalErrorCount || 0),
      callsWithMisunderstandings: acc.callsWithMisunderstandings + (row.callsWithMisunderstandings || 0),
      callsWithUnsupportedScenarios: acc.callsWithUnsupportedScenarios + (row.callsWithUnsupportedScenarios || 0)
    }), {
      totalCalls: 0,
      callsWithErrors: 0,
      totalErrorCount: 0,
      callsWithMisunderstandings: 0,
      callsWithUnsupportedScenarios: 0
    });

    // Calculate overall rates
    summary.errorRate = summary.totalCalls > 0 
      ? ((summary.callsWithErrors / summary.totalCalls) * 100).toFixed(2)
      : 0;
    summary.misunderstandingRate = summary.totalCalls > 0 
      ? ((summary.callsWithMisunderstandings / summary.totalCalls) * 100).toFixed(2)
      : 0;
    summary.unsupportedScenarioRate = summary.totalCalls > 0 
      ? ((summary.callsWithUnsupportedScenarios / summary.totalCalls) * 100).toFixed(2)
      : 0;

    return NextResponse.json({
      success: true,
      data: results,
      summary,
      cached: false
    });
  } catch (error: any) {
    console.error('Errors API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch error data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
