'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TradingPair } from '@/types/trading';
import { DataTable } from './DataTable';
import { columns } from './columns';
import { RefreshCw, Download } from 'lucide-react';

interface AdvancedTradingTableProps {
  title: string;
  apiEndpoint: string;
  market: 'spot' | 'futures';
}

export function AdvancedTradingTable({ title, apiEndpoint, market }: AdvancedTradingTableProps) {
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const pairsRef = useRef<TradingPair[]>([]);

  const fetchData = useCallback(async () => {
    try {
      if (loading) setLoading(true);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${apiEndpoint}?limit=50`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 500) {
          throw new Error('Binance API connection issues detected. RSI data may be incomplete.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before refreshing.');
        } else {
          throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
      }
      
      const newData: TradingPair[] = await response.json();
      
      if (!Array.isArray(newData)) {
        throw new Error('Invalid data format received from API');
      }
      
      // Only update if data actually changed
      const hasChanged = JSON.stringify(newData) !== JSON.stringify(pairsRef.current);
      if (hasChanged) {
        setPairs(newData);
        pairsRef.current = newData;
        setLastUpdate(new Date());
        
        // Log data quality information
        const withRSI = newData.filter(item => item.rsi1d !== null).length;
        const total = newData.length;
        if (withRSI < total * 0.8) {
          console.warn(`⚠️ ${market} market: Only ${withRSI}/${total} pairs have RSI data (${Math.round(withRSI/total*100)}%)`);
        }
      }
      
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timeout - Binance API may be experiencing issues');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred');
      }
      console.error(`❌ Error fetching ${market} data:`, err);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, loading, market]);

  useEffect(() => {
    fetchData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchData, 10000); // Update every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchData, autoRefresh]);

  const handleManualRefresh = () => {
    setLoading(true);
    fetchData();
  };

  const handleExportData = () => {
    const csvContent = [
      // CSV Headers
      ['Symbol', 'Price', '24h Volume', '24h Change', '1h RSI', '4h RSI', '1d RSI', 'Signal'].join(','),
      // CSV Data
      ...pairs.map(pair => [
        pair.symbol,
        pair.price,
        pair.volume24h,
        pair.change24h,
        pair.rsi1h ?? 'N/A',
        pair.rsi4h ?? 'N/A',
        pair.rsi1d ?? 'N/A',
        pair.signal
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${market}-trading-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Get signal statistics
  const signalStats = pairs.reduce((acc, pair) => {
    acc[pair.signal] = (acc[pair.signal] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading && pairs.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {title}
            <Badge variant="outline" className="text-xs">
              {market.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {title}
            <Badge variant="outline" className="text-xs">
              {market.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="text-destructive text-center">
            <p className="text-sm">Error: {error}</p>
            <Button onClick={handleManualRefresh} className="mt-3" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-2">
          {/* Title and Controls - Compact */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{title}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {market.toUpperCase()}
              </Badge>
              {loading && (
                <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-xs h-7 px-2 ${autoRefresh ? 'bg-green-100 dark:bg-green-900' : ''}`}
              >
                {autoRefresh ? '🟢' : '⏸️'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={loading}
                className="text-xs h-7 px-2"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                className="text-xs h-7 px-2"
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Stats and Last Update - Compact */}
          <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1">
              {Object.entries(signalStats).map(([signal, count]) => (
                <Badge key={signal} variant="secondary" className="text-xs px-1 py-0">
                  {signal.replace('_', ' ')}: {count}
                </Badge>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              {lastUpdate.toLocaleTimeString()} • {pairs.length} pairs
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-3">
        <DataTable
          columns={columns}
          data={pairs}
          searchPlaceholder={`Search ${market} pairs...`}
        />
      </CardContent>
    </Card>
  );
} 