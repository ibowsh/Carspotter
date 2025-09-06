// CarSpotter base JS utilities

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function debounce(fn, wait = 200) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

// Compare list persisted in localStorage
const storageKey = 'carspotter_compare';
function getCompareList() {
  try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
}
function setCompareList(list) { localStorage.setItem(storageKey, JSON.stringify(list.slice(0, 4))); }
function toggleCompare(car) {
  const list = getCompareList();
  const exists = list.find(x => x.id === car.id);
  const next = exists ? list.filter(x => x.id !== car.id) : [...list, car].slice(0, 4);
  setCompareList(next);
  dispatchCompareUpdate();
}
function dispatchCompareUpdate() { window.dispatchEvent(new CustomEvent('compare:update', { detail: getCompareList() })); }

// Search/query helpers
function getQueryObject() {
  const params = new URLSearchParams(location.search);
  const obj = {};
  params.forEach((v, k) => obj[k] = v);
  return obj;
}
function setQueryObject(obj, replace = true) {
  const params = new URLSearchParams(obj);
  const url = `${location.pathname}?${params.toString()}`;
  if (replace) history.replaceState(null, '', url); else history.pushState(null, '', url);
}

// Filter binding for catalog pages
function bindFilters(root = document) {
  const filterForm = root.querySelector('[data-filters]');
  if (!filterForm) return;
  const onChange = debounce(() => {
    const formData = new FormData(filterForm);
    const q = {};
    for (const [k, v] of formData.entries()) if (v) q[k] = v;
    setQueryObject(q);
    filterForm.dispatchEvent(new CustomEvent('filters:change', { detail: q }));
  }, 120);
  filterForm.addEventListener('input', onChange);
  filterForm.addEventListener('change', onChange);
}

// Minimal chart drawer (no deps) for comparison bars
function drawBarChart(canvas, datasets) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth * dpr;
  const h = canvas.clientHeight * dpr;
  canvas.width = w; canvas.height = h;
  ctx.scale(dpr, dpr);
  const pad = 14;
  const innerW = canvas.clientWidth - pad * 2;
  const innerH = canvas.clientHeight - pad * 2;
  const max = Math.max(...datasets.map(d => d.value)) || 1;
  const barH = Math.min(28, (innerH - pad) / datasets.length - 8);
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  ctx.font = '12px ui-sans-serif, system-ui';
  datasets.forEach((d, i) => {
    const x = pad;
    const y = pad + i * (barH + 16);
    const wBar = innerW * (d.value / max);
    // background
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x, y, innerW, barH);
    // bar
    const grad = ctx.createLinearGradient(x, y, x + wBar, y);
    grad.addColorStop(0, '#00ffd1');
    grad.addColorStop(1, '#00b3ff');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, wBar, barH);
    // label
    ctx.fillStyle = '#a9b7d0';
    ctx.fillText(`${d.label} • ${d.value}`, x, y - 4);
  });
}

// Global init
document.addEventListener('DOMContentLoaded', () => {
  bindFilters();
  window.addEventListener('resize', debounce(() => {
    $$('.chart-bars').forEach(c => drawBarChart(c, JSON.parse(c.dataset.series || '[]')));
  }, 150));
  $$('.chart-bars').forEach(c => drawBarChart(c, JSON.parse(c.dataset.series || '[]')));
});

// Expose for inline handlers
window.CarSpotter = { toggleCompare, getCompareList, drawBarChart };


