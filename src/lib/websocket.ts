import WebSocket from 'ws';
import { TradingPair } from '@/types/trading';
import { wilderRSI, formatPrice, formatVolume, formatChange, getRSISignal } from './binance';

interface BinanceTickerData {
  s: string;  // symbol
  c: string;  // close price
  v: string;  // volume (base asset)
  q: string;  // quote volume (USDT)
  P: string;  // price change percent
  h: string;  // high price  
  l: string;  // low price
}

interface BinanceKlineData {
  s: string;  // symbol
  k: {
    s: string;  // symbol
    i: string;  // interval
    c: string;  // close price
    o: string;  // open price
    h: string;  // high price
    l: string;  // low price
    v: string;  // volume
    t: number;  // kline start time
    T: number;  // kline close time
    x: boolean; // is this kline closed?
  }
}

interface KlineHistory {
  [symbol: string]: {
    [interval: string]: Array<{
      close: number;
      timestamp: number;
    }>;
  };
}

export class BinanceWebSocketManager {
  private spotTickerWs: WebSocket | null = null;
  private futuresTickerWs: WebSocket | null = null;
  private klineWs: WebSocket | null = null;
  private spotData: Map<string, TradingPair> = new Map();
  private futuresData: Map<string, TradingPair> = new Map();
  private klineHistory: KlineHistory = {};
  private subscribers: Set<(type: 'spot' | 'futures', data: TradingPair[]) => void> = new Set();
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly maxReconnectDelay = 30000;
  private readonly initialReconnectDelay = 1000;
  private initialized = false;
  
  // Dynamic kline stream management
  private currentTopSymbols: Set<string> = new Set();
  private readonly targetSymbolCount = 15; // Top 15 for each market
  private klineStreamMap: Map<string, WebSocket> = new Map();
  private volumeCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Don't auto-initialize in constructor to avoid issues in Next.js environment
  }

  public initialize() {
    if (this.initialized) return;
    
    console.log('🚀 Initializing Binance WebSocket connections...');
    this.initialized = true;
    this.connectSpotTicker();
    this.connectFuturesTicker();
    this.startVolumeMonitoring();
  }

  private connectSpotTicker() {
    console.log('🔌 Connecting to Binance Spot 24hr ticker stream...');
    
    this.spotTickerWs = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
    
    this.spotTickerWs.on('open', () => {
      console.log('✅ Connected to Binance Spot ticker stream');
      this.clearReconnectTimeout('spot-ticker');
    });
    
    this.spotTickerWs.on('message', (data) => {
      try {
        const tickers: BinanceTickerData[] = JSON.parse(data.toString());
        this.processTickers(tickers, 'spot');
      } catch (error) {
        console.error('❌ Error processing spot ticker data:', error);
      }
    });
    
    this.spotTickerWs.on('close', () => {
      console.log('🔌 Spot ticker stream disconnected, reconnecting...');
      this.scheduleReconnect('spot-ticker', () => this.connectSpotTicker());
    });
    
    this.spotTickerWs.on('error', (error) => {
      console.error('❌ Spot ticker WebSocket error:', error);
    });
  }

  private connectFuturesTicker() {
    console.log('🔌 Connecting to Binance Futures 24hr ticker stream...');
    
    this.futuresTickerWs = new WebSocket('wss://fstream.binance.com/ws/!ticker@arr');
    
    this.futuresTickerWs.on('open', () => {
      console.log('✅ Connected to Binance Futures ticker stream');
      this.clearReconnectTimeout('futures-ticker');
    });
    
    this.futuresTickerWs.on('message', (data) => {
      try {
        const tickers: BinanceTickerData[] = JSON.parse(data.toString());
        this.processTickers(tickers, 'futures');
      } catch (error) {
        console.error('❌ Error processing futures ticker data:', error);
      }
    });
    
    this.futuresTickerWs.on('close', () => {
      console.log('🔌 Futures ticker stream disconnected, reconnecting...');
      this.scheduleReconnect('futures-ticker', () => this.connectFuturesTicker());
    });
    
    this.futuresTickerWs.on('error', (error) => {
      console.error('❌ Futures ticker WebSocket error:', error);
    });
  }

  private startVolumeMonitoring() {
    console.log('📊 Starting dynamic volume monitoring for top coins...');
    
    // Check and update kline streams every 10 seconds
    this.volumeCheckInterval = setInterval(() => {
      this.updateKlineStreamsBasedOnVolume();
    }, 10000);
    
    // Initial update after 5 seconds to let ticker data populate
    setTimeout(() => {
      this.updateKlineStreamsBasedOnVolume();
    }, 5000);
  }
  
  private updateKlineStreamsBasedOnVolume() {
    // Get current top symbols by volume from both spot and futures
    const spotSymbols = Array.from(this.spotData.values())
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, this.targetSymbolCount)
      .map(pair => pair.symbol);
      
    const futuresSymbols = Array.from(this.futuresData.values())
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, this.targetSymbolCount)
      .map(pair => pair.symbol);
    
    // Combine and deduplicate
    const newTopSymbols = new Set([...spotSymbols, ...futuresSymbols]);
    
    if (newTopSymbols.size === 0) {
      console.log('⏳ No ticker data yet, waiting...');
      return;
    }
    
    // Check if symbols changed
    const symbolsChanged = !this.setsEqual(this.currentTopSymbols, newTopSymbols);
    
    if (symbolsChanged) {
      console.log(`🔄 Top symbols changed! New top coins:`, Array.from(newTopSymbols).slice(0, 10));
      
      // Close old streams
      this.closeOldKlineStreams();
      
      // Update current symbols
      this.currentTopSymbols = newTopSymbols;
      
      // Start new streams
      this.connectKlineStreamsForSymbols(Array.from(newTopSymbols));
    }
  }
  
  private setsEqual<T>(set1: Set<T>, set2: Set<T>): boolean {
    if (set1.size !== set2.size) return false;
    for (const item of set1) {
      if (!set2.has(item)) return false;
    }
    return true;
  }
  
  private closeOldKlineStreams() {
    for (const [symbol, ws] of this.klineStreamMap) {
      ws.close();
      console.log(`🔌 Closed kline stream for ${symbol}`);
    }
    this.klineStreamMap.clear();
  }
  
  private connectKlineStreamsForSymbols(symbols: string[]) {
    if (symbols.length === 0) return;
    
    // Limit to top 10 most important symbols to reduce connection load
    const prioritySymbols = symbols.slice(0, 10);
    const intervals = ['1h', '4h', '1d'];
    
    // Create one combined stream for better reliability
    const allStreams = prioritySymbols.flatMap(symbol => 
      intervals.map(interval => `${symbol.toLowerCase()}@kline_${interval}`)
    );
    
    // Split into groups of 30 streams per connection (Binance limit)
    const streamGroups = [];
    for (let i = 0; i < allStreams.length; i += 30) {
      streamGroups.push(allStreams.slice(i, i + 30));
    }
    
    for (let groupIndex = 0; groupIndex < streamGroups.length; groupIndex++) {
      const streams = streamGroups[groupIndex];
      const streamUrl = `wss://stream.binance.com:9443/ws/${streams.join('/')}`;
      
      const ws = new WebSocket(streamUrl);
      const groupKey = `group_${groupIndex}`;
      
      ws.on('open', () => {
        console.log(`✅ Connected to kline streams group ${groupIndex + 1}/${streamGroups.length} (${streams.length} streams)`);
      });
      
      ws.on('message', (data) => {
        try {
          const klineData: BinanceKlineData = JSON.parse(data.toString());
          this.processKlineData(klineData);
        } catch (error) {
          console.error(`❌ Error processing kline data group ${groupIndex}:`, error);
        }
      });
      
      ws.on('close', () => {
        console.log(`🔌 Kline stream group ${groupIndex} disconnected`);
        this.klineStreamMap.delete(groupKey);
        
        // Auto-reconnect with backoff
        setTimeout(() => {
          console.log(`🔄 Reconnecting kline stream group ${groupIndex}...`);
          const symbolsInGroup = streams.map(s => s.split('@')[0].toUpperCase());
          const stillRelevant = symbolsInGroup.filter(sym => this.currentTopSymbols.has(sym));
          
          if (stillRelevant.length > 0) {
            this.connectKlineStreamsForSymbols(stillRelevant);
          }
        }, 10000 + groupIndex * 2000); // Staggered reconnection
      });
      
      ws.on('error', (error) => {
        console.error(`❌ Kline WebSocket error group ${groupIndex}:`, error);
        // Try to fallback to REST API for RSI calculation
        this.fallbackRSICalculation(prioritySymbols);
      });
      
      this.klineStreamMap.set(groupKey, ws);
    }
    
    console.log(`📊 Active kline connections: ${this.klineStreamMap.size} groups for ${prioritySymbols.length} symbols`);
    
    // Start fallback RSI calculation for symbols without WebSocket data
    setTimeout(() => {
      this.fallbackRSICalculation(prioritySymbols);
    }, 30000); // After 30 seconds, calculate RSI via REST if needed
  }
  
  private async fallbackRSICalculation(symbols: string[]) {
    console.log('🔄 Starting fallback RSI calculation via REST API...');
    
    for (const symbol of symbols) {
      // Only calculate if we don't have recent RSI data
      if (!this.klineHistory[symbol] || Object.keys(this.klineHistory[symbol]).length === 0) {
        try {
          await this.calculateRSIViaREST(symbol);
        } catch (error) {
          console.error(`❌ Fallback RSI calculation failed for ${symbol}:`, error);
        }
      }
    }
  }
  
  private async calculateRSIViaREST(symbol: string) {
    const intervals = [
      { key: '1h', limit: 100 },
      { key: '4h', limit: 100 },
      { key: '1d', limit: 100 }
    ];
    
    for (const interval of intervals) {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval.key}&limit=${interval.limit}`,
          { signal: AbortSignal.timeout(10000) } // 10 second timeout
        );
        
        if (response.ok) {
          const klines = await response.json();
          if (klines.length >= 15) {
            const closes = klines.map((k: any) => parseFloat(k[4])); // Close price
            const rsi = wilderRSI(closes, 14);
            
            if (rsi !== null && rsi >= 0 && rsi <= 100) {
              // Store in history for immediate use
              if (!this.klineHistory[symbol]) {
                this.klineHistory[symbol] = {};
              }
              
              this.klineHistory[symbol][interval.key] = closes.map((close: number, index: number) => ({
                close,
                timestamp: Date.now() - ((closes.length - 1 - index) * 3600000) // Approximate timestamps
              }));
              
              console.log(`✅ Calculated ${symbol} ${interval.key} RSI via REST: ${rsi.toFixed(2)}`);
            }
          }
        }
      } catch (error) {
        console.error(`❌ REST RSI calculation failed for ${symbol} ${interval.key}:`, error);
      }
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private scheduleReconnect(type: string, reconnectFn: () => void) {
    const delay = Math.min(this.initialReconnectDelay * Math.pow(2, 
      this.reconnectTimeouts.size), this.maxReconnectDelay);
    
    const timeout = setTimeout(() => {
      reconnectFn();
    }, delay);
    
    this.reconnectTimeouts.set(type, timeout);
  }

  private clearReconnectTimeout(type: string) {
    const timeout = this.reconnectTimeouts.get(type);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(type);
    }
  }

  private processTickers(tickers: BinanceTickerData[], market: 'spot' | 'futures') {
    const dataMap = market === 'spot' ? this.spotData : this.futuresData;
    
    // Filter for USDT pairs and process
    const usdtTickers = tickers.filter(ticker => 
      ticker.s.endsWith('USDT') && 
      !ticker.s.includes('UP') && 
      !ticker.s.includes('DOWN') &&
      !ticker.s.includes('BEAR') &&
      !ticker.s.includes('BULL')
    );

    // Sort by USDT volume and take top 50
    const sortedTickers = usdtTickers
      .sort((a, b) => parseFloat(b.q) - parseFloat(a.q))  // Use quote volume (USDT)
      .slice(0, 50);

    for (const ticker of sortedTickers) {
      const existingPair = dataMap.get(ticker.s);
      const currentPrice = parseFloat(ticker.c);
      
      // Calculate RSI with live price for real-time updates
      const rsiData = this.getRSIForSymbol(ticker.s, currentPrice);
      
      const tradingPair: TradingPair = {
        symbol: ticker.s,
        price: currentPrice,
        volume24h: parseFloat(ticker.q),  // Use quote volume (USDT)
        change24h: parseFloat(ticker.P),
        high24h: parseFloat(ticker.h),
        low24h: parseFloat(ticker.l),
        rsi1h: rsiData.rsi1h,
        rsi4h: rsiData.rsi4h,
        rsi1d: rsiData.rsi1d,
        signal: getRSISignal(rsiData.rsi1d)
      };
      
      dataMap.set(ticker.s, tradingPair);
    }

    // Notify subscribers
    const sortedPairs = Array.from(dataMap.values())
      .sort((a, b) => b.volume24h - a.volume24h);
    
    this.notifySubscribers(market, sortedPairs);
  }

  private processKlineData(klineData: BinanceKlineData) {
    const { s: symbol, k: kline } = klineData;
    
    // Only process closed klines (historical data for RSI base calculation)
    // Note: Live price from ticker stream provides real-time RSI updates
    if (!kline.x) return;
    
    const interval = kline.i;
    const closePrice = parseFloat(kline.c);
    const timestamp = kline.T;
    
    // Initialize symbol history if not exists
    if (!this.klineHistory[symbol]) {
      this.klineHistory[symbol] = {};
    }
    
    if (!this.klineHistory[symbol][interval]) {
      this.klineHistory[symbol][interval] = [];
    }
    
    // Add new kline data
    this.klineHistory[symbol][interval].push({
      close: closePrice,
      timestamp
    });
    
    // Keep only last 100 periods for RSI calculation
    if (this.klineHistory[symbol][interval].length > 100) {
      this.klineHistory[symbol][interval] = this.klineHistory[symbol][interval].slice(-100);
    }
    
    console.log(`📊 Updated ${symbol} ${interval} kline: ${closePrice}`);
  }

  private getRSIForSymbol(symbol: string, currentPrice?: number): { rsi1h: number | null; rsi4h: number | null; rsi1d: number | null } {
    const result: { rsi1h: number | null; rsi4h: number | null; rsi1d: number | null } = { rsi1h: null, rsi4h: null, rsi1d: null };
    
    if (!this.klineHistory[symbol]) return result;
    
    // Calculate RSI for each interval
    const intervals = [
      { key: 'rsi1h' as keyof typeof result, interval: '1h' },
      { key: 'rsi4h' as keyof typeof result, interval: '4h' },
      { key: 'rsi1d' as keyof typeof result, interval: '1d' }
    ];
    
    for (const { key, interval } of intervals) {
      const klines = this.klineHistory[symbol][interval];
      if (klines && klines.length >= 14) {
        // Get historical closes
        let closes = klines.map(k => k.close);
        
        // Include current live price as the current candle's close (if available)
        if (currentPrice !== undefined) {
          closes = [...closes, currentPrice];
          // Debug: Log real-time RSI calculation
          if (Math.random() < 0.01) { // Log 1% of calculations to avoid spam
            console.log(`⚡ Real-time RSI ${symbol} ${interval}: Using live price $${currentPrice}`);
          }
        }
        
        // Calculate RSI with live price included
        const rsi = wilderRSI(closes, 14);
        if (rsi !== null && rsi >= 0 && rsi <= 100) {
          if (key === 'rsi1h') result.rsi1h = rsi;
          else if (key === 'rsi4h') result.rsi4h = rsi;
          else if (key === 'rsi1d') result.rsi1d = rsi;
        }
      }
    }
    
    return result;
  }

  public subscribe(callback: (type: 'spot' | 'futures', data: TradingPair[]) => void) {
    this.subscribers.add(callback);
    
    // Send current data immediately
    const spotPairs = Array.from(this.spotData.values())
      .sort((a, b) => b.volume24h - a.volume24h);
    const futuresPairs = Array.from(this.futuresData.values())
      .sort((a, b) => b.volume24h - a.volume24h);
    
    if (spotPairs.length > 0) {
      callback('spot', spotPairs);
    }
    if (futuresPairs.length > 0) {
      callback('futures', futuresPairs);
    }
  }

  public unsubscribe(callback: (type: 'spot' | 'futures', data: TradingPair[]) => void) {
    this.subscribers.delete(callback);
  }

  private notifySubscribers(type: 'spot' | 'futures', data: TradingPair[]) {
    for (const callback of this.subscribers) {
      try {
        callback(type, data);
      } catch (error) {
        console.error('❌ Error notifying subscriber:', error);
      }
    }
  }

  public async getSpotData(limit: number = 50): Promise<TradingPair[]> {
    if (!this.initialized) {
      this.initialize();
    }
    
    const sortedData = Array.from(this.spotData.values())
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, limit);
    
    // Calculate RSI for coins that don't have it yet
    await this.ensureRSIForCoins(sortedData);
    
    return sortedData;
  }

  public async getFuturesData(limit: number = 50): Promise<TradingPair[]> {
    if (!this.initialized) {
      this.initialize();
    }
    
    const sortedData = Array.from(this.futuresData.values())
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, limit);
    
    // Calculate RSI for coins that don't have it yet
    await this.ensureRSIForCoins(sortedData);
    
    return sortedData;
  }

  private async ensureRSIForCoins(coins: TradingPair[]) {
    const coinsNeedingRSI = coins.filter(coin => 
      coin.rsi1h === null || coin.rsi4h === null || coin.rsi1d === null
    );
    
    if (coinsNeedingRSI.length === 0) return;
    
    console.log(`🔄 Calculating missing RSI for ${coinsNeedingRSI.length} coins...`);
    
    // Calculate RSI for coins that need it
    const promises = coinsNeedingRSI.map(async (coin) => {
      try {
        await this.calculateRSIViaREST(coin.symbol);
        // Update the coin object with new RSI data including current live price
        const rsiData = this.getRSIForSymbol(coin.symbol, coin.price);
        coin.rsi1h = rsiData.rsi1h;
        coin.rsi4h = rsiData.rsi4h;
        coin.rsi1d = rsiData.rsi1d;
        coin.signal = getRSISignal(rsiData.rsi1d); // Use 1d RSI for signal
      } catch (error) {
        console.error(`❌ Failed to calculate RSI for ${coin.symbol}:`, error);
      }
    });
    
    await Promise.all(promises);
  }

  public getConnectionStatus() {
    if (!this.initialized) {
      this.initialize();
    }
    
    const klineConnections = Array.from(this.klineStreamMap.values())
      .filter(ws => ws.readyState === WebSocket.OPEN).length;
    
    return {
      spot: this.spotTickerWs?.readyState === WebSocket.OPEN,
      futures: this.futuresTickerWs?.readyState === WebSocket.OPEN,
      klines: {
        connected: klineConnections,
        total: this.klineStreamMap.size,
        symbols: Array.from(this.currentTopSymbols).slice(0, 10)
      },
      initialized: this.initialized
    };
  }

  public close() {
    console.log('🔌 Closing WebSocket connections...');
    
    // Clear all reconnect timeouts
    for (const timeout of this.reconnectTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.reconnectTimeouts.clear();
    
    // Clear volume monitoring
    if (this.volumeCheckInterval) {
      clearInterval(this.volumeCheckInterval);
      this.volumeCheckInterval = null;
    }
    
    // Close connections
    this.spotTickerWs?.close();
    this.futuresTickerWs?.close();
    this.closeOldKlineStreams();
    
    // Clear data
    this.spotData.clear();
    this.futuresData.clear();
    this.klineHistory = {};
    this.currentTopSymbols.clear();
    this.subscribers.clear();
    this.initialized = false;
  }
}

// Global instance
export const websocketManager = new BinanceWebSocketManager(); 