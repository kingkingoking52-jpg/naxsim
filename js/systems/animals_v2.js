/* ==========================================
   ORION FOREST v6.5 - ANIMALS V2
   Geyik Kralı + Yaban Domuzu Sürüsü
   ========================================== */

'use strict';

const AnimalSystemV2 = {
  // Özel hayvanlar
  specialAnimals: [],

  // Yeni item: Boynuz
  registerItems() {
    if (typeof ITEM_DATA !== 'undefined') {
      ITEM_DATA.boynuz = {
        icon: '🦌',
        name: 'Geyik Boynuzu',
        cat: 'resource',
        desc: 'Nadir bir malzeme. Değerli!'
      };
    }
  },

  /* ==================== OLUŞTUR ==================== */
  spawnDeerKing() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 1500 + Math.random() * 2000;

    const king = {
      type: 'deer_king',
      name: 'Geyik Kralı',
      x: CAMP_X + Math.cos(angle) * dist,
      y: CAMP_Y + Math.sin(angle) * dist,
      hp: 15,
      maxHp: 15,
      speed: 1.6,
      size: 24,
      color: '#a87c50',
      food: 8,
      xp: 200,
      isBoss: true,
      state: 'idle',
      stateTime: Math.random() * 3,
      facing: 1,
      targetX: 0, targetY: 0,
      animation: { frame: 0, time: 0, walking: false }
    };

    this.specialAnimals.push(king);
    console.log('🦌 Geyik Kralı doğdu!');
    return king;
  },

  spawnBoarPack() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 800 + Math.random() * 1500;
    const centerX = CAMP_X + Math.cos(angle) * dist;
    const centerY = CAMP_Y + Math.sin(angle) * dist;

    const packSize = 3 + Math.floor(Math.random() * 3); // 3-5 domuz
    const pack = [];

    for (let i = 0; i < packSize; i++) {
      const a = (i / packSize) * Math.PI * 2;
      const d = 30 + Math.random() * 40;

      const boar = {
        type: 'boar_wild',
        name: 'Yaban Domuzu',
        x: centerX + Math.cos(a) * d,
        y: centerY + Math.sin(a) * d,
        packCenterX: centerX,
        packCenterY: centerY,
        packId: Math.random(),
        hp: 3,
        maxHp: 3,
        speed: 1.8,
        size: 15,
        color: '#3a2a1a',
        food: 3,
        xp: 30,
        hostile: true,
        isPackAnimal: true,
        state: 'idle',
        stateTime: Math.random() * 3,
        facing: 1,
        targetX: 0, targetY: 0,
        animation: { frame: 0, time: 0, walking: false }
      };

      pack.push(boar);
      this.specialAnimals.push(boar);
    }

    console.log(`🐗 ${packSize} yaban domuzu sürüsü doğdu!`);
    return pack;
  },

  /* ==================== BAŞLAT ==================== */
  generate() {
    this.specialAnimals = [];
    this.registerItems();

    // 3 geyik kralı
    for (let i = 0; i < 3; i++) {
      this.spawnDeerKing();
    }

    // 8 domuz sürüsü
    for (let i = 0; i < 8; i++) {
      this.spawnBoarPack();
    }

    console.log(`🐾 ${this.specialAnimals.length} özel hayvan oluşturuldu`);
  },

  /* ==================== GÜNCELLE ==================== */
  update(dt) {
    const p = game.player;

    for (let i = this.specialAnimals.length - 1; i >= 0; i--) {
      const animal = this.specialAnimals[i];
      const dist = Math.hypot(animal.x - p.x, animal.y - p.y);

      // Çok uzaktakileri temizle
      if (dist > 4000) {
        this.specialAnimals.splice(i, 1);
        continue;
      }

      animal.stateTime -= dt;

      // Domuz sürüsü davranışı
      if (animal.isPackAnimal) {
        // Diğer domuzların saldırı durumu
        const packAggro = this.specialAnimals.some(a =>
          a.packId === animal.packId && a.state === 'chase'
        );

        // Oyuncu yakınsa saldır
        if ((dist < 250 || packAggro) && dist < 400) {
          animal.state = 'chase';
          const dx = p.x - animal.x;
          const dy = p.y - animal.y;
          const d = Math.hypot(dx, dy);

          if (d > 25) {
            animal.x += (dx / d) * animal.speed;
            animal.y += (dy / d) * animal.speed;
            animal.facing = dx > 0 ? 1 : -1;
            animal.animation.walking = true;
          } else {
            // Saldırı
            if (!animal.attackCooldown || animal.attackCooldown <= 0) {
              damagePlayer(2, 'Yaban domuzu saldırısı');
              animal.attackCooldown = 1.5;
            }
          }
          if (animal.attackCooldown) animal.attackCooldown -= dt;
        } else {
          // Sürü merkezinde dolaş
          if (animal.stateTime <= 0) {
            animal.state = animal.state === 'idle' ? 'walk' : 'idle';
            animal.stateTime = 2 + Math.random() * 2;

            if (animal.state === 'walk') {
              const a = Math.random() * Math.PI * 2;
              const d = 20 + Math.random() * 50;
              animal.targetX = animal.packCenterX + Math.cos(a) * d;
              animal.targetY = animal.packCenterY + Math.sin(a) * d;
            }
          }

          if (animal.state === 'walk') {
            const dx = animal.targetX - animal.x;
            const dy = animal.targetY - animal.y;
            const d = Math.hypot(dx, dy);
            if (d > 3) {
              animal.x += (dx / d) * animal.speed * 0.5;
              animal.y += (dy / d) * animal.speed * 0.5;
              animal.facing = dx > 0 ? 1 : -1;
              animal.animation.walking = true;
            }
          }
        }
      }
      // Geyik Kralı davranışı
      else if (animal.isBoss) {
        if (dist < 200) {
          // Kaç
          animal.state = 'flee';
          const dx = animal.x - p.x;
          const dy = animal.y - p.y;
          const d = Math.hypot(dx, dy);

          if (d > 5) {
            animal.x += (dx / d) * animal.speed * 1.5;
            animal.y += (dy / d) * animal.speed * 1.5;
            animal.facing = dx > 0 ? 1 : -1;
            animal.animation.walking = true;
          }
        } else {
          if (animal.stateTime <= 0) {
            animal.state = animal.state === 'idle' ? 'walk' : 'idle';
            animal.stateTime = 2 + Math.random() * 3;

            if (animal.state === 'walk') {
              animal.targetX = animal.x + (Math.random() - 0.5) * 500;
              animal.targetY = animal.y + (Math.random() - 0.5) * 500;
            }
          }

          if (animal.state === 'walk') {
            const dx = animal.targetX - animal.x;
            const dy = animal.targetY - animal.y;
            const d = Math.hypot(dx, dy);
            if (d > 5) {
              animal.x += (dx / d) * animal.speed;
              animal.y += (dy / d) * animal.speed;
              animal.facing = dx > 0 ? 1 : -1;
              animal.animation.walking = true;
            }
          }
        }
      }

      // Animasyon
      animal.animation.time += dt;
      if (animal.animation.walking && animal.animation.time > 0.18) {
        animal.animation.frame = (animal.animation.frame + 1) % 4;
        animal.animation.time = 0;
      }
    }
  },

  /* ==================== ÇİZİM ==================== */
  draw(ctx, camX, camY) {
    const darkness = game.world.isDay ? 1 : 0.65;

    this.specialAnimals.forEach(animal => {
      const sx = animal.x - camX;
      const sy = animal.y - camY;
      if (sx < -80 || sx > W + 80 || sy < -80 || sy > H + 80) return;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(animal.facing, 1);

      // Gölge
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(0, animal.size * 0.6, animal.size * 0.8, animal.size * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      const bob = animal.animation.walking ? Math.sin(animal.animation.frame * Math.PI / 2) * 2 : 0;

      // Geyik Kralı özel çizim
      if (animal.isBoss) {
        // Altın aura
        const auraGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, animal.size * 1.5);
        auraGrad.addColorStop(0, 'rgba(255, 215, 0, 0.2)');
        auraGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, animal.size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Gövde
        ctx.fillStyle = animal.color;
        ctx.beginPath();
        ctx.ellipse(0, bob, animal.size, animal.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Baş
        ctx.beginPath();
        ctx.arc(animal.size * 0.7, bob - animal.size * 0.3, animal.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Altın boynuzlar
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(animal.size * 0.5, bob - animal.size * 0.8);
        ctx.lineTo(animal.size * 0.7, bob - animal.size * 1.5);
        ctx.lineTo(animal.size * 0.85, bob - animal.size * 0.8);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(animal.size * 0.85, bob - animal.size * 0.8);
        ctx.lineTo(animal.size * 1.05, bob - animal.size * 1.5);
        ctx.lineTo(animal.size * 1.15, bob - animal.size * 0.8);
        ctx.closePath();
        ctx.fill();

        // Gözler (parlak)
        ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.beginPath();
        ctx.arc(animal.size * 0.5, bob - animal.size * 0.45, 2.5, 0, Math.PI * 2);
        ctx.arc(animal.size * 0.9, bob - animal.size * 0.45, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Taç
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👑', animal.size * 0.7, bob - animal.size * 1.8);
      }
      // Yaban Domuzu
      else {
        ctx.fillStyle = animal.color;
        ctx.beginPath();
        ctx.ellipse(0, bob, animal.size, animal.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Baş
        ctx.beginPath();
        ctx.arc(animal.size * 0.7, bob - animal.size * 0.3, animal.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Burun
        ctx.fillStyle = '#5a4030';
        ctx.beginPath();
        ctx.arc(animal.size * 1.05, bob - animal.size * 0.2, animal.size * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Gözler (kırmızı - kızgın)
        ctx.fillStyle = 'rgba(255, 50, 50, 0.9)';
        ctx.beginPath();
        ctx.arc(animal.size * 0.5, bob - animal.size * 0.45, 2, 0, Math.PI * 2);
        ctx.arc(animal.size * 0.9, bob - animal.size * 0.45, 2, 0, Math.PI * 2);
        ctx.fill();

        // Dişler
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(animal.size * 0.95, bob - animal.size * 0.1);
        ctx.lineTo(animal.size * 0.9, bob + animal.size * 0.1);
        ctx.lineTo(animal.size * 1, bob + animal.size * 0.1);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      // İsim + HP bar
      const label = animal.isBoss ? '👑 Geyik Kralı' : '🐗 Yaban Domuzu';
      const labelColor = animal.isBoss ? '#ffd700' : '#ff6b35';

      ctx.fillStyle = labelColor;
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, sx, sy - animal.size * 2);

      if (animal.hp < animal.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(sx - 25, sy - animal.size * 2.8, 50, 5);
        ctx.fillStyle = animal.isBoss ? '#ffd700' : '#ff0844';
        ctx.fillRect(sx - 25, sy - animal.size * 2.8, 50 * (animal.hp / animal.maxHp), 5);
      }
    });
  },

  /* ==================== ÖLÜM ==================== */
  onKill(animal) {
    if (animal.isBoss) {
      // Geyik kralı öldü
      addMessage('👑 GEYİK KRALI ÖLDÜRÜLDÜ!');

      // Boynuz ver
      game.player.inventory.boynuz = (game.player.inventory.boynuz || 0) + 1;
      addMessage('🦌 Geyik Boynuzu elde edildi!');

      // 8 et
      game.player.inventory.cig_et = (game.player.inventory.cig_et || 0) + 8;

      // XP patlaması
      game.player.xp += 200;
      checkLevelUp();

      // Görsel efekt
      for (let i = 0; i < 30; i++) {
        game.particles.push({
          x: animal.x,
          y: animal.y - 20,
          vx: (Math.random() - 0.5) * 8,
          vy: -Math.random() * 6,
          life: 2,
          color: '255,215,0',
          size: 4
        });
      }
    } else if (animal.isPackAnimal) {
      addMessage('🐗 Yaban domuzu avlandı!');
      game.player.xp += 30;
    }

    // Listeden çıkar
    const idx = this.specialAnimals.indexOf(animal);
    if (idx > -1) this.specialAnimals.splice(idx, 1);
  }
};

window.AnimalSystemV2 = AnimalSystemV2;

console.log('✅ animals_v2.js yüklendi');