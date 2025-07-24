import { NextResponse } from 'next/server';
import { websocketManager } from '@/lib/websocket';

export async function GET() {
  try {
    const status = websocketManager.getConnectionStatus();
    const spotData = await websocketManager.getSpotData();
    const futuresData = await websocketManager.getFuturesData();
    
    return NextResponse.json({
      connections: status,
      dataAvailable: {
        spot: spotData.length,
        futures: futuresData.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting WebSocket status:', error);
    return NextResponse.json(
      { error: 'Failed to get WebSocket status' },
      { status: 500 }
    );
  }
} 