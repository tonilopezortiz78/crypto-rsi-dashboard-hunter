import { NextResponse } from 'next/server';
import { websocketManager } from '@/lib/websocket';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    console.log(`🔄 Fetching top ${limit} futures pairs from WebSocket...`);
    const futuresPairs = await websocketManager.getFuturesData(limit);
    
    if (futuresPairs.length === 0) {
      return NextResponse.json(
        { error: 'No futures data available yet, WebSocket still connecting...' },
        { status: 503 }
      );
    }
    
    console.log(`✅ Returning ${futuresPairs.length} futures pairs`);
    return NextResponse.json(futuresPairs);
  } catch (error) {
    console.error('Error fetching futures pairs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch futures pairs' },
      { status: 500 }
    );
  }
} 