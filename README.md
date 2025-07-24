# 🚀 Crypto RSI Dashboard Hunter

A **professional real-time cryptocurrency RSI dashboard** built with Next.js 14, featuring live Binance data, smooth animations, and dark theme support.

![Crypto RSI Dashboard](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

## ✨ Features

### 📊 **Real-time Trading Data**
- **Live Binance API Integration** - Real-time price, volume, and RSI data
- **Dual Market Support** - Spot and Futures trading pairs side-by-side
- **Top 50 Pairs** - Automatically sorted by 24h trading volume (USDT)
- **Auto-refresh** - Updates every 10 seconds with toggle control

### 📈 **Advanced RSI Analysis**
- **Multi-timeframe RSI** - 1h, 4h, and 1d RSI indicators
- **Wilder's RSI Formula** - TradingView-standard calculation
- **Smart Trading Signals**:
  - 🟢 **STRONG BUY** (RSI ≤ 20) - Extremely oversold
  - 🟢 **BUY** (RSI ≤ 30) - Oversold  
  - 🔴 **SELL** (RSI ≥ 70) - Overbought
  - 🔴 **STRONG SELL** (RSI ≥ 80) - Extremely overbought
  - ⚪ **NEUTRAL** (30 < RSI < 70) - Normal range

### 📋 **Advanced Table Features**
- **Global Search** - Search across all columns instantly
- **Multi-Column Sorting** - Sort by price, volume, RSI, or any column
- **Smart Filtering** - Filter by trading signals (Strong Buy, Buy, etc.)
- **Pagination** - Handle 50+ coins with customizable page sizes (10-50)
- **Column Visibility** - Show/hide columns as needed
- **CSV Export** - Download trading data for analysis
- **Auto-refresh Toggle** - Control data updates (auto/manual)

### 🎨 **Modern UI/UX**
- **Dark/Light Theme** - Smooth theme switching with system detection
- **Smooth Animations** - Individual cell updates without jarring refreshes
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **shadcn/ui Components** - Professional, accessible UI components
- **Real-time Indicators** - Visual feedback for data changes

### 🔧 **Technical Features**
- **Performance Optimized** - Smart re-rendering and change detection
- **Advanced Error Handling** - Graceful API failure recovery with retries
- **Network Resilience** - Automatic retry logic for connection timeouts
- **Rate Limiting** - Respects Binance API limits with intelligent queuing
- **Real-time Monitoring** - Network status dashboard with health checks
- **TypeScript** - Full type safety for reliability
- **Accessibility** - WCAG compliant components

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI Framework**: shadcn/ui components, Tailwind CSS
- **Data Table**: TanStack Table for advanced features
- **API**: Binance REST API, Axios for HTTP requests
- **Theme**: next-themes for dark/light mode
- **Icons**: Lucide React
- **Performance**: Smart memoization, change detection, optimized rendering

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/tonilopezortiz78/crypto-rsi-dashboard-hunter.git
cd crypto-rsi-dashboard-hunter
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open your browser**
```
http://localhost:3000
```

That's it! The dashboard will start pulling live data from Binance immediately.

## 📊 Dashboard Overview

### **Advanced Spot Trading Table**
- Top 50 spot pairs by 24h volume with pagination
- Global search and multi-column sorting
- Signal filtering and column visibility controls
- Real-time price updates with change detection
- CSV export functionality

### **Advanced Futures Trading Table** 
- Top 50 futures pairs by 24h volume with pagination
- Same advanced filtering and sorting capabilities
- Higher leverage trading opportunities
- Comprehensive RSI analysis across timeframes
- Live trading signals with statistics

### **Data Display**
- **Symbol**: Trading pair (e.g., BTCUSDT, ETHUSDT)
- **Price**: Current market price with smooth updates
- **24h Volume**: Trading volume in USDT
- **24h Change**: Percentage change with color coding
- **1h/4h/1d RSI**: Multi-timeframe relative strength index
- **Signal**: Automated trading signal based on daily RSI

## 🎯 Trading Signals Explained

The dashboard uses **daily RSI** for trading signals as it's more reliable for medium-term trading:

| RSI Range | Signal | Meaning | Action Suggestion |
|-----------|---------|---------|-------------------|
| ≤ 20 | 🟢 STRONG BUY | Extremely oversold | Consider buying |
| 21-30 | 🟢 BUY | Oversold | Watch for entry |
| 31-69 | ⚪ NEUTRAL | Normal range | Hold position |
| 70-79 | 🔴 SELL | Overbought | Consider selling |
| ≥ 80 | 🔴 STRONG SELL | Extremely overbought | Strong sell signal |

> **Note**: These are automated signals for reference only. Always do your own research and risk management.

## 🔧 Configuration

### Environment Variables (Optional)
Create a `.env.local` file for custom configuration:

```env
# API Configuration
NEXT_PUBLIC_UPDATE_INTERVAL=5000
NEXT_PUBLIC_API_TIMEOUT=10000

# Theme Configuration  
NEXT_PUBLIC_DEFAULT_THEME=system
```

### Customization
- **Update Frequency**: Modify the 10-second interval in `AdvancedTradingTable.tsx`
- **Pair Count**: Change from top 50 to any number in the API calls
- **Pagination Size**: Adjust default page size in `DataTable.tsx`
- **RSI Periods**: Adjust RSI calculation periods in `binance.ts`
- **Signal Thresholds**: Customize buy/sell RSI levels
- **Table Features**: Enable/disable specific table features

## 📱 Responsive Design

The dashboard is fully responsive and works on:
- **Desktop** (1920px+): Full side-by-side layout
- **Tablet** (768px-1919px): Stacked tables
- **Mobile** (320px-767px): Optimized mobile layout

## 🔒 API Rate Limits & Network Resilience

The dashboard is built for reliability and respects Binance API limits:

### **Rate Limiting**
- **Weight limit**: 1200 requests per minute
- **Intelligent queuing**: 100ms minimum interval between requests
- **Auto-retry**: Built-in retry logic for network errors

### **Network Resilience** 
- **Timeout handling**: 10s general, 8s for historical data
- **Automatic retries**: ETIMEDOUT and connection reset recovery
- **Graceful degradation**: Shows price/volume even if RSI fails
- **Real-time monitoring**: Live API health status display
- **Error recovery**: Continues operation during partial failures

### **Connection Issues**
If you see connection timeout errors:
1. Check the **Network Status** indicator in the dashboard
2. Issues are often temporary due to Binance server load
3. Data will automatically recover when connection stabilizes
4. Price and volume data remains available during RSI calculation issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Binance API** - Real-time cryptocurrency data
- **shadcn/ui** - Beautiful UI components
- **Next.js Team** - Amazing React framework
- **Vercel** - Deployment platform

## ⚠️ Disclaimer

This tool is for educational and informational purposes only. Cryptocurrency trading involves substantial risk of loss. Always do your own research and consult with financial advisors before making trading decisions.

---

**Built with ❤️ for the crypto trading community**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tonilopezortiz78/crypto-rsi-dashboard-hunter)
