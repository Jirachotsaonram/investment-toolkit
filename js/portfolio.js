const Portfolio = (function() {
  const STORAGE_KEY = 'investpro_portfolio';
  let assets = [];
  let currentChart = null;

  const CHART_COLORS = [
    '#a855f7', '#6c5ce7', '#3b82f6', '#00d2ff', 
    '#00e676', '#ffd740', '#ff9800', '#ff5252',
    '#e91e63', '#9c27b0'
  ];

  // DOM Elements
  const els = {
    form: document.getElementById('portfolio-form'),
    nameInput: document.getElementById('asset-name'),
    typeInput: document.getElementById('asset-type'),
    quantityInput: document.getElementById('asset-quantity'),
    buyPriceInput: document.getElementById('asset-buy-price'),
    currentPriceInput: document.getElementById('asset-current-price'),
    table: document.getElementById('portfolio-table'),
    filter: document.getElementById('portfolio-filter'),
    totalValue: document.getElementById('portfolio-total-value'),
    totalProfit: document.getElementById('portfolio-total-profit'),
    totalChange: document.getElementById('portfolio-total-change'),
    assetCount: document.getElementById('portfolio-asset-count'),
    noDataChart: document.getElementById('portfolio-no-data'),
    tableEmpty: document.getElementById('portfolio-table-empty'),
    chartCanvas: document.getElementById('portfolio-chart')
  };

  // Helper functions - fallback to basic if Utils not available
  const generateId = () => window.Utils?.generateId() || Date.now().toString(36) + Math.random().toString(36).substr(2);
  const saveToStorage = (key, data) => window.Utils?.saveToStorage(key, data) || localStorage.setItem(key, JSON.stringify(data));
  const loadFromStorage = (key) => window.Utils?.loadFromStorage(key) || JSON.parse(localStorage.getItem(key) || 'null');
  const showToast = (msg, type) => window.Utils?.showToast(msg, type) || console.log(`[${type}] ${msg}`);
  const formatCurrency = (val) => window.Utils?.formatCurrency(val) || new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(val);
  const getTypeLabel = (type) => {
    if (window.Utils?.getTypeLabel) return window.Utils.getTypeLabel(type);
    const map = { stock: '📈 หุ้น', crypto: '🪙 คริปโต', fund: '📊 กองทุน', gold: '🥇 ทองคำ', bond: '📄 พันธบัตร', other: '📦 อื่นๆ' };
    return `<span class="badge badge-${type}">${map[type] || 'อื่นๆ'}</span>`;
  };

  function init() {
    loadData();
    bindEvents();
    render();
  }

  function loadData() {
    assets = loadFromStorage(STORAGE_KEY) || [];
  }

  function bindEvents() {
    if (els.form) {
      els.form.addEventListener('submit', handleFormSubmit);
    }
    if (els.filter) {
      els.filter.addEventListener('change', renderTable);
    }
    
    // Delegate delete and edit events
    if (els.table) {
      els.table.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const id = btn.dataset.id;
        if (btn.classList.contains('btn-delete')) {
          deleteAsset(id);
        } else if (btn.classList.contains('btn-edit')) {
          editAsset(id);
        }
      });
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    
    const newAsset = {
      id: generateId(),
      name: els.nameInput.value.trim(),
      type: els.typeInput.value,
      quantity: parseFloat(els.quantityInput.value),
      buyPrice: parseFloat(els.buyPriceInput.value),
      currentPrice: parseFloat(els.currentPriceInput.value),
      addedAt: new Date().toISOString()
    };

    assets.push(newAsset);
    saveToStorage(STORAGE_KEY, assets);
    showToast('เพิ่มสินทรัพย์เรียบร้อยแล้ว', 'success');
    
    els.form.reset();
    render();
  }

  function deleteAsset(id) {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบสินทรัพย์นี้?')) {
      assets = assets.filter(a => a.id !== id);
      saveToStorage(STORAGE_KEY, assets);
      showToast('ลบสินทรัพย์เรียบร้อยแล้ว', 'info');
      render();
    }
  }

  function editAsset(id) {
    const asset = assets.find(a => a.id === id);
    if (!asset) return;
    
    els.nameInput.value = asset.name;
    els.typeInput.value = asset.type;
    els.quantityInput.value = asset.quantity;
    els.buyPriceInput.value = asset.buyPrice;
    els.currentPriceInput.value = asset.currentPrice;
    
    // Remove the old one so when user submits, it saves as new
    assets = assets.filter(a => a.id !== id);
    saveToStorage(STORAGE_KEY, assets);
    showToast('กำลังแก้ไขสินทรัพย์...', 'info');
    render();
    
    // Scroll to form
    els.form.scrollIntoView({ behavior: 'smooth' });
  }

  function render() {
    renderSummary();
    renderTable();
    renderChart();
  }

  function renderSummary() {
    let totalValue = 0;
    let totalCost = 0;

    assets.forEach(asset => {
      const value = asset.quantity * asset.currentPrice;
      const cost = asset.quantity * asset.buyPrice;
      totalValue += value;
      totalCost += cost;
    });

    const totalProfit = totalValue - totalCost;
    const totalChange = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    if (els.totalValue) els.totalValue.textContent = formatCurrency(totalValue);
    
    if (els.totalProfit) {
      els.totalProfit.textContent = formatCurrency(Math.abs(totalProfit));
      if (totalProfit >= 0) {
        els.totalProfit.textContent = '+' + formatCurrency(totalProfit);
        els.totalProfit.style.color = '#00e676';
      } else {
        els.totalProfit.textContent = '-' + formatCurrency(Math.abs(totalProfit));
        els.totalProfit.style.color = '#ff5252';
      }
    }
    
    if (els.totalChange) {
      els.totalChange.textContent = Math.abs(totalChange).toFixed(2) + '%';
      if (totalChange >= 0) {
        els.totalChange.textContent = '+' + totalChange.toFixed(2) + '%';
        els.totalChange.style.color = '#00e676';
      } else {
        els.totalChange.textContent = totalChange.toFixed(2) + '%';
        els.totalChange.style.color = '#ff5252';
      }
    }
    
    if (els.assetCount) els.assetCount.textContent = assets.length;
  }

  function renderTable() {
    if (!els.table) return;
    
    const filterType = els.filter ? els.filter.value : 'all';
    const filteredAssets = filterType === 'all' ? assets : assets.filter(a => a.type === filterType);
    
    els.table.innerHTML = '';
    
    if (filteredAssets.length === 0) {
      if (els.tableEmpty) els.tableEmpty.style.display = 'flex';
    } else {
      if (els.tableEmpty) els.tableEmpty.style.display = 'none';
      
      filteredAssets.forEach(asset => {
        const value = asset.quantity * asset.currentPrice;
        const cost = asset.quantity * asset.buyPrice;
        const profit = value - cost;
        const change = cost > 0 ? (profit / cost) * 100 : 0;
        
        const profitColor = profit >= 0 ? 'color: #00e676;' : 'color: #ff5252;';
        const profitSign = profit >= 0 ? '+' : '';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${asset.name}</strong></td>
          <td>${getTypeLabel(asset.type)}</td>
          <td>${asset.quantity.toLocaleString(undefined, {maximumFractionDigits: 4})}</td>
          <td>${formatCurrency(asset.buyPrice)}</td>
          <td>${formatCurrency(asset.currentPrice)}</td>
          <td><strong>${formatCurrency(value)}</strong></td>
          <td style="${profitColor}">${profitSign}${formatCurrency(profit)}</td>
          <td style="${profitColor}">${profitSign}${change.toFixed(2)}%</td>
          <td>
            <button class="btn btn-sm btn-edit" data-id="${asset.id}" style="background:transparent; color:#3b82f6; border:none; cursor:pointer;"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-delete" data-id="${asset.id}" style="background:transparent; color:#ff5252; border:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
          </td>
        `;
        els.table.appendChild(tr);
      });
    }
  }

  function renderChart() {
    if (!els.chartCanvas) return;
    
    if (assets.length === 0) {
      if (els.noDataChart) els.noDataChart.style.display = 'flex';
      els.chartCanvas.style.display = 'none';
      if (currentChart) {
        currentChart.destroy();
        currentChart = null;
      }
      return;
    }
    
    if (els.noDataChart) els.noDataChart.style.display = 'none';
    els.chartCanvas.style.display = 'block';
    
    // Aggregate by type
    const allocation = {};
    assets.forEach(asset => {
      const value = asset.quantity * asset.currentPrice;
      if (!allocation[asset.type]) allocation[asset.type] = 0;
      allocation[asset.type] += value;
    });
    
    const labels = Object.keys(allocation).map(type => {
      const map = { stock: 'หุ้น', crypto: 'คริปโต', fund: 'กองทุน', gold: 'ทองคำ', bond: 'พันธบัตร', other: 'อื่นๆ' };
      return map[type] || type;
    });
    const data = Object.values(allocation);
    
    if (currentChart) {
      currentChart.destroy();
    }
    
    const ctx = els.chartCanvas.getContext('2d');
    
    // Calculate total for center text
    const totalValue = data.reduce((a,b) => a+b, 0);
    
    // Custom plugin for center text
    const centerTextPlugin = {
      id: 'centerText',
      beforeDraw: function(chart) {
        if (chart.config.type !== 'doughnut') return;
        var width = chart.width,
            height = chart.height,
            ctx = chart.ctx;
    
        ctx.restore();
        var fontSize = (height / 160).toFixed(2);
        ctx.font = "bold " + fontSize + "em Inter, sans-serif";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
    
        var text = "฿" + (totalValue > 1000000 ? (totalValue/1000000).toFixed(2) + "M" : totalValue.toLocaleString()),
            textX = Math.round((width - ctx.measureText(text).width) / 2),
            textY = height / 2;
    
        ctx.fillText(text, textX, textY);
        ctx.save();
      }
    };

    currentChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: CHART_COLORS.slice(0, labels.length),
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#ffffff',
              padding: 20,
              font: {
                family: "'Inter', sans-serif",
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed !== null) {
                  label += new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(context.parsed);
                }
                return label;
              }
            }
          }
        }
      },
      plugins: [centerTextPlugin]
    });
  }

  // Expose API
  return {
    init
  };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Portfolio.init();
});
