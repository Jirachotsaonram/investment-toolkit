const BudgetTracker = (function() {
  let transactions = [];
  let donutChart = null;
  let barChart = null;

  const STORAGE_KEY = 'investpro_budget';
  const CATEGORY_COLORS = {
    food: '#ff9800',
    transport: '#2196f3',
    housing: '#9c27b0',
    utilities: '#ffd740',
    shopping: '#e91e63',
    entertainment: '#00bcd4',
    health: '#4caf50',
    education: '#3f51b5',
    'investment-expense': '#ff5722',
    'other-expense': '#607d8b'
  };

  function getCategoryLabel(cat) {
    const labels = {
      'salary': '💼 เงินเดือน',
      'freelance': '💻 ฟรีแลนซ์',
      'investment-income': '📈 ผลตอบแทนการลงทุน',
      'business': '🏪 รายได้ธุรกิจ',
      'other-income': '📦 อื่นๆ',
      'food': '🍜 อาหาร',
      'transport': '🚗 เดินทาง',
      'housing': '🏠 ที่อยู่อาศัย',
      'utilities': '💡 สาธารณูปโภค',
      'shopping': '🛍️ ช้อปปิ้ง',
      'entertainment': '🎬 ความบันเทิง',
      'health': '🏥 สุขภาพ',
      'education': '📚 การศึกษา',
      'investment-expense': '💰 ลงทุน',
      'other-expense': '📦 อื่นๆ'
    };
    return labels[cat] || cat;
  }

  function init() {
    loadData();
    setDefaultDate();
    bindEvents();
    renderAll();
  }

  function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        transactions = JSON.parse(data);
      } catch (e) {
        transactions = [];
      }
    }
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }

  function setDefaultDate() {
    const dateInput = document.getElementById('budget-date');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.value = today;
    }
  }

  function bindEvents() {
    const typeIncome = document.getElementById('budget-type-income');
    const typeExpense = document.getElementById('budget-type-expense');
    const typeHidden = document.getElementById('budget-type');
    const catIncome = document.getElementById('budget-income-categories');
    const catExpense = document.getElementById('budget-expense-categories');
    const categorySelect = document.getElementById('budget-category');

    function toggleType(type) {
      if(typeHidden) typeHidden.value = type;
      if (type === 'income') {
        if(typeIncome) typeIncome.classList.add('active');
        if(typeExpense) typeExpense.classList.remove('active');
        if(catIncome) catIncome.style.display = '';
        if(catExpense) catExpense.style.display = 'none';
        if(categorySelect) categorySelect.value = 'salary';
      } else {
        if(typeExpense) typeExpense.classList.add('active');
        if(typeIncome) typeIncome.classList.remove('active');
        if(catExpense) catExpense.style.display = '';
        if(catIncome) catIncome.style.display = 'none';
        if(categorySelect) categorySelect.value = 'food';
      }
    }

    if (typeIncome && typeExpense) {
      typeIncome.addEventListener('click', () => toggleType('income'));
      typeExpense.addEventListener('click', () => toggleType('expense'));
      toggleType('income');
    }

    const form = document.getElementById('budget-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = typeHidden ? typeHidden.value : 'income';
        const amount = parseFloat(document.getElementById('budget-amount').value);
        const category = categorySelect ? categorySelect.value : '';
        const date = document.getElementById('budget-date').value;
        const note = document.getElementById('budget-note').value;

        if (!amount || !date) return;

        const newTx = {
          id: Date.now().toString(),
          type,
          amount,
          category,
          date,
          note,
          createdAt: new Date().toISOString()
        };

        transactions.push(newTx);
        saveData();
        renderAll();
        
        if (window.Utils && window.Utils.showToast) {
          window.Utils.showToast('เพิ่มรายการสำเร็จ', 'success');
        } else {
          alert('เพิ่มรายการสำเร็จ');
        }

        form.reset();
        setDefaultDate();
        toggleType('income');
      });
    }

    const filters = ['budget-filter-month', 'budget-filter-year', 'budget-filter-type'];
    filters.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', renderAll);
    });
  }

  function getFilteredTransactions() {
    const monthEl = document.getElementById('budget-filter-month');
    const yearEl = document.getElementById('budget-filter-year');
    const typeEl = document.getElementById('budget-filter-type');
    
    const monthFilter = monthEl ? monthEl.value : 'all';
    const yearFilter = yearEl ? yearEl.value : 'all';
    const typeFilter = typeEl ? typeEl.value : 'all';

    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      const txMonth = txDate.getMonth().toString();
      const txYear = txDate.getFullYear().toString();

      if (monthFilter !== 'all' && monthFilter !== txMonth) return false;
      if (yearFilter !== 'all' && yearFilter !== txYear) return false;
      if (typeFilter !== 'all' && typeFilter !== tx.type) return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function renderAll() {
    const filtered = getFilteredTransactions();
    
    let totalIncome = 0;
    let totalExpense = 0;

    filtered.forEach(tx => {
      if (tx.type === 'income') totalIncome += tx.amount;
      else totalExpense += tx.amount;
    });

    const balance = totalIncome - totalExpense;
    const savingRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

    const formatCurrency = window.Utils && window.Utils.formatCurrency 
      ? window.Utils.formatCurrency 
      : (val) => '฿' + val.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    const incomeEl = document.getElementById('budget-total-income');
    if(incomeEl) incomeEl.textContent = formatCurrency(totalIncome);
    
    const expenseEl = document.getElementById('budget-total-expense');
    if(expenseEl) expenseEl.textContent = formatCurrency(totalExpense);
    
    const balanceEl = document.getElementById('budget-total-balance');
    if(balanceEl) {
      balanceEl.textContent = formatCurrency(balance);
      balanceEl.style.color = balance >= 0 ? '#00e676' : '#ff5252';
    }
    
    const rateEl = document.getElementById('budget-saving-rate');
    if(rateEl) rateEl.textContent = savingRate.toLocaleString('th-TH', {minimumFractionDigits: 1, maximumFractionDigits: 1}) + '%';

    renderTable(filtered, formatCurrency);
    renderDonutChart(filtered);
    renderBarChart();
  }

  function renderTable(filtered, formatCurrency) {
    const tbody = document.getElementById('budget-table');
    const emptyMsg = document.getElementById('budget-table-empty');
    if(!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      if(emptyMsg) emptyMsg.style.display = 'flex';
      return;
    }

    if(emptyMsg) emptyMsg.style.display = 'none';
    let html = '';

    filtered.forEach(tx => {
      const dateObj = new Date(tx.date);
      const dateStr = dateObj.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
      const badge = tx.type === 'income' 
        ? '<span class="badge" style="background:rgba(0,230,118,0.2);color:#00e676;">รายรับ</span>'
        : '<span class="badge" style="background:rgba(255,82,82,0.2);color:#ff5252;">รายจ่าย</span>';
      
      const amountColor = tx.type === 'income' ? '#00e676' : '#ff5252';
      const amountPrefix = tx.type === 'income' ? '+' : '-';
      const amountStr = amountPrefix + formatCurrency(tx.amount);

      html += `<tr>
        <td>${dateStr}</td>
        <td>${badge}</td>
        <td>${getCategoryLabel(tx.category)}</td>
        <td>${tx.note || '-'}</td>
        <td style="color:${amountColor}; font-weight:600;">${amountStr}</td>
        <td>
          <button class="btn btn-sm btn-danger" style="background:#ff5252; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;" onclick="BudgetTracker.deleteTransaction('${tx.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
    });

    tbody.innerHTML = html;
  }

  function deleteTransaction(id) {
    if (confirm('ยืนยันการลบรายการนี้?')) {
      transactions = transactions.filter(t => t.id !== id);
      saveData();
      renderAll();
    }
  }

  function renderDonutChart(filtered) {
    const expenses = filtered.filter(t => t.type === 'expense');
    const donutContainer = document.getElementById('budget-no-data-donut');
    const canvas = document.getElementById('budget-chart-donut');
    if(!canvas) return;
    
    if (expenses.length === 0) {
      if (donutChart) donutChart.destroy();
      if(donutContainer) donutContainer.style.display = 'flex';
      return;
    }
    
    if(donutContainer) donutContainer.style.display = 'none';

    const catSums = {};
    expenses.forEach(t => {
      catSums[t.category] = (catSums[t.category] || 0) + t.amount;
    });

    const labels = Object.keys(catSums).map(k => getCategoryLabel(k));
    const data = Object.values(catSums);
    const bgColors = Object.keys(catSums).map(k => CATEGORY_COLORS[k] || '#999');

    const ctx = canvas.getContext('2d');
    if (donutChart) donutChart.destroy();

    donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: '#1e1e2d'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: 'right', 
            labels: { color: '#fff', font: { family: 'Inter' } } 
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) label += ': ';
                if (context.parsed !== null) {
                  label += '฿' + context.parsed.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                }
                return label;
              }
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  function renderBarChart() {
    const labels = [];
    const incomeData = [];
    const expenseData = [];

    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(monthNames[d.getMonth()]);
      
      let mIncome = 0;
      let mExpense = 0;

      transactions.forEach(t => {
        const td = new Date(t.date);
        if (td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear()) {
          if (t.type === 'income') mIncome += t.amount;
          else mExpense += t.amount;
        }
      });

      incomeData.push(mIncome);
      expenseData.push(mExpense);
    }

    const canvas = document.getElementById('budget-chart-bar');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (barChart) barChart.destroy();

    barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'รายรับ',
            data: incomeData,
            backgroundColor: '#00e676',
            borderRadius: 4
          },
          {
            label: 'รายจ่าย',
            data: expenseData,
            backgroundColor: '#ff5252',
            borderRadius: 4
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
          x: { ticks: { color: '#ccc', font: { family: 'Inter' } }, grid: { display: false } },
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

  return { init, deleteTransaction };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('page-budget')) {
    BudgetTracker.init();
    window.BudgetTracker = BudgetTracker;
  }
});
