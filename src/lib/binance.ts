import axios, { AxiosError } from 'axios';
import { BinanceTickerData, BinanceKlineResponse, TradingPair } from '@/types/trading';

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';
const BINANCE_FUTURES_BASE = 'https://fapi.binance.com/fapi/v1';

// Configure axios with timeouts and retry logic
const api = axios.create({
  timeout: 10000, // 10 second timeout
  headers: {
    'User-Agent': 'crypto-rsi-dashboard/2.0.0',
  },
});

// Add retry interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (AxiosError['config'] & { __retryCount?: number });
    if (!config) return Promise.reject(error);

    // Retry logic for network errors and 5xx errors
    if (
      (!error.response || (error.response.status >= 500 && error.response.status < 600) || 
       error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') &&
      !config.__retryCount
    ) {
      config.__retryCount = 1;
      console.warn(`Retrying request to ${config.url} due to ${error.code || error.message}`);
      
      // Wait 1 second before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return api.request(config);
    }
    
    return Promise.reject(error);
  }
);

// Rate limiting - simple queue to avoid overwhelming the API
class RateLimiter {
  private queue: Array<() => void> = [];
  private processing = false;
  private lastRequest = 0;
  private minInterval = 100; // Minimum 100ms between requests

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequest;
          if (timeSinceLastRequest < this.minInterval) {
            await new Promise(r => setTimeout(r, this.minInterval - timeSinceLastRequest));
          }
          
          this.lastRequest = Date.now();
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      await task();
    }
    this.processing = false;
  }
}

const rateLimiter = new RateLimiter();

// Get top coins by 24h volume for spot trading (increased from 10 to 50)
export async function getTopSpotPairs(limit: number = 50): Promise<TradingPair[]> {
  try {
    console.log(`🔄 Fetching top ${limit} spot pairs...`);
    
    const response = await rateLimiter.execute(() => 
      api.get<BinanceTickerData[]>(`${BINANCE_API_BASE}/ticker/24hr`)
    );
    
    const usdtPairs = response.data
      .filter(ticker => ticker.symbol.endsWith('USDT'))
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, limit);
    
    console.log(`✅ Fetched ${usdtPairs.length} spot pairs, calculating RSI...`);

    // Calculate RSI with better error handling
    const tradingPairs: TradingPair[] = await Promise.all(
      usdtPairs.map(async (ticker, index) => {
        try {
          const rsiData = await calculateRSI(ticker.symbol, 'spot');
          
          if (index % 10 === 0) {
            console.log(`📊 Processed ${index + 1}/${usdtPairs.length} spot pairs`);
          }
          
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
        } catch (error) {
          console.warn(`⚠️ Error processing ${ticker.symbol}:`, error instanceof Error ? error.message : error);
          
          // Return pair with basic data but no RSI if calculation fails
          return {
            symbol: ticker.symbol,
            price: parseFloat(ticker.lastPrice),
            volume24h: parseFloat(ticker.quoteVolume),
            change24h: parseFloat(ticker.priceChangePercent),
            high24h: parseFloat(ticker.highPrice),
            low24h: parseFloat(ticker.lowPrice),
            rsi1h: null,
            rsi4h: null,
            rsi1d: null,
            signal: 'NEUTRAL' as const
          };
        }
      })
    );
    
    console.log(`✅ Completed spot pairs processing: ${tradingPairs.length} pairs`);
    return tradingPairs;
  } catch (error) {
    console.error('❌ Error fetching spot pairs:', error);
    throw new Error(`Failed to fetch spot trading data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get top coins by 24h volume for futures trading (increased from 10 to 50)
export async function getTopFuturesPairs(limit: number = 50): Promise<TradingPair[]> {
  try {
    console.log(`🔄 Fetching top ${limit} futures pairs...`);
    
    const response = await rateLimiter.execute(() => 
      api.get<BinanceTickerData[]>(`${BINANCE_FUTURES_BASE}/ticker/24hr`)
    );
    
    const usdtPairs = response.data
      .filter(ticker => ticker.symbol.endsWith('USDT'))
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, limit);
    
    console.log(`✅ Fetched ${usdtPairs.length} futures pairs, calculating RSI...`);

    // Calculate RSI with better error handling
    const tradingPairs: TradingPair[] = await Promise.all(
      usdtPairs.map(async (ticker, index) => {
        try {
          const rsiData = await calculateRSI(ticker.symbol, 'futures');
          
          if (index % 10 === 0) {
            console.log(`📊 Processed ${index + 1}/${usdtPairs.length} futures pairs`);
          }
          
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
        } catch (error) {
          console.warn(`⚠️ Error processing ${ticker.symbol}:`, error instanceof Error ? error.message : error);
          
          // Return pair with basic data but no RSI if calculation fails
          return {
            symbol: ticker.symbol,
            price: parseFloat(ticker.lastPrice),
            volume24h: parseFloat(ticker.quoteVolume),
            change24h: parseFloat(ticker.priceChangePercent),
            high24h: parseFloat(ticker.highPrice),
            low24h: parseFloat(ticker.lowPrice),
            rsi1h: null,
            rsi4h: null,
            rsi1d: null,
            signal: 'NEUTRAL' as const
          };
        }
      })
    );
    
    console.log(`✅ Completed futures pairs processing: ${tradingPairs.length} pairs`);
    return tradingPairs;
  } catch (error) {
    console.error('❌ Error fetching futures pairs:', error);
    throw new Error(`Failed to fetch futures trading data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Calculate RSI for different timeframes with better error handling
async function calculateRSI(symbol: string, market: 'spot' | 'futures') {
  const baseUrl = market === 'spot' ? BINANCE_API_BASE : BINANCE_FUTURES_BASE;
  
  try {
    // Calculate RSI with timeout and error handling for each timeframe
    const rsiPromises = [
      calculateRSIForInterval(symbol, '1h', baseUrl).catch(error => {
        console.warn(`⚠️ RSI 1h failed for ${symbol}:`, error instanceof Error ? error.message : error);
        return null;
      }),
      calculateRSIForInterval(symbol, '4h', baseUrl).catch(error => {
        console.warn(`⚠️ RSI 4h failed for ${symbol}:`, error instanceof Error ? error.message : error);
        return null;
      }),
      calculateRSIForInterval(symbol, '1d', baseUrl).catch(error => {
        console.warn(`⚠️ RSI 1d failed for ${symbol}:`, error instanceof Error ? error.message : error);
        return null;
      }),
    ];
    
    const [rsi1h, rsi4h, rsi1d] = await Promise.all(rsiPromises);
    
    return {
      rsi1h,
      rsi4h,
      rsi1d
    };
  } catch (error) {
    console.error(`❌ Error calculating RSI for ${symbol}:`, error);
    return {
      rsi1h: null,
      rsi4h: null,
      rsi1d: null
    };
  }
}

// Calculate RSI for a specific interval with timeout and retry
async function calculateRSIForInterval(symbol: string, interval: string, baseUrl: string): Promise<number | null> {
  try {
    const response = await rateLimiter.execute(() => 
      api.get<BinanceKlineResponse[]>(`${baseUrl}/klines`, {
        params: {
          symbol,
          interval,
          limit: 100 // Get enough data for RSI calculation
        },
        timeout: 8000, // 8 second timeout for klines requests
      })
    );
    
    if (!response.data || response.data.length < 15) {
      console.warn(`⚠️ Insufficient data for ${symbol} ${interval}: only ${response.data?.length || 0} periods`);
      return null;
    }
    
    const closes = response.data.map(kline => parseFloat(kline[4])); // Close price is at index 4
    return wilderRSI(closes);
  } catch (error) {
    // More specific error logging
    if (error instanceof Error) {
      if (error.message.includes('ETIMEDOUT')) {
        console.warn(`⏰ Timeout fetching klines for ${symbol} ${interval}`);
      } else if (error.message.includes('ECONNRESET')) {
        console.warn(`🔌 Connection reset for ${symbol} ${interval}`);
      } else {
        console.warn(`⚠️ Network error fetching ${symbol} ${interval}:`, error.message);
      }
    }
    return null;
  }
}

// Wilder's RSI calculation (TradingView standard)
function wilderRSI(closes: number[], period: number = 14): number | null {
  if (closes.length < period + 1) {
    console.warn(`⚠️ Insufficient data for RSI calculation: ${closes.length} periods, need ${period + 1}`);
    return null;
  }

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
  const rsi = parseFloat((100 - (100 / (1 + rs))).toFixed(2));
  
  // Validate RSI is in correct range
  if (rsi < 0 || rsi > 100) {
    console.warn(`⚠️ Invalid RSI calculated: ${rsi}`);
    return null;
  }
  
  return rsi;
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