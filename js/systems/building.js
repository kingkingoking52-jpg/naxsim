/* ==========================================
   ORION FOREST v6.0 - BUILDING
   İnşa sistemi (detaylı, yerde duran bloklar)
   ========================================== */

'use strict';

/* ==================== YAPI ÇEŞİTLERİ ==================== */
const BUILD_ITEMS = {
  // Zeminler
  floor_wood: {
    icon: '🟫',
    name: 'Ahşap Zemin',
    cost: { odun: 3 },
    hp: 50,
    size: 40,
    isFloor: true
  },
  floor_stone: {
    icon: '⬛',
    name: 'Taş Zemin',
    cost: { tas: 5 },
    hp: 80,
    size: 40,
    isFloor: true
  },

  // Duvarlar
  wall_wood: {
    icon: '🧱',
    name: 'Ahşap Duvar',
    cost: { odun: 5 },
    hp: 100,
    size: 40,
    isWall: true
  },
  wall_stone: {
    icon: '🪨',
    name: 'Taş Duvar',
    cost: { tas: 8 },
    hp: 200,
    size: 40,
    isWall: true
  },

  // Özel
  door_wood: {
    icon: '🚪',
    name: 'Kapı',
    cost: { odun: 8, ip: 2 },
    hp: 150,
    size: 40,
    isDoor: true
  },
  window: {
    icon: '🪟',
    name: 'Pencere',
    cost: { odun: 4, ip: 1 },
    hp: 60,
    size: 40,
    isWindow: true
  },
  roof_wood: {
    icon: '🏠',
    name: 'Ahşap Çatı',
    cost: { odun: 6, yaprak: 3 },
    hp: 70,
    size: 40,
    isRoof: true
  },
  fence: {
    icon: '🚧',
    name: 'Çit',
    cost: { odun: 3 },
    hp: 40,
    size: 30,
    isFence: true
  },

  // Aksesuar
  torch: {
    icon: '🔥',
    name: 'Meşale',
    cost: { odun: 2, cali: 1 },
    hp: 20,
    light: 150,
    isTorch: true
  },
  chest: {
    icon: '📦',
    name: 'Sandık',
    cost: { odun: 12, ip: 2 },
    hp: 100,
    storage: true,
    isChest: true
  }
};

/* ==================== İNŞA SİSTEMİ ==================== */
const BuildingSystem = {

  /* ==================== RENDER ==================== */
  render() {
    const grid = $('buildGrid');
    if (!grid) return;

    grid.innerHTML = '';

    for (const [id, item] of Object.entries(BUILD_ITEMS)) {
      const costStr = Object.entries(item.cost)
        .map(([k, v]) => `${ITEM_DATA[k]?.icon || '📦'} ${v}`)
        .join(' ');

      const div = document.createElement('div');
      div.className = 'build-item';
      div.dataset.build = id;
      div.innerHTML = `
        <span class="build-icon">${item.icon}</span>
        <div class="info">
          <div class="name">${item.name}</div>
          <div class="cost">${costStr}</div>
        </div>
      `;
      div.onclick = () => this.select(id);
      grid.appendChild(div);
    }
  },

  /* ==================== SEÇİM ==================== */
  select(id) {
    const item = BUILD_ITEMS[id];
    if (!item) return;

    if (typeof game === 'undefined' || !game.player) return;

    // Kaynak kontrolü
    for (const [res, amount] of Object.entries(item.cost)) {
      if ((game.player.inventory[res] || 0) < amount) {
        showToast('Yetersiz kaynak!', 'error');
        return;
      }
    }

    // Seçili stilini güncelle
    $$('.build-item').forEach(el => el.classList.remove('selected'));
    const selected = document.querySelector(`[data-build="${id}"]`);
    if (selected) selected.classList.add('selected');

    // Build modunu aç
    game.buildMode = { type: id, ...item };

    // Paneli kapat
    if (typeof togglePanel === 'function') {
      togglePanel('buildPanel');
    }

    showToast(`🏗️ ${item.name} - yerleştirmek için E bas`, 'info', 3000);
  },

  /* ==================== YERLEŞTİRME ==================== */
  place() {
    if (typeof game === 'undefined' || !game.player) return;
    if (!game.buildMode) return;

    const item = game.buildMode;
    const inv = game.player.inventory;

    // Kaynak kontrolü
    for (const [res, amount] of Object.entries(item.cost)) {
      if ((inv[res] || 0) < amount) {
        showToast('Yetersiz kaynak!', 'error');
        game.buildMode = null;
        return;
      }
    }

    // Kaynakları çıkar
    for (const [res, amount] of Object.entries(item.cost)) {
      inv[res] -= amount;
    }

    // Oyuncunun baktığı yöne göre konum hesapla
    const facing = game.player.facing || 1;
    const offsetX = facing > 0 ? 55 : -55;
    const baseX = game.player.x + offsetX;
    const baseY = game.player.y;

    // Grid'e hizala (yerde düzgün dursun)
    const gridSize = 20;
    const gridX = Math.round(baseX / gridSize) * gridSize;
    const gridY = Math.round(baseY / gridSize) * gridSize;

    // Aynı yerde yapı var mı kontrol et (opsiyonel)
    if (game.buildings) {
      const existing = game.buildings.find(b =>
        Math.abs(b.x - gridX) < 15 && Math.abs(b.y - gridY) < 15
      );
      if (existing) {
        showToast('Buraya zaten bir yapı var!', 'warning');
        game.buildMode = null;
        return;
      }
    }

    // Yapı oluştur
    const building = {
      x: gridX,
      y: gridY,
      type: item.type,
      hp: item.hp,
      maxHp: item.hp,
      size: item.size || 40,
      isFloor: item.isFloor || false,
      isWall: item.isWall || false,
      isDoor: item.isDoor || false,
      isWindow: item.isWindow || false,
      isRoof: item.isRoof || false,
      isFence: item.isFence || false,
      isTorch: item.isTorch || false,
      isChest: item.isChest || false,
      light: item.light || 0,
      animTime: 0,
      placed: Date.now()
    };

    if (!game.buildings) game.buildings = [];
    game.buildings.push(building);

    // İstatistik
    game.player.stats.buildsCount++;

    if (game.player.stats.buildsCount === 1) {
      AchievementSystem.unlock('firstBuild');
    }
    if (game.player.stats.buildsCount >= 10) {
      AchievementSystem.unlock('build10');
    }
    if (game.player.stats.buildsCount >= 50) {
      AchievementSystem.unlock('build50');
    }

    // İlk ev
    if ((item.isWall || item.isFloor) && game.player.stats.buildsCount === 10) {
      AchievementSystem.unlock('builder_house');
    }

    // XP
    game.player.xp += 15;
    if (typeof checkLevelUp === 'function') checkLevelUp();

    if (audio && audio.build) audio.build();
    addMessage(`🏗️ ${item.name} inşa edildi!`);

    // Build modundan çık
    game.buildMode = null;

    updateUI();
    this.render();
  },

  /* ==================== KONTROL ==================== */
  canPlace(x, y) {
    if (!game.buildings) return true;

    for (const b of game.buildings) {
      if (Math.abs(b.x - x) < 15 && Math.abs(b.y - y) < 15) {
        return false;
      }
    }
    return true;
  },

  /* ==================== YIK = ==================== */
  destroy(building) {
    if (!game.buildings) return;

    const index = game.buildings.indexOf(building);
    if (index === -1) return;

    // Malzemelerin bir kısmını geri ver
    const item = BUILD_ITEMS[building.type];
    if (item && item.cost) {
      for (const [res, amount] of Object.entries(item.cost)) {
        const refund = Math.floor(amount / 2);
        if (refund > 0) {
          game.player.inventory[res] = (game.player.inventory[res] || 0) + refund;
        }
      }
    }

    game.buildings.splice(index, 1);

    if (audio && audio.click) audio.click();
    showToast('🗑️ Yapı yıkıldı', 'info', 1500);
    updateUI();
  },

  /* ==================== YAPI BUL ==================== */
  getAt(x, y, range = 50) {
    if (!game.buildings) return null;

    for (const b of game.buildings) {
      const dist = Math.hypot(b.x - x, b.y - y);
      if (dist < range) {
        return b;
      }
    }
    return null;
  },

  /* ==================== YAPI HASARI ==================== */
  damage(building, amount) {
    if (!building) return;
    building.hp -= amount;

    if (building.hp <= 0) {
      this.destroy(building);
      return true;
    }
    return false;
  },

  /* ==================== ÇİZİM ==================== */
  draw(ctx, camX, camY, darkness) {
    if (!game.buildings || game.buildings.length === 0) return;

    // Y-sıralı derinlik
    const sorted = [...game.buildings].sort((a, b) => a.y - b.y);

    // Viewport culling
    const visible = sorted.filter(b => {
      const sx = b.x - camX;
      const sy = b.y - camY;
      return sx > -100 && sx < W + 100 && sy > -100 && sy < H + 100;
    });

    visible.forEach(b => {
      this.drawBuilding(ctx, b, b.x - camX, b.y - camY, darkness);
    });
  },

  drawBuilding(ctx, b, sx, sy, darkness) {
    ctx.save();
    ctx.translate(sx, sy);

    const size = b.size || 40;
    const half = size / 2;

    // Gölge
    ctx.fillStyle = `rgba(0,0,0,${0.3 * darkness})`;
    ctx.beginPath();
    ctx.ellipse(0, half * 0.6, half * 0.9, half * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (b.isFloor) {
      // Zemin - yere yayılmış
      const color = b.type === 'floor_wood'
        ? `rgba(139, 90, 60, ${darkness})`
        : `rgba(100, 100, 110, ${darkness})`;

      ctx.fillStyle = color;
      ctx.fillRect(-half, -half * 0.6, size, size * 0.6);

      // Grid çizgileri
      ctx.strokeStyle = `rgba(0,0,0,${0.3 * darkness})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(-half, -half * 0.6, size, size * 0.6);

      // Tahta deseni
      if (b.type === 'floor_wood') {
        ctx.beginPath();
        ctx.moveTo(-half, 0);
        ctx.lineTo(half, 0);
        ctx.stroke();
      }
    }
    else if (b.isWall) {
      // Duvar - yukarı doğru
      const color = b.type === 'wall_wood'
        ? `rgba(139, 90, 60, ${darkness})`
        : `rgba(120, 120, 130, ${darkness})`;

      // Ana gövde (yukarı)
      ctx.fillStyle = color;
      ctx.fillRect(-half, -size, size, size);

      // Üst kısım (daha açık - ışık)
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * darkness})`;
      ctx.fillRect(-half, -size, size, 5);

      // Alt kenar (koyu - gölge)
      ctx.fillStyle = `rgba(0, 0, 0, ${0.25 * darkness})`;
      ctx.fillRect(-half, -2, size, 4);

      // Kenar çizgisi
      ctx.strokeStyle = `rgba(0,0,0,${0.3 * darkness})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(-half, -size, size, size);

      // Ahşap deseni
      if (b.type === 'wall_wood') {
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(0, 0);
        ctx.stroke();
      }
      // Taş deseni
      else {
        ctx.beginPath();
        ctx.moveTo(-half, -size/2);
        ctx.lineTo(half, -size/2);
        ctx.stroke();
      }
    }
    else if (b.isDoor) {
      ctx.fillStyle = `rgba(139, 90, 60, ${darkness})`;
      ctx.fillRect(-half, -size, size, size);

      // Kapı kolu
      ctx.fillStyle = `rgba(200, 180, 100, ${darkness})`;
      ctx.beginPath();
      ctx.arc(half - 6, -size/2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Alt kenar
      ctx.fillStyle = `rgba(0, 0, 0, ${0.2 * darkness})`;
      ctx.fillRect(-half, -2, size, 4);
    }
    else if (b.isWindow) {
      ctx.fillStyle = `rgba(139, 90, 60, ${darkness})`;
      ctx.fillRect(-half, -size, size, size);

      // Cam
      ctx.fillStyle = `rgba(150, 200, 240, ${darkness * 0.7})`;
      ctx.fillRect(-half + 5, -size + 5, size - 10, size - 10);

      // Cam parlaması
      ctx.fillStyle = `rgba(255, 255, 255, ${darkness * 0.3})`;
      ctx.beginPath();
      ctx.moveTo(-half + 5, -size + 5);
      ctx.lineTo(-half + 15, -size + 5);
      ctx.lineTo(-half + 5, -size + 15);
      ctx.closePath();
      ctx.fill();
    }
    else if (b.isRoof) {
      // Üçgen çatı
      ctx.fillStyle = `rgba(150, 80, 40, ${darkness})`;
      ctx.beginPath();
      ctx.moveTo(-half, -size * 0.5);
      ctx.lineTo(0, -size * 1.2);
      ctx.lineTo(half, -size * 0.5);
      ctx.closePath();
      ctx.fill();

      // Çatı kenarı
      ctx.strokeStyle = `rgba(0,0,0,${0.4 * darkness})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    else if (b.isFence) {
      ctx.fillStyle = `rgba(139, 90, 60, ${darkness})`;

      // Direkler
      ctx.fillRect(-half * 0.9, -size * 0.6, size * 0.1, size * 0.7);
      ctx.fillRect(half * 0.8, -size * 0.6, size * 0.1, size * 0.7);

      // Yatay çubuklar
      ctx.fillRect(-half * 0.9, -size * 0.5, size * 1.8, size * 0.08);
      ctx.fillRect(-half * 0.9, -size * 0.2, size * 1.8, size * 0.08);
    }
    else if (b.isTorch) {
      // Direk
      ctx.fillStyle = `rgba(80, 50, 30, ${darkness})`;
      ctx.fillRect(-2, -30, 4, 30);

      // Alev (animasyonlu)
      b.animTime = (b.animTime || 0) + 0.15;
      const flicker = Math.sin(b.animTime) * 3;

      // Işık halkası
      if (b.light) {
        const glow = ctx.createRadialGradient(0, -35, 0, 0, -35, b.light);
        glow.addColorStop(0, `rgba(255, 200, 80, ${0.4 * darkness})`);
        glow.addColorStop(0.5, `rgba(255, 150, 50, ${0.15 * darkness})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, -35, b.light, 0, Math.PI * 2);
        ctx.fill();
      }

      // Alev
      ctx.fillStyle = `rgba(255, 200, 80, ${darkness})`;
      ctx.beginPath();
      ctx.moveTo(-6 + flicker, -30);
      ctx.quadraticCurveTo(-3 + flicker, -40, 0 + flicker, -45);
      ctx.quadraticCurveTo(3 + flicker, -40, 6 + flicker, -30);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 240, 200, ${darkness})`;
      ctx.beginPath();
      ctx.arc(0 + flicker, -35, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (b.isChest) {
      ctx.fillStyle = `rgba(139, 90, 60, ${darkness})`;
      ctx.fillRect(-half, -size * 0.6, size, size * 0.6);

      // Kilit
      ctx.fillStyle = `rgba(200, 170, 80, ${darkness})`;
      ctx.fillRect(-half, -size * 0.35, size, 4);
      ctx.beginPath();
      ctx.arc(0, -size * 0.32, 3, 0, Math.PI * 2);
      ctx.fill();

      // Kenar
      ctx.strokeStyle = `rgba(0,0,0,${0.3 * darkness})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(-half, -size * 0.6, size, size * 0.6);
    }

    // HP bar (hasarlıysa)
    if (b.hp < b.maxHp) {
      ctx.fillStyle = `rgba(0,0,0,${0.7 * darkness})`;
      ctx.fillRect(-half, -size - 8, size, 4);
      ctx.fillStyle = `rgba(255, 8, 68, ${darkness})`;
      ctx.fillRect(-half, -size - 8, size * (b.hp / b.maxHp), 4);
    }

    ctx.restore();
  }
};

/* ==================== GLOBAL EXPORT ==================== */
window.BUILD_ITEMS = BUILD_ITEMS;
window.BuildingSystem = BuildingSystem;

console.log('✅ building.js yüklendi');