import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const channel = searchParams.get('channel');

    let sql = `
      SELECT 
        city,
        call_count,
        avg_sentiment_score,
        positive_calls,
        neutral_calls,
        negative_calls,
        avg_duration_seconds,
        completion_rate,
        resolution_rate,
        transfer_rate
      FROM TeneoMemory.vw_SentimentGeoHeatmap
      WHERE city IS NOT NULL
    `;

    const params: Record<string, any> = {};

    if (startDate) {
      sql += ` AND city IN (
        SELECT DISTINCT city 
        FROM TeneoMemory.vw_CallsEnriched 
        WHERE callDate >= @startDate
      )`;
      params.startDate = new Date(startDate);
    }

    if (endDate) {
      sql += ` AND city IN (
        SELECT DISTINCT city 
        FROM TeneoMemory.vw_CallsEnriched 
        WHERE callDate <= @endDate
      )`;
      params.endDate = new Date(endDate);
    }

    if (channel) {
      sql += ` AND city IN (
        SELECT DISTINCT city 
        FROM TeneoMemory.vw_CallsEnriched 
        WHERE channel = @channel
      )`;
      params.channel = channel;
    }

    sql += ` ORDER BY call_count DESC`;

    const results = await query(sql, Object.keys(params).length > 0 ? params : undefined);

    return NextResponse.json({
      success: true,
      data: results,
      totalCities: results.length,
    });
  } catch (error: any) {
    console.error('Geographic API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch geographic data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
