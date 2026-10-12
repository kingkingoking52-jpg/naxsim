/* ==========================================
   ORION FOREST v6.0 - TUTORIAL (FIXED)
   Basit ve sağlam tutorial sistemi
   ========================================== */

'use strict';

const TutorialSystem = {
  active: false,
  currentStep: 0,
  mode: 'menu', // 'menu' veya 'game'

  steps: [
    {
      icon: '🌲',
      title: 'ORION FOREST\'E HOŞ GELDİN',
      text: 'Bu kısa rehberde hayatta kalmayı öğreneceksin. Hazırsan başlayalım!',
      target: null
    },
    {
      icon: '🎮',
      title: 'HAREKET',
      text: 'WASD veya ok tuşları ile <strong>hareket</strong> et.<br><br>Ctrl tuşuna basılı tutarak <strong>koş</strong>.',
      target: null
    },
    {
      icon: '🌳',
      title: 'KAYNAK TOPLAMA',
      text: 'Ağaç, taş ve çalıların yanına git ve <strong>E</strong> tuşuna bas.<br><br>Kaynakları toplayarak envanterini doldur.',
      target: '#interactHint'
    },
    {
      icon: '🔥',
      title: 'KAMP ATEŞİ',
      text: 'Kamp ateşi <strong>gece</strong> ve <strong>soğuk</strong> için çok önemli.<br><br>Yakmak için <strong>3 odun</strong> gerekir.',
      target: null
    },
    {
      icon: '🎒',
      title: 'ENVANTER',
      text: '<strong>I</strong> tuşu ile envanterini aç.<br><br>Toplanan eşyalar burada. Kategorilere göre filtreleyebilirsin.',
      target: '#hudBottomRight'
    },
    {
      icon: '🔨',
      title: 'ZANAAT',
      text: '<strong>Q</strong> tuşu ile zanaat menüsünü aç.<br><br>Balta için: 3 odun + 2 taş',
      target: null
    },
    {
      icon: '🏗️',
      title: 'İNŞA',
      text: '<strong>B</strong> tuşu ile inşa menüsünü aç.<br><br>Duvar, zemin, çatı ve daha fazlasını yapabilirsin.',
      target: null
    },
    {
      icon: '⚔️',
      title: 'SAVAŞ',
      text: '<strong>F</strong> tuşu ile saldır.<br><br>Hayvanları avla, etlerini pişir!',
      target: null
    },
    {
      icon: '🌾',
      title: 'TARIM',
      text: '<strong>F1</strong> ile tarım menüsünü aç.<br><br>Tohum ek, sula ve hasat et!',
      target: null
    },
    {
      icon: '🌙',
      title: 'GECE',
      text: 'Gece olunca <strong>yaratıklar</strong> ortaya çıkar.<br><br>Ateş başında kalarak güvende ol!',
      target: null
    },
    {
      icon: '🎉',
      title: 'HAZIRSIN!',
      text: 'Artık ormanda hayatta kalmak için ne yapman gerektiğini biliyorsun.<br><br>İyi şanslar!',
      target: null
    }
  ],

  /* ==================== BAŞLAT ==================== */
  start(mode = 'game') {
    // Zaten aktifse çık
    if (this.active) return;

    // Menü modunda sadece göster, oyun yoksa da çalışır
    this.mode = mode;
    this.active = true;
    this.currentStep = 0;

    // Menüden açıldıysa oyun durumu değişmesin
    if (mode === 'game' && typeof game !== 'undefined') {
      // Oyundaysa duraklat
      if (game.state === 'playing') {
        game.state = 'paused';
      }
    }

    this.showStep();
  },

  /* ==================== ADIM GÖSTER ==================== */
  showStep() {
    const step = this.steps[this.currentStep];
    if (!step) {
      this.end();
      return;
    }

    if (audio && audio.tutorialStep) audio.tutorialStep();

    const overlay = $('tutorialOverlay');
    const card = $('tutCard');
    const spotlight = $('tutSpotlight');

    if (!overlay || !card) return;

    overlay.classList.add('show');
    overlay.style.pointerEvents = 'auto';

    const isLast = this.currentStep === this.steps.length - 1;
    const progress = ((this.currentStep + 1) / this.steps.length) * 100;

    // Kart içeriği
    card.innerHTML = `
      <div class="tut-card-header">
        <div class="tut-card-icon">${step.icon}</div>
        <div style="flex:1">
          <div class="tut-card-title">${step.title}</div>
          <div class="tut-card-step">ADIM ${this.currentStep + 1} / ${this.steps.length}</div>
        </div>
      </div>

      <div class="tut-card-text">${step.text}</div>

      <div class="tut-progress-bar">
        <div class="tut-progress-fill" style="width:${progress}%"></div>
      </div>

      <div class="tut-card-buttons">
        <button class="skip" onclick="TutorialSystem.skip()">ATLA</button>
        <button onclick="TutorialSystem.next()">${isLast ? 'BAŞLA 🎮' : 'İLERİ ▶'}</button>
      </div>
    `;

    // Kartı her zaman ekranın ortasında göster
    card.style.position = 'fixed';
    card.style.left = '50%';
    card.style.top = '50%';
    card.style.transform = 'translate(-50%, -50%)';
    card.style.maxWidth = '500px';
    card.style.width = '90%';

    // Spotlight göster/gizle
    if (spotlight) {
      if (step.target && this.mode === 'game') {
        const targetEl = document.querySelector(step.target);
        if (targetEl) {
          const rect = targetEl.getBoundingClientRect();
          spotlight.style.display = 'block';
          spotlight.style.position = 'fixed';
          spotlight.style.left = (rect.left - 8) + 'px';
          spotlight.style.top = (rect.top - 8) + 'px';
          spotlight.style.width = (rect.width + 16) + 'px';
          spotlight.style.height = (rect.height + 16) + 'px';
        } else {
          spotlight.style.display = 'none';
        }
      } else {
        spotlight.style.display = 'none';
      }
    }

    // Arrow gizle (kullanmıyoruz artık)
    const arrow = $('tutArrow');
    if (arrow) arrow.style.display = 'none';
  },

  /* ==================== SONRAKİ ADIM ==================== */
  next() {
    this.currentStep++;
    if (this.currentStep >= this.steps.length) {
      this.end();
    } else {
      this.showStep();
    }
  },

  /* ==================== ATLA ==================== */
  skip() {
    const self = this;

    showAlert({
      icon: '⏭️',
      title: 'TUTORIAL\'I ATLA',
      message: 'Tutorial\'ı atlamak istediğine emin misin?',
      buttons: [
        { text: 'DEVAM ET', value: false, secondary: true },
        { text: 'ATLA', value: true }
      ]
    }).then((result) => {
      if (result) {
        self.end();
      }
    });
  },

  /* ==================== BİTİR ==================== */
  end() {
    this.active = false;

    const overlay = $('tutorialOverlay');
    if (overlay) {
      overlay.classList.remove('show');
      overlay.style.pointerEvents = 'none';
    }

    const spotlight = $('tutSpotlight');
    if (spotlight) spotlight.style.display = 'none';

    // Tutorial bitti olarak işaretle
    SaveSystem.setTutorialDone();

    // Menü modundaysak menüde kal
    if (this.mode === 'menu') {
      return;
    }

    // Oyun modundaysak oyuna dön
    if (typeof game !== 'undefined') {
      if (game.state === 'paused' || game.state === 'tutorial') {
        game.state = 'playing';
        addMessage('🎮 Tutorial tamamlandı!');
      }
    }
  },

  /* ==================== SIFIRLA ==================== */
  reset() {
    SaveSystem.resetTutorial();
    showToast('Tutorial sıfırlandı', 'info');
  }
};

window.TutorialSystem = TutorialSystem;

// Kısayollar
window.startTutorial = (mode) => TutorialSystem.start(mode || 'game');
window.nextTutorialStep = () => TutorialSystem.next();
window.skipTutorial = () => TutorialSystem.skip();

console.log('✅ tutorial.js yüklendi');