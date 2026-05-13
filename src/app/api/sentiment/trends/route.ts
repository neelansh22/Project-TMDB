import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Use fast cached view if no date filters applied
    if (!startDate && !endDate) {
      const results = await query<any>(
        'SELECT * FROM [TeneoMemory].[vw_FastSentimentTrends] ORDER BY callDate ASC'
      );
      
      return NextResponse.json({
        success: true,
        data: results,
        count: results.length,
        cached: true,
      });
    }

    // Build filtered query when date filters are applied
    let sqlQuery = `
      SELECT 
        callDate,
        COUNT(*) AS totalCalls,
        SUM(CASE WHEN finalSentiment = 'Happy' THEN 1 ELSE 0 END) AS happyCount,
        SUM(CASE WHEN finalSentiment = 'Satisfied' THEN 1 ELSE 0 END) AS satisfiedCount,
        SUM(CASE WHEN finalSentiment = 'Neutral' THEN 1 ELSE 0 END) AS neutralCount,
        SUM(CASE WHEN finalSentiment = 'Frustrated' THEN 1 ELSE 0 END) AS frustratedCount,
        SUM(CASE WHEN finalSentiment = 'Angry' THEN 1 ELSE 0 END) AS angryCount,
        SUM(CASE WHEN finalSentiment = 'Anxious' THEN 1 ELSE 0 END) AS anxiousCount,
        SUM(CASE WHEN sentimentTrend = 'Positive' THEN 1 ELSE 0 END) AS improvedCount,
        SUM(CASE WHEN sentimentTrend = 'Negative' THEN 1 ELSE 0 END) AS deterioratedCount,
        SUM(CASE WHEN sentimentTrend = 'Stable' THEN 1 ELSE 0 END) AS stableCount,
        CAST(SUM(CASE WHEN finalSentiment IN ('Happy', 'Satisfied') THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(5,2)) AS positiveSentimentRate,
        CAST(SUM(CASE WHEN finalSentiment IN ('Frustrated', 'Angry') THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(5,2)) AS negativeSentimentRate,
        CAST(SUM(CASE WHEN sentimentTrend = 'Positive' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(5,2)) AS improvementRate
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

    sqlQuery += ` GROUP BY callDate`;
    sqlQuery += ` ORDER BY callDate ASC`;

    const results = await query(sqlQuery, params);

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
      cached: false,
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sentiment data', details: error.message },
      { status: 500 }
    );
  }
}
