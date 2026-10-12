/* ==========================================
   ORION FOREST v6.3 - STRUCTURES
   NPC kampları: kampa UZAK, kümeler halinde
   ========================================== */

'use strict';

/* ==================== YAPI TİPLERİ ==================== */
const STRUCTURE_TYPES = {
  house: {
    icon: '🏠',
    name: 'Terk Edilmiş Ev',
    size: 80,
    minDist: 1500,     // ✅ Kampa en az 1500 birim uzak
    loot: ['odun', 'tas', 'ip', 'elma', 'pismis_et', 'balta'],
    lootCount: [2, 5],
    npcChance: 0.7,
    enemyChance: 0.15,
    hasChest: true
  },
  camp: {
    icon: '🏕️',
    name: 'Eski Kamp',
    size: 60,
    minDist: 1200,
    loot: ['odun', 'cali', 'cig_et', 'mushroom', 'su'],
    lootCount: [1, 3],
    npcChance: 0.7,
    enemyChance: 0.2,
    hasChest: false
  },
  cave: {
    icon: '🕳️',
    name: 'Mağara',
    size: 100,
    minDist: 2000,
    loot: ['tas', 'cig_et', 'mantar', 'su'],
    lootCount: [2, 4],
    npcChance: 0.3,
    enemyChance: 0.5,
    hasChest: true
  },
  tower: {
    icon: '🗼',
    name: 'Gözcü Kulesi',
    size: 70,
    minDist: 2500,
    loot: ['ip', 'balta', 'kilic', 'pismis_et', 'elma'],
    lootCount: [3, 6],
    npcChance: 0.9,
    enemyChance: 0.3,
    hasChest: true
  },
  ruins: {
    icon: '🏛️',
    name: 'Harabe',
    size: 90,
    minDist: 1800,
    loot: ['tas', 'ip', 'balta', 'kazma', 'pismis_et'],
    lootCount: [2, 5],
    npcChance: 0.6,
    enemyChance: 0.4,
    hasChest: true
  }
};

/* ==================== ANA KAMP GÜVENLİ BÖLGE ==================== */
const SAFE_ZONE_RADIUS = 700; // Kampın 700 birim çevresinde yapı YOK

/* ==================== YAPI SİSTEMİ ==================== */
const StructureSystem = {
  structures: [],

  /* ==================== DÜNYAYA YERLEŞTİR ==================== */
  generate() {
    this.structures = [];
    const count = 45;

    // ✅ KÜME SİSTEMİ: Belirli merkez noktalara yapı kümeleri
    const clusterCount = 8; // 8 küme (her kümede 4-7 yapı)

    for (let c = 0; c < clusterCount; c++) {
      this.spawnCluster();
    }

    // Kalan yapıları rastgele serpiştir
    const remaining = count - this.structures.length;
    for (let i = 0; i < remaining; i++) {
      this.spawnRandom();
    }

    console.log(`🏠 ${this.structures.length} yapı oluşturuldu (${this.structures.filter(s => s.npc).length} NPC) - ${clusterCount} küme`);
  },

  /* ==================== YAPI KÜMESİ OLUŞTUR ==================== */
  spawnCluster() {
    // Küme merkezini bul
    let centerX, centerY;
    let valid = false;

    for (let attempt = 0; attempt < 30; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 1500 + Math.random() * 2500;
      centerX = CAMP_X + Math.cos(angle) * dist;
      centerY = CAMP_Y + Math.sin(angle) * dist;

      // Sınır kontrolü
      if (centerX < 500 || centerX > WORLD_SIZE - 500) continue;
      if (centerY < 500 || centerY > WORLD_SIZE - 500) continue;

      // Ana kamptan yeterince uzak mı?
      if (Math.hypot(centerX - CAMP_X, centerY - CAMP_Y) < SAFE_ZONE_RADIUS + 800) continue;

      // Diğer kümelere çok yakın mı?
      valid = true;
      for (const s of this.structures) {
        if (Math.hypot(s.x - centerX, s.y - centerY) < 800) {
          valid = false;
          break;
        }
      }
      if (valid) break;
    }

    if (!valid) return null;

    // Bu kümede 4-7 yapı oluştur
    const clusterSize = 4 + Math.floor(Math.random() * 4);

    for (let i = 0; i < clusterSize; i++) {
      // Küme merkezinden rastgele uzaklıkta (100-350 birim)
      const angle = Math.random() * Math.PI * 2;
      const dist = 100 + Math.random() * 250;
      const x = centerX + Math.cos(angle) * dist;
      const y = centerY + Math.sin(angle) * dist;

      // Sınır kontrolü
      if (x < 300 || x > WORLD_SIZE - 300) continue;
      if (y < 300 || y > WORLD_SIZE - 300) continue;

      // Aynı kümedeki diğer yapılarla çok yakın olmasın
      let tooClose = false;
      for (const s of this.structures) {
        if (Math.hypot(s.x - x, s.y - y) < 150) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      // Yapı tipi seç
      const types = Object.entries(STRUCTURE_TYPES);
      const [key, type] = pickRandom(types);

      const structure = {
        id: Math.random(),
        type: key,
        ...type,
        x, y,
        looted: false,
        visited: false,
        npc: null,
        enemy: null,
        chestOpened: false,
        clusterId: Math.random()
      };

      structure.loot = this.generateLoot(type);

      // NPC olasılığı
      if (Math.random() < type.npcChance) {
        structure.npc = this.generateNPC(structure);
      }

      // Yaratık olasılığı
      if (Math.random() < type.enemyChance) {
        structure.enemy = this.generateEnemy(structure);
      }

      this.structures.push(structure);
    }
  },

  /* ==================== RASTGELE SPAWN ==================== */
  spawnRandom() {
    const types = Object.entries(STRUCTURE_TYPES);
    const [key, type] = pickRandom(types);

    for (let attempt = 0; attempt < 30; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = type.minDist + Math.random() * 2000;
      const x = CAMP_X + Math.cos(angle) * dist;
      const y = CAMP_Y + Math.sin(angle) * dist;

      // Sınır kontrolü
      if (x < 300 || x > WORLD_SIZE - 300) continue;
      if (y < 300 || y > WORLD_SIZE - 300) continue;

      // ✅ Ana kamptan yeterince uzak mı?
      if (Math.hypot(x - CAMP_X, y - CAMP_Y) < SAFE_ZONE_RADIUS) continue;

      // Diğer yapılardan uzak mı?
      let tooClose = false;
      for (const s of this.structures) {
        if (Math.hypot(s.x - x, s.y - y) < 200) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      const structure = {
        id: Math.random(),
        type: key,
        ...type,
        x, y,
        looted: false,
        visited: false,
        npc: null,
        enemy: null,
        chestOpened: false
      };

      structure.loot = this.generateLoot(type);

      if (Math.random() < type.npcChance) {
        structure.npc = this.generateNPC(structure);
      }

      if (Math.random() < type.enemyChance) {
        structure.enemy = this.generateEnemy(structure);
      }

      this.structures.push(structure);
      return structure;
    }

    return null;
  },

  /* ==================== LOOT ÜRET ==================== */
  generateLoot(type) {
    const loot = [];
    const count = randomInt(type.lootCount[0], type.lootCount[1]);

    for (let i = 0; i < count; i++) {
      const item = pickRandom(type.loot);
      const amount = randomInt(1, 3);
      loot.push({ item, amount, taken: false });
    }

    return loot;
  },

  /* ==================== NPC ÜRET ==================== */
  generateNPC(structure) {
    const npcTypes = ['friendly', 'trader', 'witch', 'hostile'];
    const weights = [4, 2, 1, 2];

    let total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let selectedType = 'friendly';

    for (let i = 0; i < npcTypes.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        selectedType = npcTypes[i];
        break;
      }
    }

    return {
      type: selectedType,
      x: structure.x + randomRange(-30, 30),
      y: structure.y + randomRange(-30, 30),
      hp: 5,
      maxHp: 5,
      friendly: selectedType === 'friendly' || selectedType === 'trader',
      talked: false,
      dead: false,
      quest: selectedType === 'friendly' ? this.generateQuest() : null,
      buyItems: selectedType === 'trader' ? ['balta', 'kilic', 'pismis_et', 'su'] : null,
      witchEffect: selectedType === 'witch' ? (Math.random() < 0.5 ? 'good' : 'bad') : null
    };
  },

  generateQuest() {
    const quests = [
      { type: 'wood', need: 10, reward: 'pismis_et', rewardAmount: 2, desc: '10 odun getir' },
      { type: 'stone', need: 8, reward: 'kilic', rewardAmount: 1, desc: '8 taş getir' },
      { type: 'meat', need: 5, reward: 'altin', rewardAmount: 3, desc: '5 çiğ et getir' }
    ];
    return { ...pickRandom(quests), done: false };
  },

  /* ==================== YARATIK ÜRET ==================== */
  generateEnemy(structure) {
    const t = pickRandom(ENEMY_TYPES);
    return {
      ...t,
      x: structure.x + randomRange(-40, 40),
      y: structure.y + randomRange(-40, 40),
      maxHp: t.hp,
      hp: t.hp,
      attackCooldown: 0,
      facing: 1,
      stateTime: 0,
      animation: { frame: 0, time: 0 },
      fromStructure: structure.id
    };
  },

  /* ==================== ETKİLEŞİM ==================== */
  interact(structure) {
    if (!structure) return;
    structure.visited = true;
  },

  /* ==================== LOOT AL ==================== */
  takeLoot(structure, lootIndex) {
    if (!structure || !structure.loot[lootIndex]) return;
    const loot = structure.loot[lootIndex];
    if (loot.taken) return;

    loot.taken = true;
    game.player.inventory[loot.item] = (game.player.inventory[loot.item] || 0) + loot.amount;

    addMessage(`📦 ${ITEM_DATA[loot.item]?.icon || ''} ${loot.item} x${loot.amount}`);
    if (audio && audio.collect) audio.collect();
    updateUI();
  },

  /* ==================== SANDIK AÇ ==================== */
  openChest(structure) {
    if (!structure || !structure.hasChest || structure.chestOpened) return;
    structure.chestOpened = true;

    const rareLoot = ['kilic', 'kazma', 'yay', 'pismis_et', 'su'];
    const item = pickRandom(rareLoot);
    const amount = randomInt(1, 3);

    game.player.inventory[item] = (game.player.inventory[item] || 0) + amount;
    addMessage(`📦 SANDIK: ${ITEM_DATA[item]?.icon || ''} ${item} x${amount}`);
    if (audio && audio.success) audio.success();
    updateUI();
  },

  /* ==================== YAPILARI GÜNCELLE ==================== */
  update(dt) {
    this.structures.forEach(s => {
      if (s.enemy) {
        const distToPlayer = Math.hypot(s.enemy.x - game.player.x, s.enemy.y - game.player.y);
        if (distToPlayer < 400) {
          const dx = game.player.x - s.enemy.x;
          const dy = game.player.y - s.enemy.y;
          const d = Math.hypot(dx, dy);
          if (d > 25) {
            s.enemy.x += (dx / d) * s.enemy.speed;
            s.enemy.y += (dy / d) * s.enemy.speed;
            s.enemy.facing = dx > 0 ? 1 : -1;
          }

          s.enemy.attackCooldown = Math.max(0, s.enemy.attackCooldown - dt);
          if (d < 30 && s.enemy.attackCooldown <= 0) {
            damagePlayer(s.enemy.damage, 'Yaratık saldırısı');
            s.enemy.attackCooldown = 1.5;
          }
        }
      }
    });
  },

  /* ==================== ÇİZİM ==================== */
  draw(ctx, camX, camY, darkness) {
    this.structures.forEach(s => {
      const sx = s.x - camX;
      const sy = s.y - camY;

      if (sx < -200 || sx > W + 200 || sy < -200 || sy > H + 200) return;

      this.drawStructure(ctx, s, sx, sy, darkness, camX, camY);
    });
  },

  drawStructure(ctx, s, sx, sy, darkness, camX, camY) {
    ctx.save();
    ctx.translate(sx, sy);

    const size = s.size || 80;

    if (s.type === 'house') {
      ctx.fillStyle = `rgba(90, 60, 40, ${darkness})`;
      ctx.fillRect(-size/2, -size/2, size, size);

      ctx.fillStyle = `rgba(120, 80, 55, ${darkness})`;
      ctx.fillRect(-size/2, -size*0.9, size, size*0.5);

      ctx.fillStyle = `rgba(80, 40, 30, ${darkness})`;
      ctx.beginPath();
      ctx.moveTo(-size/2 - 10, -size*0.9);
      ctx.lineTo(0, -size*1.3);
      ctx.lineTo(size/2 + 10, -size*0.9);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = `rgba(60, 40, 25, ${darkness})`;
      ctx.fillRect(-size*0.15, -size*0.5, size*0.3, size*0.4);

      ctx.fillStyle = `rgba(255, 220, 100, ${darkness * 0.4})`;
      ctx.fillRect(-size*0.35, -size*0.7, size*0.15, size*0.15);
      ctx.fillRect(size*0.2, -size*0.7, size*0.15, size*0.15);
    }
    else if (s.type === 'camp') {
      ctx.fillStyle = `rgba(70, 55, 35, ${darkness})`;
      ctx.beginPath();
      ctx.arc(0, 0, size*0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(80, 60, 40, ${darkness})`;
      ctx.beginPath();
      ctx.moveTo(-size*0.3, 0);
      ctx.lineTo(0, -size*0.6);
      ctx.lineTo(size*0.3, 0);
      ctx.closePath();
      ctx.fill();

      const flicker = Math.sin(Date.now() * 0.01) * 2;
      ctx.fillStyle = `rgba(255, 150, 50, ${darkness})`;
      ctx.beginPath();
      ctx.arc(size*0.3, size*0.1, 6 + flicker, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (s.type === 'cave') {
      ctx.fillStyle = `rgba(60, 55, 50, ${darkness})`;
      ctx.beginPath();
      ctx.arc(0, 0, size*0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(10, 10, 10, ${darkness})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, size*0.25, size*0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (s.type === 'tower') {
      ctx.fillStyle = `rgba(100, 90, 80, ${darkness})`;
      ctx.fillRect(-size*0.3, -size*1.2, size*0.6, size*1.2);

      ctx.fillStyle = `rgba(80, 70, 60, ${darkness})`;
      ctx.fillRect(-size*0.4, -size*1.3, size*0.8, size*0.15);

      ctx.fillStyle = `rgba(200, 50, 50, ${darkness})`;
      ctx.beginPath();
      ctx.moveTo(0, -size*1.3);
      ctx.lineTo(size*0.4, -size*1.45);
      ctx.lineTo(0, -size*1.55);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = `rgba(60, 40, 30, ${darkness})`;
      ctx.fillRect(-1, -size*1.6, 2, size*0.3);
    }
    else if (s.type === 'ruins') {
      ctx.fillStyle = `rgba(150, 140, 130, ${darkness})`;
      ctx.fillRect(-size*0.4, -size*0.7, size*0.15, size*0.7);
      ctx.fillRect(size*0.25, -size*0.5, size*0.15, size*0.5);
      ctx.fillRect(-size*0.1, -size*0.9, size*0.15, size*0.9);

      ctx.fillStyle = `rgba(120, 110, 100, ${darkness})`;
      ctx.fillRect(-size*0.5, 0, size, size*0.2);
    }

    // Sandık
    if (s.hasChest && !s.chestOpened) {
      ctx.fillStyle = `rgba(139, 90, 60, ${darkness})`;
      ctx.fillRect(size*0.3, size*0.2, 20, 15);
      ctx.fillStyle = `rgba(200, 170, 80, ${darkness})`;
      ctx.fillRect(size*0.3, size*0.25, 20, 3);

      if (Math.sin(Date.now() * 0.005) > 0.5) {
        ctx.fillStyle = `rgba(255, 220, 100, ${darkness * 0.5})`;
        ctx.beginPath();
        ctx.arc(size*0.3 + 10, size*0.2 + 7, 15, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Loot göstergesi
    const remainingLoot = s.loot ? s.loot.filter(l => !l.taken).length : 0;
    if (remainingLoot > 0 && !s.looted) {
      ctx.fillStyle = `rgba(76, 201, 240, ${darkness})`;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('📦', 0, -size * 0.8);
    }

    // İsim etiketi
    const distToPlayer = Math.hypot(s.x - game.player.x, s.y - game.player.y);
    if (distToPlayer < 300) {
      ctx.fillStyle = `rgba(76, 201, 240, ${darkness})`;
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(s.name, 0, -size * 1.5);

      if (s.npc && !s.npc.dead) {
        ctx.font = 'bold 22px Arial';
        ctx.fillText('💬', 0, -size * 1.9);
      }
    }

    ctx.restore();

    // NPC
    if (s.npc && !s.npc.dead) {
      this.drawNPC(ctx, s.npc, s.npc.x - camX, s.npc.y - camY, darkness);
    }

    // Yaratık
    if (s.enemy && s.enemy.hp > 0) {
      this.drawStructEnemy(ctx, s.enemy, s.enemy.x - camX, s.enemy.y - camY);
    }
  },

  drawNPC(ctx, npc, sx, sy, darkness) {
    ctx.save();
    ctx.translate(sx, sy);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 20, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    let color = '#8d5524';
    if (npc.type === 'trader') color = '#ffd700';
    else if (npc.type === 'witch') color = '#9370db';
    else if (npc.type === 'hostile') color = '#dc143c';
    else color = '#4cc9f0';

    ctx.fillStyle = color;
    ctx.fillRect(-8, -5, 16, 22);

    ctx.fillStyle = '#c68642';
    ctx.beginPath();
    ctx.arc(0, -15, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0a0e1a';
    ctx.beginPath();
    ctx.arc(-4, -16, 2, 0, Math.PI * 2);
    ctx.arc(4, -16, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    let icon = '👤';
    if (npc.type === 'trader') icon = '💰';
    else if (npc.type === 'witch') icon = '🧙';
    else if (npc.type === 'hostile') icon = '👹';
    ctx.fillText(icon, 0, -30);

    ctx.fillStyle = color;
    ctx.font = 'bold 11px Arial';
    ctx.fillText(npc.type === 'trader' ? 'Tüccar' :
                 npc.type === 'witch' ? 'Cadı' :
                 npc.type === 'hostile' ? 'Haydut' : 'Köylü', 0, -42);

    const playerDist = Math.hypot(npc.x - game.player.x, npc.y - game.player.y);
    if (playerDist < 150) {
      ctx.fillStyle = 'rgba(76, 201, 240, 0.9)';
      ctx.font = 'bold 10px Arial';
      ctx.fillText('💬 Sağ tıkla', 0, -55);
    }

    ctx.restore();
  },

  drawStructEnemy(ctx, enemy, sx, sy) {
    ctx.save();
    ctx.translate(sx, sy);

    const bob = Math.sin(Date.now() * 0.005) * 2;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a0a1a';
    ctx.beginPath();
    ctx.ellipse(0, bob, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2a0a2a';
    ctx.beginPath();
    ctx.arc(0, -15 + bob, 12, 0, Math.PI * 2);
    ctx.fill();

    const glow = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
    ctx.fillStyle = `rgba(255,0,0,${glow})`;
    ctx.beginPath();
    ctx.arc(-5, -18 + bob, 3, 0, Math.PI * 2);
    ctx.arc(5, -18 + bob, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-20, -45, 40, 5);
    ctx.fillStyle = '#ff0844';
    ctx.fillRect(-20, -45, 40 * (enemy.hp / enemy.maxHp), 5);

    ctx.restore();
  },

  /* ==================== YAKIN YAPI BUL ==================== */
  getNearest(x, y, range = 100) {
    let nearest = null;
    let minDist = range;

    this.structures.forEach(s => {
      const dist = Math.hypot(s.x - x, s.y - y);
      if (dist < minDist) {
        minDist = dist;
        nearest = s;
      }
    });

    return nearest;
  },

  /* ==================== EN YAKIN YAPI ==================== */
  findNearestAny() {
    if (this.structures.length === 0) return null;

    let nearest = null;
    let minDist = Infinity;

    this.structures.forEach(s => {
      const dist = Math.hypot(s.x - game.player.x, s.y - game.player.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = s;
      }
    });

    return nearest;
  }
};

window.StructureSystem = StructureSystem;

console.log('✅ structures.js yüklendi (v6.3 - uzak kümeler)');