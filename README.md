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
- **Top 10 Pairs** - Automatically sorted by 24h trading volume (USDT)
- **Auto-refresh** - Updates every 5 seconds with smooth animations

### 📈 **Advanced RSI Analysis**
- **Multi-timeframe RSI** - 1h, 4h, and 1d RSI indicators
- **Wilder's RSI Formula** - TradingView-standard calculation
- **Smart Trading Signals**:
  - 🟢 **STRONG BUY** (RSI ≤ 20) - Extremely oversold
  - 🟢 **BUY** (RSI ≤ 30) - Oversold  
  - 🔴 **SELL** (RSI ≥ 70) - Overbought
  - 🔴 **STRONG SELL** (RSI ≥ 80) - Extremely overbought
  - ⚪ **NEUTRAL** (30 < RSI < 70) - Normal range

### 🎨 **Modern UI/UX**
- **Dark/Light Theme** - Smooth theme switching with system detection
- **Smooth Animations** - Individual cell updates without jarring refreshes
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **shadcn/ui Components** - Professional, accessible UI components
- **Real-time Indicators** - Visual feedback for data changes

### 🔧 **Technical Features**
- **Performance Optimized** - Smart re-rendering and change detection
- **Error Handling** - Graceful API failure recovery
- **TypeScript** - Full type safety for reliability
- **Accessibility** - WCAG compliant components

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Data**: Binance REST API, Axios for HTTP requests
- **Theme**: next-themes for dark/light mode
- **Icons**: Lucide React
- **Performance**: Smart memoization, change detection

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/[your-username]/crypto-rsi-dashboard-hunter.git
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

### **Spot Trading Table**
- Top 10 spot pairs by 24h volume
- Real-time price updates
- 24h change percentage with trend indicators
- Multi-timeframe RSI analysis

### **Futures Trading Table** 
- Top 10 futures pairs by 24h volume
- Higher leverage trading opportunities
- Same comprehensive RSI analysis
- Live trading signals

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
- **Update Frequency**: Modify the 5-second interval in `TradingTable.tsx`
- **Pair Count**: Change from top 10 to any number in the API calls
- **RSI Periods**: Adjust RSI calculation periods in `binance.ts`
- **Signal Thresholds**: Customize buy/sell RSI levels

## 📱 Responsive Design

The dashboard is fully responsive and works on:
- **Desktop** (1920px+): Full side-by-side layout
- **Tablet** (768px-1919px): Stacked tables
- **Mobile** (320px-767px): Optimized mobile layout

## 🔒 API Rate Limits

The dashboard respects Binance API rate limits:
- **Weight limit**: 1200 requests per minute
- **Order limit**: 10 orders per second
- **Auto-retry**: Built-in retry logic with exponential backoff

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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/[your-username]/crypto-rsi-dashboard-hunter)
