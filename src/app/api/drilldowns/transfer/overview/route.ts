/**
 * Transfer Drilldown API - Overview (Level 1)
 * 
 * Returns aggregated transfer data by reason with metrics
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DrilldownApiResponse } from '@/types/drilldown';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const channel = searchParams.get('channel');

    // Query to get transfer reasons with aggregated metrics
    let sqlQuery = `
      SELECT 
        tr.transfer_reason_id AS reasonId,
        tr.reason_name AS reasonName,
        tr.reason_category AS reasonCategory,
        tr.description AS reasonDescription,
        COUNT(DISTINCT c.call_id) AS transferCount,
        CAST(COUNT(DISTINCT c.call_id) * 100.0 / 
          (SELECT COUNT(*) FROM [TeneoMemory].[Sessions] WHERE transfer_reason_id IS NOT NULL AND transfer_reason_id != '') 
          AS DECIMAL(5,2)) AS percentage,
        CAST(SUM(CASE WHEN c.successful_resolution IN ('True', '1') THEN 1 ELSE 0 END) * 100.0 / 
          NULLIF(COUNT(DISTINCT c.call_id), 0) AS DECIMAL(5,2)) AS resolutionRate,
        AVG(
          CASE 
            WHEN c.avg_satisfaction_score = 'Satisfied' THEN 0.8
            WHEN c.avg_satisfaction_score = 'Happy' THEN 0.9
            WHEN c.avg_satisfaction_score = 'Neutral' THEN 0.5
            WHEN c.avg_satisfaction_score = 'Stressed' THEN 0.3
            WHEN c.avg_satisfaction_score = 'Frustrated' THEN 0.2
            ELSE 0.5
          END
        ) AS avgSentiment,
        AVG(CAST(c.duration_seconds AS FLOAT)) AS avgTimeBeforeTransfer
      FROM [TeneoMemory].[TransferReasons] tr
      INNER JOIN [TeneoMemory].[Sessions] c ON tr.transfer_reason_id = c.transfer_reason_id
      WHERE c.transfer_reason_id IS NOT NULL AND c.transfer_reason_id != ''
    `;

    const params: Record<string, any> = {};

    if (startDate) {
      sqlQuery += ` AND TRY_CAST(c.call_start_timestamp AS DATE) >= @startDate`;
      params.startDate = startDate;
    }
    if (endDate) {
      sqlQuery += ` AND TRY_CAST(c.call_start_timestamp AS DATE) <= @endDate`;
      params.endDate = endDate;
    }
    if (channel) {
      sqlQuery += ` AND c.channel = @channel`;
      params.channel = channel;
    }

    sqlQuery += `
      GROUP BY tr.transfer_reason_id, tr.reason_name, tr.reason_category, tr.description
      ORDER BY transferCount DESC
    `;

    const reasons = await query(sqlQuery, params);

    // Get totals
    let totalsQuery = `
      SELECT 
        COUNT(*) AS totalCalls,
        SUM(CASE WHEN transfer_reason_id IS NOT NULL AND transfer_reason_id != '' THEN 1 ELSE 0 END) AS totalTransfers,
        CAST(SUM(CASE WHEN transfer_reason_id IS NOT NULL AND transfer_reason_id != '' THEN 1 ELSE 0 END) * 100.0 / 
          NULLIF(COUNT(*), 0) AS DECIMAL(5,2)) AS transferRate
      FROM [TeneoMemory].[Sessions]
      WHERE 1=1
    `;

    if (startDate) {
      totalsQuery += ` AND TRY_CAST(call_start_timestamp AS DATE) >= @startDate`;
    }
    if (endDate) {
      totalsQuery += ` AND TRY_CAST(call_start_timestamp AS DATE) <= @endDate`;
    }
    if (channel) {
      totalsQuery += ` AND channel = @channel`;
    }

    const totals = await query(totalsQuery, params);

    const response: DrilldownApiResponse = {
      success: true,
      data: {
        totalCalls: totals[0]?.totalCalls || 0,
        totalTransfers: totals[0]?.totalTransfers || 0,
        transferRate: totals[0]?.transferRate || 0,
        reasons: reasons.map(r => ({
          reasonId: r.reasonId,
          reasonName: r.reasonName,
          reasonCategory: r.reasonCategory,
          reasonDescription: r.reasonDescription,
          transferCount: parseInt(r.transferCount),
          percentage: parseFloat(r.percentage || 0),
          resolutionRate: parseFloat(r.resolutionRate || 0),
          avgSentiment: parseFloat(r.avgSentiment || 0.5),
          avgTimeBeforeTransfer: parseInt(r.avgTimeBeforeTransfer || 0),
        })),
      },
      metadata: {
        totalCount: reasons.length,
        cached: false,
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Transfer overview API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transfer overview',
        data: null,
      } as DrilldownApiResponse,
      { status: 500 }
    );
  }
}
