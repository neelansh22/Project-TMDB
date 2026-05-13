import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const channel = searchParams.get('channel');
    const city = searchParams.get('city');

    // Use fast cached view if no filters applied
    if (!startDate && !endDate && !channel && !city) {
      const results = await query<any>('SELECT * FROM [TeneoMemory].[vw_FastMetricsSummary]');
      
      return NextResponse.json({
        success: true,
        data: results[0] || {},
        cached: true,
        lastRefreshed: results[0]?.lastRefreshed,
        filters: { startDate, endDate, channel, city },
      });
    }

    // Build filtered query when filters are applied
    let sqlQuery = `
      SELECT 
        COUNT(*) AS totalCalls,
        SUM(CASE WHEN callStatus = 'Completed' THEN 1 ELSE 0 END) AS completedCalls,
        CAST(SUM(CASE WHEN callStatus = 'Completed' THEN 1 ELSE 0 END) * 100.0 / 
             NULLIF(COUNT(*), 0) AS DECIMAL(5,2)) AS completionRate,
        SUM(CASE WHEN successfulResolution IN ('True', '1') THEN 1 ELSE 0 END) AS resolvedCalls,
        CAST(SUM(CASE WHEN successfulResolution IN ('True', '1') THEN 1 ELSE 0 END) * 100.0 / 
             NULLIF(COUNT(*), 0) AS DECIMAL(5,2)) AS resolutionRate,
        SUM(CASE WHEN wasTransferred = 1 THEN 1 ELSE 0 END) AS transferredCalls,
        CAST(SUM(CASE WHEN wasTransferred = 1 THEN 1 ELSE 0 END) * 100.0 / 
             NULLIF(COUNT(*), 0) AS DECIMAL(5,2)) AS transferRate,
        SUM(CASE WHEN callStatus = 'Abandoned' THEN 1 ELSE 0 END) AS droppedCalls,
        CAST(SUM(CASE WHEN callStatus = 'Abandoned' THEN 1 ELSE 0 END) * 100.0 / 
             NULLIF(COUNT(*), 0) AS DECIMAL(5,2)) AS dropRate,
        AVG(CAST(durationSeconds AS FLOAT)) AS avgDurationSeconds,
        AVG(CAST(totalTurns AS FLOAT)) AS avgTurnsPerCall,
        SUM(CASE WHEN hasErrors IN ('True', '1') THEN 1 ELSE 0 END) AS callsWithErrors,
        SUM(CAST(errorCount AS INT)) AS totalErrors
      FROM [TeneoMemory].[vw_CallsEnriched]
      WHERE 1=1
    `;

    const params: Record<string, any> = {};

    if (startDate) {
      sqlQuery += ` AND callDate >= @startDate`;
      params.startDate = startDate;
    }
    if (endDate) {
      sqlQuery += ` AND callDate <= @endDate`;
      params.endDate = endDate;
    }
    if (channel) {
      sqlQuery += ` AND channel = @channel`;
      params.channel = channel;
    }
    if (city) {
      sqlQuery += ` AND city = @city`;
      params.city = city;
    }

    const results = await query(sqlQuery, params);
    
    return NextResponse.json({
      success: true,
      data: results[0] || {},
      cached: false,
      filters: { startDate, endDate, channel, city },
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics', details: error.message },
      { status: 500 }
    );
  }
}
