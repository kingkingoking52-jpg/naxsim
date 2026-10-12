/* ==========================================
   ORION FOREST v6.4 - NPC CAMPS
   Haydut, cadı, köylü, tüccar kampları
   ========================================== */

'use strict';

const NPCCampSystem = {
  camps: [],

  /* ==================== KAMP TÜRLERİ ==================== */
  TYPES: {
    bandit: {
      name: '🏴‍☠️ Haydut Kampı',
      icon: '🏴‍☠️',
      color: '#8B0000',
      minDist: 1500,
      maxDist: 3500,
      npcCount: [3, 6],
      npcType: 'hostile',
      hasLoot: true,
      lootRare: 0.3,
      hasFire: true,
      states: ['active', 'looted', 'destroyed']  // Aktif/Yağmalanmış/Yok edilmiş
    },
    witch: {
      name: '🧙‍♀️ Cadı Evi',
      icon: '🧙‍♀️',
      color: '#9370db',
      minDist: 2000,
      maxDist: 4000,
      npcCount: [1, 1],
      npcType: 'witch',
      hasLoot: true,
      lootRare: 0.5,
      hasFire: true,
      hasMagic: true
    },
    villager: {
      name: '🏘️ Köylü Kampı',
      icon: '🏘️',
      color: '#4cc9f0',
      minDist: 1200,
      maxDist: 2500,
      npcCount: [2, 4],
      npcType: 'friendly',
      hasLoot: true,
      lootRare: 0.1,
      hasFire: true
    },
    merchant: {
      name: '💰 Tüccar Kervanı',
      icon: '💰',
      color: '#ffd700',
      minDist: 800,
      maxDist: 2000,
      npcCount: [2, 3],
      npcType: 'trader',
      hasLoot: true,
      lootRare: 0.4,
      hasFire: false
    },
    destroyed: {
      name: '⚔️ Yok Edilmiş Kamp',
      icon: '⚔️',
      color: '#666',
      minDist: 1000,
      maxDist: 3000,
      npcCount: [0, 1],
      npcType: 'ghost',
      hasLoot: true,
      lootRare: 0.05,
      hasFire: false,
      hasBlood: true
    }
  },

  /* ==================== OLUŞTUR ==================== */
  generate() {
    this.camps = [];

    // ✅ 4 haydut kampı
    for (let i = 0; i < 4; i++) this.spawn('bandit');
    // ✅ 3 cadı evi
    for (let i = 0; i < 3; i++) this.spawn('witch');
    // ✅ 5 köylü kampı
    for (let i = 0; i < 5; i++) this.spawn('villager');
    // ✅ 3 tüccar kervanı
    for (let i = 0; i < 3; i++) this.spawn('merchant');
    // ✅ 4 yok edilmiş kamp
    for (let i = 0; i < 4; i++) this.spawn('destroyed');

    console.log(`🏴‍☠️ ${this.camps.length} NPC kampı oluşturuldu`);
    console.log(`   Haydut: ${this.camps.filter(c => c.type === 'bandit').length}`);
    console.log(`   Cadı: ${this.camps.filter(c => c.type === 'witch').length}`);
    console.log(`   Köylü: ${this.camps.filter(c => c.type === 'villager').length}`);
    console.log(`   Tüccar: ${this.camps.filter(c => c.type === 'merchant').length}`);
    console.log(`   Yıkılmış: ${this.camps.filter(c => c.type === 'destroyed').length}`);
  },

  /* ==================== TEK KAMP OLUŞTUR ==================== */
  spawn(typeKey) {
    const type = this.TYPES[typeKey];
    if (!type) return null;

    // Konum bul
    let x, y;
    let valid = false;

    for (let attempt = 0; attempt < 40; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = type.minDist + Math.random() * (type.maxDist - type.minDist);
      x = CAMP_X + Math.cos(angle) * dist;
      y = CAMP_Y + Math.sin(angle) * dist;

      // Sınır kontrolü
      if (x < 500 || x > WORLD_SIZE - 500) continue;
      if (y < 500 || y > WORLD_SIZE - 500) continue;

      // Ana kamptan uzak mı?
      if (Math.hypot(x - CAMP_X, y - CAMP_Y) < 1000) continue;

      // Diğer kamplardan uzak mı?
      valid = true;
      for (const c of this.camps) {
        if (Math.hypot(c.x - x, c.y - y) < 700) {
          valid = false;
          break;
        }
      }
      if (valid) break;
    }

    if (!valid) return null;

    // Kamp durumu (haydutlar için)
    let state = 'active';
    if (typeKey === 'bandit') {
      const roll = Math.random();
      if (roll < 0.5) state = 'active';
      else if (roll < 0.8) state = 'looted';
      else state = 'destroyed';
    }

    // Kamp oluştur
    const camp = {
      id: Math.random(),
      type: typeKey,
      name: type.name,
      icon: type.icon,
      color: type.color,
      x, y,
      state,
      npcs: [],
      loots: [],
      structures: [], // Çadırlar, eşyalar
      fireLit: type.hasFire && state !== 'destroyed' && Math.random() < 0.7,
      fireAnim: 0,
      discovered: false
    };

    // NPC'ler (duruma göre)
    let npcCount = 0;
    if (state === 'active') {
      npcCount = randomInt(type.npcCount[0], type.npcCount[1]);
    } else if (state === 'looted') {
      npcCount = Math.max(0, randomInt(0, 1));
    } else {
      npcCount = 0;
    }

    for (let i = 0; i < npcCount; i++) {
      camp.npcs.push(this.createCampNPC(camp, type.npcType));
    }

    // Loot sandıkları
    if (type.hasLoot) {
      const lootCount = state === 'destroyed' ? 1 : randomInt(1, 3);
      for (let i = 0; i < lootCount; i++) {
        camp.loots.push(this.createLoot(camp, type.lootRare));
      }
    }

    // Yapılar (çadırlar, dekor)
    this.generateStructures(camp);

    this.camps.push(camp);
    return camp;
  },

  /* ==================== YAPI OLUŞTUR ==================== */
  generateStructures(camp) {
    const tentCount = randomInt(2, 5);

    // Çadırlar (radial yerleşim)
    for (let i = 0; i < tentCount; i++) {
      const angle = (i / tentCount) * Math.PI * 2;
      const dist = 40 + Math.random() * 60;
      camp.structures.push({
        type: 'tent',
        x: camp.x + Math.cos(angle) * dist,
        y: camp.y + Math.sin(angle) * dist,
        size: 30 + Math.random() * 15,
        angle: angle + Math.PI / 2,
        color: camp.type === 'bandit' ? '#3a1a1a' :
               camp.type === 'witch' ? '#3d2a5a' :
               camp.type === 'merchant' ? '#a88b3a' :
               camp.type === 'destroyed' ? '#2a1a0a' : '#5a3a1a',
        burnt: camp.type === 'destroyed'
      });
    }

    // Dekor
    if (camp.type === 'bandit') {
      // Kuru kafalar
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = 50 + Math.random() * 40;
        camp.structures.push({
          type: 'skull',
          x: camp.x + Math.cos(a) * d,
          y: camp.y + Math.sin(a) * d,
          size: 8
        });
      }
      // Silah yığını
      camp.structures.push({
        type: 'weapons',
        x: camp.x + randomRange(-30, 30),
        y: camp.y + randomRange(-30, 30),
        size: 20
      });
    }

    if (camp.type === 'witch') {
      // Kazan
      camp.structures.push({
        type: 'cauldron',
        x: camp.x + randomRange(-20, 20),
        y: camp.y + randomRange(-20, 20),
        size: 25,
        anim: 0
      });
      // Semboller
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        camp.structures.push({
          type: 'symbol',
          x: camp.x + Math.cos(a) * 60,
          y: camp.y + Math.sin(a) * 60,
          size: 15,
          rotation: a
        });
      }
    }

    if (camp.type === 'merchant') {
      // Sandıklar
      for (let i = 0; i < 2; i++) {
        camp.structures.push({
          type: 'crate',
          x: camp.x + randomRange(-50, 50),
          y: camp.y + randomRange(-50, 50),
          size: 15
        });
      }
      // Katır
      camp.structures.push({
        type: 'mule',
        x: camp.x + randomRange(-60, 60),
        y: camp.y + randomRange(-60, 60),
        size: 20
      });
    }

    if (camp.type === 'destroyed') {
      // Kan lekeleri
      for (let i = 0; i < 4; i++) {
        camp.structures.push({
          type: 'blood',
          x: camp.x + randomRange(-60, 60),
          y: camp.y + randomRange(-60, 60),
          size: 20 + Math.random() * 15
        });
      }
      // İskelet
      camp.structures.push({
        type: 'skeleton',
        x: camp.x + randomRange(-40, 40),
        y: camp.y + randomRange(-40, 40),
        size: 15
      });
    }
  },

  /* ==================== NPC OLUŞTUR ==================== */
  createCampNPC(camp, npcType) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 20 + Math.random() * 60;

    return {
      id: Math.random(),
      type: npcType,
      campId: camp.id,
      x: camp.x + Math.cos(angle) * dist,
      y: camp.y + Math.sin(angle) * dist,
      homeX: camp.x,
      homeY: camp.y,
      hp: npcType === 'hostile' ? 8 : 5,
      maxHp: npcType === 'hostile' ? 8 : 5,
      dead: false,
      facing: 1,
      state: 'idle',
      stateTime: 1 + Math.random() * 3,
      targetX: 0,
      targetY: 0,
      animation: { frame: 0, time: 0, walking: false },
      attackCooldown: 0,
      hasTalked: false
    };
  },

  /* ==================== LOOT OLUŞTUR ==================== */
  createLoot(camp, rareChance) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 80;

    // Nadir mi?
    const isRare = Math.random() < rareChance;
    let items;

    if (isRare) {
      items = ['kilic', 'kazma', 'yay', 'balta'];
    } else {
      items = ['odun', 'tas', 'ip', 'elma', 'cig_et', 'pismis_et', 'su'];
    }

    const item = pickRandom(items);
    const amount = isRare ? randomInt(1, 2) : randomInt(2, 5);

    return {
      id: Math.random(),
      x: camp.x + Math.cos(angle) * dist,
      y: camp.y + Math.sin(angle) * dist,
      item, amount,
      taken: false,
      isRare,
      anim: 0
    };
  },

  /* ==================== GÜNCELLE ==================== */
  update(dt) {
    this.camps.forEach(camp => {
      // Ateş animasyonu
      if (camp.fireLit) {
        camp.fireAnim = (camp.fireAnim || 0) + dt;
      }

      // Kazan animasyonu
      camp.structures.forEach(s => {
        if (s.anim !== undefined) s.anim += dt;
      });

      // NPC'ler
      camp.npcs.forEach(npc => {
        if (npc.dead) return;

        // Oyuncu yakınsa
        const distToPlayer = Math.hypot(npc.x - game.player.x, npc.y - game.player.y);

        // Haydut saldırgan mı?
        if (npc.type === 'hostile' && distToPlayer < 250) {
          // Oyuncuya doğru hareket
          const dx = game.player.x - npc.x;
          const dy = game.player.y - npc.y;
          const d = Math.hypot(dx, dy);

          if (d > 30) {
            npc.x += (dx / d) * 1.5;
            npc.y += (dy / d) * 1.5;
            npc.facing = dx > 0 ? 1 : -1;
            npc.animation.walking = true;
            npc.state = 'chasing';
          } else {
            npc.animation.walking = false;

            // Saldırı
            npc.attackCooldown = Math.max(0, npc.attackCooldown - dt);
            if (npc.attackCooldown <= 0) {
              damagePlayer(3, 'Haydut saldırısı');
              npc.attackCooldown = 1.5;
            }
          }
        } else {
          // Normal dolaşma (kamp çevresinde)
          npc.stateTime -= dt;

          if (npc.stateTime <= 0) {
            npc.state = npc.state === 'idle' ? 'walk' : 'idle';
            npc.stateTime = 1 + Math.random() * 3;

            if (npc.state === 'walk') {
              const a = Math.random() * Math.PI * 2;
              const d = 20 + Math.random() * 60;
              npc.targetX = camp.x + Math.cos(a) * d;
              npc.targetY = camp.y + Math.sin(a) * d;
            }
          }

          if (npc.state === 'walk') {
            const dx = npc.targetX - npc.x;
            const dy = npc.targetY - npc.y;
            const d = Math.hypot(dx, dy);
            if (d > 3) {
              npc.x += (dx / d) * 0.7;
              npc.y += (dy / d) * 0.7;
              npc.facing = dx > 0 ? 1 : -1;
              npc.animation.walking = true;
            } else {
              npc.state = 'idle';
              npc.animation.walking = false;
            }
          } else {
            npc.animation.walking = false;
          }
        }

        // Animasyon
        npc.animation.time += dt;
        if (npc.animation.walking && npc.animation.time > 0.18) {
          npc.animation.frame = (npc.animation.frame + 1) % 4;
          npc.animation.time = 0;
        }
      });
    });
  },

  /* ==================== ÇİZİM ==================== */
  draw(ctx, camX, camY, darkness) {
    this.camps.forEach(camp => {
      const sx = camp.x - camX;
      const sy = camp.y - camY;

      // Viewport culling
      if (sx < -400 || sx > W + 400 || sy < -400 || sy > H + 400) return;

      this.drawCamp(ctx, camp, sx, sy, darkness, camX, camY);
    });
  },

  drawCamp(ctx, camp, sx, sy, darkness, camX, camY) {
    // Kamp zemin efekti
    ctx.save();

    // Zemin (kahverengi/koyu)
    let groundColor = 'rgba(70, 55, 40, 0.5)';
    if (camp.type === 'witch') groundColor = 'rgba(50, 30, 70, 0.5)';
    else if (camp.type === 'bandit') groundColor = 'rgba(60, 30, 30, 0.5)';
    else if (camp.type === 'destroyed') groundColor = 'rgba(40, 30, 25, 0.5)';

    const groundGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 120);
    groundGrad.addColorStop(0, groundColor);
    groundGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = groundGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, 120, 0, Math.PI * 2);
    ctx.fill();

    // Cadı evi özel ışık
    if (camp.type === 'witch' && camp.state !== 'destroyed') {
      const purpleGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 150);
      purpleGlow.addColorStop(0, 'rgba(147, 112, 219, 0.15)');
      purpleGlow.addColorStop(0.5, 'rgba(147, 112, 219, 0.08)');
      purpleGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = purpleGlow;
      ctx.beginPath();
      ctx.arc(sx, sy, 150, 0, Math.PI * 2);
      ctx.fill();
    }

    // Haydut kampı kırmızı aura (aktifse)
    if (camp.type === 'bandit' && camp.state === 'active') {
      const redAura = ctx.createRadialGradient(sx, sy, 0, sx, sy, 140);
      redAura.addColorStop(0, 'rgba(139, 0, 0, 0.1)');
      redAura.addColorStop(1, 'transparent');
      ctx.fillStyle = redAura;
      ctx.beginPath();
      ctx.arc(sx, sy, 140, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Yapıları çiz (Y sıralı)
    const sortedStructures = [...camp.structures].sort((a, b) => a.y - b.y);
    sortedStructures.forEach(s => {
      this.drawStructure(ctx, s, s.x - camX, s.y - camY, darkness, camp);
    });

    // Lootları çiz
    camp.loots.forEach(loot => {
      if (loot.taken) return;
      const lx = loot.x - camX;
      const ly = loot.y - camY;

      loot.anim = (loot.anim || 0) + 0.05;

      // Parlama
      const glow = 0.5 + Math.sin(loot.anim) * 0.3;
      const glowColor = loot.isRare ? '255, 215, 0' : '76, 201, 240';

      const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, 20);
      grad.addColorStop(0, `rgba(${glowColor}, ${glow * 0.5})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lx, ly, 20, 0, Math.PI * 2);
      ctx.fill();

      // Sandık
      ctx.fillStyle = loot.isRare ? `rgba(200, 170, 40, ${darkness})` : `rgba(139, 90, 60, ${darkness})`;
      ctx.fillRect(lx - 10, ly - 8, 20, 16);
      ctx.fillStyle = `rgba(0, 0, 0, ${darkness * 0.3})`;
      ctx.fillRect(lx - 10, ly - 2, 20, 2);

      // Kilit
      ctx.fillStyle = loot.isRare ? `rgba(255, 240, 150, ${darkness})` : `rgba(200, 170, 80, ${darkness})`;
      ctx.beginPath();
      ctx.arc(lx, ly - 3, 3, 0, Math.PI * 2);
      ctx.fill();

      // Nadir ise ✨ göster
      if (loot.isRare) {
        ctx.fillStyle = `rgba(255, 215, 0, ${glow})`;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✨', lx, ly - 15);
      }
    });

    // NPC'leri çiz
    camp.npcs.forEach(npc => {
      if (npc.dead) return;
      this.drawNPC(ctx, npc, npc.x - camX, npc.y - camY, darkness);
    });

    // Kamp ismi (yakınsa)
    const distToPlayer = Math.hypot(camp.x - game.player.x, camp.y - game.player.y);
    if (distToPlayer < 400) {
      ctx.fillStyle = camp.color;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(camp.name, sx, sy - 150);

      // Durum göster
      if (camp.type === 'bandit') {
        const stateText = camp.state === 'active' ? '⚔️ Aktif' :
                         camp.state === 'looted' ? '📦 Yağmalanmış' : '💀 Yok Edilmiş';
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(stateText, sx, sy - 135);
      }

      if (distToPlayer < 150) {
        ctx.fillStyle = 'rgba(255, 200, 100, 0.9)';
        ctx.font = 'bold 10px Arial';
        ctx.fillText('💡 Yaklaş ve incele', sx, sy - 120);
      }
    }
  },

  drawStructure(ctx, s, sx, sy, darkness, camp) {
    ctx.save();
    ctx.translate(sx, sy);

    if (s.type === 'tent') {
      // Çadır (üçgen)
      ctx.rotate(s.angle || 0);

      const size = s.size;

      // Gölge
      ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * darkness})`;
      ctx.beginPath();
      ctx.ellipse(0, size * 0.3, size * 0.7, size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Çadır gövdesi
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.moveTo(-size * 0.6, size * 0.2);
      ctx.lineTo(0, -size);
      ctx.lineTo(size * 0.6, size * 0.2);
      ctx.closePath();
      ctx.fill();

      // Koyu gölge
      ctx.fillStyle = `rgba(0, 0, 0, 0.2)`;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.6, size * 0.2);
      ctx.lineTo(0, size * 0.2);
      ctx.closePath();
      ctx.fill();

      // Giriş deliği
      ctx.fillStyle = s.burnt ? '#1a0a0a' : `rgba(30, 20, 20, ${darkness})`;
      ctx.beginPath();
      ctx.moveTo(-size * 0.2, size * 0.2);
      ctx.lineTo(0, -size * 0.3);
      ctx.lineTo(size * 0.2, size * 0.2);
      ctx.closePath();
      ctx.fill();

      // Yanmış efekti
      if (s.burnt) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.moveTo(-size * 0.6, size * 0.2);
        ctx.lineTo(0, -size);
        ctx.lineTo(size * 0.6, size * 0.2);
        ctx.closePath();
        ctx.fill();

        // Duman
        ctx.fillStyle = `rgba(50, 40, 40, ${0.3 * darkness})`;
        ctx.beginPath();
        ctx.arc(0, -size - 10, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    else if (s.type === 'skull') {
      // Kuru kafa
      ctx.fillStyle = `rgba(220, 220, 200, ${darkness})`;
      ctx.beginPath();
      ctx.arc(0, 0, s.size * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Gözler
      ctx.fillStyle = `rgba(0, 0, 0, ${darkness})`;
      ctx.beginPath();
      ctx.arc(-s.size * 0.2, -s.size * 0.1, s.size * 0.12, 0, Math.PI * 2);
      ctx.arc(s.size * 0.2, -s.size * 0.1, s.size * 0.12, 0, Math.PI * 2);
      ctx.fill();

      // Çene
      ctx.fillStyle = `rgba(200, 200, 180, ${darkness})`;
      ctx.fillRect(-s.size * 0.3, s.size * 0.15, s.size * 0.6, s.size * 0.25);
    }
    else if (s.type === 'weapons') {
      // Silah yığını
      ctx.fillStyle = `rgba(100, 100, 100, ${darkness})`;
      ctx.fillRect(-s.size * 0.5, -2, s.size, 4);
      ctx.fillStyle = `rgba(139, 90, 60, ${darkness})`;
      ctx.fillRect(-s.size * 0.4, -s.size * 0.3, 4, s.size * 0.5);
      ctx.fillRect(s.size * 0.2, -s.size * 0.2, 4, s.size * 0.4);
    }
    else if (s.type === 'cauldron') {
      // Kazan
      ctx.fillStyle = `rgba(40, 30, 30, ${darkness})`;
      ctx.beginPath();
      ctx.ellipse(0, 5, s.size * 0.6, s.size * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Kaynama efekti
      if (s.anim) {
        for (let i = 0; i < 5; i++) {
          const bubbleY = 5 - ((s.anim * 30 + i * 20) % 30);
          const bubbleX = Math.sin(s.anim * 2 + i) * 5;
          const alpha = 1 - ((s.anim * 30 + i * 20) % 30) / 30;

          ctx.fillStyle = `rgba(147, 112, 219, ${alpha * darkness})`;
          ctx.beginPath();
          ctx.arc(bubbleX, bubbleY, 2 + i * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    else if (s.type === 'symbol') {
      // Mor semboller
      ctx.rotate(s.rotation || 0);
      ctx.strokeStyle = `rgba(147, 112, 219, ${darkness * 0.7})`;
      ctx.lineWidth = 2;

      // Yıldız sembolü
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const x1 = Math.cos(a) * s.size;
        const y1 = Math.sin(a) * s.size;
        const a2 = a + Math.PI * 2 / 5 * 2;
        const x2 = Math.cos(a2) * s.size;
        const y2 = Math.sin(a2) * s.size;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    else if (s.type === 'crate') {
      // Sandık
      ctx.fillStyle = `rgba(139, 90, 60, ${darkness})`;
      ctx.fillRect(-s.size * 0.5, -s.size * 0.5, s.size, s.size);
      ctx.strokeStyle = `rgba(90, 60, 40, ${darkness})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(-s.size * 0.5, -s.size * 0.5, s.size, s.size);
    }
    else if (s.type === 'mule') {
      // Katır (basit)
      ctx.fillStyle = `rgba(120, 100, 80, ${darkness})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, s.size * 0.6, s.size * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Baş
      ctx.beginPath();
      ctx.arc(s.size * 0.5, -s.size * 0.3, s.size * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (s.type === 'blood') {
      // Kan lekesi
      ctx.fillStyle = `rgba(80, 0, 0, ${darkness * 0.6})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, s.size * 0.5, s.size * 0.3, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (s.type === 'skeleton') {
      // İskelet
      ctx.fillStyle = `rgba(220, 220, 200, ${darkness})`;
      // Kafatası
      ctx.beginPath();
      ctx.arc(0, -8, 5, 0, Math.PI * 2);
      ctx.fill();
      // Gövde
      ctx.fillRect(-2, -3, 4, 10);
      // Bacaklar
      ctx.fillRect(-5, 7, 3, 8);
      ctx.fillRect(2, 7, 3, 8);
      // Kollar
      ctx.fillRect(-8, -2, 3, 8);
      ctx.fillRect(5, -2, 3, 8);
    }

    ctx.restore();

    // Ateş (kampın ortasında)
    if (camp.fireLit && s === camp.structures[0]) {
      this.drawFire(ctx, sx, sy + 30, darkness, camp);
    }
  },

  drawFire(ctx, sx, sy, darkness, camp) {
    const flicker = Math.sin(camp.fireAnim * 3) * 3;
    const height = 20 + Math.sin(camp.fireAnim * 4) * 6;

    // Işık halkası
    const lightGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 100);
    lightGrad.addColorStop(0, 'rgba(255, 180, 80, 0.3)');
    lightGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, 100, 0, Math.PI * 2);
    ctx.fill();

    // Taşlar
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.fillStyle = `rgba(90, 90, 100, ${darkness})`;
      ctx.beginPath();
      ctx.arc(sx + Math.cos(a) * 15, sy + Math.sin(a) * 15, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Alev
    const flameGrad = ctx.createLinearGradient(sx, sy, sx, sy - height);
    flameGrad.addColorStop(0, 'rgba(255, 240, 100, 0.95)');
    flameGrad.addColorStop(0.5, 'rgba(255, 130, 40, 0.8)');
    flameGrad.addColorStop(1, 'rgba(200, 40, 10, 0)');

    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(sx - 8 + flicker, sy);
    ctx.quadraticCurveTo(sx - 3 + flicker, sy - height * 0.7, sx + flicker, sy - height);
    ctx.quadraticCurveTo(sx + 3 + flicker, sy - height * 0.7, sx + 8 + flicker, sy);
    ctx.fill();
  },

  drawNPC(ctx, npc, sx, sy, darkness) {
    ctx.save();
    ctx.translate(sx, sy);

    // Gölge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 20, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Renk
    let color = '#8d5524';
    let icon = '👤';
    if (npc.type === 'hostile') { color = '#dc143c'; icon = '👹'; }
    else if (npc.type === 'witch') { color = '#9370db'; icon = '🧙‍♀️'; }
    else if (npc.type === 'trader') { color = '#ffd700'; icon = '💰'; }
    else if (npc.type === 'friendly') { color = '#4cc9f0'; icon = '👤'; }
    else if (npc.type === 'ghost') { color = '#a0a0c0'; icon = '👻'; }

    // Gövde
    ctx.fillStyle = color;
    ctx.fillRect(-8, -5, 16, 22);

    // Baş
    ctx.fillStyle = '#c68642';
    ctx.beginPath();
    ctx.arc(0, -15, 10, 0, Math.PI * 2);
    ctx.fill();

    // Gözler
    ctx.fillStyle = '#0a0e1a';
    ctx.beginPath();
    ctx.arc(-4, -16, 2, 0, Math.PI * 2);
    ctx.arc(4, -16, 2, 0, Math.PI * 2);
    ctx.fill();

    // İkon
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(icon, 0, -30);

    // HP bar (hasarlıysa)
    if (npc.hp < npc.maxHp) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-15, -42, 30, 4);
      ctx.fillStyle = npc.type === 'hostile' ? '#ff0844' : '#00d68f';
      ctx.fillRect(-15, -42, 30 * (npc.hp / npc.maxHp), 4);
    }

    ctx.restore();
  },

  /* ==================== YAKIN KAMP BUL ==================== */
  getNearest(x, y, range = 150) {
    let nearest = null;
    let minDist = range;

    this.camps.forEach(c => {
      const dist = Math.hypot(c.x - x, c.y - y);
      if (dist < minDist) {
        minDist = dist;
        nearest = c;
      }
    });

    return nearest;
  },

  /* ==================== LOOT TOPLA ==================== */
  takeLoot(camp, lootIndex) {
    const loot = camp.loots[lootIndex];
    if (!loot || loot.taken) return;

    loot.taken = true;
    game.player.inventory[loot.item] = (game.player.inventory[loot.item] || 0) + loot.amount;

    const emoji = loot.isRare ? '✨' : '📦';
    addMessage(`${emoji} ${ITEM_DATA[loot.item]?.icon || ''} ${loot.item} x${loot.amount}`);
    if (audio && audio.collect) audio.collect();
    updateUI();
  }
};

window.NPCCampSystem = NPCCampSystem;

console.log('✅ npc_camps.js yüklendi');