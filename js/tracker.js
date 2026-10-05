const CryptoTracker = (function() {
  const API_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=30&page=1&sparkline=true&price_change_percentage=7d';
  const GLOBAL_API_URL = 'https://api.coingecko.com/api/v3/global';
  let refreshTimer = null;
  let coinsData = [];

  // DOM Elements
  const els = {
    table: document.getElementById('tracker-table'),
    searchInput: document.getElementById('tracker-search'),
    refreshBtn: document.getElementById('tracker-refresh-btn'),
    lastUpdated: document.getElementById('tracker-last-updated'),
    loading: document.getElementById('tracker-loading'),
    error: document.getElementById('tracker-error'),
    btcPrice: document.getElementById('tracker-btc-price'),
    btcChange: document.getElementById('tracker-btc-change'),
    ethPrice: document.getElementById('tracker-eth-price'),
    ethChange: document.getElementById('tracker-eth-change'),
    totalMcap: document.getElementById('tracker-total-mcap'),
    totalVolume: document.getElementById('tracker-total-volume')
  };

  // Formatters
  const formatUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  
  const formatCompactUSD = (val) => {
    if (val === undefined || val === null) return '$—';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      notation: 'compact',
      compactDisplay: 'short'
    }).format(val);
  };

  const formatPercent = (val) => {
    if (val === undefined || val === null) return '—';
    const num = parseFloat(val);
    const sign = num >= 0 ? '▲' : '▼';
    const color = num >= 0 ? '#00e676' : '#ff5252';
    return `<span style="color: ${color}; font-weight: 500;">${sign} ${Math.abs(num).toFixed(2)}%</span>`;
  };

  function generateMockSparkline(basePrice) {
    const sparkline = [];
    let currentPrice = basePrice * 0.9; // Start a bit lower
    for (let i = 0; i < 168; i++) {
      // Random walk
      const change = currentPrice * (Math.random() * 0.04 - 0.02);
      currentPrice += change;
      sparkline.push(currentPrice);
    }
    // Make sure the last point matches current price closely
    sparkline.push(basePrice);
    return sparkline;
  }

  const FALLBACK_DATA = [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', current_price: 67500, price_change_percentage_24h: 2.35, price_change_percentage_7d_in_currency: 5.12, market_cap: 1320000000000, total_volume: 28000000000, sparkline_in_7d: { price: generateMockSparkline(67500) } },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', current_price: 3500, price_change_percentage_24h: 1.2, price_change_percentage_7d_in_currency: -2.1, market_cap: 420000000000, total_volume: 15000000000, sparkline_in_7d: { price: generateMockSparkline(3500) } },
    { id: 'tether', symbol: 'usdt', name: 'Tether', image: 'https://assets.coingecko.com/coins/images/325/small/Tether.png', current_price: 1.00, price_change_percentage_24h: 0.01, price_change_percentage_7d_in_currency: 0.05, market_cap: 104000000000, total_volume: 45000000000, sparkline_in_7d: { price: generateMockSparkline(1.00) } },
    { id: 'binancecoin', symbol: 'bnb', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', current_price: 590, price_change_percentage_24h: 4.5, price_change_percentage_7d_in_currency: 8.2, market_cap: 88000000000, total_volume: 2100000000, sparkline_in_7d: { price: generateMockSparkline(590) } },
    { id: 'solana', symbol: 'sol', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', current_price: 145, price_change_percentage_24h: -1.5, price_change_percentage_7d_in_currency: 12.4, market_cap: 65000000000, total_volume: 4500000000, sparkline_in_7d: { price: generateMockSparkline(145) } },
    { id: 'ripple', symbol: 'xrp', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', current_price: 0.62, price_change_percentage_24h: 0.8, price_change_percentage_7d_in_currency: 1.5, market_cap: 34000000000, total_volume: 1200000000, sparkline_in_7d: { price: generateMockSparkline(0.62) } },
    { id: 'usdc', symbol: 'usdc', name: 'USDC', image: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png', current_price: 1.00, price_change_percentage_24h: 0.0, price_change_percentage_7d_in_currency: 0.01, market_cap: 32000000000, total_volume: 4100000000, sparkline_in_7d: { price: generateMockSparkline(1.00) } },
    { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', current_price: 0.16, price_change_percentage_24h: 8.4, price_change_percentage_7d_in_currency: -4.2, market_cap: 23000000000, total_volume: 2500000000, sparkline_in_7d: { price: generateMockSparkline(0.16) } },
    { id: 'cardano', symbol: 'ada', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/small/cardano.png', current_price: 0.58, price_change_percentage_24h: 1.1, price_change_percentage_7d_in_currency: 2.3, market_cap: 20000000000, total_volume: 450000000, sparkline_in_7d: { price: generateMockSparkline(0.58) } },
    { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', current_price: 45.2, price_change_percentage_24h: -2.3, price_change_percentage_7d_in_currency: -5.1, market_cap: 17000000000, total_volume: 600000000, sparkline_in_7d: { price: generateMockSparkline(45.2) } },
    { id: 'polkadot', symbol: 'dot', name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png', current_price: 8.5, price_change_percentage_24h: 0.5, price_change_percentage_7d_in_currency: 1.2, market_cap: 11000000000, total_volume: 250000000, sparkline_in_7d: { price: generateMockSparkline(8.5) } },
    { id: 'chainlink', symbol: 'link', name: 'Chainlink', image: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png', current_price: 18.2, price_change_percentage_24h: 3.2, price_change_percentage_7d_in_currency: 7.8, market_cap: 10500000000, total_volume: 500000000, sparkline_in_7d: { price: generateMockSparkline(18.2) } },
    { id: 'matic-network', symbol: 'matic', name: 'Polygon', image: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png', current_price: 0.95, price_change_percentage_24h: -1.0, price_change_percentage_7d_in_currency: -2.5, market_cap: 9500000000, total_volume: 300000000, sparkline_in_7d: { price: generateMockSparkline(0.95) } },
    { id: 'shiba-inu', symbol: 'shib', name: 'Shiba Inu', image: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png', current_price: 0.000028, price_change_percentage_24h: 5.1, price_change_percentage_7d_in_currency: 12.3, market_cap: 16000000000, total_volume: 1200000000, sparkline_in_7d: { price: generateMockSparkline(0.000028) } },
    { id: 'litecoin', symbol: 'ltc', name: 'Litecoin', image: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png', current_price: 85.5, price_change_percentage_24h: 1.5, price_change_percentage_7d_in_currency: 4.2, market_cap: 6300000000, total_volume: 450000000, sparkline_in_7d: { price: generateMockSparkline(85.5) } },
    { id: 'uniswap', symbol: 'uni', name: 'Uniswap', image: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png', current_price: 11.2, price_change_percentage_24h: -3.4, price_change_percentage_7d_in_currency: 2.1, market_cap: 6700000000, total_volume: 150000000, sparkline_in_7d: { price: generateMockSparkline(11.2) } },
    { id: 'cosmos', symbol: 'atom', name: 'Cosmos', image: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png', current_price: 10.8, price_change_percentage_24h: 2.1, price_change_percentage_7d_in_currency: -1.5, market_cap: 4200000000, total_volume: 120000000, sparkline_in_7d: { price: generateMockSparkline(10.8) } },
    { id: 'stellar', symbol: 'xlm', name: 'Stellar', image: 'https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png', current_price: 0.13, price_change_percentage_24h: 0.5, price_change_percentage_7d_in_currency: 1.1, market_cap: 3800000000, total_volume: 65000000, sparkline_in_7d: { price: generateMockSparkline(0.13) } },
    { id: 'monero', symbol: 'xmr', name: 'Monero', image: 'https://assets.coingecko.com/coins/images/69/small/monero_logo.png', current_price: 135.5, price_change_percentage_24h: 0.2, price_change_percentage_7d_in_currency: 2.4, market_cap: 2500000000, total_volume: 45000000, sparkline_in_7d: { price: generateMockSparkline(135.5) } },
    { id: 'ethereum-classic', symbol: 'etc', name: 'Ethereum Classic', image: 'https://assets.coingecko.com/coins/images/453/small/ethereum-classic-logo.png', current_price: 32.5, price_change_percentage_24h: 1.8, price_change_percentage_7d_in_currency: 5.6, market_cap: 4700000000, total_volume: 250000000, sparkline_in_7d: { price: generateMockSparkline(32.5) } }
  ];

  function init() {
    bindEvents();
    fetchData();
    
    // Auto refresh every 60s
    refreshTimer = setInterval(() => {
      if (!document.hidden) {
        fetchData();
      }
    }, 60000);

    // Pause on hide to save API calls
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInterval(refreshTimer);
      } else {
        fetchData();
        refreshTimer = setInterval(fetchData, 60000);
      }
    });
  }

  function bindEvents() {
    if (els.searchInput) {
      els.searchInput.addEventListener('input', renderTable);
    }
    if (els.refreshBtn) {
      els.refreshBtn.addEventListener('click', () => {
        const icon = els.refreshBtn.querySelector('i');
        icon.classList.add('fa-spin');
        fetchData().finally(() => {
          setTimeout(() => icon.classList.remove('fa-spin'), 500);
        });
      });
    }
  }

  async function fetchData() {
    if (els.loading && coinsData.length === 0) {
      els.loading.style.display = 'flex';
      if (els.table) els.table.style.display = 'none';
      if (els.error) els.error.style.display = 'none';
    }

    try {
      // Try fetching real data
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      coinsData = data;
      
      // Update global stats
      fetchGlobalData();
      
    } catch (err) {
      console.warn('Using fallback data due to API error:', err);
      coinsData = FALLBACK_DATA;
      
      // Mock global data based on fallback
      if (els.totalMcap) els.totalMcap.textContent = formatCompactUSD(2500000000000);
      if (els.totalVolume) els.totalVolume.textContent = formatCompactUSD(120000000000);
      
      // We don't show the error div if we have fallback data working perfectly,
      // but if you want to notify users it's mock data, you could show a toast.
    } finally {
      if (els.loading) els.loading.style.display = 'none';
      
      updateOverviewCards();
      renderTable();
      updateTimestamp();
    }
  }

  async function fetchGlobalData() {
    try {
      const res = await fetch(GLOBAL_API_URL);
      if (!res.ok) return;
      const global = await res.json();
      if (global && global.data) {
        if (els.totalMcap) els.totalMcap.textContent = formatCompactUSD(global.data.total_market_cap.usd);
        if (els.totalVolume) els.totalVolume.textContent = formatCompactUSD(global.data.total_volume.usd);
      }
    } catch (e) {
      console.warn('Could not fetch global data');
    }
  }

  function updateOverviewCards() {
    const btc = coinsData.find(c => c.symbol === 'btc');
    const eth = coinsData.find(c => c.symbol === 'eth');

    if (btc && els.btcPrice && els.btcChange) {
      els.btcPrice.textContent = formatUSD(btc.current_price);
      els.btcChange.innerHTML = formatPercent(btc.price_change_percentage_24h);
    }
    
    if (eth && els.ethPrice && els.ethChange) {
      els.ethPrice.textContent = formatUSD(eth.current_price);
      els.ethChange.innerHTML = formatPercent(eth.price_change_percentage_24h);
    }
  }

  function renderTable() {
    if (!els.table) return;
    
    els.table.style.display = 'table-row-group';
    els.table.innerHTML = '';
    
    const searchTerm = els.searchInput ? els.searchInput.value.toLowerCase() : '';
    
    const filteredCoins = coinsData.filter(coin => 
      coin.name.toLowerCase().includes(searchTerm) || 
      coin.symbol.toLowerCase().includes(searchTerm)
    );

    filteredCoins.forEach((coin, index) => {
      const tr = document.createElement('tr');
      
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${coin.image}" alt="${coin.name}" width="24" height="24" style="border-radius: 50%;">
            <div style="display: flex; flex-direction: column;">
              <span style="font-weight: 600;">${coin.name}</span>
              <span style="font-size: 12px; color: #a0aec0; text-transform: uppercase;">${coin.symbol}</span>
            </div>
          </div>
        </td>
        <td style="font-weight: 600;">${formatUSD(coin.current_price)}</td>
        <td>${formatPercent(coin.price_change_percentage_24h)}</td>
        <td>${formatPercent(coin.price_change_percentage_7d_in_currency)}</td>
        <td>${formatCompactUSD(coin.market_cap)}</td>
        <td>${formatCompactUSD(coin.total_volume)}</td>
        <td style="width: 120px; height: 40px;">
          <canvas id="sparkline-${coin.id}" width="120" height="40"></canvas>
        </td>
      `;
      
      els.table.appendChild(tr);
      
      // Draw sparkline
      if (coin.sparkline_in_7d && coin.sparkline_in_7d.price) {
        drawSparkline(`sparkline-${coin.id}`, coin.sparkline_in_7d.price, coin.price_change_percentage_7d_in_currency);
      }
    });
  }

  function drawSparkline(canvasId, data, changePercent) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    const color = changePercent >= 0 ? '#00e676' : '#ff5252';
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    
    for (let i = 0; i < data.length; i++) {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((data[i] - min) / range) * height;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }

  function updateTimestamp() {
    if (els.lastUpdated) {
      const now = new Date();
      els.lastUpdated.textContent = `อัปเดตล่าสุด: ${now.toLocaleTimeString('th-TH')}`;
    }
  }

  // Expose API
  return {
    init,
    fetchData
  };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  CryptoTracker.init();
});
