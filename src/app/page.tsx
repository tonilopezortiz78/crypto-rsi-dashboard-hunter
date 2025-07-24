'use client';

import { AdvancedTradingTable } from '@/components/AdvancedTradingTable';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NetworkStatus } from '@/components/NetworkStatus';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-[1800px]">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              🚀 Crypto RSI Dashboard Pro
            </h1>
            <p className="text-muted-foreground">
              Advanced cryptocurrency RSI analysis with real-time WebSocket data from Binance
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NetworkStatus />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Side by Side Tables - Compact Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Spot Table */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold">📈 Spot Market</h2>
          <AdvancedTradingTable 
            title="Top Spot Trading Pairs"
            apiEndpoint="/api/spot"
            market="spot"
          />
        </div>

        {/* Futures Table */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold">🚀 Futures Market</h2>
          <AdvancedTradingTable 
            title="Top Futures Trading Pairs"
            apiEndpoint="/api/futures"
            market="futures"
          />
        </div>
      </div>
    </main>
  );
}
