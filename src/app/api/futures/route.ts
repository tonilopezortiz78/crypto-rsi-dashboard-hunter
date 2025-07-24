import { NextResponse } from 'next/server';
import { getTopFuturesPairs } from '@/lib/binance';

export async function GET() {
  try {
    const futuresPairs = await getTopFuturesPairs();
    return NextResponse.json(futuresPairs);
  } catch (error) {
    console.error('Error fetching futures pairs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch futures pairs' },
      { status: 500 }
    );
  }
} 