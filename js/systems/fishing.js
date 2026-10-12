/* ==========================================
   ORION FOREST v6.1 - FISHING SYSTEM
   Balık tutma minigame
   ========================================== */

'use strict';

const FishingSystem = {
  active: false,
  state: 'idle', // idle, waiting, bite, done
  timer: 0,
  waitDuration: 0,
  biteWindow: 0,
  currentWater: null,
  lastFish: null,

  // Balık türleri
  FISH_TYPES: [
    { name: 'Sazan',     icon: '🐟', xp: 15, size: 'küçük', color: '#8b9bb4' },
    { name: 'Alabalık',  icon: '🐠', xp: 25, size: 'orta',  color: '#e8a86b' },
    { name: 'Somon',     icon: '🐡', xp: 40, size: 'büyük', color: '#ff8b6b' },
    { name: 'Yayın',     icon: '🐋', xp: 60, size: 'dev',   color: '#5a6b8b' },
    { name: 'Turna',     icon: '🦈', xp: 35, size: 'büyük', color: '#4a5a7a' },
    { name: 'Eski Çizme',icon: '🥾', xp: 5,  size: 'çöp',   color: '#6b5544', junk: true }
  ],

  /* ==================== BAŞLAT ==================== */
  startFishing(water) {
    if (this.active) return;

    // Olta var mı?
    if (!game.player.inventory.olta || game.player.inventory.olta < 1) {
      showToast('❌ Olta gerekli! (Zanaat: 3 odun + 2 ip)', 'error', 3000);
      return;
    }

    this.active = true;
    this.state = 'waiting';
    this.currentWater = water;
    this.timer = 0;

    // Rastgele bekleme süresi (2-5 saniye)
    this.waitDuration = 2 + Math.random() * 3;
    this.biteWindow = 0;

    addMessage('🎣 Olta atıldı... Bekle!');
    if (audio && audio.fishing) audio.fishing();

    // Fishing UI göster
    this.showUI();
  },

  /* ==================== GÜNCELLE ==================== */
  update(dt) {
    if (!this.active) return;

    this.timer += dt;

    if (this.state === 'waiting') {
      // Bekleme süresi bitti mi?
      if (this.timer >= this.waitDuration) {
        this.state = 'bite';
        this.biteWindow = 0;
        this.timer = 0;

        addMessage('❗ BİR ŞEY GELDİ! E\'ye bas!');
        if (audio && audio.alert) audio.alert();

        // Görsel uyarı
        this.updateUI('bite');
      }
    }
    else if (this.state === 'bite') {
      // 0.8 saniye içinde basmalı
      this.biteWindow += dt;

      if (this.biteWindow >= 0.8) {
        // Kaçırdın!
        this.fail('🐟 Balık kaçtı...');
      }
    }
  },

  /* ==================== E TUŞU ==================== */
  tryCatch() {
    if (!this.active) return false;

    if (this.state === 'bite') {
      // Yakaladın!
      this.catchFish();
      return true;
    }
    else if (this.state === 'waiting') {
      // Çok erken çektin
      this.fail('⏱️ Çok erken çektin!');
      return true;
    }

    return false;
  },

  /* ==================== BALIK YAKALA ==================== */
  catchFish() {
    // Rastgele balık seç
    const fish = this.FISH_TYPES[Math.floor(Math.random() * this.FISH_TYPES.length)];
    this.lastFish = fish;

    // Çöp mü?
    if (fish.junk) {
      addMessage(`🗑️ ${fish.name} buldun...`);
      if (audio && audio.hurt) audio.hurt();
    } else {
      // Envantere ekle
      const amount = 1;
      game.player.inventory.balik = (game.player.inventory.balik || 0) + amount;
      game.player.xp += fish.xp;

      // İstatistik
      if (game.player.stats) {
        game.player.stats.fishCaught = (game.player.stats.fishCaught || 0) + 1;
      }

      addMessage(`✅ ${fish.icon} ${fish.name} yakaladın! +${fish.xp} XP`);
      if (audio && audio.success) audio.success();

      // Başarım
      if (typeof AchievementSystem !== 'undefined') {
        if (game.player.stats.fishCaught === 1) AchievementSystem.unlock('firstFish');
        if (game.player.stats.fishCaught >= 20) AchievementSystem.unlock('fisher');
      }

      // Level kontrolü
      if (typeof checkLevelUp === 'function') checkLevelUp();
    }

    // UI göster
    this.updateUI('catch', fish);

    // 1.5 saniye sonra kapat
    setTimeout(() => this.end(), 1500);
  },

  /* ==================== BAŞARISIZ ==================== */
  fail(message) {
    addMessage(message);
    if (audio && audio.hurt) audio.hurt();

    this.updateUI('fail');

    setTimeout(() => this.end(), 1200);
  },

  /* ==================== BİTİR ==================== */
  end() {
    this.active = false;
    this.state = 'idle';
    this.currentWater = null;
    this.hideUI();
    if (typeof updateUI === 'function') updateUI();
  },

  /* ==================== UI GÖSTER ==================== */
  showUI() {
    // Ana hint'i değiştir
    const hint = $('interactHint');
    if (hint) {
      hint.style.display = 'block';
      hint.textContent = '🎣 Bekle...';
      hint.style.background = 'rgba(76, 201, 240, 0.95)';
    }
  },

  updateUI(state, fish) {
    const hint = $('interactHint');
    if (!hint) return;

    if (state === 'bite') {
      hint.textContent = '❗ BİR ŞEY GELDİ! E\'YE BAS!';
      hint.style.background = 'rgba(255, 8, 68, 0.95)';
      hint.style.fontSize = '16px';
      hint.style.padding = '12px 24px';

      // Sallanma efekti
      hint.style.animation = 'hintPulse 0.3s infinite';
    }
    else if (state === 'catch') {
      hint.textContent = `✅ ${fish.icon} ${fish.name}!`;
      hint.style.background = 'rgba(0, 214, 143, 0.95)';
      hint.style.fontSize = '15px';
      hint.style.animation = 'none';
    }
    else if (state === 'fail') {
      hint.textContent = '❌ Kaçtı!';
      hint.style.background = 'rgba(255, 8, 68, 0.85)';
      hint.style.fontSize = '14px';
      hint.style.animation = 'none';
    }
  },

  hideUI() {
    const hint = $('interactHint');
    if (hint) {
      hint.style.background = '';
      hint.style.fontSize = '';
      hint.style.padding = '';
      hint.style.animation = '';
    }
  },

  /* ==================== ÇİZİM (Olta) ==================== */
  draw(ctx, camX, camY) {
    if (!this.active || !this.currentWater) return;

    const p = game.player;
    const water = this.currentWater;

    // Oyuncu ile su arasında olta ipi
    const px = W / 2;
    const py = H / 2;
    const wx = water.x - camX;
    const wy = water.y - camY;

    // Olta ipi (eğri çizgi)
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.7)';
    ctx.lineWidth = 1.5;

    // Kontrol noktası (ortada daha yukarıda)
    const midX = (px + wx) / 2;
    const midY = Math.min(py, wy) - 40;

    ctx.beginPath();
    ctx.moveTo(px, py - 20);
    ctx.quadraticCurveTo(midX, midY, wx, wy);
    ctx.stroke();

    // Şamandıra (su üstünde)
    const bob = Math.sin(Date.now() * 0.005) * 2;
    ctx.fillStyle = this.state === 'bite' ? '#ff0844' : '#ff6b35';
    ctx.beginPath();
    ctx.arc(wx, wy + bob, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Bekleme animasyonu
    if (this.state === 'waiting') {
      const dots = '.'.repeat(Math.floor(this.timer * 2) % 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🎣' + dots, wx, wy - 25);
    }

    // Isırma efekti
    if (this.state === 'bite') {
      // Su halkası
      const ringSize = 10 + (this.biteWindow * 60);
      const alpha = 1 - (this.biteWindow / 0.8);
      ctx.strokeStyle = `rgba(255, 8, 68, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(wx, wy, ringSize, 0, Math.PI * 2);
      ctx.stroke();

      // Büyük "!" işareti
      ctx.fillStyle = '#ff0844';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('!', wx, wy - 50);
    }
  }
};

window.FishingSystem = FishingSystem;

console.log('✅ fishing.js yüklendi');