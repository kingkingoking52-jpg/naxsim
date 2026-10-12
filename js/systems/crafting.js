/* ==========================================
   ORION FOREST v6.0 - CRAFTING
   Zanaat sistemi (eşya yapımı)
   ========================================== */

'use strict';

/* ==================== TARİFLER ==================== */
const RECIPES = {
  // Araçlar
  axe: {
    name: '🪓 Balta',
    cost: { odun: 3, tas: 2 },
    give: { balta: 1 },
    equip: 'axe'
  },
  bow: {
    name: '🏹 Yay',
    cost: { odun: 5, ip: 3 },
    give: { yay: 1 }
  },
  sword: {
    name: '🗡️ Kılıç',
    cost: { odun: 4, tas: 4, ip: 2 },
    give: { kilic: 1 },
    equip: 'sword'
  },
  pickaxe: {
    name: '⛏️ Kazma',
    cost: { odun: 3, tas: 4 },
    give: { kazma: 1 }
  },
  fishingrod: {
    name: '🎣 Olta',
    cost: { odun: 3, ip: 2 },
    give: { olta: 1 }
  },
  rope: {
    name: '🧵 İp',
    cost: { yaprak: 5 },
    give: { ip: 1 }
  },

  // Yapılar (hazır)
  shelter: {
    name: '🛖 Barınak',
    cost: { odun: 20, yaprak: 10 },
    heal: 40
  },
  bed: {
    name: '🛏️ Yatak',
    cost: { odun: 10, yaprak: 5 },
    heal: 20
  },

  // Yemek
  cookedMeat: {
    name: '🍖 Pişmiş Et',
    cost: { cig_et: 1 },
    give: { pismis_et: 1 }
  },
  cookedFish: {
    name: '🐠 Pişmiş Balık',
    cost: { balik: 1 },
    give: { pismis_balik: 1 }
  }
};

/* ==================== ZANAAT SİSTEMİ ==================== */
const CraftingSystem = {

  /* ==================== RENDER ==================== */
  render() {
    const list = $('craftList');
    if (!list) return;

    list.innerHTML = '';

    for (const [id, recipe] of Object.entries(RECIPES)) {
      const costStr = Object.entries(recipe.cost)
        .map(([k, v]) => {
          const item = ITEM_DATA[k];
          return `${item?.icon || '📦'} ${v}`;
        })
        .join(' + ');

      const div = document.createElement('div');
      div.className = 'craft-item';
      div.innerHTML = `
        <div class="info">
          <div class="name">${recipe.name}</div>
          <div class="cost">${costStr}</div>
        </div>
        <button data-craft="${id}">YAP</button>
      `;

      list.appendChild(div);
    }

    // Buton dinleyicileri
    list.querySelectorAll('[data-craft]').forEach(btn => {
      btn.onclick = () => this.craft(btn.dataset.craft);
    });

    this.updateButtons();
  },

  /* ==================== BUTON GÜNCELLE ==================== */
  updateButtons() {
    if (typeof game === 'undefined' || !game.player) return;

    $$('[data-craft]').forEach(btn => {
      const recipe = RECIPES[btn.dataset.craft];
      if (!recipe) return;

      let canCraft = true;
      for (const [item, amount] of Object.entries(recipe.cost)) {
        if ((game.player.inventory[item] || 0) < amount) {
          canCraft = false;
          break;
        }
      }
      btn.disabled = !canCraft;
    });
  },

  /* ==================== ZANAAT YAP ==================== */
  craft(id) {
    const recipe = RECIPES[id];
    if (!recipe) return;

    if (typeof game === 'undefined' || !game.player) return;

    const inv = game.player.inventory;

    // Kaynak kontrolü
    for (const [item, amount] of Object.entries(recipe.cost)) {
      if ((inv[item] || 0) < amount) {
        showToast('Yetersiz kaynak!', 'error');
        return;
      }
    }

    // Kaynakları çıkar
    for (const [item, amount] of Object.entries(recipe.cost)) {
      inv[item] -= amount;
    }

    // Ses çal
    if (audio && audio.craft) audio.craft();

    // Eşya ver
    if (recipe.give) {
      for (const [item, amount] of Object.entries(recipe.give)) {
        inv[item] = (inv[item] || 0) + amount;
        showToast(`✅ ${recipe.name} yapıldı!`, 'success');

        if (recipe.equip) {
          game.player.equipped = recipe.equip;
        }
      }
    }

    // İyileştirme
    if (recipe.heal) {
      game.player.health = Math.min(game.player.maxHealth, game.player.health + recipe.heal);
      showToast(`💚 ${recipe.name} inşa edildi! +${recipe.heal} HP`, 'success');
    }

    // XP
    game.player.xp += 10;
    if (typeof checkLevelUp === 'function') checkLevelUp();

    updateUI();
    this.render();
  },

  /* ==================== ÖZEL: KAMP ATEŞİ ==================== */
  placeCampfire() {
    if (typeof game === 'undefined' || !game.player) return;

    const inv = game.player.inventory;

    // 3 odun gerekli
    if (inv.odun < 3) {
      showToast('3 odun gerekli!', 'warning');
      return;
    }

    inv.odun -= 3;

    // Oyuncunun yanına kamp ateşi koy
    const angle = game.player.facing > 0 ? 0 : Math.PI;
    const fx = game.player.x + Math.cos(angle) * 80;
    const fy = game.player.y + Math.sin(angle) * 80;

    if (!game.campfires) game.campfires = [];

    game.campfires.push({
      x: fx,
      y: fy,
      lit: true,
      fuel: 60,
      animTime: 0
    });

    // Ana kamp ateşi varsa taşıyalım
    if (game.world.campfire && !game.world.campfire.lit) {
      // İlk kamp ateşi ana olsun
      game.world.campfire = game.campfires[0];
    }

    if (audio && audio.fire) audio.fire();
    addMessage('🔥 Kamp ateşi kuruldu!');

    if (typeof AchievementSystem !== 'undefined') {
      AchievementSystem.unlock('firstFire');
    }

    updateUI();
    this.render();
  },

  /* ==================== KAMP ATEŞİNİ TAŞI ==================== */
  moveCampfire() {
    if (typeof game === 'undefined' || !game.world.campfire) return;

    const cf = game.world.campfire;

    // Yeni konum: oyuncunun önünde
    const angle = game.player.facing > 0 ? 0 : Math.PI;
    cf.x = game.player.x + Math.cos(angle) * 60;
    cf.y = game.player.y + Math.sin(angle) * 60;

    // Kamp alanı güncelle
    if (typeof CAMP_X !== 'undefined') {
      // Global değişkenler const olduğu için kullanılmıyor
      // Ana kamp konumu sadece başlangıçta ayarlanır
    }

    addMessage('🔥 Kamp ateşi taşındı!');
    if (audio && audio.click) audio.click();
  }
};

/* ==================== GLOBAL EXPORT ==================== */
window.RECIPES = RECIPES;
window.CraftingSystem = CraftingSystem;

console.log('✅ crafting.js yüklendi');