/* ==========================================
   ORION FOREST v6.0 - INVENTORY
   Envanter sistemi + item verileri
   ========================================== */

'use strict';

/* ==================== ITEM VERİLERİ ==================== */
const ITEM_DATA = {
  // Kaynaklar
  odun:    { icon: '🪵', name: 'Odun',    cat: 'resource', desc: 'Yapı malzemesi, ağaçlardan toplanır' },
  tas:     { icon: '🪨', name: 'Taş',     cat: 'resource', desc: 'Alet yapımı ve inşa için' },
  yaprak:  { icon: '🍃', name: 'Yaprak',  cat: 'resource', desc: 'İnşa malzemesi' },
  ip:      { icon: '🧵', name: 'İp',      cat: 'resource', desc: 'Birleştirme ve zanaat' },
  cali:    { icon: '🌿', name: 'Çalı',    cat: 'resource', desc: 'Ateş yakmak için ideal' },

  // Yemek
  elma:        { icon: '🍎', name: 'Elma',        cat: 'food', hunger: 20, thirst: 5,  desc: '+20 Açlık, +5 Susuzluk' },
  cilek:       { icon: '🍓', name: 'Çilek',       cat: 'food', hunger: 10, thirst: 3,  desc: '+10 Açlık, +3 Susuzluk' },
  mantar:      { icon: '🍄', name: 'Mantar',      cat: 'food', hunger: 12,             desc: '+12 Açlık' },
  cig_et:      { icon: '🥩', name: 'Çiğ Et',      cat: 'food', hunger: 15, hp: -5,     desc: '+15 Açlık, -5 HP (riskli)' },
  pismis_et:   { icon: '🍖', name: 'Pişmiş Et',   cat: 'food', hunger: 40, thirst: 5,  desc: '+40 Açlık, +5 Susuzluk' },
  su:          { icon: '💧', name: 'Su',          cat: 'food', thirst: 30,             desc: '+30 Susuzluk' },
  balik:       { icon: '🐟', name: 'Çiğ Balık',   cat: 'food', hunger: 12, hp: -3,     desc: '+12 Açlık, -3 HP' },
  pismis_balik:{ icon: '🐠', name: 'Pişmiş Balık',cat: 'food', hunger: 35, thirst: 5,  desc: '+35 Açlık, +5 Susuzluk' },
  bugday:      { icon: '🌾', name: 'Buğday',      cat: 'food', hunger: 15,             desc: '+15 Açlık' },
  havuc:       { icon: '🥕', name: 'Havuç',       cat: 'food', hunger: 18,             desc: '+18 Açlık' },
  patates:     { icon: '🥔', name: 'Patates',     cat: 'food', hunger: 22,             desc: '+22 Açlık' },

  // Aletler
  balta:   { icon: '🪓', name: 'Balta',   cat: 'tool', equip: 'axe',   desc: 'Ağaç kesme aleti (hasar: 2)' },
  yay:     { icon: '🏹', name: 'Yay',     cat: 'tool',                 desc: 'Uzaktan saldırı' },
  kilic:   { icon: '🗡️', name: 'Kılıç',   cat: 'tool', equip: 'sword', desc: 'Güçlü silah (hasar: 3)' },
  kazma:   { icon: '⛏️', name: 'Kazma',   cat: 'tool',                 desc: 'Madencilik için' },
  olta:    { icon: '🎣', name: 'Olta',    cat: 'tool',                 desc: 'Balık tutma aleti' },

  // Tohumlar
  tohum_bugday:  { icon: '🌾', name: 'Buğday Tohumu',  cat: 'seed', plant: 'bugday',  growth: 30, desc: 'Buğday yetiştirir' },
  tohum_havuc:   { icon: '🥕', name: 'Havuç Tohumu',   cat: 'seed', plant: 'havuc',   growth: 25, desc: 'Havuç yetiştirir' },
  tohum_patates: { icon: '🥔', name: 'Patates Tohumu', cat: 'seed', plant: 'patates', growth: 35, desc: 'Patates yetiştirir' }
};

/* ==================== ENVANTER SİSTEMİ ==================== */
const InventorySystem = {

  /* ==================== RENDER ==================== */
  render() {
    const grid = $('invGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const category = (typeof game !== 'undefined' && game.inventoryCategory) ? game.inventoryCategory : 'all';
    const inventory = (typeof game !== 'undefined' && game.player) ? game.player.inventory : {};

    const items = [];
    for (const [id, count] of Object.entries(inventory)) {
      if (count > 0 && ITEM_DATA[id]) {
        const data = ITEM_DATA[id];
        if (category !== 'all' && data.cat !== category) continue;
        items.push({ id, count, ...data });
      }
    }

    if (items.length === 0) {
      grid.innerHTML = '<div class="inv-empty">📦 Envanter boş</div>';
      return;
    }

    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'inv-slot-btn';
      btn.innerHTML = `
        <span class="item-icon">${item.icon}</span>
        <span class="item-count">${item.count}</span>
        <span class="item-name">${item.name}</span>
      `;
      btn.onclick = () => {
        this.select(item);
        if (audio && audio.click) audio.click();
      };
      grid.appendChild(btn);
    });
  },

  /* ==================== SEÇİM ==================== */
  select(item) {
    const info = $('invItemInfo');
    if (!info) return;

    info.classList.add('show');

    let html = `<h4>${item.icon} ${item.name}</h4><p>${item.desc || ''}</p>`;

    if (item.cat === 'food') {
      html += `<button class="setting-btn" style="margin-top:8px" onclick="InventorySystem.useFood('${item.id}')">🍴 YE</button>`;
    }

    if (item.cat === 'seed') {
      html += `<button class="setting-btn" style="margin-top:8px" onclick="InventorySystem.plantSeed('${item.id}')">🌱 EK</button>`;
    }

    if (item.cat === 'tool' && item.equip) {
      const equipped = game.player.equipped === item.equip;
      html += `<button class="setting-btn" style="margin-top:8px" onclick="InventorySystem.equipItem('${item.equip}')">${equipped ? '❌ ÇIKAR' : '⚔️ KUŞAN'}</button>`;
    }

    info.innerHTML = html;
  },

  /* ==================== YEMEK YEME ==================== */
  useFood(itemId) {
    if (typeof game === 'undefined' || !game.player) return;
    const item = ITEM_DATA[itemId];
    if (!item || game.player.inventory[itemId] <= 0) return;

    game.player.inventory[itemId]--;

    if (item.hunger) {
      game.player.hunger = Math.min(game.player.maxHunger || 100, game.player.hunger + item.hunger);
    }
    if (item.thirst) {
      game.player.thirst = Math.min(game.player.maxThirst || 100, game.player.thirst + item.thirst);
    }
    if (item.hp) {
      game.player.health = Math.max(1, game.player.health + item.hp);
    }

    addMessage(`🍴 ${item.name} yedin!`);
    if (audio && audio.eat) audio.eat();
    updateUI();
    this.render();
  },

  /* ==================== EKİPMAN ==================== */
  equipItem(type) {
    if (typeof game === 'undefined' || !game.player) return;

    game.player.equipped = game.player.equipped === type ? null : type;
    const msg = game.player.equipped ? `⚔️ ${type} kuşanıldı` : 'Ekipman çıkarıldı';
    addMessage(msg);
    if (audio && audio.click) audio.click();
    this.render();
  },

  /* ==================== TOHUM EKME ==================== */
  plantSeed(seedId) {
    if (typeof game === 'undefined' || !game.player) return;

    const seed = ITEM_DATA[seedId];
    if (!seed || game.player.inventory[seedId] <= 0) {
      showToast('Tohum yok!', 'error');
      return;
    }

    game.player.inventory[seedId]--;

    game.crops.push({
      x: game.player.x + (Math.random() - 0.5) * 60,
      y: game.player.y + (Math.random() - 0.5) * 60,
      type: seed.plant,
      growth: 0,
      requiredGrowth: seed.growth,
      water: 50,
      planted: Date.now()
    });

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

    // Tarım paneli aç
    const fp = $('farmPanel');
    if (fp && typeof renderFarmList === 'function') {
      renderFarmList();
      fp.classList.add('open');
    }
  },

  /* ==================== HASAT ==================== */
  harvest(index) {
    if (typeof game === 'undefined') return;

    const crop = game.crops[index];
    if (!crop) return;

    const data = ITEM_DATA[crop.type];
    if (!data) return;

    if (crop.growth < crop.requiredGrowth) {
      showToast('Henüz hazır değil!', 'warning');
      return;
    }

    const amount = 1 + Math.floor(Math.random() * 2);
    game.player.inventory[crop.type] = (game.player.inventory[crop.type] || 0) + amount;

    game.player.stats.harvests++;

    if (game.player.stats.harvests === 1) AchievementSystem.unlock('firstHarvest');
    if (game.player.stats.harvests >= 10) AchievementSystem.unlock('farm10');
    if (game.player.stats.harvests >= 50) AchievementSystem.unlock('farm50');

    game.crops.splice(index, 1);

    if (audio && audio.success) audio.success();
    addMessage(`🌾 ${data.icon} x${amount} hasat edildi!`);

    game.player.xp += 10;
    if (typeof checkLevelUp === 'function') checkLevelUp();

    updateUI();

    if (typeof renderFarmList === 'function') renderFarmList();
  },

  /* ==================== EKLE ==================== */
  addItem(itemId, amount = 1) {
    if (typeof game === 'undefined' || !game.player) return;
    if (!ITEM_DATA[itemId]) return false;

    game.player.inventory[itemId] = (game.player.inventory[itemId] || 0) + amount;
    return true;
  },

  /* ==================== ÇIKAR ==================== */
  removeItem(itemId, amount = 1) {
    if (typeof game === 'undefined' || !game.player) return false;
    if ((game.player.inventory[itemId] || 0) < amount) return false;

    game.player.inventory[itemId] -= amount;
    return true;
  },

  /* ==================== KONTROL ==================== */
  hasItem(itemId, amount = 1) {
    if (typeof game === 'undefined' || !game.player) return false;
    return (game.player.inventory[itemId] || 0) >= amount;
  },

  /* ==================== KATEGORİ DEĞİŞTİR ==================== */
  setCategory(cat) {
    if (typeof game !== 'undefined') {
      game.inventoryCategory = cat;
    }
    this.render();
  },

  /* ==================== KATEGORİ TABLARI ==================== */
  initTabs() {
    $$('.inv-tab').forEach(tab => {
      tab.onclick = () => {
        if (audio && audio.click) audio.click();
        $$('.inv-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.setCategory(tab.dataset.cat);
      };
    });
  }
};

/* ==================== GLOBAL EXPORT ==================== */
window.ITEM_DATA = ITEM_DATA;
window.InventorySystem = InventorySystem;

// Kısayol fonksiyonları (eski kod ile uyumluluk)
window.useFood = (id) => InventorySystem.useFood(id);
window.equipItem = (type) => InventorySystem.equipItem(type);
window.startPlanting = (id) => InventorySystem.plantSeed(id);
window.harvestCrop = (index) => InventorySystem.harvest(index);

console.log('✅ inventory.js yüklendi');