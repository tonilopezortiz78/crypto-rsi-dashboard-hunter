// Trading data types for the RSI dashboard

export interface MarketTicker {
  symbol: string;
  price: number;
  volume24h: number;
  change24h: number;
  high24h: number;
  low24h: number;
}

export interface RSIData {
  symbol: string;
  market: 'spot' | 'futures';
  rsi1h: number | null;
  rsi4h: number | null;
  rsi1d: number | null;
}

export interface TradingPair {
  symbol: string;
  price: number;
  volume24h: number;
  change24h: number;
  high24h: number;
  low24h: number;
  rsi1h: number | null;
  rsi4h: number | null;
  rsi1d: number | null;
  signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
}

export interface WebSocketMessage {
  type: 'market_update' | 'rsi_update' | 'connection_status';
  data: TradingPair[] | { connected: boolean };
  timestamp: string;
}

export interface BinanceTickerData {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export type BinanceKlineResponse = [
  number, // openTime
  string, // open
  string, // high
  string, // low
  string, // close
  string, // volume
  number, // closeTime
  string, // quoteAssetVolume
  number, // numberOfTrades
  string, // takerBuyBaseAssetVolume
  string, // takerBuyQuoteAssetVolume
  string  // ignore
]; 