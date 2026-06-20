/* =====================================================
   RAILQUICK — Complete Application JavaScript
   ===================================================== */

'use strict';

// =====================================================
// API CONFIG — RailKit via local proxy server
// =====================================================
const origin = window.location.origin || '';
const API_BASE = (origin.startsWith('file://') || origin === 'null')
  ? 'http://localhost:3000'
  : origin;


// =====================================================
// APP STATE
// =====================================================
let appState = {
  currentPage: 'page-splash',
  user: null,
  cart: [],
  orders: [],
  pnrData: null,
  trainData: null,
  selectedPayment: 'upi',
  modalProduct: null,
  modalQty: 1,
  currentFilter: 'all',
  searchQuery: '',
  appliedCoupon: null
};

// Load persisted data
function loadState() {
  try {
    const saved = localStorage.getItem('railquick_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      appState.user   = parsed.user   || null;
      appState.cart   = Array.isArray(parsed.cart) ? parsed.cart : [];
      appState.orders = Array.isArray(parsed.orders) ? parsed.orders : [];
      appState.pnrData = parsed.pnrData || null;
    }
  } catch(e) {}
}

function saveState() {
  try {
    localStorage.setItem('railquick_state', JSON.stringify({
      user:    appState.user,
      cart:    appState.cart,
      orders:  appState.orders,
      pnrData: appState.pnrData
    }));
  } catch(e) {}
}

// =====================================================
// PRODUCTS DATABASE
// =====================================================
const PRODUCTS = [
  {
    id: 1,
    name: "Bisleri Mineral Water 1L",
    price: 20,
    mrp: 25,
    category: "beverages",
    img: "product_water.png",
    rating: 4.7,
    reviews: 1240,
    description: "Fresh and pure mineral water. Stay hydrated throughout your train journey. ISI certified, sealed bottle.",
    tags: ["Hydration", "ISI Certified", "1 Litre"]
  },
  {
    id: 2,
    name: "Haldiram's Aloo Bhujia 150g",
    price: 30,
    mrp: 35,
    category: "snacks",
    img: "product_haldirams.png",
    rating: 4.6,
    reviews: 892,
    description: "Crispy, crunchy and spicy Aloo Bhujia from Haldiram's. The ultimate train snack companion — original Bikaneri recipe.",
    tags: ["Vegetarian", "Crispy", "Bikaneri Recipe"]
  },
  {
    id: 3,
    name: "Ambrane 10000mAh Power Bank",
    price: 499,
    mrp: 799,
    category: "electronics",
    img: "product_powerbank.png",
    rating: 4.6,
    reviews: 543,
    description: "Never run out of charge on long journeys. Dual USB output, fast charge support. Compact and light.",
    tags: ["Fast Charge", "Dual USB", "10000mAh"]
  },
  {
    id: 4,
    name: "Travel Hygiene Kit",
    price: 35,
    mrp: 50,
    category: "hygiene",
    img: "product_toothbrush.png",
    rating: 4.5,
    reviews: 337,
    description: "Complete travel kit with toothbrush, mini toothpaste, face towel & Dove soap. Everything for a fresh journey.",
    tags: ["Complete Kit", "Travel Size", "Colgate+Dove"]
  },
  {
    id: 5,
    name: "Dettol Hand Sanitizer 50ml",
    price: 45,
    mrp: 60,
    category: "hygiene",
    img: "product_sanitizer.png",
    rating: 4.8,
    reviews: 2145,
    description: "Kill 99.9% of germs. No water required. Compact travel size fits in your pocket easily.",
    tags: ["Kills 99.9% Germs", "Travel Size", "Instant"]
  },
  {
    id: 6,
    name: "Wagh Bakri Instant Chai Kit",
    price: 40,
    mrp: 55,
    category: "beverages",
    img: "product_tea.png",
    rating: 4.4,
    reviews: 451,
    description: "Enjoy authentic masala chai anywhere on your journey. 10 cups pack with sugar & spices. Just add hot water!",
    tags: ["Masala Chai", "10 Cups", "Instant"]
  },
  {
    id: 7,
    name: "Inflatable Travel Neck Pillow",
    price: 149,
    mrp: 249,
    category: "comfort",
    img: "product_neckpillow.png",
    rating: 4.3,
    reviews: 788,
    description: "Sleep comfortably even on long overnight journeys. Soft velvet cover, portable inflatable design. Supports neck perfectly.",
    tags: ["Velvet Cover", "Inflatable", "Ergonomic"]
  },
  {
    id: 8,
    name: "boAt Wired Earphones",
    price: 199,
    mrp: 399,
    category: "electronics",
    img: "product_earphones.png",
    rating: 4.5,
    reviews: 1120,
    description: "Premium audio quality earphones with mic. Great for music, calls & videos during your train journey. 3.5mm jack.",
    tags: ["With Mic", "3.5mm Jack", "Premium Sound"]
  }
];

// =====================================================
// NAVIGATION
// =====================================================
function navigateTo(pageId) {
  const current = document.getElementById(appState.currentPage);
  const target  = document.getElementById(pageId);
  if (!target || pageId === appState.currentPage) return;

  current.classList.remove('active');
  current.classList.add('slide-out');

  setTimeout(() => {
    current.classList.remove('slide-out');
  }, 400);

  target.classList.add('active');
  appState.currentPage = pageId;

  // Control bottom nav visibility
  const hideNavPages = ['page-splash', 'page-pnr', 'page-cart', 'page-checkout'];
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav) {
    if (hideNavPages.includes(pageId)) {
      bottomNav.style.display = 'none';
    } else {
      bottomNav.style.display = 'flex';
    }
  }

  // Auto-sync bottom nav item
  const navMap = {
    'page-shop': 'home',
    'page-pnr': 'pnr',
    'page-orders': 'orders',
    'page-offers': 'offers',
    'page-account': 'account'
  };
  const navName = navMap[pageId];
  if (navName) {
    activateNav(navName);
  }

  // Page-specific init
  if (pageId === 'page-shop') initShopPage();
  if (pageId === 'page-cart') initCartPage();
  if (pageId === 'page-orders') initOrdersPage();
  if (pageId === 'page-account') initAccountPage();
  if (pageId === 'page-checkout') initCheckoutPage();
}

// =====================================================
// PNR PAGE
// =====================================================
function switchPNRTab(tab) {
  document.getElementById('panel-pnr').classList.toggle('hidden', tab !== 'pnr');
  document.getElementById('panel-live').classList.toggle('hidden', tab !== 'live');
  document.getElementById('tab-pnr').classList.toggle('active', tab === 'pnr');
  document.getElementById('tab-live').classList.toggle('active', tab === 'live');
  document.getElementById('pnr-results').classList.add('hidden');
  document.getElementById('pnr-results').innerHTML = '';
}

function validatePNR(input) {
  input.value = input.value.slice(0, 10);
}

function validateApiResponse(data) {
  if (!data || !data.success || !data.data) {
    throw new Error(data?.error || 'Failed to fetch data');
  }
  const payload = data.data;
  if (payload.success === false || payload.error) {
    throw new Error(payload.error || 'No data found');
  }
  return payload;
}

async function checkPNRStatus() {
  const pnr = document.getElementById('pnr-input').value.trim();
  if (pnr.length !== 10) {
    showToast('Please enter a valid 10-digit PNR', 'warning');
    return;
  }

  showLoading('Checking PNR Status...');

  try {
    const resp = await fetch(`${API_BASE}/api/pnr/${pnr}`);
    const data = await resp.json();
    hideLoading();

    const d = validateApiResponse(data);
    // Map RailKit response to our format
    const mapped = {
      pnrNumber: d.pnr,
      trainNumber: d.train?.number || '—',
      trainName: d.train?.name || 'Train',
      dateOfJourney: d.journey?.dateOfJourney || '—',
      source: `${d.journey?.source?.name || '—'} (${d.journey?.source?.code || ''})`,
      destination: `${d.journey?.destination?.name || '—'} (${d.journey?.destination?.code || ''})`,
      reservationClass: d.journey?.class || '—',
      chartPrepared: d.chart?.status || '—',
      fare: d.booking?.fare || null,
      passengerList: (d.passengers || []).map(p => ({
        serialNumber: p.serialNumber || 'Passenger',
        bookingStatus: p.booking?.details || '—',
        currentStatus: p.current?.details || '—',
        coach: p.current?.coach || p.booking?.coach || '',
        berth: p.current?.berthNo || p.booking?.berthNo || '',
        berthCode: p.current?.berthCode || p.booking?.berthCode || ''
      }))
    };
    appState.pnrData = mapped;
    saveState();
    renderPNRResult(mapped);
    showContinueBar(mapped);
    showToast('PNR details fetched successfully!');
  } catch (err) {
    hideLoading();
    showToast(err.message || 'Could not fetch PNR.', 'warning');
    console.error('PNR Error:', err);
  }
}

function renderPNRResult(d) {
  const passengers = d.passengerList || [];
  const paxHTML = passengers.map(p => `
    <div class="passenger-chip">
      <strong>${p.serialNumber}</strong>: ${p.currentStatus}
    </div>
  `).join('');

  const chartColor = (d.chartPrepared || '').toLowerCase().includes('prepared') ? 'green' : 'orange';

  document.getElementById('pnr-results').innerHTML = `
    <div class="result-header">
      <div class="result-train-name">${d.trainName || 'Train'}</div>
      <div class="result-train-num">#${d.trainNumber || '—'}</div>
    </div>
    <div class="result-body">
      <div class="result-row">
        <span class="result-label">PNR Number</span>
        <span class="result-value">${d.pnrNumber}</span>
      </div>
      <div class="result-row">
        <span class="result-label">Journey Date</span>
        <span class="result-value">${d.dateOfJourney || '—'}</span>
      </div>
      <div class="result-row">
        <span class="result-label">From → To</span>
        <span class="result-value" style="font-size:0.78rem">${d.source || '—'} → ${d.destination || '—'}</span>
      </div>
      <div class="result-row">
        <span class="result-label">Class</span>
        <span class="result-value">${d.reservationClass || '—'}</span>
      </div>
      <div class="result-row">
        <span class="result-label">Chart Status</span>
        <span class="result-value ${chartColor}">${d.chartPrepared || '—'}</span>
      </div>
      ${d.fare ? `<div class="result-row">
        <span class="result-label">Fare</span>
        <span class="result-value">₹${d.fare}</span>
      </div>` : ''}
      ${paxHTML}
    </div>
  `;
  document.getElementById('pnr-results').classList.remove('hidden');
}

function showContinueBar(data) {
  const bar  = document.getElementById('continue-bar');
  const info = document.getElementById('train-info-mini');
  const pax = data.passengerList && data.passengerList[0];
  const seat = pax ? pax.currentStatus : data.reservationClass || '—';

  info.innerHTML = `
    <strong>${data.trainName || 'Train'}</strong><br/>
    <span style="color:var(--orange)">Seat: ${seat}</span>
  `;
  bar.classList.remove('hidden');
}

function proceedToShop() {
  navigateTo('page-shop');
}

async function checkLiveStatus() {
  const trainNo = document.getElementById('live-train-input').value.trim();
  const dateInput = document.getElementById('live-date-input').value;

  if (!trainNo) {
    showToast('Enter a train number', 'warning');
    return;
  }

  // RailKit needs DD-MM-YYYY format
  let dateStr;
  if (dateInput) {
    const [y, m, d] = dateInput.split('-');
    dateStr = `${d}-${m}-${y}`;
  } else {
    const now = new Date();
    dateStr = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}`;
  }

  showLoading('Getting live train position...');

  try {
    const resp = await fetch(`${API_BASE}/api/track-train/${trainNo}/${dateStr}`);
    const data = await resp.json();
    hideLoading();

    const d = validateApiResponse(data);
    renderLiveTrainResult(d, trainNo);
    showToast('Live status fetched!');
  } catch(err) {
    hideLoading();
    showToast(err.message || 'Could not fetch live status.', 'warning');
    console.error('Live Status Error:', err);
  }
}

function renderLiveTrainResult(d, trainNo) {
  let currentStation = '—';
  let nextStation = '—';
  
  if (d.timeline && d.timeline.length > 0) {
    // 1. Try to find the station with status 'current'
    let current = d.timeline.find(t => t.status === 'current');
    
    // 2. If no 'current' station, try to find by currentStationCode
    if (!current && d.currentStationCode) {
      current = d.timeline.find(t => t.stationCode === d.currentStationCode);
    }
    
    // 3. If still not found, get the last station with status 'passed'
    if (!current) {
      const passedStations = d.timeline.filter(t => t.status === 'passed');
      if (passedStations.length > 0) {
        current = passedStations[passedStations.length - 1];
      }
    }
    
    if (current) {
      currentStation = `${current.stationName || current.stationCode} (${current.stationCode})`;
      
      // Find the next upcoming station/stoppage
      const currIdx = d.timeline.indexOf(current);
      if (currIdx !== -1 && currIdx < d.timeline.length - 1) {
        const upcoming = d.timeline.slice(currIdx + 1).find(t => t.status === 'upcoming' || t.status === 'current');
        if (upcoming) {
          nextStation = `${upcoming.stationName || upcoming.stationCode} (${upcoming.stationCode})`;
        }
      }
    } else {
      if (d.currentStationCode) {
        currentStation = d.currentStationCode;
      }
    }
    
    // If nextStation is still '—', find the first upcoming station in the whole timeline
    if (nextStation === '—') {
      const upcoming = d.timeline.find(t => t.status === 'upcoming');
      if (upcoming) {
        nextStation = `${upcoming.stationName || upcoming.stationCode} (${upcoming.stationCode})`;
      }
    }
  }

  const statusNote = d.statusNote || 'Running';
  const isDelayed = statusNote.toLowerCase().includes('late') || statusNote.toLowerCase().includes('delay');

  // Build timeline HTML
  let timelineHTML = '';
  if (d.timeline && d.timeline.length > 0) {
    const stoppages = d.timeline.filter(t => t.type === 'stoppage').slice(0, 6);
    timelineHTML = stoppages.map(s => {
      const statusClass = s.status === 'passed' ? 'green' : (s.status === 'current' ? 'orange' : '');
      const dep = s.departure?.actual || s.departure?.scheduled || '—';
      const arr = s.arrival?.actual || s.arrival?.scheduled || '—';
      return `<div class="result-row">
        <span class="result-label">${s.stationName} (${s.stationCode})</span>
        <span class="result-value ${statusClass}" style="font-size:0.75rem">${arr} / ${dep}</span>
      </div>`;
    }).join('');
  }

  document.getElementById('pnr-results').innerHTML = `
    <div class="result-header" style="background:linear-gradient(135deg,#1E3A5F,#2a5298)">
      <div class="result-train-name">${d.trainName || 'Train ' + trainNo}</div>
      <div class="result-train-num">Updated: ${d.lastUpdate || 'Just now'}</div>
    </div>
    <div class="result-body">
      <div class="result-row">
        <span class="result-label">Train Number</span>
        <span class="result-value">#${d.trainNo || trainNo}</span>
      </div>
      <div class="result-row">
        <span class="result-label">Status</span>
        <span class="result-value ${isDelayed ? 'orange' : 'green'}">${statusNote}</span>
      </div>
      ${currentStation !== '—' ? `<div class="result-row">
        <span class="result-label">Current Station</span>
        <span class="result-value">${currentStation}</span>
      </div>` : ''}
      ${nextStation !== '—' ? `<div class="result-row">
        <span class="result-label">Next Station</span>
        <span class="result-value orange">${nextStation}</span>
      </div>` : ''}
      ${timelineHTML ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
        <div style="font-size:0.72rem;font-weight:700;color:var(--text-light);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">STATION TIMELINE</div>
        ${timelineHTML}
      </div>` : ''}
    </div>
  `;
  document.getElementById('pnr-results').classList.remove('hidden');
}

async function searchTrain() {
  const query = document.getElementById('train-search-input').value.trim();

  if (!query) {
    showToast('Enter train number or name', 'warning');
    return;
  }

  showLoading('Searching train...');

  try {
    const resp = await fetch(`${API_BASE}/api/train-info/${query}`);
    const data = await resp.json();
    hideLoading();

    const d = validateApiResponse(data);
    renderTrainSchedule(d);
    showToast('Train info fetched!');
  } catch (err) {
    hideLoading();
    showToast(err.message || 'Could not find train.', 'warning');
    console.error('Search Error:', err);
  }
}

function renderTrainSchedule(d) {
  const info = d.trainInfo || {};
  const stations = (d.route || []).slice(0, 8);
  const stationsHTML = stations.map(s => `
    <div class="result-row">
      <span class="result-label">${s.stnName || s.stationName} (${s.stnCode || s.stationCode || ''})</span>
      <span class="result-value" style="font-size:0.78rem">${s.arrival || '—'} / ${s.departure || '—'}</span>
    </div>
  `).join('');

  document.getElementById('pnr-results').innerHTML = `
    <div class="result-header">
      <div class="result-train-name">${info.train_name || 'Train'} (${info.train_no || ''})</div>
      <div class="result-train-num">${info.from_stn_name || ''} → ${info.to_stn_name || ''} · ${info.travel_time || ''}</div>
    </div>
    <div class="result-body">
      <div class="result-row" style="background:#F0FDF4;border-radius:8px;padding:8px 12px;margin-bottom:4px;">
        <span class="result-label" style="font-size:0.7rem;font-weight:700">STATION</span>
        <span class="result-label" style="font-size:0.7rem;font-weight:700">ARR / DEP</span>
      </div>
      ${stationsHTML}
    </div>
  `;
  document.getElementById('pnr-results').classList.remove('hidden');
}

// =====================================================
// SHOP PAGE
// =====================================================
function initShopPage() {
  renderProducts(PRODUCTS);
  updateTrainStrip();
  updateCartFAB();
  updateNavbar();
}

function updateTrainStrip() {
  const strip = document.getElementById('train-strip');
  if (appState.pnrData) {
    const d = appState.pnrData;
    const seat = d.passengerList && d.passengerList[0]
      ? d.passengerList[0].currentStatus
      : d.reservationClass || '—';
    document.getElementById('strip-train-name').textContent = `${d.trainName || 'Train'} #${d.trainNumber || ''}`;
    document.getElementById('strip-seat').textContent = `Seat: ${seat}`;
    strip.classList.remove('hidden');
  } else {
    strip.classList.add('hidden');
  }
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  if (!products.length) {
    grid.innerHTML = `<div style="grid-column:span 2;text-align:center;padding:40px 0;color:var(--text-light)">
      <div>
        <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 48px; height: 48px; color: var(--text-light); margin-bottom: 8px;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </div>
      <div style="margin-top:8px;font-weight:600">No products found</div>
    </div>`;
    return;
  }

  grid.innerHTML = products.map(p => {
    const inCart = appState.cart.find(c => c.id === p.id);
    const qty = inCart ? inCart.qty : 0;

    return `
      <div class="product-card" onclick="openProductModal(${p.id})" id="pcard-${p.id}">
        <div class="product-img-wrapper">
          <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.src='product_water.png'" />
        </div>
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 8px; line-height: 1.3;">${p.description.substring(0, 48)}...</div>
          <div class="product-footer">
            <div class="product-price">₹${p.price}</div>
            ${qty > 0
              ? `<div class="product-qty-control">
                  <button class="product-qty-btn" onclick="event.stopPropagation();changeProductQty(${p.id},-1)">−</button>
                  <span class="product-qty-val">${qty}</span>
                  <button class="product-qty-btn" onclick="event.stopPropagation();changeProductQty(${p.id},1)">+</button>
                </div>`
              : `<button class="add-btn" onclick="event.stopPropagation();addToCart(${p.id})">ADD</button>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function filterCategory(cat, el) {
  appState.currentFilter = cat;
  document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');

  const filtered = cat === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === cat);

  renderProducts(filtered);
}

function filterProducts(q) {
  appState.searchQuery = q.toLowerCase();
  const filtered = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(appState.searchQuery) ||
    p.category.toLowerCase().includes(appState.searchQuery)
  );
  renderProducts(filtered);
}

function scrollToProducts() {
  document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' });
}

function activateNav(name) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`nav-${name}`);
  if (btn) btn.classList.add('active');
}

function updateNavbar() {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('nav-home').classList.add('active');
}

// =====================================================
// PROMO CODES / COUPONS
// =====================================================
function copyCoupon(code, buttonEl) {
  navigator.clipboard.writeText(code).then(() => {
    const originalText = buttonEl.textContent;
    buttonEl.textContent = 'Copied!';
    buttonEl.style.color = '#10B981';
    showToast(`Code ${code} copied!`);
    setTimeout(() => {
      buttonEl.textContent = originalText;
      buttonEl.style.color = 'var(--green)';
    }, 2000);
  }).catch(() => {
    showToast('Failed to copy code', 'error');
  });
}

function getCartTotals() {
  const subtotal = appState.cart.reduce((s, c) => s + c.price * c.qty, 0);
  let discount = 0;
  
  if (appState.appliedCoupon === 'RAILQUICK15') {
    discount = Math.round(subtotal * 0.15);
    if (discount > 50) discount = 50;
  }
  
  const gst = Math.round((subtotal - discount) * 0.05);
  const total = subtotal - discount + gst;
  
  return { subtotal, discount, gst, total };
}

function applyPromoCode() {
  const input = document.getElementById('promo-input');
  const statusEl = document.getElementById('promo-status');
  if (!input || !statusEl) return;
  
  const code = input.value.trim().toUpperCase();
  if (!code) {
    showToast('Please enter a coupon code', 'warning');
    return;
  }
  
  if (code === 'RAILQUICK15') {
    appState.appliedCoupon = code;
    statusEl.textContent = 'Coupon applied: 15% OFF (Max ₹50)';
    statusEl.style.color = 'var(--green)';
    statusEl.style.display = 'block';
    showToast('Coupon applied successfully!');
    updateCartSummary();
  } else if (code === 'FREEDEL') {
    appState.appliedCoupon = code;
    statusEl.textContent = 'Coupon applied: Free Delivery active!';
    statusEl.style.color = 'var(--green)';
    statusEl.style.display = 'block';
    showToast('Coupon applied successfully!');
    updateCartSummary();
  } else {
    showToast('Invalid coupon code', 'error');
    statusEl.textContent = 'Invalid coupon code';
    statusEl.style.color = '#EF4444';
    statusEl.style.display = 'block';
  }
}

// =====================================================
// CART
// =====================================================
function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = appState.cart.find(c => c.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    appState.cart.push({ ...product, qty: 1 });
  }

  saveState();
  updateCartFAB();
  showToast(`✓ ${product.name.split(' ').slice(0,3).join(' ')} added!`);
  renderProducts(getFilteredProducts());
}

function changeProductQty(productId, delta) {
  const item = appState.cart.find(c => c.id === productId);
  if (!item) { if (delta > 0) addToCart(productId); return; }

  item.qty += delta;
  if (item.qty <= 0) {
    appState.cart = appState.cart.filter(c => c.id !== productId);
  }

  saveState();
  updateCartFAB();
  renderProducts(getFilteredProducts());
}

function getFilteredProducts() {
  let p = appState.currentFilter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === appState.currentFilter);
  if (appState.searchQuery) p = p.filter(x => x.name.toLowerCase().includes(appState.searchQuery));
  return p;
}

function updateCartFAB() {
  const fab = document.getElementById('cart-fab');
  const count = appState.cart.reduce((s, c) => s + c.qty, 0);
  const total = appState.cart.reduce((s, c) => s + c.price * c.qty, 0);

  if (count > 0 && appState.currentPage === 'page-shop') {
    fab.classList.remove('hidden');
    document.getElementById('cart-fab-count').textContent = count;
    document.getElementById('cart-fab-price').textContent = `₹${total}`;
  } else {
    fab.classList.add('hidden');
  }
}

function initCartPage() {
  const cartList = document.getElementById('cart-items-list');
  const emptyEl  = document.getElementById('cart-empty');
  const summary  = document.getElementById('cart-summary');

  if (appState.cart.length === 0) {
    cartList.innerHTML = '';
    emptyEl.classList.remove('hidden');
    summary.style.display = 'none';
  } else {
    emptyEl.classList.add('hidden');
    summary.style.display = 'flex';
    renderCartItems();
    updateCartSummary();
  }

  // Update delivery detail
  if (appState.pnrData) {
    const d = appState.pnrData;
    const seat = d.passengerList && d.passengerList[0]
      ? d.passengerList[0].currentStatus
      : d.reservationClass;
    document.getElementById('delivery-detail').textContent =
      `${d.trainName || 'Train'} · Seat: ${seat || '—'} · New Delhi (NDLS)`;
  }
}

function renderCartItems() {
  const cartList = document.getElementById('cart-items-list');
  cartList.innerHTML = appState.cart.map(item => `
    <div class="cart-item" id="citem-${item.id}">
      <img class="cart-item-img" src="${item.img}" alt="${item.name}" onerror="this.src='product_water.png'" />
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${item.price} each</div>
        <div class="cart-item-controls">
          <button class="cart-qty-btn" onclick="updateCartItemQty(${item.id},-1)">−</button>
          <span class="cart-qty-val">${item.qty}</span>
          <button class="cart-qty-btn" onclick="updateCartItemQty(${item.id},1)">+</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
        <button class="cart-item-delete" onclick="removeCartItem(${item.id})">
          <svg class="icon-svg" viewBox="0 0 24 24" style="width: 18px; height: 18px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </button>
        <div class="cart-item-total">₹${item.price * item.qty}</div>
      </div>
    </div>
  `).join('');
}

function updateCartItemQty(id, delta) {
  const item = appState.cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) appState.cart = appState.cart.filter(c => c.id !== id);
  saveState();
  initCartPage();
}

function removeCartItem(id) {
  appState.cart = appState.cart.filter(c => c.id !== id);
  saveState();
  initCartPage();
  updateCartFAB();
  showToast('Item removed', 'info');
}

function clearCart() {
  if (!appState.cart.length) return;
  appState.cart = [];
  saveState();
  initCartPage();
  updateCartFAB();
}

function updateCartSummary() {
  if (appState.cart.length === 0) {
    appState.appliedCoupon = null;
    const statusEl = document.getElementById('promo-status');
    if (statusEl) statusEl.style.display = 'none';
    const inputEl = document.getElementById('promo-input');
    if (inputEl) inputEl.value = '';
  }

  const { subtotal, discount, gst, total } = getCartTotals();
  document.getElementById('summary-subtotal').textContent = `₹${subtotal}`;
  document.getElementById('summary-gst').textContent = `₹${gst}`;

  let discountRow = document.getElementById('summary-discount-row');
  if (!discountRow) {
    const summaryBlock = document.getElementById('cart-summary');
    discountRow = document.createElement('div');
    discountRow.id = 'summary-discount-row';
    discountRow.className = 'summary-row discount-row';
    discountRow.style.color = 'var(--green)';
    discountRow.style.fontWeight = '600';
    discountRow.innerHTML = `<span>Discount</span><span id="summary-discount">-₹0</span>`;
    summaryBlock.insertBefore(discountRow, summaryBlock.querySelector('.summary-divider'));
  }

  if (discount > 0) {
    discountRow.style.display = 'flex';
    document.getElementById('summary-discount').textContent = `-₹${discount}`;
  } else {
    discountRow.style.display = 'none';
  }

  document.getElementById('summary-total').textContent = `₹${total}`;
}

function proceedToCheckout() {
  if (!appState.cart.length) {
    showToast('Cart is empty!', 'warning');
    return;
  }
  if (!appState.user) {
    showToast('Please sign in first!', 'warning');
    navigateTo('page-account');
    return;
  }
  navigateTo('page-checkout');
}

// =====================================================
// CHECKOUT
// =====================================================
function initCheckoutPage() {
  // Step 1 active
  setCheckoutStep(1);

  const pnrCard = document.getElementById('checkout-pnr-details');
  const manualCard = document.getElementById('checkout-manual-details');

  if (appState.pnrData) {
    pnrCard.classList.remove('hidden');
    manualCard.classList.add('hidden');
    const d = appState.pnrData;
    const seat = d.passengerList && d.passengerList[0]
      ? d.passengerList[0].currentStatus
      : d.reservationClass || '—';
    document.getElementById('checkout-train').textContent = `${d.trainName} (#${d.trainNumber})`;
    document.getElementById('checkout-seat').textContent = seat;
  } else {
    pnrCard.classList.add('hidden');
    manualCard.classList.remove('hidden');
    document.getElementById('manual-train').value = '';
    document.getElementById('manual-coach').value = '';
    document.getElementById('manual-seat').value = '';
  }

  // Fill user info
  if (appState.user) {
    document.getElementById('contact-name').value = appState.user.name || '';
    document.getElementById('contact-phone').value = appState.user.phone || '';
  }

  // Render mini items
  renderCheckoutMiniItems();

  // Total
  const { total } = getCartTotals();
  document.getElementById('checkout-total-amt').textContent = `₹${total}`;
  document.getElementById('pay-total-amt').textContent = `₹${total}`;
}

function renderCheckoutMiniItems() {
  const el = document.getElementById('checkout-items-mini');
  el.innerHTML = appState.cart.map(item => `
    <div class="checkout-mini-item">
      <img class="mini-item-img" src="${item.img}" alt="${item.name}" onerror="this.src='product_water.png'" />
      <span class="mini-item-name">${item.name} × ${item.qty}</span>
      <span class="mini-item-price">₹${item.price * item.qty}</span>
    </div>
  `).join('');
}

function goToPayment() {
  const name = document.getElementById('contact-name').value.trim();
  const phone = document.getElementById('contact-phone').value.trim();

  if (!name || !phone) {
    showToast('Please fill your name and phone', 'warning');
    return;
  }

  if (!appState.pnrData) {
    const manualTrain = document.getElementById('manual-train').value.trim();
    const manualCoach = document.getElementById('manual-coach').value.trim();
    const manualSeat = document.getElementById('manual-seat').value.trim();
    if (!manualTrain || !manualCoach || !manualSeat) {
      showToast('Please enter your Train, Coach, and Seat number', 'warning');
      return;
    }
  }

  setCheckoutStep(2);
}

function setCheckoutStep(step) {
  document.getElementById('checkout-step-1').classList.toggle('hidden', step !== 1);
  document.getElementById('checkout-step-2').classList.toggle('hidden', step !== 2);
  document.getElementById('checkout-step-3').classList.toggle('hidden', step !== 3);

  [1, 2, 3].forEach(s => {
    const el = document.getElementById(`step-${s}`);
    el.classList.toggle('active', s === step);
    el.classList.toggle('done', s < step);
  });

  document.querySelectorAll('.step-line').forEach((line, i) => {
    line.classList.toggle('active', i < step - 1);
  });
}

function selectPayment(el, type) {
  appState.selectedPayment = type;
  document.querySelectorAll('.payment-option').forEach(o => {
    o.classList.remove('selected');
    o.querySelector('.pay-check').classList.add('hidden');
  });
  el.classList.add('selected');
  el.querySelector('.pay-check').classList.remove('hidden');

  // Show/hide UPI input
  document.getElementById('upi-input-section').style.display =
    type === 'upi' ? 'block' : 'none';
}

function selectUPIApp(el) {
  document.querySelectorAll('.upi-app').forEach(a => a.style.opacity = '0.5');
  el.style.opacity = '1';
  const name = el.querySelector('.upi-app-name').textContent;
  showToast(`${name} selected for payment`, 'info');
}

function placeOrder() {
  // Simulate payment processing
  showLoading('Processing payment securely...');

  setTimeout(() => {
    hideLoading();

    const orderId = 'RQ-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    let seat = 'Your Seat';
    let train = 'Train';

    if (appState.pnrData) {
      const seatDetails = appState.pnrData.passengerList && appState.pnrData.passengerList[0]
        ? appState.pnrData.passengerList[0].currentStatus
        : appState.pnrData.reservationClass || '—';
      seat = seatDetails;
      train = appState.pnrData.trainName || 'Train';
    } else {
      const manualTrain = document.getElementById('manual-train').value.trim();
      const manualCoach = document.getElementById('manual-coach').value.trim().toUpperCase();
      const manualSeat = document.getElementById('manual-seat').value.trim();
      if (manualTrain) train = manualTrain;
      if (manualCoach && manualSeat) {
        seat = `Coach ${manualCoach}, Seat ${manualSeat}`;
      } else if (manualCoach || manualSeat) {
        seat = manualCoach || manualSeat;
      }
    }

    const { subtotal, discount, gst, total } = getCartTotals();
    // Save order
    const order = {
      id: orderId,
      items: [...appState.cart],
      date: new Date().toLocaleDateString('en-IN'),
      status: 'preparing',
      subtotal: subtotal,
      discount: discount,
      gst: gst,
      total: total,
      seat: seat,
      train: train
    };

    appState.appliedCoupon = null;

    appState.orders.unshift(order);
    appState.cart = [];
    saveState();
    updateCartFAB();

    document.getElementById('order-id-display').textContent = orderId;
    document.getElementById('success-seat').textContent = seat || 'Your Seat';

    setCheckoutStep(3);
    showToast('Order placed successfully!');
  }, 2500);
}

// =====================================================
// ORDERS PAGE
// =====================================================
function initOrdersPage() {
  const list = document.getElementById('orders-list');
  const empty = document.getElementById('orders-empty');

  if (!appState.orders.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  list.innerHTML = appState.orders.map(order => {
    const statusMap = {
      preparing: 'preparing',
      'in-transit': 'in-transit',
      delivered: 'delivered'
    };
    const statusLabel = {
      preparing: 'Preparing',
      'in-transit': 'In Transit',
      delivered: 'Delivered'
    };

    const itemImgs = order.items.slice(0, 4).map(i =>
      `<img class="order-item-thumb" src="${i.img}" alt="${i.name}" onerror="this.src='product_water.png'" />`
    ).join('');

    const gst = Math.round(order.total * 0.05);
    const totalWithGST = order.total + gst;

    return `
      <div class="order-card">
        <div class="order-card-header">
          <span class="order-id">${order.id}</span>
          <span class="order-date">${order.date}</span>
        </div>
        <div class="order-status ${statusMap[order.status] || 'preparing'}">
          ${statusLabel[order.status] || 'Preparing'}
        </div>
        <div class="order-items-preview">${itemImgs}</div>
        <div style="font-size:0.78rem;color:var(--text-light);margin-bottom:8px;">
          ${order.train || 'Train'} · Seat: ${order.seat || '—'}
        </div>
        <div class="order-footer">
          <div>
            <div class="order-total-label">Total Paid</div>
            <div class="order-total-val">₹${totalWithGST}</div>
          </div>
          <button class="order-track-btn" onclick="trackOrder('${order.id}')">Track Order</button>
        </div>
      </div>
    `;
  }).join('');
}

function trackOrder(id) {
  showToast(`Order ${id} is on the way!`, 'info');
}

// =====================================================
// ACCOUNT PAGE
// =====================================================
function initAccountPage() {
  const loggedIn = document.getElementById('account-logged-section');
  const loginSection = document.getElementById('account-login-section');

  if (appState.user) {
    loginSection.classList.add('hidden');
    loggedIn.classList.remove('hidden');
    document.getElementById('profile-name').textContent = appState.user.name || 'User';
    document.getElementById('profile-email').textContent = appState.user.email || '';
    document.getElementById('profile-avatar').textContent =
      (appState.user.name || 'U')[0].toUpperCase();
  } else {
    loginSection.classList.remove('hidden');
    loggedIn.classList.add('hidden');
  }
}

function googleSignIn() {
  // Since we can't integrate real Google OAuth without a backend,
  // we simulate a successful login with demo user data
  showLoading('Signing in with Google...');
  setTimeout(() => {
    hideLoading();
    appState.user = {
      name: 'Kartik Guleria',
      email: 'kartik@gmail.com',
      phone: '+91 9876543210',
      avatar: 'K',
      provider: 'google',
      loginAt: new Date().toISOString()
    };
    saveState();
    initAccountPage();
    showToast('✓ Signed in successfully!');
  }, 1500);
}

function showPhoneLogin() {
  showToast('Phone login — integration coming soon!', 'info');
}

function signOut() {
  appState.user = null;
  saveState();
  initAccountPage();
  showToast('Signed out successfully', 'info');
}

// =====================================================
// PRODUCT MODAL
// =====================================================
function openProductModal(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  appState.modalProduct = product;
  appState.modalQty = 1;

  document.getElementById('modal-img').src = product.img;
  document.getElementById('modal-img').onerror = () => { document.getElementById('modal-img').src = 'product_water.png'; };
  document.getElementById('modal-category').textContent = product.category.charAt(0).toUpperCase() + product.category.slice(1);
  document.getElementById('modal-name').textContent = product.name;
  document.getElementById('modal-stars').textContent = getStars(product.rating);
  document.getElementById('modal-reviews').textContent = `(${product.reviews} reviews)`;
  document.getElementById('modal-price').textContent = `₹${product.price}`;
  if (product.mrp > product.price) {
    document.getElementById('modal-price').innerHTML =
      `₹${product.price} <span style="text-decoration:line-through;color:#9CA3AF;font-size:1rem;">₹${product.mrp}</span>
       <span style="color:#16a34a;font-size:0.85rem;font-weight:600;">${Math.round((1-product.price/product.mrp)*100)}% off</span>`;
  }
  document.getElementById('modal-desc').textContent = product.description;
  document.getElementById('modal-tags').innerHTML = product.tags.map(t =>
    `<span class="modal-tag">${t}</span>`
  ).join('');
  document.getElementById('modal-qty').textContent = 1;
  document.getElementById('modal-total').textContent = `₹${product.price}`;

  document.getElementById('product-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  document.getElementById('product-modal').classList.add('hidden');
  document.body.style.overflow = '';
  appState.modalProduct = null;
}

function closeModal(event) {
  if (event.target === document.getElementById('product-modal')) {
    closeProductModal();
  }
}

function changeModalQty(delta) {
  appState.modalQty = Math.max(1, appState.modalQty + delta);
  document.getElementById('modal-qty').textContent = appState.modalQty;
  if (appState.modalProduct) {
    document.getElementById('modal-total').textContent =
      `₹${appState.modalProduct.price * appState.modalQty}`;
  }
}

function addToCartFromModal() {
  if (!appState.modalProduct) return;

  const id = appState.modalProduct.id;
  const qty = appState.modalQty;
  const existing = appState.cart.find(c => c.id === id);

  if (existing) {
    existing.qty += qty;
  } else {
    appState.cart.push({ ...appState.modalProduct, qty });
  }

  saveState();
  updateCartFAB();
  closeProductModal();
  showToast(`✓ ${appState.modalProduct.name.split(' ').slice(0,3).join(' ')} × ${qty} added!`);

  // Re-render products
  if (appState.currentPage === 'page-shop') {
    renderProducts(getFilteredProducts());
  }
}

// =====================================================
// TOAST SYSTEM
// =====================================================
let toastTimeout;

function showToast(msg, type = 'success') {
  clearTimeout(toastTimeout);
  const toast = document.getElementById('toast');
  const icon  = document.getElementById('toast-icon');
  const text  = document.getElementById('toast-msg');

  const icons = {
    success: '✓',
    warning: '!',
    info:    'i',
    error:   '✕'
  };

  icon.textContent = icons[type] || '✓';
  text.textContent = msg;
  toast.classList.remove('hidden');

  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// =====================================================
// LOADING
// =====================================================
function showLoading(text = 'Loading...') {
  document.getElementById('loading-text').textContent = text;
  document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}

// =====================================================
// FOCUS SEARCH
// =====================================================
function focusSearch() {
  document.getElementById('product-search').focus();
}

// =====================================================
// SET DEFAULT DATE
// =====================================================
function setDefaultDates() {
  const today = new Date().toISOString().slice(0, 10);
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(input => { input.value = today; });
}

// =====================================================
// KEYBOARD / GESTURE
// =====================================================
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);

  // Swipe right to go back (only if not on splash)
  if (dx > 80 && dy < 40 && touchStartX < 60) {
    const backMap = {
      'page-pnr':      'page-splash',
      'page-shop':     'page-pnr',
      'page-cart':     'page-shop',
      'page-checkout': 'page-cart',
      'page-orders':   'page-shop',
      'page-account':  'page-shop'
    };
    const back = backMap[appState.currentPage];
    if (back) navigateTo(back);
  }
}, { passive: true });

// =====================================================
// CUSTOM DATE SELECTOR HELPER FUNCTIONS
// =====================================================
function renderCustomDatePicker(containerId, inputId) {
  const container = document.getElementById(containerId);
  const hiddenInput = document.getElementById(inputId);
  if (!container || !hiddenInput) return;

  const dates = [];
  const today = new Date();

  // Create next 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }

  let html = '';
  const currentSelectedValue = hiddenInput.value || today.toISOString().slice(0, 10);
  
  dates.forEach((date, index) => {
    const dateStr = date.toISOString().slice(0, 10);
    const isSelected = dateStr === currentSelectedValue;
    const dayName = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : date.toLocaleDateString('en-IN', { weekday: 'short' });
    const dayNum = date.getDate();
    const monthName = date.toLocaleDateString('en-IN', { month: 'short' });

    html += `
      <div class="date-item ${isSelected ? 'selected' : ''}" data-date="${dateStr}" onclick="selectCustomDate('${containerId}', '${inputId}', '${dateStr}', this)">
        <span class="date-day">${dayName}</span>
        <span class="date-num">${dayNum}</span>
        <span class="date-day" style="font-size: 0.62rem; margin-top: 2px;">${monthName}</span>
      </div>
    `;
  });

  // Add an "Other" option that triggers native calendar
  html += `
    <div class="date-item other" onclick="triggerNativeDatePicker('${inputId}')">
      <span class="date-day">Other</span>
      <span class="date-num">📅</span>
      <span class="date-day" style="font-size: 0.62rem; margin-top: 2px;">Calendar</span>
    </div>
  `;

  container.innerHTML = html;
}

function selectCustomDate(containerId, inputId, dateStr, element) {
  const container = document.getElementById(containerId);
  const hiddenInput = document.getElementById(inputId);
  if (!container || !hiddenInput) return;

  container.querySelectorAll('.date-item').forEach(item => item.classList.remove('selected'));
  if (element) {
    element.classList.add('selected');
  }

  hiddenInput.value = dateStr;
  const event = new Event('change');
  hiddenInput.dispatchEvent(event);
}

function triggerNativeDatePicker(inputId) {
  const hiddenInput = document.getElementById(inputId);
  if (!hiddenInput) return;
  
  hiddenInput.style.display = 'block';
  hiddenInput.focus();
  hiddenInput.click();
  
  hiddenInput.onchange = function() {
    hiddenInput.style.display = 'none';
    const containerId = inputId === 'train-date-input' ? 'search-date-selector' : 'live-date-selector';
    renderCustomDatePicker(containerId, inputId);
  };
}

// =====================================================
// INIT
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  setDefaultDates();

  // Render custom date pickers
  renderCustomDatePicker('search-date-selector', 'train-date-input');
  renderCustomDatePicker('live-date-selector', 'live-date-input');

  // Start with Splash Screen
  document.getElementById('page-splash').classList.add('active');
  appState.currentPage = 'page-splash';
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav) bottomNav.style.display = 'none';

  // If user already logged in, update account page
  if (appState.user) initAccountPage();

  // Products data available on shop
  PRODUCTS; // ensures it's loaded

  // Keyboard close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProductModal();
  });

  // Add animation to FAB on hover
  const fab = document.getElementById('cart-fab');
  if (fab) {
    fab.addEventListener('mouseenter', () => {
      fab.style.transform = 'scale(1.06)';
    });
    fab.addEventListener('mouseleave', () => {
      fab.style.transform = 'scale(1)';
    });
  }
});
