const DCASimulator = (function() {
  let dcaChart = null;
  let priceChart = null;

  function init() {
    bindEvents();
    simulateAndRender();
  }

  function bindEvents() {
    const monthsInput = document.getElementById('dca-months');
    const monthsSlider = document.getElementById('dca-months-slider');
    const volInput = document.getElementById('dca-volatility');
    const volSlider = document.getElementById('dca-volatility-slider');
    
    if(monthsInput && monthsSlider) {
      monthsInput.addEventListener('input', (e) => monthsSlider.value = e.target.value);
      monthsSlider.addEventListener('input', (e) => monthsInput.value = e.target.value);
    }
    if(volInput && volSlider) {
      volInput.addEventListener('input', (e) => volSlider.value = e.target.value);
      volSlider.addEventListener('input', (e) => volInput.value = e.target.value);
    }

    const form = document.getElementById('dca-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        simulateAndRender();
      });
    }
  }

  function generatePrices(startPrice, endPrice, months, volatility, scenario) {
    let prices = [startPrice];
    let currentPrice = startPrice;
    const vol = volatility / 100;
    
    for (let i = 1; i < months; i++) {
      let progress = i / (months - 1);
      
      let change = 0;
      let randomNoise = (Math.random() - 0.5) * 2 * vol * currentPrice;
      
      switch(scenario) {
        case 'uptrend':
          change = (endPrice - startPrice) / months + Math.abs((Math.random() - 0.2) * vol * currentPrice);
          break;
        case 'downtrend':
          change = (endPrice - startPrice) / months - Math.abs((Math.random() - 0.2) * vol * currentPrice);
          break;
        case 'volatile':
          change = (Math.random() - 0.5) * 4 * vol * currentPrice;
          break;
        case 'crash-recover':
          if (progress < 0.5) {
            change = -currentPrice * (vol + 0.05);
          } else {
            change = (endPrice - currentPrice) / (months - i) + randomNoise;
          }
          break;
        case 'random':
        default:
          change = (endPrice - currentPrice) / (months - i) + randomNoise;
          break;
      }
      
      currentPrice += change;
      if (currentPrice <= 0) currentPrice = startPrice * 0.01; 
      
      if (i === months - 1) currentPrice = endPrice;
      
      prices.push(currentPrice);
    }
    return prices;
  }

  function simulateAndRender() {
    const monthlyAmount = parseFloat(document.getElementById('dca-monthly-amount').value) || 0;
    const months = parseInt(document.getElementById('dca-months').value, 10) || 24;
    const startPrice = parseFloat(document.getElementById('dca-start-price').value) || 0;
    const endPrice = parseFloat(document.getElementById('dca-end-price').value) || 0;
    const volatility = parseFloat(document.getElementById('dca-volatility').value) || 15;
    const scenario = document.getElementById('dca-scenario').value;

    const prices = generatePrices(startPrice, endPrice, months, volatility, scenario);

    let total_units = 0;
    let total_invested = 0;
    let labels = [];
    let investedData = [];
    let valueData = [];

    for (let i = 0; i < months; i++) {
      labels.push(`เดือนที่ ${i + 1}`);
      const price = prices[i];
      const units_bought = monthlyAmount / price;
      
      total_units += units_bought;
      total_invested += monthlyAmount;
      const portfolio_value = total_units * price;
      
      investedData.push(total_invested);
      valueData.push(portfolio_value);
    }

    const finalValue = valueData[months - 1];
    const profit = finalValue - total_invested;
    const returnPct = total_invested > 0 ? (profit / total_invested) * 100 : 0;
    const avgCost = total_units > 0 ? total_invested / total_units : 0;

    const formatCurrency = window.Utils && window.Utils.formatCurrency 
      ? window.Utils.formatCurrency 
      : (val) => '฿' + val.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    document.getElementById('dca-result-invested').textContent = formatCurrency(total_invested);
    document.getElementById('dca-result-value').textContent = formatCurrency(finalValue);
    
    const profitEl = document.getElementById('dca-result-profit');
    profitEl.textContent = formatCurrency(profit);
    profitEl.style.color = profit >= 0 ? '#00e676' : '#ff5252';

    document.getElementById('dca-result-avg-cost').textContent = formatCurrency(avgCost);
    
    const returnEl = document.getElementById('dca-result-return');
    returnEl.textContent = returnPct.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%';
    returnEl.style.color = profit >= 0 ? '#00e676' : '#ff5252';
    
    document.getElementById('dca-result-units').textContent = total_units.toLocaleString('th-TH', {minimumFractionDigits: 4, maximumFractionDigits: 6});

    renderDCAChart(labels, investedData, valueData, profit >= 0);
    renderPriceChart(labels, prices, endPrice >= startPrice);
  }

  function renderDCAChart(labels, investedData, valueData, isPositive) {
    const canvas = document.getElementById('dca-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (dcaChart) dcaChart.destroy();

    const color = isPositive ? '#00e676' : '#a855f7';
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    if (isPositive) {
      gradient.addColorStop(0, 'rgba(0, 230, 118, 0.5)');
      gradient.addColorStop(1, 'rgba(0, 230, 118, 0.0)');
    } else {
      gradient.addColorStop(0, 'rgba(168, 85, 247, 0.5)');
      gradient.addColorStop(1, 'rgba(168, 85, 247, 0.0)');
    }

    dcaChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'มูลค่าพอร์ต',
            data: valueData,
            borderColor: color,
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            order: 1
          },
          {
            label: 'เงินลงทุนสะสม',
            data: investedData,
            borderColor: '#3a7bd5',
            borderDash: [5, 5],
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.4,
            borderWidth: 2,
            order: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#fff', font: { family: 'Inter' } } },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  label += '฿' + context.parsed.y.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: { ticks: { color: '#ccc', font: { family: 'Inter' } }, grid: { color: 'rgba(255,255,255,0.1)' } },
          y: { 
            ticks: { 
              color: '#ccc',
              font: { family: 'Inter' },
              callback: function(value) { return '฿' + value.toLocaleString('th-TH'); }
            }, 
            grid: { color: 'rgba(255,255,255,0.1)' } 
          }
        }
      }
    });
  }

  function renderPriceChart(labels, prices, isUptrend) {
    const canvas = document.getElementById('dca-price-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (priceChart) priceChart.destroy();

    const color = isUptrend ? '#00e676' : '#ff5252';
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, isUptrend ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 82, 82, 0.3)');
    gradient.addColorStop(1, 'transparent');

    priceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'ราคาสินทรัพย์',
          data: prices,
          borderColor: color,
          backgroundColor: gradient,
          fill: true,
          tension: 0.1,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#fff', font: { family: 'Inter' } } },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  label += '฿' + context.parsed.y.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: { ticks: { color: '#ccc', font: { family: 'Inter' } }, grid: { color: 'rgba(255,255,255,0.1)' } },
          y: { 
            ticks: { 
              color: '#ccc',
              font: { family: 'Inter' },
              callback: function(value) { return '฿' + value.toLocaleString('th-TH'); }
            }, 
            grid: { color: 'rgba(255,255,255,0.1)' } 
          }
        }
      }
    });
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('page-dca')) {
    DCASimulator.init();
  }
});
