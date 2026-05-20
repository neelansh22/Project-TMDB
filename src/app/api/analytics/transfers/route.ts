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
        reasonName,
        reasonCategory,
        reasonDescription,
        SUM(transferCount) as transferCount,
        AVG(percentageOfTransfers) as percentageOfTransfers,
        AVG(percentageOfAllCalls) as percentageOfAllCalls,
        AVG(avgDurationSeconds) as avgDurationSeconds
      FROM [TeneoMemory].[vw_TransferReasonsBreakdown]
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
      GROUP BY reasonName, reasonCategory, reasonDescription
      ORDER BY SUM(transferCount) DESC
    `;

    const results = await query(sqlQuery, params);

    return NextResponse.json({
      success: true,
      data: results,
      cached: false
    });
  } catch (error: any) {
    console.error('Transfers API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch transfer data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
