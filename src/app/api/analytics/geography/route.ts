import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let sqlQuery = `
      SELECT 
        latitude,
        longitude,
        city,
        state,
        country,
        postalCode,
        SUM(callVolume) as callVolume,
        SUM(happyCount) as happyCount,
        SUM(satisfiedCount) as satisfiedCount,
        SUM(neutralCount) as neutralCount,
        SUM(confusedCount) as confusedCount,
        SUM(frustratedCount) as frustratedCount,
        SUM(angryCount) as angryCount,
        SUM(anxiousCount) as anxiousCount,
        AVG(avgSentimentScore) as avgSentimentScore,
        AVG(happyPercent) as happyPercent,
        AVG(satisfiedPercent) as satisfiedPercent,
        AVG(negativePercent) as negativePercent
      FROM [TeneoMemory].[vw_SentimentGeoHeatmap]
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

    sqlQuery += `
      GROUP BY latitude, longitude, city, state, country, postalCode
      ORDER BY SUM(callVolume) DESC
    `;

    const results = await query(sqlQuery, params);

    return NextResponse.json({
      success: true,
      data: results,
      totalLocations: results.length,
      cached: false
    });
  } catch (error: any) {
    console.error('Geography API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch geography data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
