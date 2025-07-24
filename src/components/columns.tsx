'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TradingPair } from '@/types/trading';
import { formatPrice, formatVolume, formatChange } from '@/lib/binance';

// Helper function to get signal color
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

// Helper function to get change icon
const getChangeIcon = (change: number) => {
  if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Activity className="w-4 h-4 text-gray-500" />;
};

// Helper function to get RSI color
const getRSIColor = (rsi: number | null) => {
  if (!rsi) return 'text-muted-foreground';
  if (rsi <= 30) return 'text-green-500 font-bold';
  if (rsi >= 70) return 'text-red-500 font-bold';
  return 'text-foreground';
};

export const columns: ColumnDef<TradingPair>[] = [
  {
    accessorKey: 'symbol',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 hover:bg-transparent"
        >
          Symbol
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const symbol = row.getValue('symbol') as string;
      return <div className="font-medium">{symbol}</div>;
    },
  },
  {
    accessorKey: 'price',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 hover:bg-transparent"
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('price'));
      return <div className="font-mono">{formatPrice(price)}</div>;
    },
  },
  {
    accessorKey: 'volume24h',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 hover:bg-transparent"
        >
          24h Volume
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const volume = parseFloat(row.getValue('volume24h'));
      return <div>{formatVolume(volume)}</div>;
    },
  },
  {
    accessorKey: 'change24h',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 hover:bg-transparent"
        >
          24h Change
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const change = parseFloat(row.getValue('change24h'));
      return (
        <div className="flex items-center gap-1">
          {getChangeIcon(change)}
          <span
            className={
              change > 0
                ? 'text-green-500'
                : change < 0
                ? 'text-red-500'
                : 'text-muted-foreground'
            }
          >
            {formatChange(change)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'rsi1h',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 hover:bg-transparent"
        >
          1h RSI
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const rsi = row.getValue('rsi1h') as number | null;
      return (
        <div className={getRSIColor(rsi)}>
          {rsi?.toFixed(2) ?? 'N/A'}
        </div>
      );
    },
  },
  {
    accessorKey: 'rsi4h',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 hover:bg-transparent"
        >
          4h RSI
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const rsi = row.getValue('rsi4h') as number | null;
      return (
        <div className={getRSIColor(rsi)}>
          {rsi?.toFixed(2) ?? 'N/A'}
        </div>
      );
    },
  },
  {
    accessorKey: 'rsi1d',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="p-0 hover:bg-transparent"
        >
          1d RSI
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const rsi = row.getValue('rsi1d') as number | null;
      return (
        <div className={getRSIColor(rsi)}>
          {rsi?.toFixed(2) ?? 'N/A'}
        </div>
      );
    },
  },
  {
    accessorKey: 'signal',
    header: 'Signal',
    cell: ({ row }) => {
      const signal = row.getValue('signal') as TradingPair['signal'];
      return (
        <Badge className={getSignalColor(signal)}>
          {signal.replace('_', ' ')}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
]; 