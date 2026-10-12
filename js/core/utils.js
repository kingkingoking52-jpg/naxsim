/* ==========================================
   ORION FOREST v6.0 - UTILS
   Yardımcı fonksiyonlar, alert, toast
   ========================================== */

'use strict';

/* ==================== GLOBAL HATA YAKALAYICI ==================== */
window.addEventListener('error', (e) => {
  console.error('❌ HATA:', e.message, '| satır:', e.lineno);
});

/* ==================== KISAYOLLAR ==================== */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

/* ==================== ELEMENT YARDIMCILARI ==================== */
function bindClick(id, handler) {
  const el = $(id);
  if (el) el.onclick = handler;
  else console.warn('⚠️ Element bulunamadı:', id);
}

function bind(el, event, handler) {
  if (el) el.addEventListener(event, handler);
}

function safeSet(id, prop, value) {
  const el = $(id);
  if (el) el[prop] = value;
}

function safeText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function safeHTML(id, html) {
  const el = $(id);
  if (el) el.innerHTML = html;
}

function safeStyle(id, prop, value) {
  const el = $(id);
  if (el) el.style[prop] = value;
}

function safeWidth(id, percent) {
  const el = $(id);
  if (el) el.style.width = percent + '%';
}

/* ==================== CİHAZ TESPİTİ ==================== */
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  || ('ontouchstart' in window && window.innerWidth < 1024);
const isPC = !isMobile;

/* ==================== MATEMATİK YARDIMCILARI ==================== */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function chance(percent) {
  return Math.random() < percent;
}

/* ==================== ZAMAN YARDIMCILARI ==================== */
function formatTime(hours) {
  const h = Math.floor(hours);
  const m = Math.floor((hours % 1) * 60);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function formatDate(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

/* ==================== ÖZEL ALERT SİSTEMİ ==================== */
function showAlert(options = {}) {
  return new Promise((resolve) => {
    const alertEl = $('customAlert');
    if (!alertEl) {
      resolve(true);
      return;
    }

    safeText('alertIcon', options.icon || 'ℹ️');
    safeText('alertTitle', options.title || 'BİLGİ');
    safeText('alertMessage', options.message || '');

    const btnsEl = $('alertButtons');
    if (!btnsEl) {
      resolve(true);
      return;
    }
    btnsEl.innerHTML = '';

    const buttons = options.buttons || [{ text: 'TAMAM', value: true }];
    buttons.forEach((btn) => {
      const b = document.createElement('button');
      b.textContent = btn.text;
      if (btn.secondary) b.className = 'secondary';
      b.onclick = () => {
        alertEl.classList.remove('show');
        if (typeof audio !== 'undefined' && audio.click) audio.click();
        setTimeout(() => resolve(btn.value), 200);
      };
      btnsEl.appendChild(b);
    });

    alertEl.classList.add('show');
    if (typeof audio !== 'undefined' && audio.alert) audio.alert();
  });
}

/* ==================== TOAST SİSTEMİ ==================== */
function showToast(message, type = 'info', duration = 2500) {
  const container = $('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast ' + type;

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ==================== LOCALSTORAGE YARDIMCILARI ==================== */
function saveToLocal(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn('Kayıt hatası:', e);
    return false;
  }
}

function loadFromLocal(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.warn('Yükleme hatası:', e);
    return defaultValue;
  }
}

function removeFromLocal(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
}

/* ==================== DOM HAZIR KONTROLÜ ==================== */
function onDOMReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

/* ==================== YARDIMCI: EVENT DURDUR ==================== */
function stopEvent(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
}

/* ==================== FPS SAYACI ==================== */
class FPSCounter {
  constructor() {
    this.frames = 0;
    this.time = 0;
    this.fps = 60;
    this.lastTime = performance.now();
  }

  update(now) {
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    this.frames++;
    this.time += dt;

    if (this.time >= 1) {
      this.fps = this.frames;
      this.frames = 0;
      this.time = 0;
    }

    return dt;
  }
}

/* ==================== DEBUG ==================== */
const DEBUG = {
  enabled: false,
  log(...args) {
    if (this.enabled) console.log('🐛', ...args);
  },
  warn(...args) {
    if (this.enabled) console.warn('⚠️', ...args);
  },
  error(...args) {
    console.error('❌', ...args);
  }
};

/* ==================== GLOBAL EXPORT ==================== */
window.$ = $;
window.$$ = $$;
window.bindClick = bindClick;
window.bind = bind;
window.safeSet = safeSet;
window.safeText = safeText;
window.safeHTML = safeHTML;
window.safeStyle = safeStyle;
window.safeWidth = safeWidth;
window.isMobile = isMobile;
window.isPC = isPC;
window.clamp = clamp;
window.lerp = lerp;
window.distance = distance;
window.randomRange = randomRange;
window.randomInt = randomInt;
window.pickRandom = pickRandom;
window.chance = chance;
window.formatTime = formatTime;
window.formatDate = formatDate;
window.showAlert = showAlert;
window.showToast = showToast;
window.saveToLocal = saveToLocal;
window.loadFromLocal = loadFromLocal;
window.removeFromLocal = removeFromLocal;
window.onDOMReady = onDOMReady;
window.stopEvent = stopEvent;
window.FPSCounter = FPSCounter;
window.DEBUG = DEBUG;

console.log('✅ utils.js yüklendi');
