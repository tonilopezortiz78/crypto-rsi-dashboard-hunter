import { AdvancedTradingTable } from '@/components/AdvancedTradingTable';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-[1600px]">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              🚀 Crypto RSI Dashboard Pro
            </h1>
            <p className="text-muted-foreground">
              Advanced cryptocurrency trading analysis with filtering, sorting & pagination
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="space-y-8">
        <AdvancedTradingTable
          title="📊 Spot Trading"
          apiEndpoint="/api/spot"
          market="spot"
        />
        <AdvancedTradingTable
          title="⚡ Futures Trading"
          apiEndpoint="/api/futures"
          market="futures"
        />
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div>
            <h3 className="font-semibold mb-2">🔧 Features:</h3>
            <ul className="space-y-1 text-xs">
              <li>• Global search across all columns</li>
              <li>• Sort by any column (price, volume, RSI, etc.)</li>
              <li>• Filter by trading signals</li>
              <li>• Pagination with customizable page size</li>
              <li>• Export data to CSV</li>
              <li>• Auto-refresh every 10 seconds</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">📊 RSI Signals:</h3>
            <ul className="space-y-1 text-xs">
              <li>🟢 <strong>Strong Buy:</strong> RSI ≤ 20 (Extremely oversold)</li>
              <li>🟢 <strong>Buy:</strong> RSI ≤ 30 (Oversold)</li>
              <li>⚪ <strong>Neutral:</strong> 30 &lt; RSI &lt; 70 (Normal range)</li>
              <li>🔴 <strong>Sell:</strong> RSI ≥ 70 (Overbought)</li>
              <li>🔴 <strong>Strong Sell:</strong> RSI ≥ 80 (Extremely overbought)</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-muted-foreground/20">
          <p className="text-center">
            RSI calculated using Wilder&apos;s method • Data from Binance API • 
            <span className="font-semibold">For educational purposes only - Not financial advice</span>
          </p>
        </div>
      </div>
    </main>
  );
}
