const CompoundCalc = (function() {
  let mainChart = null;
  let compareChart = null;

  function init() {
    bindEvents();
    calculateAndRender();
  }

  function bindEvents() {
    const rateInput = document.getElementById('compound-rate');
    const rateSlider = document.getElementById('compound-rate-slider');
    const yearsInput = document.getElementById('compound-years');
    const yearsSlider = document.getElementById('compound-years-slider');
    
    if(rateInput && rateSlider) {
      rateInput.addEventListener('input', (e) => rateSlider.value = e.target.value);
      rateSlider.addEventListener('input', (e) => rateInput.value = e.target.value);
    }
    if(yearsInput && yearsSlider) {
      yearsInput.addEventListener('input', (e) => yearsSlider.value = e.target.value);
      yearsSlider.addEventListener('input', (e) => yearsInput.value = e.target.value);
    }

    const form = document.getElementById('compound-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateAndRender();
      });
    }

    const compareBtn = document.getElementById('btn-compare');
    if (compareBtn) {
      compareBtn.addEventListener('click', () => {
        renderCompareChart();
      });
    }
  }

  function calculateAndRender() {
    const principal = parseFloat(document.getElementById('compound-principal').value) || 0;
    const monthly = parseFloat(document.getElementById('compound-monthly').value) || 0;
    const rate = parseFloat(document.getElementById('compound-rate').value) || 0;
    const years = parseInt(document.getElementById('compound-years').value, 10) || 0;
    const frequency = parseInt(document.getElementById('compound-frequency').value, 10) || 12;

    const r = rate / 100;
    const n = frequency;
    
    let labels = [];
    let investedData = [];
    let totalData = [];
    let tableHTML = '';
    
    let currentInvested = principal;
    let currentTotal = principal;

    const formatCurrency = window.Utils && window.Utils.formatCurrency 
      ? window.Utils.formatCurrency 
      : (val) => '฿' + val.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    for (let i = 1; i <= years; i++) {
      labels.push(`ปีที่ ${i}`);
      
      const prevTotal = currentTotal;
      const t = i;
      
      let investedAtYear = principal + (monthly * 12 * t);
      
      let pmtPeriods = n * t;
      let ratePerPeriod = r / n;
      let fv = principal * Math.pow(1 + ratePerPeriod, pmtPeriods);
      
      if (ratePerPeriod > 0) {
        let pmtPerPeriod = (monthly * 12) / n;
        fv += pmtPerPeriod * ((Math.pow(1 + ratePerPeriod, pmtPeriods) - 1) / ratePerPeriod);
      } else {
        fv += monthly * 12 * t;
      }
      
      currentInvested = investedAtYear;
      currentTotal = fv;
      
      let interestThisYear = currentTotal - prevTotal - (monthly * 12);
      if (i === 1) interestThisYear = currentTotal - principal - (monthly * 12);
      
      let totalInterestAccum = currentTotal - currentInvested;

      investedData.push(currentInvested);
      totalData.push(currentTotal);
      
      tableHTML += `<tr>
        <td>${i}</td>
        <td>${formatCurrency(currentInvested)}</td>
        <td>${formatCurrency(totalInterestAccum > 0 ? totalInterestAccum : 0)}</td>
        <td>${formatCurrency(currentTotal)}</td>
        <td>${formatCurrency(interestThisYear > 0 ? interestThisYear : 0)}</td>
      </tr>`;
    }

    const finalInvested = investedData.length > 0 ? investedData[investedData.length - 1] : principal;
    const finalTotal = totalData.length > 0 ? totalData[totalData.length - 1] : principal;
    const finalInterest = finalTotal - finalInvested;
    const returnPct = finalInvested > 0 ? ((finalTotal - finalInvested) / finalInvested) * 100 : 0;

    document.getElementById('compound-result-total').textContent = formatCurrency(finalTotal);
    document.getElementById('compound-result-interest').textContent = formatCurrency(finalInterest > 0 ? finalInterest : 0);
    document.getElementById('compound-result-invested').textContent = formatCurrency(finalInvested);
    document.getElementById('compound-result-return').textContent = returnPct.toLocaleString('th-TH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%';
    
    document.getElementById('compound-table').innerHTML = tableHTML;

    renderMainChart(labels, investedData, totalData);
  }

  function renderMainChart(labels, investedData, totalData) {
    const canvas = document.getElementById('compound-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (mainChart) mainChart.destroy();

    const gradientPurple = ctx.createLinearGradient(0, 0, 0, 400);
    gradientPurple.addColorStop(0, 'rgba(168, 85, 247, 0.5)');
    gradientPurple.addColorStop(1, 'rgba(168, 85, 247, 0.0)');

    const gradientBlue = ctx.createLinearGradient(0, 0, 0, 400);
    gradientBlue.addColorStop(0, 'rgba(58, 123, 213, 0.5)');
    gradientBlue.addColorStop(1, 'rgba(58, 123, 213, 0.0)');

    mainChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'มูลค่ารวม',
            data: totalData,
            borderColor: '#a855f7',
            backgroundColor: gradientPurple,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            order: 1
          },
          {
            label: 'เงินที่ลงทุน',
            data: investedData,
            borderColor: '#3a7bd5',
            backgroundColor: gradientBlue,
            fill: true,
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

  function renderCompareChart() {
    const principal = parseFloat(document.getElementById('compound-principal').value) || 0;
    const monthly = parseFloat(document.getElementById('compound-monthly').value) || 0;
    const years = parseInt(document.getElementById('compound-years').value, 10) || 0;
    const frequency = parseInt(document.getElementById('compound-frequency').value, 10) || 12;

    const rate1 = parseFloat(document.getElementById('compare-rate-1').value) || 0;
    const rate2 = parseFloat(document.getElementById('compare-rate-2').value) || 0;
    const rate3 = parseFloat(document.getElementById('compare-rate-3').value) || 0;

    const rates = [rate1, rate2, rate3];
    const colors = ['#00e676', '#00d2ff', '#a855f7'];
    const datasets = [];
    const labels = [];

    for (let i = 1; i <= years; i++) {
      labels.push(`ปีที่ ${i}`);
    }

    rates.forEach((rate, index) => {
      let data = [];
      const r = rate / 100;
      const n = frequency;
      const pmtPerPeriod = (monthly * 12) / n;

      for (let i = 1; i <= years; i++) {
        let pmtPeriods = n * i;
        let ratePerPeriod = r / n;
        let fv = principal * Math.pow(1 + ratePerPeriod, pmtPeriods);
        if (ratePerPeriod > 0) {
          fv += pmtPerPeriod * ((Math.pow(1 + ratePerPeriod, pmtPeriods) - 1) / ratePerPeriod);
        } else {
          fv += monthly * 12 * i;
        }
        data.push(fv);
      }

      datasets.push({
        label: `ผลตอบแทน ${rate}%`,
        data: data,
        borderColor: colors[index],
        backgroundColor: 'transparent',
        tension: 0.4,
        borderWidth: 2
      });
    });

    const canvas = document.getElementById('compound-compare-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (compareChart) compareChart.destroy();

    compareChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
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
  if (document.getElementById('page-compound')) {
    CompoundCalc.init();
  }
});
