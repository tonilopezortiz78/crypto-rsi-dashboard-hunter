'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TradingPair } from '@/types/trading';
import { formatPrice, formatVolume, formatChange } from '@/lib/binance';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface TradingTableProps {
  title: string;
  apiEndpoint: string;
  market: 'spot' | 'futures';
}

interface AnimatedCellProps {
  value: string | number;
  className?: string;
  formatter?: (val: string | number) => string;
  children?: React.ReactNode;
}

function AnimatedCell({ value, className, formatter, children }: AnimatedCellProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setIsAnimating(true);
      setDisplayValue(value);
      
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      prevValueRef.current = value;
      
      return () => clearTimeout(timer);
    }
  }, [value]);

  const formattedValue = formatter ? formatter(displayValue) : displayValue;

  return (
    <TableCell 
      className={`${className} transition-all duration-300 ${
        isAnimating ? 'bg-blue-100 dark:bg-blue-900/30 scale-105' : ''
      }`}
    >
      {children || formattedValue}
    </TableCell>
  );
}

export function TradingTable({ title, apiEndpoint, market }: TradingTableProps) {
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const pairsRef = useRef<TradingPair[]>([]);

  const fetchData = useCallback(async () => {
    try {
      if (loading) setLoading(true);
      
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const newData: TradingPair[] = await response.json();
      
      // Only update if data actually changed
      const hasChanged = JSON.stringify(newData) !== JSON.stringify(pairsRef.current);
      if (hasChanged) {
        setPairs(newData);
        pairsRef.current = newData;
        setLastUpdate(new Date());
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, loading]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  const getSignalColor = (signal: TradingPair['signal']) => {
    switch (signal) {
      case 'STRONG_BUY':
        return 'bg-green-600 text-white hover:bg-green-700';
      case 'BUY':
        return 'bg-green-500 text-white hover:bg-green-600';
      case 'SELL':
        return 'bg-red-500 text-white hover:bg-red-600';
      case 'STRONG_SELL':
        return 'bg-red-600 text-white hover:bg-red-700';
      default:
        return 'bg-gray-500 text-white hover:bg-gray-600';
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getRSIColor = (rsi: number | null) => {
    if (!rsi) return 'text-muted-foreground';
    if (rsi <= 30) return 'text-green-500 font-bold';
    if (rsi >= 70) return 'text-red-500 font-bold';
    return 'text-foreground';
  };

  if (loading && pairs.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {title}
            <Badge variant="outline" className="ml-2">
              {market.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {title}
            <Badge variant="outline" className="ml-2">
              {market.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive text-center">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            {title}
            <Badge variant="outline" className="ml-2">
              {market.toUpperCase()}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>Top 10 {market} pairs by 24h volume</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>24h Volume</TableHead>
              <TableHead>24h Change</TableHead>
              <TableHead>1h RSI</TableHead>
              <TableHead>4h RSI</TableHead>
              <TableHead>1d RSI</TableHead>
              <TableHead>Signal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pairs.map((pair) => (
              <TableRow 
                key={pair.symbol} 
                className="hover:bg-muted/50 transition-colors duration-200"
              >
                <TableCell className="font-medium">{pair.symbol}</TableCell>
                
                <AnimatedCell 
                  value={pair.price} 
                  className="font-mono" 
                  formatter={(val) => formatPrice(Number(val))}
                />
                
                <AnimatedCell 
                  value={pair.volume24h} 
                  formatter={(val) => formatVolume(Number(val))}
                />
                
                <AnimatedCell value={pair.change24h}>
                  <div className="flex items-center gap-1">
                    {getChangeIcon(pair.change24h)}
                    <span
                      className={
                        pair.change24h > 0
                          ? 'text-green-500'
                          : pair.change24h < 0
                          ? 'text-red-500'
                          : 'text-muted-foreground'
                      }
                    >
                      {formatChange(pair.change24h)}
                    </span>
                  </div>
                </AnimatedCell>
                
                <AnimatedCell 
                  value={pair.rsi1h || 0} 
                  className={getRSIColor(pair.rsi1h)}
                >
                  {pair.rsi1h?.toFixed(2) ?? 'N/A'}
                </AnimatedCell>
                
                <AnimatedCell 
                  value={pair.rsi4h || 0} 
                  className={getRSIColor(pair.rsi4h)}
                >
                  {pair.rsi4h?.toFixed(2) ?? 'N/A'}
                </AnimatedCell>
                
                <AnimatedCell 
                  value={pair.rsi1d || 0} 
                  className={getRSIColor(pair.rsi1d)}
                >
                  {pair.rsi1d?.toFixed(2) ?? 'N/A'}
                </AnimatedCell>
                
                <AnimatedCell value={pair.signal}>
                  <Badge className={getSignalColor(pair.signal)}>
                    {pair.signal.replace('_', ' ')}
                  </Badge>
                </AnimatedCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 