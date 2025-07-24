import axios from 'axios';
import { BinanceTickerData, BinanceKlineResponse, TradingPair } from '@/types/trading';

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';
const BINANCE_FUTURES_BASE = 'https://fapi.binance.com/fapi/v1';

// Get top 10 pairs by 24h volume for spot trading
export async function getTopSpotPairs(): Promise<TradingPair[]> {
  try {
    const response = await axios.get<BinanceTickerData[]>(`${BINANCE_API_BASE}/ticker/24hr`);
    
    const usdtPairs = response.data
      .filter(ticker => ticker.symbol.endsWith('USDT'))
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 10);
    
    const tradingPairs: TradingPair[] = await Promise.all(
      usdtPairs.map(async (ticker) => {
        const rsiData = await calculateRSI(ticker.symbol, 'spot');
        
        return {
          symbol: ticker.symbol,
          price: parseFloat(ticker.lastPrice),
          volume24h: parseFloat(ticker.quoteVolume),
          change24h: parseFloat(ticker.priceChangePercent),
          high24h: parseFloat(ticker.highPrice),
          low24h: parseFloat(ticker.lowPrice),
          rsi1h: rsiData.rsi1h,
          rsi4h: rsiData.rsi4h,
          rsi1d: rsiData.rsi1d,
          signal: getRSISignal(rsiData.rsi1d)
        };
      })
    );
    
    return tradingPairs;
  } catch (error) {
    console.error('Error fetching spot pairs:', error);
    return [];
  }
}

// Get top 10 pairs by 24h volume for futures trading
export async function getTopFuturesPairs(): Promise<TradingPair[]> {
  try {
    const response = await axios.get<BinanceTickerData[]>(`${BINANCE_FUTURES_BASE}/ticker/24hr`);
    
    const usdtPairs = response.data
      .filter(ticker => ticker.symbol.endsWith('USDT'))
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 10);
    
    const tradingPairs: TradingPair[] = await Promise.all(
      usdtPairs.map(async (ticker) => {
        const rsiData = await calculateRSI(ticker.symbol, 'futures');
        
        return {
          symbol: ticker.symbol,
          price: parseFloat(ticker.lastPrice),
          volume24h: parseFloat(ticker.quoteVolume),
          change24h: parseFloat(ticker.priceChangePercent),
          high24h: parseFloat(ticker.highPrice),
          low24h: parseFloat(ticker.lowPrice),
          rsi1h: rsiData.rsi1h,
          rsi4h: rsiData.rsi4h,
          rsi1d: rsiData.rsi1d,
          signal: getRSISignal(rsiData.rsi1d)
        };
      })
    );
    
    return tradingPairs;
  } catch (error) {
    console.error('Error fetching futures pairs:', error);
    return [];
  }
}

// Calculate RSI for different timeframes
async function calculateRSI(symbol: string, market: 'spot' | 'futures') {
  const baseUrl = market === 'spot' ? BINANCE_API_BASE : BINANCE_FUTURES_BASE;
  
  try {
    const [rsi1h, rsi4h, rsi1d] = await Promise.all([
      calculateRSIForInterval(symbol, '1h', baseUrl),
      calculateRSIForInterval(symbol, '4h', baseUrl),
      calculateRSIForInterval(symbol, '1d', baseUrl),
    ]);
    
    return {
      rsi1h,
      rsi4h,
      rsi1d
    };
  } catch (error) {
    console.error(`Error calculating RSI for ${symbol}:`, error);
    return {
      rsi1h: null,
      rsi4h: null,
      rsi1d: null
    };
  }
}

// Calculate RSI for a specific interval
async function calculateRSIForInterval(symbol: string, interval: string, baseUrl: string): Promise<number | null> {
  try {
    const response = await axios.get<BinanceKlineResponse[]>(`${baseUrl}/klines`, {
      params: {
        symbol,
        interval,
        limit: 100 // Get enough data for RSI calculation
      }
    });
    
    const closes = response.data.map(kline => parseFloat(kline[4])); // Close price is at index 4
    return wilderRSI(closes);
  } catch (error) {
    console.error(`Error fetching klines for ${symbol} ${interval}:`, error);
    return null;
  }
}

// Wilder's RSI calculation (TradingView standard)
function wilderRSI(closes: number[], period: number = 14): number | null {
  if (closes.length < period + 1) return null;

  const changes = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  // Initial averages
  let gainSum = 0;
  let lossSum = 0;
  for (let i = 0; i < period; i++) {
    const change = changes[i];
    if (change > 0) gainSum += change;
    else lossSum -= change;
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  // Wilder's smoothing
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return parseFloat((100 - (100 / (1 + rs))).toFixed(2));
}

// Get trading signal based on RSI
function getRSISignal(rsi: number | null): 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' {
  if (!rsi) return 'NEUTRAL';
  
  if (rsi <= 20) return 'STRONG_BUY';
  if (rsi <= 30) return 'BUY';
  if (rsi >= 80) return 'STRONG_SELL';
  if (rsi >= 70) return 'SELL';
  return 'NEUTRAL';
}

// Format price for display
export function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(8)}`;
}

// Format volume for display
export function formatVolume(volume: number): string {
  if (volume >= 1e9) return `$${(volume / 1e9).toFixed(1)}B`;
  if (volume >= 1e6) return `$${(volume / 1e6).toFixed(1)}M`;
  if (volume >= 1e3) return `$${(volume / 1e3).toFixed(1)}K`;
  return `$${volume.toFixed(0)}`;
}

// Format percentage change
export function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
} 