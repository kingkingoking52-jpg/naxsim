/* ==========================================
   ORION FOREST v6.0 - FARMING
   Tarım sistemi (bitki yetiştirme)
   ========================================== */

'use strict';

/* ==================== TARIM SİSTEMİ ==================== */
const FarmingSystem = {

  /* ==================== PANEL RENDER ==================== */
  render() {
    this.renderSeeds();
    this.renderCrops();
  },

  /* ==================== TOHUMLAR ==================== */
  renderSeeds() {
    const seedList = $('seedList');
    if (!seedList) return;

    seedList.innerHTML = '';

    const seeds = ['tohum_bugday', 'tohum_havuc', 'tohum_patates'];
    let hasSeeds = false;

    seeds.forEach(seedId => {
      const count = game.player.inventory[seedId] || 0;
      if (count <= 0) return;

      hasSeeds = true;
      const seed = ITEM_DATA[seedId];

      const div = document.createElement('div');
      div.className = 'craft-item';
      div.innerHTML = `
        <div class="info">
          <div class="name">${seed.icon} ${seed.name} (${count})</div>
          <div class="cost">🌱 Ekilebilir</div>
        </div>
        <button onclick="FarmingSystem.plant('${seedId}')">EK</button>
      `;
      seedList.appendChild(div);
    });

    if (!hasSeeds) {
      seedList.innerHTML = '<div class="inv-empty">Tohum yok</div>';
    }
  },

  /* ==================== BİTKİLER ==================== */
  renderCrops() {
    const cropList = $('cropList');
    if (!cropList) return;

    cropList.innerHTML = '';

    if (!game.crops || game.crops.length === 0) {
      cropList.innerHTML = '<div class="inv-empty">Tarlada bitki yok</div>';
      return;
    }

    game.crops.forEach((crop, index) => {
      const data = ITEM_DATA[crop.type];
      if (!data) return;

      const ready = crop.growth >= crop.requiredGrowth;
      const pct = Math.floor((crop.growth / crop.requiredGrowth) * 100);

      const div = document.createElement('div');
      div.className = 'craft-item';
      div.innerHTML = `
        <div class="info">
          <div class="name">${data.icon} ${data.name} ${ready ? '✅' : `(${pct}%)`}</div>
          <div class="cost">💧 Su: ${Math.round(crop.water)}/100</div>
        </div>
        <button ${ready ? '' : 'disabled'} onclick="FarmingSystem.harvest(${index})">
          ${ready ? 'HASAT' : 'BEKLE'}
        </button>
      `;
      cropList.appendChild(div);
    });
  },

  /* ==================== EKME ==================== */
  plant(seedId) {
    if (typeof game === 'undefined' || !game.player) return;

    const seed = ITEM_DATA[seedId];
    if (!seed) return;

    if (game.player.inventory[seedId] <= 0) {
      showToast('Tohum yok!', 'error');
      return;
    }

    // Tohum çıkar
    game.player.inventory[seedId]--;

    // Bitki oluştur
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 40;

    game.crops.push({
      x: game.player.x + Math.cos(angle) * dist,
      y: game.player.y + Math.sin(angle) * dist,
      type: seed.plant,
      growth: 0,
      requiredGrowth: seed.growth,
      water: 50,
      planted: Date.now()
    });

    // İstatistik
    game.player.stats.farmsPlanted++;

    if (game.player.stats.farmsPlanted === 1) {
      AchievementSystem.unlock('firstFarm');
    }

    if (audio && audio.plant) audio.plant();
    addMessage(`🌱 ${seed.name} ekildi!`);

    game.player.xp += 5;
    if (typeof checkLevelUp === 'function') checkLevelUp();

    updateUI();
    this.render();
  },

  /* ==================== HASAT ==================== */
  harvest(index) {
    if (!game.crops || !game.crops[index]) return;

    const crop = game.crops[index];
    const data = ITEM_DATA[crop.type];
    if (!data) return;

    if (crop.growth < crop.requiredGrowth) {
      showToast('Henüz hazır değil!', 'warning');
      return;
    }

    // Miktar belirle
    const amount = 1 + Math.floor(Math.random() * 2);

    game.player.inventory[crop.type] = (game.player.inventory[crop.type] || 0) + amount;

    // İstatistik
    game.player.stats.harvests++;

    if (game.player.stats.harvests === 1) AchievementSystem.unlock('firstHarvest');
    if (game.player.stats.harvests >= 10) AchievementSystem.unlock('farm10');
    if (game.player.stats.harvests >= 50) AchievementSystem.unlock('farm50');

    // Bitkiyi kaldır
    game.crops.splice(index, 1);

    if (audio && audio.success) audio.success();
    addMessage(`🌾 ${data.icon} x${amount} hasat edildi!`);

    game.player.xp += 10;
    if (typeof checkLevelUp === 'function') checkLevelUp();

    updateUI();
    this.render();
  },

  /* ==================== BÜYÜME GÜNCELLE ==================== */
  update(dt) {
    if (!game.crops || game.crops.length === 0) return;

    for (let i = game.crops.length - 1; i >= 0; i--) {
      const crop = game.crops[i];

      // Büyüme (yavaş)
      if (crop.growth < crop.requiredGrowth) {
        // Su varsa hızlı büyür
        const growthRate = crop.water > 0 ? 0.8 : 0.2;
        crop.growth += growthRate * dt;

        // Su azalır
        crop.water = Math.max(0, crop.water - 0.3 * dt);
      }
    }
  },

  /* ==================== SULAMA ==================== */
  waterCrop(index) {
    if (!game.crops || !game.crops[index]) return;

    const crop = game.crops[index];

    // Su item'ı var mı?
    if ((game.player.inventory.su || 0) > 0) {
      game.player.inventory.su--;
      crop.water = 100;
      showToast('💧 Bitki sulandı!', 'success');
    } else {
      // Kamp ateşi yakınında mı?
      const cf = game.world.campfire;
      if (cf && cf.lit) {
        const dist = Math.hypot(crop.x - cf.x, crop.y - cf.y);
        if (dist < 100) {
          crop.water = Math.min(100, crop.water + 50);
          showToast('💧 Bitki sulandı!', 'success');
        } else {
          showToast('Su yok! Gölde su topla', 'warning');
        }
      } else {
        showToast('Su yok! Gölde su topla', 'warning');
      }
    }

    this.render();
  },

  /* ==================== ÇİZİM ==================== */
  draw(ctx, camX, camY, darkness) {
    if (!game.crops || game.crops.length === 0) return;

    game.crops.forEach(crop => {
      const sx = crop.x - camX;
      const sy = crop.y - camY;

      // Viewport culling
      if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) return;

      const data = ITEM_DATA[crop.type];
      if (!data) return;

      const ready = crop.growth >= crop.requiredGrowth;
      const pct = crop.growth / crop.requiredGrowth;

      // Toprak
      ctx.fillStyle = `rgba(90, 60, 40, ${darkness})`;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 3, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bitki animasyonu (hafif sallanma)
      const sway = Math.sin(Date.now() * 0.002 + crop.planted * 0.001) * 2;

      // Bitki boyutu (büyümeye göre)
      const scale = 0.4 + pct * 0.6;

      ctx.save();
      ctx.translate(sx + sway, sy);
      ctx.scale(scale, scale);

      // Gövde
      ctx.fillStyle = `rgba(60, 140, 60, ${darkness})`;
      ctx.fillRect(-1, -15, 2, 15);

      // Yapraklar
      ctx.fillStyle = `rgba(76, 175, 80, ${darkness})`;
      ctx.beginPath();
      ctx.ellipse(-5, -10, 5, 3, -0.3, 0, Math.PI * 2);
      ctx.ellipse(5, -12, 5, 3, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Meyve (hazırsa)
      if (ready) {
        ctx.fillStyle = `rgba(255, 215, 0, ${darkness})`;
        ctx.beginPath();
        ctx.arc(0, -18, 5, 0, Math.PI * 2);
        ctx.fill();

        // Parlama
        ctx.fillStyle = `rgba(255, 255, 200, ${0.6 * darkness})`;
        ctx.beginPath();
        ctx.arc(-2, -20, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Büyüme barı
      if (!ready) {
        ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * darkness})`;
        ctx.fillRect(sx - 10, sy - 25, 20, 3);
        ctx.fillStyle = `rgba(76, 201, 240, ${darkness})`;
        ctx.fillRect(sx - 10, sy - 25, 20 * pct, 3);
      }

      // Su göstergesi
      if (crop.water < 20 && !ready) {
        ctx.fillStyle = `rgba(255, 100, 100, ${darkness})`;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💧', sx, sy - 30);
      }
    });
  },

  /* ==================== TÜM BİTKİLERİ SULA ==================== */
  waterAll() {
    if (!game.crops || game.crops.length === 0) {
      showToast('Bitki yok!', 'warning');
      return;
    }

    let watered = 0;
    game.crops.forEach(crop => {
      if (crop.water < 100) {
        crop.water = 100;
        watered++;
      }
    });

    if (watered > 0) {
      showToast(`💧 ${watered} bitki sulandı!`, 'success');
    } else {
      showToast('Tüm bitkiler zaten sulu', 'info');
    }

    this.render();
  }
};

/* ==================== GLOBAL EXPORT ==================== */
window.FarmingSystem = FarmingSystem;

// Kısayol (eski kod uyumluluğu)
window.renderFarmList = () => FarmingSystem.render();

console.log('✅ farming.js yüklendi');