import { NextResponse } from 'next/server';
import { getTopSpotPairs } from '@/lib/binance';

export async function GET() {
  try {
    const spotPairs = await getTopSpotPairs();
    return NextResponse.json(spotPairs);
  } catch (error) {
    console.error('Error fetching spot pairs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spot pairs' },
      { status: 500 }
    );
  }
} 