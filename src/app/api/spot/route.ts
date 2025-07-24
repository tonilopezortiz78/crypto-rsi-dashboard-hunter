import { NextResponse } from 'next/server';
import { websocketManager } from '@/lib/websocket';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    console.log(`🔄 Fetching top ${limit} spot pairs from WebSocket...`);
    const spotPairs = await websocketManager.getSpotData(limit);
    
    if (spotPairs.length === 0) {
      return NextResponse.json(
        { error: 'No spot data available yet, WebSocket still connecting...' },
        { status: 503 }
      );
    }
    
    console.log(`✅ Returning ${spotPairs.length} spot pairs`);
    return NextResponse.json(spotPairs);
  } catch (error) {
    console.error('Error fetching spot pairs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spot pairs' },
      { status: 500 }
    );
  }
} 