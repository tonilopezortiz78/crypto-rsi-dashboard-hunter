import { TradingTable } from '@/components/TradingTable';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              🚀 Crypto RSI Dashboard
            </h1>
            <p className="text-muted-foreground">
              Real-time RSI analysis for top cryptocurrency pairs
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TradingTable
          title="📊 Spot Trading"
          apiEndpoint="/api/spot"
          market="spot"
        />
        <TradingTable
          title="⚡ Futures Trading"
          apiEndpoint="/api/futures"
          market="futures"
        />
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Data updates every 5 seconds • RSI calculated using Wilder&apos;s method</p>
        <p>
          🟢 RSI ≤30: Oversold | 🔴 RSI ≥70: Overbought | 
          <span className="ml-2">
            Strong signals at RSI ≤20 (Strong Buy) and RSI ≥80 (Strong Sell)
          </span>
        </p>
      </div>
    </main>
  );
}
