import { NextResponse } from 'next/server';
import { getTopSpotPairs } from '@/lib/binance';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    const spotPairs = await getTopSpotPairs(limit);
    return NextResponse.json(spotPairs);
  } catch (error) {
    console.error('Error fetching spot pairs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spot pairs' },
      { status: 500 }
    );
  }
} 