'use strict';

/* ════════════════════════════════════════════════════════════════════════════
   CURRENCY DEFINITIONS
════════════════════════════════════════════════════════════════════════════ */
const CURRENCIES = {
  USD:{name:'US Dollar',          country:'United States',           symbol:'$'    },
  EUR:{name:'Euro',               country:'Eurozone',                symbol:'€'    },
  GBP:{name:'British Pound',      country:'United Kingdom',          symbol:'£'    },
  JPY:{name:'Japanese Yen',       country:'Japan',                   symbol:'¥'    },
  CNY:{name:'Chinese Yuan',       country:'China',                   symbol:'¥'    },
  AUD:{name:'Australian Dollar',  country:'Australia',               symbol:'A$'   },
  CAD:{name:'Canadian Dollar',    country:'Canada',                  symbol:'C$'   },
  CHF:{name:'Swiss Franc',        country:'Switzerland',             symbol:'Fr'   },
  HKD:{name:'Hong Kong Dollar',   country:'Hong Kong',               symbol:'HK$'  },
  SGD:{name:'Singapore Dollar',   country:'Singapore',               symbol:'S$'   },
  KRW:{name:'South Korean Won',   country:'South Korea',             symbol:'₩'    },
  INR:{name:'Indian Rupee',       country:'India',                   symbol:'₹'    },
  MYR:{name:'Malaysian Ringgit',  country:'Malaysia',                symbol:'RM'   },
  THB:{name:'Thai Baht',          country:'Thailand',                symbol:'฿'    },
  IDR:{name:'Indonesian Rupiah',  country:'Indonesia',               symbol:'Rp'   },
  PHP:{name:'Philippine Peso',    country:'Philippines',             symbol:'₱'    },
  VND:{name:'Vietnamese Dong',    country:'Vietnam',                 symbol:'₫'    },
  KHR:{name:'Cambodian Riel',     country:'Cambodia',                symbol:'៛'    },
  TWD:{name:'New Taiwan Dollar',  country:'Taiwan',                  symbol:'NT$'  },
  MMK:{name:'Myanmar Kyat',       country:'Myanmar',                 symbol:'K'    },
  BDT:{name:'Bangladeshi Taka',   country:'Bangladesh',              symbol:'৳'    },
  PKR:{name:'Pakistani Rupee',    country:'Pakistan',                symbol:'₨'    },
  LKR:{name:'Sri Lankan Rupee',   country:'Sri Lanka',               symbol:'Rs'   },
  NPR:{name:'Nepalese Rupee',     country:'Nepal',                   symbol:'Rs'   },
  MXN:{name:'Mexican Peso',       country:'Mexico',                  symbol:'$'    },
  BRL:{name:'Brazilian Real',     country:'Brazil',                  symbol:'R$'   },
  ARS:{name:'Argentine Peso',     country:'Argentina',               symbol:'$'    },
  CLP:{name:'Chilean Peso',       country:'Chile',                   symbol:'$'    },
  COP:{name:'Colombian Peso',     country:'Colombia',                symbol:'$'    },
  PEN:{name:'Peruvian Sol',       country:'Peru',                    symbol:'S/'   },
  RUB:{name:'Russian Ruble',      country:'Russia',                  symbol:'₽'    },
  TRY:{name:'Turkish Lira',       country:'Turkey',                  symbol:'₺'    },
  UAH:{name:'Ukrainian Hryvnia',  country:'Ukraine',                 symbol:'₴'    },
  PLN:{name:'Polish Zloty',       country:'Poland',                  symbol:'zł'   },
  SEK:{name:'Swedish Krona',      country:'Sweden',                  symbol:'kr'   },
  NOK:{name:'Norwegian Krone',    country:'Norway',                  symbol:'kr'   },
  DKK:{name:'Danish Krone',       country:'Denmark',                 symbol:'kr'   },
  CZK:{name:'Czech Koruna',       country:'Czech Republic',          symbol:'Kč'   },
  HUF:{name:'Hungarian Forint',   country:'Hungary',                 symbol:'Ft'   },
  RON:{name:'Romanian Leu',       country:'Romania',                 symbol:'lei'  },
  ZAR:{name:'South African Rand', country:'South Africa',            symbol:'R'    },
  NGN:{name:'Nigerian Naira',     country:'Nigeria',                 symbol:'₦'    },
  EGP:{name:'Egyptian Pound',     country:'Egypt',                   symbol:'E£'   },
  KES:{name:'Kenyan Shilling',    country:'Kenya',                   symbol:'KSh'  },
  GHS:{name:'Ghanaian Cedi',      country:'Ghana',                   symbol:'₵'    },
  AED:{name:'UAE Dirham',         country:'United Arab Emirates',    symbol:'د.إ'  },
  SAR:{name:'Saudi Riyal',        country:'Saudi Arabia',            symbol:'﷼'    },
  QAR:{name:'Qatari Riyal',       country:'Qatar',                   symbol:'QR'   },
  KWD:{name:'Kuwaiti Dinar',      country:'Kuwait',                  symbol:'KD'   },
  BHD:{name:'Bahraini Dinar',     country:'Bahrain',                 symbol:'BD'   },
  OMR:{name:'Omani Rial',         country:'Oman',                    symbol:'ر.ع'  },
  ILS:{name:'Israeli Shekel',     country:'Israel',                  symbol:'₪'    },
  NZD:{name:'New Zealand Dollar', country:'New Zealand',             symbol:'NZ$'  },
};

/* ════════════════════════════════════════════════════════════════════════════
   FALLBACK RATES  (approx. May 2025 — used when API is unreachable)
   All relative to USD: value = how many units of this currency per 1 USD
════════════════════════════════════════════════════════════════════════════ */
const FALLBACK = {
  USD:1,    EUR:0.924, GBP:0.786, JPY:155.2, CNY:7.27,  AUD:1.556, CAD:1.382,
  CHF:0.901,HKD:7.79,  SGD:1.339, KRW:1376,  INR:84.3,  MYR:4.44,  THB:33.6,
  IDR:16350,PHP:56.4,  VND:25450, KHR:4082,  TWD:32.8,  MMK:2098,  BDT:110,
  PKR:278,  LKR:306,   NPR:134,   MXN:19.6,  BRL:5.72,  ARS:1125,  CLP:967,
  COP:4200, PEN:3.72,  RUB:80.5,  TRY:38.2,  UAH:41.5,  PLN:3.98,  SEK:10.5,
  NOK:10.8, DKK:6.90,  CZK:23.8,  HUF:371,   RON:4.74,  ZAR:18.4,  NGN:1620,
  EGP:50.3, KES:129,   GHS:14.2,  AED:3.672, SAR:3.753, QAR:3.641, KWD:0.308,
  BHD:0.377,OMR:0.385, ILS:3.68,  NZD:1.695,
};

/* ════════════════════════════════════════════════════════════════════════════
   CATEGORIES
════════════════════════════════════════════════════════════════════════════ */
const CATS = {
  food:          { label:'Food & Dining',    icon:'🍔', color:'#22c55e' },
  transport:     { label:'Transport',        icon:'🚗', color:'#3b82f6' },
  shopping:      { label:'Shopping',         icon:'🛍',  color:'#a855f7' },
  entertainment: { label:'Entertainment',    icon:'🎮', color:'#ec4899' },
  health:        { label:'Health & Medical', icon:'💊', color:'#ef4444' },
  housing:       { label:'Housing & Rent',   icon:'🏠', color:'#f97316' },
  education:     { label:'Education',        icon:'📚', color:'#6366f1' },
  travel:        { label:'Travel',           icon:'✈️', color:'#06b6d4' },
  utilities:     { label:'Utilities',        icon:'💡', color:'#eab308' },
  other:         { label:'Other',            icon:'💸', color:'#94a3b8' },
};

/* ════════════════════════════════════════════════════════════════════════════
   STORAGE KEYS
════════════════════════════════════════════════════════════════════════════ */
const K = {
  SETTINGS: 'fp-settings',
  TXS:      'fp-txs',
  RATES:    'fp-rates-v2',
  THEME:    'fp-theme',
};

/* ════════════════════════════════════════════════════════════════════════════
   STATE
════════════════════════════════════════════════════════════════════════════ */
let rates    = { ...FALLBACK };
let settings = { base: 'USD', display: 'USD', budget: 0 };
let txs      = [];
let selMonth = null;  // null = current month

/* ════════════════════════════════════════════════════════════════════════════
   STORAGE
════════════════════════════════════════════════════════════════════════════ */
function loadAll() {
  try {
    const s = JSON.parse(localStorage.getItem(K.SETTINGS));
    if (s) settings = { ...settings, ...s };
    const t = JSON.parse(localStorage.getItem(K.TXS));
    if (Array.isArray(t)) txs = t;
    const r = JSON.parse(localStorage.getItem(K.RATES));
    if (r && r.data) rates = { ...FALLBACK, ...r.data };
  } catch (_) {}
}
function saveSettings() {
  try { localStorage.setItem(K.SETTINGS, JSON.stringify(settings)); } catch (_) {}
}
function saveTxs() {
  try { localStorage.setItem(K.TXS, JSON.stringify(txs)); } catch (_) {}
}

/* ════════════════════════════════════════════════════════════════════════════
   CURRENCY — FETCH LIVE RATES
   Source: cdn.jsdelivr.net/npm/@fawazahmed0/currency-api — free, no key, daily updates
════════════════════════════════════════════════════════════════════════════ */
async function fetchRates() {
  const bar = document.getElementById('rateBar');
  try {
    const cached = JSON.parse(localStorage.getItem(K.RATES) || 'null');
    if (cached && cached.ts && Date.now() - cached.ts < 3_600_000) {
      rates = { ...FALLBACK, ...cached.data };
      bar.textContent = `Rates: ${new Date(cached.ts).toLocaleString()} (cached — refreshes hourly)`;
      bar.className   = 'rate-bar rate-ok';
      return;
    }

    const res  = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
    if (!res.ok) throw new Error('fetch failed');
    const json = await res.json();
    const raw  = json.usd;

    const fresh = { USD: 1 };
    for (const code of Object.keys(CURRENCIES)) {
      const lc = code.toLowerCase();
      if (raw[lc] != null) fresh[code] = raw[lc];
      else                 fresh[code] = FALLBACK[code] || 1;
    }

    rates = fresh;
    const ts = Date.now();
    localStorage.setItem(K.RATES, JSON.stringify({ ts, data: rates }));
    bar.textContent = `Live rates as of ${new Date(ts).toLocaleString()} — cdn.jsdelivr.net/@fawazahmed0/currency-api`;
    bar.className   = 'rate-bar rate-ok';
    renderAll();
  } catch (_) {
    rates = { ...FALLBACK };
    bar.textContent = 'Offline — using approximate fallback rates (May 2025)';
    bar.className   = 'rate-bar rate-fallback';
  }
}

/* ── Convert amount from one currency to another ── */
function convert(amount, from, to) {
  if (from === to) return amount;
  return amount * (rates[to] || 1) / (rates[from] || 1);
}

/* ── Format amount in given (or display) currency ── */
const NO_DECIMALS = new Set(['JPY','KRW','IDR','VND','KHR','MMK','HUF','CLP','COP','RUB','ARS','PKR','NGN','BDT']);
function fmt(amount, code) {
  const c   = code || settings.display;
  const sym = CURRENCIES[c]?.symbol || c;
  const opts = NO_DECIMALS.has(c)
    ? { minimumFractionDigits:0, maximumFractionDigits:0 }
    : { minimumFractionDigits:2, maximumFractionDigits:2 };
  return sym + ' ' + Math.abs(amount).toLocaleString(undefined, opts);
}

/* ════════════════════════════════════════════════════════════════════════════
   TRANSACTIONS
════════════════════════════════════════════════════════════════════════════ */
function addTx(data) {
  txs.unshift({
    id:           String(Date.now()),
    amount:       parseFloat(data.amount),
    baseCurrency: settings.base,
    category:     data.category,
    description:  data.description || CATS[data.category]?.label || data.category,
    date:         data.date,
  });
  saveTxs();
}

function deleteTx(id) {
  txs = txs.filter(t => t.id !== id);
  saveTxs();
}

/* ── Month key helpers ── */
function monthKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function currentMonthKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}
function allMonthKeys() {
  const keys = new Set(txs.map(t => monthKey(t.date)));
  keys.add(currentMonthKey());
  return [...keys].sort().reverse();
}
function filteredTxs() {
  const key = selMonth || currentMonthKey();
  return txs.filter(t => monthKey(t.date) === key);
}

/* ════════════════════════════════════════════════════════════════════════════
   RENDER
════════════════════════════════════════════════════════════════════════════ */
function renderAll() {
  renderStats();
  renderCategories();
  renderTxList();
}

function renderStats() {
  const list   = filteredTxs();
  const spent  = list.reduce((s, t) => s + convert(t.amount, t.baseCurrency, settings.display), 0);
  const budget = convert(settings.budget, settings.base, settings.display);
  const remain = budget - spent;
  const pct    = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  document.getElementById('statBudget').textContent    = settings.budget > 0 ? fmt(budget) : 'Not set';
  document.getElementById('statSpent').textContent     = fmt(spent);
  document.getElementById('statRemaining').textContent = settings.budget > 0 ? fmt(Math.abs(remain)) : '—';

  const noteEl  = document.getElementById('statNote');
  const remCard = document.querySelector('.stat-card--remaining');
  if (settings.budget > 0 && remain < 0) {
    noteEl.textContent = fmt(Math.abs(remain)) + ' over budget';
    remCard.classList.add('over-budget');
  } else {
    noteEl.textContent = '';
    remCard.classList.remove('over-budget');
  }

  const fill = document.getElementById('progressFill');
  fill.style.width = pct + '%';
  fill.className = 'progress-fill' + (pct >= 100 ? ' over' : pct >= 80 ? ' warn' : '');

  const key = selMonth || currentMonthKey();
  const [y, m] = key.split('-');
  const label  = new Date(+y, +m - 1, 1).toLocaleDateString(undefined, { month:'long', year:'numeric' });

  document.getElementById('progressPct').textContent   = settings.budget > 0
    ? `${Math.round((spent / budget) * 100)}% used`
    : 'No budget set';
  document.getElementById('progressMonth').textContent = label;
  document.getElementById('budgetCurrLabel').textContent = settings.base;
  document.getElementById('fieldCurrLabel').textContent  = `(${settings.base})`;
}

function renderCategories() {
  const list   = filteredTxs();
  const totals = {};
  let grand    = 0;
  list.forEach(t => {
    const v         = convert(t.amount, t.baseCurrency, settings.display);
    totals[t.category] = (totals[t.category] || 0) + v;
    grand += v;
  });

  const key = selMonth || currentMonthKey();
  const [y, m] = key.split('-');
  document.getElementById('catMonth').textContent =
    new Date(+y, +m - 1, 1).toLocaleDateString(undefined, { month:'short', year:'2-digit' });

  const el = document.getElementById('catList');
  if (Object.keys(totals).length === 0) {
    el.innerHTML = '<div class="empty-state"><span class="empty-icon">📊</span><p>No spending recorded this month.</p></div>';
    return;
  }

  el.innerHTML = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => {
      const c   = CATS[cat] || CATS.other;
      const pct = grand > 0 ? (amt / grand) * 100 : 0;
      return `<div class="cat-item">
        <div class="cat-dot" style="background:${c.color}"></div>
        <span class="cat-label">${c.icon} ${c.label}</span>
        <div class="cat-bar-wrap"><div class="cat-bar" style="width:${pct.toFixed(1)}%;background:${c.color}"></div></div>
        <span class="cat-amount">${fmt(amt)}</span>
      </div>`;
    }).join('');
}

function renderTxList() {
  const list = filteredTxs();
  const el   = document.getElementById('txList');
  if (list.length === 0) {
    el.innerHTML = '<div class="empty-state"><span class="empty-icon">🧾</span><p>No transactions this month yet.</p></div>';
    return;
  }
  el.innerHTML = list.map(t => {
    const c   = CATS[t.category] || CATS.other;
    const amt = convert(t.amount, t.baseCurrency, settings.display);
    const d   = new Date(t.date + 'T00:00:00').toLocaleDateString(undefined, { day:'numeric', month:'short' });
    return `<div class="tx-item">
      <div class="tx-dot" style="background:${c.color}"></div>
      <div class="tx-info">
        <div class="tx-desc">${esc(t.description)}</div>
        <div class="tx-meta">
          <span class="tx-cat">${c.icon} ${c.label}</span>
          <span class="tx-date">· ${d}</span>
        </div>
      </div>
      <span class="tx-amount">−${fmt(amt)}</span>
      <button class="tx-del" data-id="${t.id}" aria-label="Delete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </div>`;
  }).join('');
}

function renderMonthFilter() {
  const sel  = document.getElementById('monthSel');
  const cur  = currentMonthKey();
  sel.innerHTML = allMonthKeys().map(k => {
    const [y, m] = k.split('-');
    const label  = new Date(+y, +m - 1, 1).toLocaleDateString(undefined, { month:'long', year:'numeric' });
    const sel    = (!selMonth && k === cur) || selMonth === k ? 'selected' : '';
    return `<option value="${k}" ${sel}>${label}</option>`;
  }).join('');
}

function initCurrencyDropdowns() {
  _makeCurrencyDd({
    ddId:'baseDd', triggerId:'baseTrigger', labelId:'baseTriggerLabel',
    menuId:'baseMenu', searchId:'baseSearch', bodyId:'baseBody',
    getValue:() => settings.base,
    onSelect(code){ settings.base = code; saveSettings(); renderAll(); }
  });
  _makeCurrencyDd({
    ddId:'dispDd', triggerId:'dispTrigger', labelId:'dispTriggerLabel',
    menuId:'dispMenu', searchId:'dispSearch', bodyId:'dispBody',
    getValue:() => settings.display,
    onSelect(code){ settings.display = code; saveSettings(); renderAll(); }
  });
}

function _makeCurrencyDd({ ddId, triggerId, labelId, menuId, searchId, bodyId, getValue, onSelect }) {
  const dd      = document.getElementById(ddId);
  const trigger = document.getElementById(triggerId);
  const label   = document.getElementById(labelId);
  const menu    = document.getElementById(menuId);
  const search  = document.getElementById(searchId);
  const body    = document.getElementById(bodyId);
  let isOpen    = false;

  label.textContent = getValue();

  function buildItems(filter) {
    const lc = (filter || '').toLowerCase();
    body.innerHTML = '';
    Object.entries(CURRENCIES).forEach(([code, c]) => {
      if (lc && !code.toLowerCase().includes(lc) && !c.name.toLowerCase().includes(lc) && !c.country.toLowerCase().includes(lc)) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fd-item--sm' + (code === getValue() ? ' is-selected' : '');
      btn.textContent = `${code} — ${c.country}`;
      btn.dataset.code = code;
      btn.addEventListener('click', () => {
        onSelect(code);
        label.textContent = code;
        body.querySelectorAll('.fd-item--sm').forEach(b => b.classList.toggle('is-selected', b.dataset.code === code));
        close();
      });
      body.appendChild(btn);
    });
    const sel = body.querySelector('.is-selected');
    if (sel) setTimeout(() => sel.scrollIntoView({ block:'nearest' }), 10);
  }

  function open() {
    isOpen = true;
    dd.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    buildItems();
    const h = Math.min(menu.scrollHeight, 280);
    menu.style.height = h + 'px';
    setTimeout(() => search.focus(), 50);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    if (menu.style.height !== '0px') { menu.style.height = menu.offsetHeight + 'px'; menu.offsetHeight; }
    menu.style.height = '0';
    dd.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    search.value = '';
  }

  trigger.addEventListener('click', () => isOpen ? close() : open());
  search.addEventListener('input', () => buildItems(search.value));
  search.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.addEventListener('click', e => { if (!dd.contains(e.target)) close(); });
}

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════════════════════ */
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem(K.THEME, t); } catch (_) {}
}

/* ════════════════════════════════════════════════════════════════════════════
   FLUID CATEGORY DROPDOWN
════════════════════════════════════════════════════════════════════════════ */
const ITEM_H = 40;
let _catOpen = false;
let _catSelected = null;

function initCatDropdown() {
  const body    = document.getElementById('catBody');
  const hi      = document.getElementById('catHighlight');
  const trigger = document.getElementById('catTrigger');
  const menu    = document.getElementById('catMenu');
  const catKeys = Object.keys(CATS);

  catKeys.forEach((key, i) => {
    const cat = CATS[key];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fd-item';
    btn.dataset.cat = key;
    btn.innerHTML = `<span class="fd-item-icon">${cat.icon}</span>${cat.label}`;

    btn.addEventListener('mouseenter', () => {
      hi.style.transform = `translateY(${i * ITEM_H}px)`;
      hi.classList.add('visible');
    });
    btn.addEventListener('mouseleave', () => {
      if (_catSelected !== null) {
        hi.style.transform = `translateY(${catKeys.indexOf(_catSelected) * ITEM_H}px)`;
      } else {
        hi.classList.remove('visible');
      }
    });
    btn.addEventListener('click', () => _selectCat(key, i));
    body.appendChild(btn);
  });

  trigger.addEventListener('click', () => _catOpen ? _closeCatDropdown() : _openCatDropdown());

  document.addEventListener('click', e => {
    if (!document.getElementById('catDropdown').contains(e.target)) _closeCatDropdown();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') _closeCatDropdown();
  });
}

function _openCatDropdown() {
  const dd   = document.getElementById('catDropdown');
  const menu = document.getElementById('catMenu');
  _catOpen = true;
  dd.querySelectorAll('.fd-item').forEach((el, i) => { el.style.transitionDelay = (i * 0.04) + 's'; });
  dd.classList.add('is-open');
  document.getElementById('catTrigger').setAttribute('aria-expanded', 'true');
  const h = Math.min(menu.scrollHeight || (Object.keys(CATS).length * ITEM_H + 8), 260);
  menu.style.height = h + 'px';
  setTimeout(() => { if (_catOpen) menu.style.height = h + 'px'; }, 360);
}

function _closeCatDropdown() {
  const dd   = document.getElementById('catDropdown');
  const menu = document.getElementById('catMenu');
  if (!_catOpen) return;
  _catOpen = false;
  dd.querySelectorAll('.fd-item').forEach(el => { el.style.transitionDelay = '0s'; });
  if (menu.style.height === 'auto') {
    menu.style.height = menu.offsetHeight + 'px';
    menu.offsetHeight;
  }
  menu.style.height = '0';
  dd.classList.remove('is-open');
  document.getElementById('catTrigger').setAttribute('aria-expanded', 'false');
}

function _selectCat(key, idx) {
  _catSelected = key;
  const cat = CATS[key];
  document.getElementById('txCat').value = key;
  document.getElementById('catTriggerIcon').textContent = cat.icon;
  const lbl = document.getElementById('catTriggerLabel');
  lbl.textContent = cat.label;
  lbl.classList.remove('fd-placeholder');
  const hi = document.getElementById('catHighlight');
  hi.style.transform = `translateY(${idx * ITEM_H}px)`;
  hi.classList.add('visible');
  document.querySelectorAll('.fd-item').forEach(b => b.classList.remove('is-selected'));
  document.querySelector(`.fd-item[data-cat="${key}"]`)?.classList.add('is-selected');
  _closeCatDropdown();
}

function resetCatDropdown() {
  _catSelected = null;
  document.getElementById('txCat').value = '';
  document.getElementById('catTriggerIcon').textContent = '';
  const lbl = document.getElementById('catTriggerLabel');
  lbl.textContent = 'Select a category…';
  lbl.classList.add('fd-placeholder');
  document.querySelectorAll('.fd-item').forEach(b => b.classList.remove('is-selected'));
  document.getElementById('catHighlight').classList.remove('visible');
  _closeCatDropdown();
}

/* ════════════════════════════════════════════════════════════════════════════
   EVENTS
════════════════════════════════════════════════════════════════════════════ */
function bindEvents() {
  document.getElementById('themeBtn').addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  document.getElementById('monthSel').addEventListener('change', e => {
    selMonth = e.target.value;
    renderAll();
  });

  document.getElementById('txForm').addEventListener('submit', e => {
    e.preventDefault();
    const amt  = parseFloat(document.getElementById('txAmount').value);
    const cat  = document.getElementById('txCat').value;
    const desc = document.getElementById('txDesc').value.trim();
    const date = document.getElementById('txDate').value;
    if (!amt || amt <= 0 || !cat || !date) return;

    addTx({ amount: amt, category: cat, description: desc, date });
    document.getElementById('txAmount').value = '';
    resetCatDropdown();
    document.getElementById('txDesc').value   = '';

    renderMonthFilter();
    renderAll();
    document.querySelector('.tx-list').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  document.getElementById('txList').addEventListener('click', e => {
    const btn = e.target.closest('.tx-del');
    if (!btn) return;
    if (!confirm('Delete this transaction?')) return;
    deleteTx(btn.dataset.id);
    renderMonthFilter();
    renderAll();
  });

  document.getElementById('editBudgetBtn').addEventListener('click', () => {
    document.getElementById('budgetInput').value = settings.budget || '';
    document.getElementById('budgetModal').classList.remove('hidden');
  });
  document.getElementById('cancelBudgetBtn').addEventListener('click', () => {
    document.getElementById('budgetModal').classList.add('hidden');
  });
  document.getElementById('saveBudgetBtn').addEventListener('click', () => {
    const v = parseFloat(document.getElementById('budgetInput').value);
    if (!isNaN(v) && v >= 0) { settings.budget = v; saveSettings(); }
    document.getElementById('budgetModal').classList.add('hidden');
    renderAll();
  });
  document.getElementById('budgetModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   BOOT
════════════════════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', async () => {
  applyTheme(localStorage.getItem(K.THEME) || 'dark');
  loadAll();
  initCurrencyDropdowns();
  initCatDropdown();
  document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
  renderMonthFilter();
  renderAll();
  bindEvents();
  await fetchRates();
  renderAll();
});
