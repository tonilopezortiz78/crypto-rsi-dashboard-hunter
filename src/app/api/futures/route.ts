import { NextResponse } from 'next/server';
import { getTopFuturesPairs } from '@/lib/binance';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    const futuresPairs = await getTopFuturesPairs(limit);
    return NextResponse.json(futuresPairs);
  } catch (error) {
    console.error('Error fetching futures pairs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch futures pairs' },
      { status: 500 }
    );
  }
} 