/* =====================================================
   RAILQUICK — Complete Application JavaScript
   Blinkit Green Theme · PNR & Live Tracking · Mock Fallbacks
   ===================================================== */

'use strict';

// ===== API CONFIG =====
const origin = window.location.origin || '';
const API_BASE = (origin.startsWith('file://') || origin === 'null')
  ? 'http://localhost:3000'
  : origin;

// ===== APP STATE =====
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

// ===== MOCK DATA GENERATORS =====
function getMockPNRData(pnr) {
  const pnrStr = String(pnr);
  const oddPnr = parseInt(pnrStr.charAt(pnrStr.length - 1)) % 2 !== 0;
  
  const trainNo = oddPnr ? '12301' : '12424';
  const trainName = oddPnr ? 'Rajdhani Express' : 'Vande Bharat Express';
  const dateStr = new Date().toLocaleDateString('en-IN');
  const coach = oddPnr ? 'B2' : 'C4';
  const seat = oddPnr ? '45' : '18';
  const berth = oddPnr ? 'UB' : 'WS'; // Upper Berth vs Window Seat

  return {
    pnrNumber: pnrStr,
    trainNumber: trainNo,
    trainName: trainName,
    dateOfJourney: dateStr,
    source: 'New Delhi (NDLS)',
    destination: oddPnr ? 'Howrah Junction (HWH)' : 'Dibrugarh (DBRG)',
    reservationClass: oddPnr ? 'AC 3 Tier (3A)' : 'AC Chair Car (CC)',
    chartPrepared: 'Prepared',
    fare: oddPnr ? 1640 : 1250,
    passengerList: [
      {
        serialNumber: 'Passenger 1',
        bookingStatus: `CNF / ${coach} / ${seat} / ${berth}`,
        currentStatus: `CNF / ${coach} / ${seat} / ${berth}`,
        coach: coach,
        berth: seat,
        berthCode: berth
      }
    ]
  };
}

function getMockLiveStatus(trainNo) {
  const now = new Date();
  const updateTime = 'Just now';
  
  return {
    trainNo: trainNo || '12301',
    trainName: trainNo === '12301' ? 'Rajdhani Express' : 'Express Special',
    lastUpdate: updateTime,
    statusNote: 'Running 12 mins late',
    currentStationCode: 'UMB',
    timeline: [
      { stationName: 'New Delhi', stationCode: 'NDLS', type: 'stoppage', status: 'passed', arrival: { actual: '06:00', scheduled: '06:00' }, departure: { actual: '06:10', scheduled: '06:10' }, platform: '1' },
      { stationName: 'Panipat Junction', stationCode: 'PNP', type: 'stoppage', status: 'passed', arrival: { actual: '07:22', scheduled: '07:15' }, departure: { actual: '07:24', scheduled: '07:17' }, platform: '3' },
      { stationName: 'Ambala Cantt Junction', stationCode: 'UMB', type: 'stoppage', status: 'current', arrival: { actual: '08:45', scheduled: '08:33' }, departure: { actual: '08:50', scheduled: '08:38' }, platform: '2' },
      { stationName: 'Ludhiana Junction', stationCode: 'LDH', type: 'stoppage', status: 'upcoming', arrival: { scheduled: '10:15' }, departure: { scheduled: '10:25' }, platform: '1' },
      { stationName: 'Jalandhar Cantt', stationCode: 'JRC', type: 'stoppage', status: 'upcoming', arrival: { scheduled: '11:15' }, departure: { scheduled: '11:17' }, platform: '2' },
      { stationName: 'Jammu Tawi', stationCode: 'JAT', type: 'stoppage', status: 'upcoming', arrival: { scheduled: '13:45' }, departure: { scheduled: '13:55' }, platform: '3' }
    ]
  };
}

function getMockTrainSchedule(query) {
  return {
    trainInfo: {
      train_name: 'New Delhi Express',
      train_no: query || '12002',
      from_stn_name: 'NDLS',
      to_stn_name: 'KLK',
      travel_time: '4h 15m'
    },
    route: [
      { stationName: 'New Delhi', stationCode: 'NDLS', stnName: 'New Delhi', stnCode: 'NDLS', arrival: 'Source', departure: '07:40' },
      { stationName: 'Panipat Junction', stationCode: 'PNP', stnName: 'Panipat Jn', stnCode: 'PNP', arrival: '08:50', departure: '08:52' },
      { stationName: 'Ambala Cantt', stationCode: 'UMB', stnName: 'Ambala Cantt', stnCode: 'UMB', arrival: '10:05', departure: '10:07' },
      { stationName: 'Chandigarh', stationCode: 'CDG', stnName: 'Chandigarh', stnCode: 'CDG', arrival: '11:00', departure: '11:05' },
      { stationName: 'Kalka', stationCode: 'KLK', stnName: 'Kalka', stnCode: 'KLK', arrival: '11:55', departure: 'Destination' }
    ]
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem('railquick_state');
    if (saved) {
      const p = JSON.parse(saved);
      appState.user = p.user || null;
      appState.cart = Array.isArray(p.cart) ? p.cart : [];
      appState.orders = Array.isArray(p.orders) ? p.orders : [];
      appState.pnrData = p.pnrData || null;
    }
  } catch(e) {}
}

function saveState() {
  try {
    localStorage.setItem('railquick_state', JSON.stringify({
      user: appState.user,
      cart: appState.cart,
      orders: appState.orders,
      pnrData: appState.pnrData
    }));
  } catch(e) {}
}

// ===== PRODUCTS DATABASE =====
const PRODUCTS = [
  { id: 1, name: 'Bisleri Mineral Water 1L', price: 20, mrp: 25, category: 'beverages', img: 'product_water.png', rating: 4.7, reviews: 1240, description: 'Fresh and pure mineral water. Stay hydrated throughout your train journey. ISI certified, sealed bottle.', tags: ['Hydration', 'ISI Certified', '1 Litre'] },
  { id: 2, name: "Haldiram's Aloo Bhujia 150g", price: 30, mrp: 35, category: 'snacks', img: 'product_haldirams.png', rating: 4.6, reviews: 892, description: "Crispy, crunchy and spicy Aloo Bhujia from Haldiram's. The ultimate train snack — original Bikaneri recipe.", tags: ['Vegetarian', 'Crispy', 'Bikaneri Recipe'] },
  { id: 3, name: 'Ambrane 10000mAh Power Bank', price: 499, mrp: 799, category: 'electronics', img: 'product_powerbank.png', rating: 4.6, reviews: 543, description: 'Never run out of charge. Dual USB output, fast charge support. Compact and light for journeys.', tags: ['Fast Charge', 'Dual USB', '10000mAh'] },
  { id: 4, name: 'Travel Hygiene Kit', price: 35, mrp: 50, category: 'hygiene', img: 'product_toothbrush.png', rating: 4.5, reviews: 337, description: 'Complete travel kit with toothbrush, mini toothpaste, face towel & soap. Everything for a fresh journey.', tags: ['Complete Kit', 'Travel Size', 'Colgate+Dove'] },
  { id: 5, name: 'Dettol Hand Sanitizer 50ml', price: 45, mrp: 60, category: 'hygiene', img: 'product_sanitizer.png', rating: 4.8, reviews: 2145, description: 'Kill 99.9% of germs. No water required. Compact travel size fits in your pocket easily.', tags: ['Kills 99.9% Germs', 'Travel Size', 'Instant'] },
  { id: 6, name: 'Wagh Bakri Instant Chai Kit', price: 40, mrp: 55, category: 'beverages', img: 'product_tea.png', rating: 4.4, reviews: 451, description: 'Masala chai anywhere on your journey. 10 cups pack with sugar & spices. Just add hot water!', tags: ['Masala Chai', '10 Cups', 'Instant'] },
  { id: 7, name: 'Inflatable Travel Neck Pillow', price: 149, mrp: 249, category: 'comfort', img: 'product_neckpillow.png', rating: 4.3, reviews: 788, description: 'Sleep comfortably on long overnight journeys. Soft velvet cover, portable inflatable design.', tags: ['Velvet Cover', 'Inflatable', 'Ergonomic'] },
  { id: 8, name: 'boAt Wired Earphones', price: 199, mrp: 399, category: 'electronics', img: 'product_earphones.png', rating: 4.5, reviews: 1120, description: 'Premium audio quality with mic. Great for music, calls & videos during train journey. 3.5mm jack.', tags: ['With Mic', '3.5mm Jack', 'Premium Sound'] }
];

// ===== NAVIGATION =====
function navigateTo(pageId) {
  const current = document.getElementById(appState.currentPage);
  const target = document.getElementById(pageId);
  if (!target || pageId === appState.currentPage) return;

  current.classList.remove('active');
  current.classList.add('slide-out');
  setTimeout(() => { current.classList.remove('slide-out'); }, 400);

  target.classList.add('active');
  appState.currentPage = pageId;

  const hideNavPages = ['page-splash', 'page-pnr', 'page-cart', 'page-checkout'];
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav) {
    bottomNav.style.display = hideNavPages.includes(pageId) ? 'none' : 'flex';
  }

  const navMap = { 'page-shop': 'home', 'page-orders': 'orders', 'page-account': 'account' };
  const navName = navMap[pageId];
  if (navName) activateNav(navName);

  if (pageId === 'page-shop') initShopPage();
  if (pageId === 'page-cart') initCartPage();
  if (pageId === 'page-orders') initOrdersPage();
  if (pageId === 'page-account') initAccountPage();
  if (pageId === 'page-checkout') initCheckoutPage();
}

function activateNav(name) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`nav-${name}`);
  if (btn) btn.classList.add('active');
}

// ===== PNR & LIVE STATUS PAGE =====
function switchPNRTab(tab) {
  document.getElementById('panel-pnr').classList.toggle('hidden', tab !== 'pnr');
  document.getElementById('panel-live').classList.toggle('hidden', tab !== 'live');
  document.getElementById('tab-pnr').classList.toggle('active', tab === 'pnr');
  document.getElementById('tab-live').classList.toggle('active', tab === 'live');
  document.getElementById('pnr-results').classList.add('hidden');
  document.getElementById('pnr-results').innerHTML = '';
}

function validatePNR(input) { input.value = input.value.slice(0, 10); }

function validateApiResponse(data) {
  if (!data || !data.success || !data.data) throw new Error(data?.error || 'Failed to fetch data');
  const payload = data.data;
  if (payload.success === false || payload.error) throw new Error(payload.error || 'No data found');
  return payload;
}

// Check PNR Status with Mock fallback
async function checkPNRStatus() {
  const pnr = document.getElementById('pnr-input').value.trim();
  if (pnr.length !== 10) { showToast('Please enter a valid 10-digit PNR', 'warning'); return; }

  showLoading('Checking PNR Status...');
  try {
    const resp = await fetch(`${API_BASE}/api/pnr/${pnr}`);
    const data = await resp.json();
    hideLoading();

    const d = validateApiResponse(data);
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
    showToast('PNR details loaded!');
  } catch (err) {
    // API Failed -> Fallback to realistic Mock Data
    console.warn('API error, falling back to mock data:', err.message);
    const mock = getMockPNRData(pnr);
    appState.pnrData = mock;
    saveState();
    renderPNRResult(mock);
    showContinueBar(mock);
    hideLoading();
    showToast('Mock PNR loaded (API offline)', 'info');
  }
}

function renderPNRResult(d) {
  const paxHTML = (d.passengerList || []).map(p => `
    <div class="passenger-chip"><strong>${p.serialNumber}</strong>: ${p.currentStatus}</div>
  `).join('');
  const chartColor = (d.chartPrepared || '').toLowerCase().includes('prepared') ? 'green' : 'red';

  document.getElementById('pnr-results').innerHTML = `
    <div class="result-header">
      <div class="result-train-name">${d.trainName || 'Train'}</div>
      <div class="result-train-num">#${d.trainNumber || '—'}</div>
    </div>
    <div class="result-body">
      <div class="result-row"><span class="result-label">PNR Number</span><span class="result-value">${d.pnrNumber}</span></div>
      <div class="result-row"><span class="result-label">Journey Date</span><span class="result-value">${d.dateOfJourney || '—'}</span></div>
      <div class="result-row"><span class="result-label">Route</span><span class="result-value" style="font-size:0.75rem">${d.source} → ${d.destination}</span></div>
      <div class="result-row"><span class="result-label">Class</span><span class="result-value">${d.reservationClass || '—'}</span></div>
      <div class="result-row"><span class="result-label">Chart Status</span><span class="result-value ${chartColor}">${d.chartPrepared || '—'}</span></div>
      ${d.fare ? `<div class="result-row"><span class="result-label">Fare</span><span class="result-value">₹${d.fare}</span></div>` : ''}
      <div style="margin-top:10px; font-weight:600; font-size:0.8rem; color:var(--text-light)">PASSENGERS SEATS</div>
      ${paxHTML}
    </div>`;
  document.getElementById('pnr-results').classList.remove('hidden');
}

function showContinueBar(data) {
  const bar = document.getElementById('continue-bar');
  const info = document.getElementById('train-info-mini');
  const pax = data.passengerList && data.passengerList[0];
  const seat = pax ? `${pax.coach}, Seat ${pax.berth}` : data.reservationClass || '—';
  info.innerHTML = `<strong>${data.trainName || 'Train'}</strong><br/><span style="color:var(--green)">Delivery to: ${seat}</span>`;
  bar.classList.remove('hidden');
}

function proceedToShop() { navigateTo('page-shop'); }

// Get Live Train Status with Mock fallback
async function checkLiveStatus() {
  const trainNo = document.getElementById('live-train-input').value.trim();
  const dateInput = document.getElementById('live-date-input').value;
  if (!trainNo) { showToast('Enter a train number', 'warning'); return; }

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
    // API Failed -> Fallback to detailed Mock Timeline
    console.warn('API error, falling back to mock train status:', err.message);
    const mock = getMockLiveStatus(trainNo);
    renderLiveTrainResult(mock, trainNo);
    hideLoading();
    showToast('Mock status loaded (API offline)', 'info');
  }
}

// Render vertical premium timeline route visualization
function renderLiveTrainResult(d, trainNo) {
  let currentStation = '—', nextStation = '—';
  if (d.timeline && d.timeline.length > 0) {
    let current = d.timeline.find(t => t.status === 'current');
    if (!current && d.currentStationCode) current = d.timeline.find(t => t.stationCode === d.currentStationCode);
    if (!current) { const passed = d.timeline.filter(t => t.status === 'passed'); if (passed.length) current = passed[passed.length - 1]; }
    if (current) {
      currentStation = `${current.stationName || current.stationCode} (${current.stationCode})`;
      const idx = d.timeline.indexOf(current);
      if (idx < d.timeline.length - 1) { const up = d.timeline.slice(idx + 1).find(t => t.status === 'upcoming'); if (up) nextStation = `${up.stationName || up.stationCode} (${up.stationCode})`; }
    }
  }

  const statusNote = d.statusNote || 'Running';
  const isDelayed = statusNote.toLowerCase().includes('late') || statusNote.toLowerCase().includes('delay');
  
  let timelineHTML = '';
  if (d.timeline && d.timeline.length > 0) {
    timelineHTML = d.timeline.map(s => {
      const nodeClass = s.status === 'passed' ? 'passed' : (s.status === 'current' ? 'current' : 'upcoming');
      const isLateNode = isDelayed && nodeClass === 'current';
      
      const timeArr = s.arrival?.actual || s.arrival?.scheduled || '—';
      const timeSch = s.arrival?.scheduled || '';
      
      return `
        <div class="timeline-node ${nodeClass}">
          <div class="node-dot"></div>
          <div class="node-content">
            <div class="node-details">
              <span class="node-station">${s.stationName} (${s.stationCode})</span>
              <span class="node-platform">Platform ${s.platform || '—'}</span>
              ${nodeClass === 'current' ? `<span class="delay-tag ${isDelayed ? 'late' : 'ontime'}">${statusNote}</span>` : ''}
            </div>
            <div class="node-times">
              <div class="time-actual">${timeArr}</div>
              ${timeSch && timeSch !== timeArr ? `<div class="time-sched">${timeSch}</div>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  document.getElementById('pnr-results').innerHTML = `
    <div class="result-header" style="background:linear-gradient(135deg,#0C831F,#055913)">
      <div class="result-train-name">${d.trainName || 'Train ' + trainNo}</div>
      <div class="result-train-num">Updated: ${d.lastUpdate || 'Just now'}</div>
    </div>
    <div class="result-body" style="padding-top:20px;">
      <div class="result-row"><span class="result-label">Train Number</span><span class="result-value">#${d.trainNo || trainNo}</span></div>
      <div class="result-row"><span class="result-label">Status</span><span class="result-value" style="color:var(--green);font-weight:700;">${statusNote}</span></div>
      
      <div style="margin-top:20px; font-weight:800; font-size:0.75rem; color:var(--text-light); text-transform:uppercase; letter-spacing:0.5px;">ROUTE TIMELINE</div>
      <div class="train-timeline">
        ${timelineHTML}
      </div>
    </div>`;
  document.getElementById('pnr-results').classList.remove('hidden');
}

// Search Train Route
async function searchTrain() {
  const query = document.getElementById('train-search-input').value.trim();
  if (!query) { showToast('Enter train number or name', 'warning'); return; }
  showLoading('Searching train route...');
  try {
    const resp = await fetch(`${API_BASE}/api/train-info/${query}`);
    const data = await resp.json();
    hideLoading();
    const d = validateApiResponse(data);
    renderTrainSchedule(d);
    showToast('Train route loaded!');
  } catch (err) {
    // API Failed -> Fallback to mock schedule
    console.warn('API error, falling back to mock schedule:', err.message);
    const mock = getMockTrainSchedule(query);
    renderTrainSchedule(mock);
    hideLoading();
    showToast('Mock route loaded (API offline)', 'info');
  }
}

function renderTrainSchedule(d) {
  const info = d.trainInfo || {};
  const stations = d.route || [];
  const stationsHTML = stations.map(s => `
    <div class="result-row">
      <span class="result-label">${s.stnName || s.stationName} (${s.stnCode || s.stationCode || ''})</span>
      <span class="result-value" style="font-size:0.78rem">${s.arrival || 'Source'} / ${s.departure || 'Destination'}</span>
    </div>
  `).join('');

  document.getElementById('pnr-results').innerHTML = `
    <div class="result-header">
      <div class="result-train-name">${info.train_name || 'Train'} (${info.train_no || ''})</div>
      <div class="result-train-num">${info.from_stn_name || ''} → ${info.to_stn_name || ''} · Travel Time: ${info.travel_time || '—'}</div>
    </div>
    <div class="result-body">
      <div class="result-row" style="background:var(--green-light);border-radius:8px;padding:8px 12px;margin-bottom:8px;">
        <span class="result-label" style="font-size:0.7rem;font-weight:700;color:var(--green-dark);">STATION</span>
        <span class="result-label" style="font-size:0.7rem;font-weight:700;color:var(--green-dark);">ARR / DEP</span>
      </div>
      ${stationsHTML}
    </div>`;
  document.getElementById('pnr-results').classList.remove('hidden');
}

// ===== SHOP PAGE =====
function initShopPage() {
  renderProducts(PRODUCTS);
  updateShopTopbar();
  updateCartFAB();
}

// Dynamic header showing train name or default Delivery station
function updateShopTopbar() {
  const labelEl = document.getElementById('shop-delivering-label');
  const headerEl = document.getElementById('shop-delivery-header');
  const strip = document.getElementById('train-strip');

  if (appState.pnrData) {
    const d = appState.pnrData;
    const pax = d.passengerList && d.passengerList[0];
    const coach = pax ? pax.coach : '—';
    const seat = pax ? pax.berth : '—';
    const berth = pax ? pax.berthCode : '';

    labelEl.innerHTML = `Delivering to <strong>${d.trainName || 'Train'}</strong>`;
    headerEl.innerHTML = `<span class="city-orange">${d.trainNumber || ''}</span> · <span style="font-size:0.78rem;font-weight:600;color:white;">Coach ${coach}, Seat ${seat} ${berth ? `(${berth})` : ''}</span>`;
    
    // Train strip also visible
    document.getElementById('strip-train-name').textContent = `${d.trainName} #${d.trainNumber}`;
    document.getElementById('strip-seat').textContent = `Coach ${coach}, Seat ${seat}`;
    strip.classList.remove('hidden');
  } else {
    labelEl.textContent = 'Delivering in trains arriving in';
    headerEl.innerHTML = `<span class="city-orange">Delhi</span>&nbsp;▾`;
    strip.classList.add('hidden');
  }
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  if (!products.length) {
    grid.innerHTML = `<div style="grid-column:span 2;text-align:center;padding:40px 0;color:var(--text-light)"><div style="font-size:2rem;margin-bottom:8px">🔍</div><div style="font-weight:600">No products found</div></div>`;
    return;
  }
  grid.innerHTML = products.map(p => {
    const inCart = appState.cart.find(c => c.id === p.id);
    const qty = inCart ? inCart.qty : 0;
    const discount = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
    return `
      <div class="product-card" onclick="openProductModal(${p.id})">
        <div class="product-img-wrapper">
          <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.src='product_water.png'" />
        </div>
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-rating"><span class="stars">★ ${p.rating}</span><span class="rating-num">(${p.reviews})</span></div>
          <div class="product-footer">
            <div>
              <span class="product-price">₹${p.price}</span>
              ${p.mrp > p.price ? `<span class="product-mrp">₹${p.mrp}</span>` : ''}
            </div>
            ${qty > 0
              ? `<div class="product-qty-control"><button class="product-qty-btn" onclick="event.stopPropagation();changeProductQty(${p.id},-1)">−</button><span class="product-qty-val">${qty}</span><button class="product-qty-btn" onclick="event.stopPropagation();changeProductQty(${p.id},1)">+</button></div>`
              : `<button class="add-btn" onclick="event.stopPropagation();addToCart(${p.id})">+</button>`}
          </div>
        </div>
      </div>`;
  }).join('');
}

function getStars(r) { return '★'.repeat(Math.floor(r)) + (r % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.floor(r) - (r % 1 >= 0.5 ? 1 : 0)); }

function filterCategory(cat, el) {
  appState.currentFilter = cat;
  document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  renderProducts(cat === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === cat));
}

function filterProducts(q) {
  appState.searchQuery = q.toLowerCase();
  renderProducts(PRODUCTS.filter(p => p.name.toLowerCase().includes(appState.searchQuery) || p.category.toLowerCase().includes(appState.searchQuery)));
}

function scrollToProducts() { document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' }); }
function focusSearch() { document.getElementById('product-search').focus(); }
function showNotif() { showToast('Delivering orders to platforms 1-8 currently.', 'info'); }

// ===== COUPONS =====
function copyCoupon(code, btn) {
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = 'Copied!';
    showToast(`Code ${code} copied!`);
    setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
  }).catch(() => showToast('Failed to copy', 'error'));
}

function getCartTotals() {
  const subtotal = appState.cart.reduce((s, c) => s + c.price * c.qty, 0);
  let discount = 0;
  if (appState.appliedCoupon === 'RAILQUICK15') { discount = Math.min(Math.round(subtotal * 0.15), 50); }
  const gst = Math.round((subtotal - discount) * 0.05);
  return { subtotal, discount, gst, total: subtotal - discount + gst };
}

function applyPromoCode() {
  const input = document.getElementById('promo-input');
  const status = document.getElementById('promo-status');
  const code = (input?.value || '').trim().toUpperCase();
  if (!code) { showToast('Please enter a coupon code', 'warning'); return; }
  if (code === 'RAILQUICK15') {
    appState.appliedCoupon = code;
    status.textContent = 'Coupon applied: 15% OFF (Max ₹50)'; status.style.color = 'var(--green)'; status.style.display = 'block';
    showToast('Coupon applied!'); updateCartSummary();
  } else if (code === 'FREEDEL') {
    appState.appliedCoupon = code;
    status.textContent = 'Free Delivery activated!'; status.style.color = 'var(--green)'; status.style.display = 'block';
    showToast('Coupon applied!'); updateCartSummary();
  } else {
    showToast('Invalid coupon code', 'error');
    status.textContent = 'Invalid coupon code'; status.style.color = 'var(--danger)'; status.style.display = 'block';
  }
}

// ===== CART =====
function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  const existing = appState.cart.find(c => c.id === productId);
  if (existing) existing.qty++; else appState.cart.push({ ...product, qty: 1 });
  saveState(); updateCartFAB();
  showToast(`✓ ${product.name.split(' ').slice(0, 3).join(' ')} added!`);
  renderProducts(getFilteredProducts());
}

function changeProductQty(id, delta) {
  const item = appState.cart.find(c => c.id === id);
  if (!item) { if (delta > 0) addToCart(id); return; }
  item.qty += delta;
  if (item.qty <= 0) appState.cart = appState.cart.filter(c => c.id !== id);
  saveState(); updateCartFAB(); renderProducts(getFilteredProducts());
}

function getFilteredProducts() {
  let p = appState.currentFilter === 'all' ? PRODUCTS : PRODUCTS.filter(x => x.category === appState.currentFilter);
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
  } else { fab.classList.add('hidden'); }
}

function initCartPage() {
  const cartList = document.getElementById('cart-items-list');
  const emptyEl = document.getElementById('cart-empty');
  const summary = document.getElementById('cart-summary');
  if (appState.cart.length === 0) {
    cartList.innerHTML = ''; emptyEl.classList.remove('hidden'); summary.style.display = 'none';
  } else {
    emptyEl.classList.add('hidden'); summary.style.display = 'flex'; renderCartItems(); updateCartSummary();
  }
  if (appState.pnrData) {
    const d = appState.pnrData;
    const pax = d.passengerList && d.passengerList[0];
    const coach = pax ? pax.coach : '—';
    const seat = pax ? pax.berth : '—';
    document.getElementById('delivery-detail').textContent = `${d.trainName || 'Train'} · Coach ${coach}, Seat ${seat} · New Delhi (NDLS)`;
  }
}

function renderCartItems() {
  document.getElementById('cart-items-list').innerHTML = appState.cart.map(item => `
    <div class="cart-item">
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
          <svg class="icon-svg" viewBox="0 0 24 24" style="width:18px;height:18px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
        <div class="cart-item-total">₹${item.price * item.qty}</div>
      </div>
    </div>`).join('');
}

function updateCartItemQty(id, delta) {
  const item = appState.cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) appState.cart = appState.cart.filter(c => c.id !== id);
  saveState(); initCartPage();
}

function removeCartItem(id) {
  appState.cart = appState.cart.filter(c => c.id !== id);
  saveState(); initCartPage(); updateCartFAB(); showToast('Item removed', 'info');
}

function clearCart() {
  if (!appState.cart.length) return;
  appState.cart = []; saveState(); initCartPage(); updateCartFAB();
}

function updateCartSummary() {
  if (!appState.cart.length) { appState.appliedCoupon = null; }
  const { subtotal, discount, gst, total } = getCartTotals();
  document.getElementById('summary-subtotal').textContent = `₹${subtotal}`;
  document.getElementById('summary-gst').textContent = `₹${gst}`;

  let discountRow = document.getElementById('summary-discount-row');
  if (!discountRow) {
    const summaryBlock = document.getElementById('cart-summary');
    discountRow = document.createElement('div');
    discountRow.id = 'summary-discount-row';
    discountRow.className = 'summary-row discount-row';
    discountRow.style.fontWeight = '600';
    discountRow.innerHTML = `<span>Discount</span><span id="summary-discount">-₹0</span>`;
    summaryBlock.insertBefore(discountRow, summaryBlock.querySelector('.summary-divider'));
  }
  if (discount > 0) { discountRow.style.display = 'flex'; document.getElementById('summary-discount').textContent = `-₹${discount}`; }
  else { discountRow.style.display = 'none'; }
  document.getElementById('summary-total').textContent = `₹${total}`;
}

function proceedToCheckout() {
  if (!appState.cart.length) { showToast('Cart is empty!', 'warning'); return; }
  if (!appState.user) { showToast('Please sign in first!', 'warning'); navigateTo('page-account'); return; }
  navigateTo('page-checkout');
}

// ===== CHECKOUT =====
function initCheckoutPage() {
  setCheckoutStep(1);
  const pnrCard = document.getElementById('checkout-pnr-details');
  const manualCard = document.getElementById('checkout-manual-details');
  if (appState.pnrData) {
    pnrCard.classList.remove('hidden'); manualCard.classList.add('hidden');
    const d = appState.pnrData;
    const pax = d.passengerList && d.passengerList[0];
    const seat = pax ? `${pax.coach}, Seat ${pax.berth}` : d.reservationClass || '—';
    document.getElementById('checkout-train').textContent = `${d.trainName} (#${d.trainNumber})`;
    document.getElementById('checkout-seat').textContent = seat;
  } else { pnrCard.classList.add('hidden'); manualCard.classList.remove('hidden'); }
  if (appState.user) {
    document.getElementById('contact-name').value = appState.user.name || '';
    document.getElementById('contact-phone').value = appState.user.phone || '';
  }
  renderCheckoutMiniItems();
  const { total } = getCartTotals();
  document.getElementById('checkout-total-amt').textContent = `₹${total}`;
  document.getElementById('pay-total-amt').textContent = `₹${total}`;
}

function renderCheckoutMiniItems() {
  document.getElementById('checkout-items-mini').innerHTML = appState.cart.map(item => `
    <div class="checkout-mini-item">
      <img class="mini-item-img" src="${item.img}" alt="${item.name}" onerror="this.src='product_water.png'" />
      <span class="mini-item-name">${item.name} × ${item.qty}</span>
      <span class="mini-item-price">₹${item.price * item.qty}</span>
    </div>`).join('');
}

function goToPayment() {
  const name = document.getElementById('contact-name').value.trim();
  const phone = document.getElementById('contact-phone').value.trim();
  if (!name || !phone) { showToast('Please fill your name and phone', 'warning'); return; }
  if (!appState.pnrData) {
    const mt = document.getElementById('manual-train').value.trim();
    const mc = document.getElementById('manual-coach').value.trim();
    const ms = document.getElementById('manual-seat').value.trim();
    if (!mt || !mc || !ms) { showToast('Please enter Train, Coach, and Seat number', 'warning'); return; }
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
  document.querySelectorAll('.step-line').forEach((line, i) => { line.classList.toggle('active', i < step - 1); });
}

function selectPayment(el, type) {
  appState.selectedPayment = type;
  document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('upi-input-section').style.display = type === 'upi' ? 'block' : 'none';
}

function selectUPIApp(el) {
  document.querySelectorAll('.upi-app').forEach(a => a.classList.remove('selected'));
  el.classList.add('selected');
  showToast(`${el.querySelector('.upi-app-name').textContent} selected`, 'info');
}

function placeOrder() {
  showLoading('Processing payment securely...');
  setTimeout(() => {
    hideLoading();
    const orderId = 'RQ-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    let seat = 'Your Seat', train = 'Train';
    if (appState.pnrData) {
      const pax = appState.pnrData.passengerList?.[0];
      seat = pax ? `Coach ${pax.coach}, Seat ${pax.berth}` : appState.pnrData.reservationClass || '—';
      train = `${appState.pnrData.trainName} (#${appState.pnrData.trainNumber})`;
    } else {
      const mt = document.getElementById('manual-train')?.value?.trim();
      const mc = document.getElementById('manual-coach')?.value?.trim()?.toUpperCase();
      const ms = document.getElementById('manual-seat')?.value?.trim();
      if (mt) train = mt;
      if (mc && ms) seat = `Coach ${mc}, Seat ${ms}`;
    }
    const { subtotal, discount, gst, total } = getCartTotals();
    appState.orders.unshift({
      id: orderId,
      items: [...appState.cart],
      date: new Date().toLocaleDateString('en-IN'),
      status: 'preparing',
      subtotal,
      discount,
      gst,
      total,
      seat,
      train
    });
    appState.appliedCoupon = null; appState.cart = []; saveState(); updateCartFAB();
    document.getElementById('order-id-display').textContent = orderId;
    document.getElementById('success-seat').textContent = seat;
    setCheckoutStep(3);
    showToast('Order placed successfully! 🎉');
  }, 2500);
}

// ===== REDESIGNED ORDERS PAGE (BLINKIT STYLE) =====
function initOrdersPage() {
  const list = document.getElementById('orders-list');
  const empty = document.getElementById('orders-empty');
  if (!appState.orders.length) { list.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  
  list.innerHTML = appState.orders.map(order => {
    const itemsHTML = order.items.map(i => `
      <div class="order-item-row">
        <div class="order-item-left">
          <span class="order-item-qty-tag">${i.qty}x</span>
          <span class="order-item-name-text">${i.name}</span>
        </div>
        <span class="order-item-price-text">₹${i.price * i.qty}</span>
      </div>
    `).join('');

    let trackingStatus = 'Order Placed';
    if (order.status === 'preparing') { trackingStatus = 'Preparing essentials...'; }
    else if (order.status === 'in-transit') { trackingStatus = 'Out for delivery at platform!'; }
    else if (order.status === 'delivered') { trackingStatus = 'Delivered to seat!'; }

    // Simulating Ramesh the delivery partner
    const partnerName = "Ramesh Kumar";
    const partnerDesc = "Delivering at Platform 4";

    return `
      <div class="blinkit-order-card">
        <div class="order-shop-header">
          <div class="shop-title-info">
            <div class="shop-logo-avatar">RQ</div>
            <div>
              <div class="shop-name-text">RailQuick Express Store</div>
              <div class="order-meta-date">${order.date} · ID: ${order.id}</div>
            </div>
          </div>
          <span class="order-status ${order.status || 'preparing'}">${trackingStatus}</span>
        </div>

        <div class="order-tracking-mini">
          <span class="tracking-status-text">🚂 ${order.train}</span>
          <span class="tracking-eta-text">${order.seat}</span>
        </div>

        <div class="order-items-summary">
          ${itemsHTML}
        </div>

        <div class="order-delivery-partner-card">
          <div class="partner-avatar">👦</div>
          <div class="partner-info-text">
            <div class="partner-name">${partnerName}</div>
            <div class="partner-desc">${partnerDesc}</div>
          </div>
          <button class="partner-call-btn" onclick="showToast('Calling Ramesh (+91 98765 43210)...', 'info')">Call</button>
        </div>

        <div class="order-footer">
          <div>
            <div class="order-total-label">Total Amount Paid</div>
            <div class="order-total-val">₹${order.total}</div>
          </div>
          <button class="btn-green" style="padding:8px 16px; font-size:0.8rem; box-shadow:none; background:var(--green);" onclick="showToast('Order details verified and processed.', 'success')">Details</button>
        </div>
      </div>`;
  }).join('');
}

// ===== ACCOUNT =====
function initAccountPage() {
  const logged = document.getElementById('account-logged-section');
  const login = document.getElementById('account-login-section');
  if (appState.user) {
    login.classList.add('hidden'); logged.classList.remove('hidden');
    document.getElementById('profile-name').textContent = appState.user.name || 'User';
    document.getElementById('profile-email').textContent = appState.user.email || '';
    document.getElementById('profile-avatar').textContent = (appState.user.name || 'U')[0].toUpperCase();
  } else { login.classList.remove('hidden'); logged.classList.add('hidden'); }
}

function googleSignIn() {
  showLoading('Signing in with Google...');
  setTimeout(() => {
    hideLoading();
    appState.user = { name: 'Kartik Guleria', email: 'kartik@gmail.com', phone: '+91 9876543210', avatar: 'K', provider: 'google', loginAt: new Date().toISOString() };
    saveState(); initAccountPage();
    showToast('Signed in successfully! 🎉');
  }, 1500);
}

function showPhoneLogin() { showToast('Phone login — coming soon!', 'info'); }

function signOut() {
  appState.user = null; saveState(); initAccountPage();
  showToast('Signed out', 'info');
}

// ===== PRODUCT MODAL =====
function openProductModal(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;
  appState.modalProduct = p; appState.modalQty = 1;
  document.getElementById('modal-img').src = p.img;
  document.getElementById('modal-img').onerror = () => { document.getElementById('modal-img').src = 'product_water.png'; };
  document.getElementById('modal-category').textContent = p.category.charAt(0).toUpperCase() + p.category.slice(1);
  document.getElementById('modal-name').textContent = p.name;
  document.getElementById('modal-stars').textContent = getStars(p.rating);
  document.getElementById('modal-reviews').textContent = `(${p.reviews} reviews)`;
  document.getElementById('modal-price').innerHTML = p.mrp > p.price
    ? `₹${p.price} <span style="text-decoration:line-through;color:#9CA3AF;font-size:1rem;">₹${p.mrp}</span> <span style="color:var(--green);font-size:0.85rem;font-weight:600;">${Math.round((1 - p.price / p.mrp) * 100)}% off</span>`
    : `₹${p.price}`;
  document.getElementById('modal-desc').textContent = p.description;
  document.getElementById('modal-tags').innerHTML = p.tags.map(t => `<span class="modal-tag">${t}</span>`).join('');
  document.getElementById('modal-qty').textContent = 1;
  document.getElementById('modal-total').textContent = `₹${p.price}`;
  document.getElementById('product-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  document.getElementById('product-modal').classList.add('hidden');
  document.body.style.overflow = '';
  appState.modalProduct = null;
}

function closeModal(event) { if (event.target === document.getElementById('product-modal')) closeProductModal(); }

function changeModalQty(delta) {
  appState.modalQty = Math.max(1, appState.modalQty + delta);
  document.getElementById('modal-qty').textContent = appState.modalQty;
  if (appState.modalProduct) document.getElementById('modal-total').textContent = `₹${appState.modalProduct.price * appState.modalQty}`;
}

function addToCartFromModal() {
  if (!appState.modalProduct) return;
  const id = appState.modalProduct.id, qty = appState.modalQty;
  const existing = appState.cart.find(c => c.id === id);
  if (existing) existing.qty += qty; else appState.cart.push({ ...appState.modalProduct, qty });
  saveState(); updateCartFAB(); closeProductModal();
  showToast(`✓ ${appState.modalProduct.name.split(' ').slice(0, 3).join(' ')} × ${qty} added!`);
  if (appState.currentPage === 'page-shop') renderProducts(getFilteredProducts());
}

// ===== TOAST =====
let toastTimeout;
function showToast(msg, type = 'success') {
  clearTimeout(toastTimeout);
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toast-icon');
  const text = document.getElementById('toast-msg');
  const icons = { success: '✓', warning: '!', info: 'i', error: '✕' };
  icon.textContent = icons[type] || '✓';
  icon.style.background = type === 'warning' ? '#F59E0B' : type === 'error' ? '#EF4444' : type === 'info' ? '#3B82F6' : 'var(--green)';
  text.textContent = msg;
  toast.classList.remove('hidden');
  toastTimeout = setTimeout(() => { toast.classList.add('hidden'); }, 3000);
}

// ===== LOADING =====
function showLoading(text = 'Loading...') {
  document.getElementById('loading-text').textContent = text;
  document.getElementById('loading-overlay').classList.remove('hidden');
}
function hideLoading() { document.getElementById('loading-overlay').classList.add('hidden'); }

// ===== DATE PICKER =====
function setDefaultDates() { document.querySelectorAll('input[type="date"]').forEach(input => { input.value = new Date().toISOString().slice(0, 10); }); }

// Render custom date picker with past dates (shows 3 past days, today, and 3 future days)
function renderCustomDatePicker(containerId, inputId) {
  const container = document.getElementById(containerId);
  const hiddenInput = document.getElementById(inputId);
  if (!container || !hiddenInput) return;
  const today = new Date();
  
  // Custom: Generate range containing 3 past days + today + 3 future days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 3 + i); // from 3 days ago to 3 days ahead
    return d;
  });
  
  const currentVal = hiddenInput.value || today.toISOString().slice(0, 10);
  container.innerHTML = dates.map((date) => {
    const dateStr = date.toISOString().slice(0, 10);
    const timeDiff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let dayName = date.toLocaleDateString('en-IN', { weekday: 'short' });
    if (timeDiff === 0 && date.getDate() === today.getDate()) dayName = 'Today';
    else if (timeDiff === 1 && date.getDate() === today.getDate() + 1) dayName = 'Tom';
    else if (timeDiff === -1 && date.getDate() === today.getDate() - 1) dayName = 'Yest';
    
    return `<div class="date-item ${dateStr === currentVal ? 'selected' : ''}" onclick="selectCustomDate('${containerId}','${inputId}','${dateStr}',this)">
      <span class="date-day">${dayName}</span><span class="date-num">${date.getDate()}</span><span class="date-day" style="font-size:0.62rem;margin-top:2px;">${date.toLocaleDateString('en-IN', { month: 'short' })}</span>
    </div>`;
  }).join('') + `<div class="date-item" onclick="triggerNativeDatePicker('${inputId}')"><span class="date-day">Other</span><span class="date-num">📅</span><span class="date-day" style="font-size:0.62rem;margin-top:2px;">Calendar</span></div>`;
}

function selectCustomDate(cId, iId, dateStr, el) {
  const c = document.getElementById(cId); const h = document.getElementById(iId);
  if (!c || !h) return;
  c.querySelectorAll('.date-item').forEach(i => i.classList.remove('selected'));
  if (el) el.classList.add('selected');
  h.value = dateStr;
}

function triggerNativeDatePicker(inputId) {
  const h = document.getElementById(inputId); if (!h) return;
  h.style.display = 'block'; h.focus(); h.click();
  h.onchange = () => { h.style.display = 'none'; const cId = inputId === 'train-date-input' ? 'search-date-selector' : 'live-date-selector'; renderCustomDatePicker(cId, inputId); };
}

// ===== GESTURES =====
let touchStartX = 0, touchStartY = 0;
document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }, { passive: true });
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
  if (dx > 80 && dy < 40 && touchStartX < 60) {
    const backMap = { 'page-pnr': 'page-splash', 'page-shop': 'page-pnr', 'page-cart': 'page-shop', 'page-checkout': 'page-cart', 'page-orders': 'page-shop', 'page-account': 'page-shop' };
    const back = backMap[appState.currentPage];
    if (back) navigateTo(back);
  }
}, { passive: true });

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  setDefaultDates();
  renderCustomDatePicker('search-date-selector', 'train-date-input');
  renderCustomDatePicker('live-date-selector', 'live-date-input');
  document.getElementById('page-splash').classList.add('active');
  appState.currentPage = 'page-splash';
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav) bottomNav.style.display = 'none';
  if (appState.user) initAccountPage();
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeProductModal(); });
  const fab = document.getElementById('cart-fab');
  if (fab) {
    fab.addEventListener('mouseenter', () => { fab.style.transform = 'translateX(-50%) scale(1.06)'; });
    fab.addEventListener('mouseleave', () => { fab.style.transform = 'translateX(-50%) scale(1)'; });
  }
});
