import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');

    if (!callId) {
      return NextResponse.json(
        { error: 'callId parameter is required' },
        { status: 400 }
      );
    }

    // Get conversation turns with all details from vw_ConversationTurnsEnriched
    const turnsSql = `
      SELECT 
        turnId,
        turnSequence,
        turnTimestamp,
        userInput,
        botOutput,
        intentName,
        intentCategory,
        intentDescription,
        sentimentScore,
        confidenceScore,
        sentimentCategory,
        responseTimeMs,
        isFallback,
        isError,
        channel,
        callStartTime,
        callDate
      FROM TeneoMemory.vw_ConversationTurnsEnriched
      WHERE callId = @callId
      ORDER BY turnSequence ASC
    `;

    const turns = await query(turnsSql, { callId: callId });

    if (turns.length === 0) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      );
    }

    // Extract call details from first turn
    const firstTurn = turns[0];
    const callDetails = {
      callId: callId,
      sessionId: callId, // Using callId as sessionId
      callDate: firstTurn.callDate,
      channel: firstTurn.channel,
      duration: turns.length * 30, // Estimate based on turns
      callDirection: 'Inbound',
      customerSentiment: firstTurn.sentimentCategory || 'Neutral',
      agentName: 'Agent',
      callOutcome: 'Completed',
      resolutionStatus: turns[turns.length - 1]?.isFallback ? 'Unresolved' : 'Resolved',
      transferCount: 0
    };

    // Transform turns to match expected format
    const transformedTurns = turns.flatMap((turn: any, index: number) => {
      const turnsArray = [];
      const confidenceScore = typeof turn.confidenceScore === 'number' ? turn.confidenceScore : parseFloat(turn.confidenceScore);
      
      // Add user input turn if exists
      if (turn.userInput) {
        turnsArray.push({
          turnId: `${turn.turnId}-user`,
          turnNumber: index * 2,
          turnTimestamp: turn.turnTimestamp,
          speaker: 'customer',
          utteranceText: turn.userInput,
          utteranceType: 'user',
          sentiment: turn.sentimentCategory,
          confidence: confidenceScore
        });
      }
      
      // Add bot output turn if exists
      if (turn.botOutput) {
        turnsArray.push({
          turnId: `${turn.turnId}-bot`,
          turnNumber: (index * 2) + 1,
          turnTimestamp: turn.turnTimestamp,
          speaker: 'agent',
          utteranceText: turn.botOutput,
          utteranceType: 'bot',
          sentiment: 'Neutral',
          confidence: confidenceScore
        });
      }
      
      return turnsArray;
    });

    // Extract unique intents from turns
    const intentsMap = new Map();
    turns.forEach((turn: any) => {
      if (turn.intentName && !intentsMap.has(turn.intentName)) {
        intentsMap.set(turn.intentName, {
          intentName: turn.intentName,
          intentCategory: turn.intentCategory,
          intentDescription: turn.intentDescription,
          intentConfidence: typeof turn.confidenceScore === 'number' ? turn.confidenceScore : parseFloat(turn.confidenceScore),
          detectedAt: turn.turnTimestamp
        });
      }
    });
    const intents = Array.from(intentsMap.values());

    // Create sentiment checkpoints from turns
    const sentimentCheckpoints = turns
      .filter((turn: any) => turn.sentimentScore !== null)
      .map((turn: any, index: number) => ({
        checkpointId: `checkpoint-${index}`,
        checkpointTimestamp: turn.turnTimestamp,
        checkpointNumber: index + 1,
        sentimentScore: typeof turn.sentimentScore === 'number' ? turn.sentimentScore : parseFloat(turn.sentimentScore),
        sentimentLabel: turn.sentimentCategory,
        emotionDetected: turn.sentimentCategory,
        confidenceScore: typeof turn.confidenceScore === 'number' ? turn.confidenceScore : parseFloat(turn.confidenceScore)
      }));

    return NextResponse.json({
      success: true,
      callDetails,
      turns: transformedTurns,
      sentimentCheckpoints,
      intents,
      totalTurns: transformedTurns.length
    });
  } catch (error: any) {
    console.error('Get Conversation Details Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch conversation details',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
