/* ==========================================
   ORION FOREST v6.0 - INPUT
   Klavye ve touch girdi yönetimi
   ========================================== */

'use strict';

const Input = {
  keys: {},
  joystick: {
    active: false,
    dx: 0,
    dy: 0,
    startX: 0,
    startY: 0
  },

  /* ==================== BAŞLATMA ==================== */
  init() {
    this.initKeyboard();
    this.initJoystick();
    this.initActionButtons();
    this.initTouchBlock();
    console.log('🎮 Input sistemi başlatıldı');
  },

  /* ==================== KLAVYE ==================== */
  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = true;

      // ESC her zaman çalışsın
      if (key === 'escape') {
        if (typeof toggleEscMenu === 'function') toggleEscMenu();
        e.preventDefault();
        return;
      }

      // Oyun oynanmıyorsa çık
      if (typeof game === 'undefined' || game.state !== 'playing') return;

      if (key === 'e') {
        if (typeof interact === 'function') interact();
      }
      if (key === 'f') {
        if (typeof attack === 'function') attack();
      }
      if (key === 'r') {
        if (typeof useQuickFood === 'function') useQuickFood();
      }
      if (key === 'q') {
        if (typeof togglePanel === 'function') togglePanel('craftPanel');
      }
      if (key === 'b') {
        if (typeof togglePanel === 'function') togglePanel('buildPanel');
      }
      if (key === 'i') {
        if (typeof togglePanel === 'function') togglePanel('inventoryPanel');
      }
      if (key === 'f1') {
        e.preventDefault();
        if (typeof togglePanel === 'function') togglePanel('farmPanel');
      }

      // Ctrl ile koşma (Shift değil!)
      if (key === 'control' || key === 'ctrl') {
        game.player.isRunning = true;
      }

      // Hızlı ekipman değiştir
      if (key === '1' && game.player.inventory.balta > 0) {
        game.player.equipped = game.player.equipped === 'axe' ? null : 'axe';
        showToast(game.player.equipped ? '🪓 Balta kuşanıldı' : 'Ekipman çıkarıldı', 'info');
      }
      if (key === '2' && game.player.inventory.kilic > 0) {
        game.player.equipped = game.player.equipped === 'sword' ? null : 'sword';
        showToast(game.player.equipped ? '🗡️ Kılıç kuşanıldı' : 'Ekipman çıkarıldı', 'info');
      }

      // Ok tuşları ve boşluk - sayfa kaydırmayı engelle
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = false;

      if (key === 'control' || key === 'ctrl') {
        if (typeof game !== 'undefined' && game.player) {
          game.player.isRunning = false;
        }
      }
    });

    // Pencere odak kaybında tüm tuşları bırak
    window.addEventListener('blur', () => {
      this.keys = {};
      if (typeof game !== 'undefined' && game.player) {
        game.player.isRunning = false;
      }
    });
  },

  /* ==================== JOYSTICK ==================== */
  initJoystick() {
    const zone = $('joystickZone');
    const knob = $('joystickKnob');
    if (!zone || !knob) return;

    const getMaxDist = () => {
      const size = (typeof game !== 'undefined' && game.settings && game.settings.joystickSize)
        ? game.settings.joystickSize
        : 130;
      return size * 0.35;
    };

    const handleStart = (e) => {
      e.preventDefault();
      this.joystick.active = true;

      const touch = e.touches ? e.touches[0] : e;
      const rect = zone.getBoundingClientRect();
      this.joystick.startX = rect.left + rect.width / 2;
      this.joystick.startY = rect.top + rect.height / 2;

      handleMove(e);
    };

    const handleMove = (e) => {
      if (!this.joystick.active) return;
      e.preventDefault();

      const touch = e.touches ? e.touches[0] : e;
      let dx = touch.clientX - this.joystick.startX;
      let dy = touch.clientY - this.joystick.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = getMaxDist();

      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }

      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      this.joystick.dx = dx / maxDist;
      this.joystick.dy = dy / maxDist;
    };

    const handleEnd = (e) => {
      e.preventDefault();
      this.joystick.active = false;
      this.joystick.dx = 0;
      this.joystick.dy = 0;
      knob.style.transform = 'translate(-50%, -50%)';
    };

    zone.addEventListener('touchstart', handleStart, { passive: false });
    zone.addEventListener('touchmove', handleMove, { passive: false });
    zone.addEventListener('touchend', handleEnd, { passive: false });
    zone.addEventListener('touchcancel', handleEnd, { passive: false });
  },

  /* ==================== AKSİYON BUTONLARI ==================== */
  initActionButtons() {
    const buttons = [
      { id: 'btnCollect', action: 'interact' },
      { id: 'btnAttack', action: 'attack' },
      { id: 'btnEat', action: 'useQuickFood' }
    ];

    buttons.forEach(({ id, action }) => {
      const btn = $(id);
      if (!btn) return;

      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        if (typeof window[action] === 'function') window[action]();
      }, { passive: false });

      btn.addEventListener('touchend', () => btn.classList.remove('pressed'));
      btn.addEventListener('touchcancel', () => btn.classList.remove('pressed'));

      // PC için
      if (isPC) {
        btn.onclick = () => {
          if (typeof window[action] === 'function') window[action]();
        };
      }
    });

    // Build butonu
    const btnBuild = $('btnBuild');
    if (btnBuild) {
      btnBuild.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (typeof togglePanel === 'function') togglePanel('buildPanel');
      }, { passive: false });
      if (isPC) {
        btnBuild.onclick = () => {
          if (typeof togglePanel === 'function') togglePanel('buildPanel');
        };
      }
    }

    // Inventory butonu
    const btnInv = $('btnInventory');
    if (btnInv) {
      btnInv.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (typeof togglePanel === 'function') togglePanel('inventoryPanel');
      }, { passive: false });
      if (isPC) {
        btnInv.onclick = () => {
          if (typeof togglePanel === 'function') togglePanel('inventoryPanel');
        };
      }
    }

    // Run butonu (basılı tut)
    const btnRun = $('btnRun');
    if (btnRun) {
      btnRun.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (typeof game !== 'undefined' && game.player) {
          game.player.isRunning = true;
        }
        btnRun.classList.add('pressed');
      }, { passive: false });

      btnRun.addEventListener('touchend', () => {
        if (typeof game !== 'undefined' && game.player) {
          game.player.isRunning = false;
        }
        btnRun.classList.remove('pressed');
      });

      btnRun.addEventListener('touchcancel', () => {
        if (typeof game !== 'undefined' && game.player) {
          game.player.isRunning = false;
        }
        btnRun.classList.remove('pressed');
      });
    }
  },

  /* ==================== TOUCH ENGELLE ==================== */
  initTouchBlock() {
    window.addEventListener('touchmove', (e) => {
      if (typeof game === 'undefined' || game.state !== 'playing') return;
      if (e.target.closest('.joystick-zone')) return;
      if (e.target.closest('.modal-content')) return;
      if (e.target.closest('#inventoryPanel')) return;
      if (e.target.closest('#buildPanel')) return;
      if (e.target.closest('#craftPanel')) return;
      if (e.target.closest('#farmPanel')) return;
      e.preventDefault();
    }, { passive: false });
  },

  /* ==================== KONTROL SORGULAMA ==================== */
  isPressed(key) {
    return this.keys[key.toLowerCase()] === true;
  },

  isRunning() {
    return this.keys['control'] === true || this.keys['ctrl'] === true;
  },

  getMovement() {
    let dx = 0, dy = 0;

    if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;

    if (this.joystick.active) {
      dx += this.joystick.dx;
      dy += this.joystick.dy;
    }

    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > 1) {
      dx /= mag;
      dy /= mag;
    }

    return { dx, dy, magnitude: Math.min(mag, 1) };
  }
};

window.Input = Input;

console.log('✅ input.js yüklendi');