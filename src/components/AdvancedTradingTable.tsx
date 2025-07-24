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
          <div className="text-destructive text-center">
            <p>Error: {error}</p>
            <Button onClick={handleManualRefresh} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex flex-col space-y-4">
          {/* Title and Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>{title}</CardTitle>
              <Badge variant="outline" className="ml-2">
                {market.toUpperCase()}
              </Badge>
              {loading && (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-100 dark:bg-green-900' : ''}
              >
                {autoRefresh ? '🟢 Auto' : '⏸️ Manual'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>

          {/* Stats and Last Update */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {Object.entries(signalStats).map(([signal, count]) => (
                <Badge key={signal} variant="secondary" className="text-xs">
                  {signal.replace('_', ' ')}: {count}
                </Badge>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              Last update: {lastUpdate.toLocaleTimeString()} • 
              {pairs.length} pairs • 
              Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <DataTable
          columns={columns}
          data={pairs}
          searchPlaceholder={`Search ${market} pairs...`}
        />
      </CardContent>
    </Card>
  );
} 