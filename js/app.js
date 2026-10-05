document.addEventListener('DOMContentLoaded', () => {
  // Navigation System
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const hamburgerBtn = document.getElementById('hamburger-btn');

  function navigateTo(pageId) {
    navItems.forEach(item => item.classList.remove('active'));
    pages.forEach(page => page.classList.remove('active'));

    const targetItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    const targetPage = document.getElementById(`page-${pageId}`);

    if (targetItem && targetPage) {
      targetItem.classList.add('active');
      targetPage.classList.add('active');
      window.location.hash = pageId;
    }

    if (window.innerWidth <= 768) {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.dataset.page);
    });
  });

  window.addEventListener('hashchange', () => {
    const pageId = window.location.hash.substring(1) || 'portfolio';
    navigateTo(pageId);
  });

  // Mobile Sidebar
  hamburgerBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
  });

  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
  });

  // Sidebar Clock
  const clockEl = document.getElementById('sidebar-clock');
  if (clockEl) {
    function updateClock() {
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString('th-TH');
    }
    setInterval(updateClock, 1000);
    updateClock();
  }

  // Initialization
  const initialPage = window.location.hash.substring(1) || 'portfolio';
  navigateTo(initialPage);

  const budgetDateInput = document.getElementById('budget-date');
  if (budgetDateInput) {
    budgetDateInput.valueAsDate = new Date();
  }
});

// Utility Functions
window.Utils = {
  formatCurrency: (amount, currency = '฿') => {
    return currency + new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },
  formatNumber: (num) => {
    return new Intl.NumberFormat('th-TH').format(num);
  },
  formatPercent: (num) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num) + '%';
  },
  formatCompactNumber: (num) => {
    return new Intl.NumberFormat('th-TH', {
      notation: 'compact',
      maximumFractionDigits: 2
    }).format(num);
  },
  showToast: (message, type = 'info') => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    toast.innerHTML = `<i class="fas fa-${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },
  generateId: () => {
    return Math.random().toString(36).substring(2, 9);
  },
  saveToStorage: (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  },
  loadFromStorage: (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  getTypeLabel: (type) => {
    const types = {
      'stock': '📈 หุ้น',
      'crypto': '🪙 คริปโต',
      'fund': '📊 กองทุน',
      'gold': '🥇 ทองคำ',
      'bond': '📄 พันธบัตร',
      'other': '📦 อื่นๆ'
    };
    return types[type] || type;
  },
  getCategoryLabel: (category) => {
    const categories = {
      'salary': '💼 เงินเดือน',
      'freelance': '💻 ฟรีแลนซ์',
      'investment-income': '📈 ผลตอบแทนการลงทุน',
      'business': '🏪 รายได้ธุรกิจ',
      'other-income': '📦 อื่นๆ',
      'food': '🍜 อาหาร',
      'transport': '🚗 เดินทาง',
      'housing': '🏠 ที่อยู่อาศัย',
      'utilities': '💡 ค่าสาธารณูปโภค',
      'shopping': '🛍️ ช้อปปิ้ง',
      'entertainment': '🎬 ความบันเทิง',
      'health': '🏥 สุขภาพ',
      'education': '📚 การศึกษา',
      'investment-expense': '💰 ลงทุน',
      'other-expense': '📦 อื่นๆ'
    };
    return categories[category] || category;
  }
};
