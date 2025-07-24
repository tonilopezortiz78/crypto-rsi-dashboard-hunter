'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';

interface NetworkStatusProps {
  className?: string;
}

interface ApiStatus {
  spot: 'healthy' | 'degraded' | 'down' | 'unknown';
  futures: 'healthy' | 'degraded' | 'down' | 'unknown';
  lastCheck: Date;
  errors: string[];
}

export function NetworkStatus({ className }: NetworkStatusProps) {
  const [status, setStatus] = useState<ApiStatus>({
    spot: 'unknown',
    futures: 'unknown',
    lastCheck: new Date(),
    errors: []
  });

  useEffect(() => {
    checkApiHealth();
    const interval = setInterval(checkApiHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkApiHealth = async () => {
    const errors: string[] = [];
    let spotStatus: ApiStatus['spot'] = 'unknown';
    let futuresStatus: ApiStatus['futures'] = 'unknown';

    try {
      // Test spot API with minimal request
      const spotResponse = await fetch('/api/spot?limit=5', { 
        method: 'GET',
        signal: AbortSignal.timeout(10000) 
      });
      
      if (spotResponse.ok) {
        const spotData = await spotResponse.json();
        if (Array.isArray(spotData) && spotData.length > 0) {
          // Check if RSI data is available
          const hasRSI = spotData.some(item => item.rsi1d !== null);
          spotStatus = hasRSI ? 'healthy' : 'degraded';
          if (!hasRSI) {
            errors.push('Spot RSI calculation issues detected');
          }
        } else {
          spotStatus = 'degraded';
          errors.push('Spot API returning empty data');
        }
      } else {
        spotStatus = 'down';
        errors.push(`Spot API error: ${spotResponse.status}`);
      }
    } catch (error) {
      spotStatus = 'down';
      errors.push(`Spot API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      // Test futures API with minimal request
      const futuresResponse = await fetch('/api/futures?limit=5', { 
        method: 'GET',
        signal: AbortSignal.timeout(10000) 
      });
      
      if (futuresResponse.ok) {
        const futuresData = await futuresResponse.json();
        if (Array.isArray(futuresData) && futuresData.length > 0) {
          // Check if RSI data is available
          const hasRSI = futuresData.some(item => item.rsi1d !== null);
          futuresStatus = hasRSI ? 'healthy' : 'degraded';
          if (!hasRSI) {
            errors.push('Futures RSI calculation issues detected');
          }
        } else {
          futuresStatus = 'degraded';
          errors.push('Futures API returning empty data');
        }
      } else {
        futuresStatus = 'down';
        errors.push(`Futures API error: ${futuresResponse.status}`);
      }
    } catch (error) {
      futuresStatus = 'down';
      errors.push(`Futures API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setStatus({
      spot: spotStatus,
      futures: futuresStatus,
      lastCheck: new Date(),
      errors: errors.slice(0, 3) // Keep only latest 3 errors
    });
  };

  const getOverallStatus = () => {
    if (status.spot === 'down' && status.futures === 'down') return 'down';
    if (status.spot === 'down' || status.futures === 'down') return 'degraded';
    if (status.spot === 'degraded' || status.futures === 'degraded') return 'degraded';
    if (status.spot === 'healthy' && status.futures === 'healthy') return 'healthy';
    return 'unknown';
  };

  const getStatusIcon = (apiStatus: ApiStatus['spot']) => {
    switch (apiStatus) {
      case 'healthy':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'down':
        return <WifiOff className="h-3 w-3 text-red-500" />;
      default:
        return <Wifi className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusColor = (apiStatus: ApiStatus['spot']) => {
    switch (apiStatus) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'down':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const overallStatus = getOverallStatus();

  return (
    <Card className={`${className} border-border`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {getStatusIcon(overallStatus)}
              <span className="text-xs font-medium">API Status</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className={`text-xs ${getStatusColor(status.spot)}`}>
                {getStatusIcon(status.spot)}
                <span className="ml-1">Spot</span>
              </Badge>
              <Badge variant="secondary" className={`text-xs ${getStatusColor(status.futures)}`}>
                {getStatusIcon(status.futures)}
                <span className="ml-1">Futures</span>
              </Badge>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {status.lastCheck.toLocaleTimeString()}
          </div>
        </div>

        {status.errors.length > 0 && (
          <div className="mt-2 space-y-1">
            {status.errors.map((error, index) => (
              <div key={index} className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {error}
              </div>
            ))}
          </div>
        )}

        {overallStatus === 'degraded' && status.errors.length === 0 && (
          <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
            Some services may be experiencing issues. Data may be incomplete.
          </div>
        )}
      </CardContent>
    </Card>
  );
} 