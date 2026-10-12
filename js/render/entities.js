/* ==========================================
   ORION FOREST v6.7 - RENDER / ENTITIES
   Hayvanlar, düşmanlar, oyuncu, evcil, partikül
   ========================================== */

'use strict';

/* ==================== HAYVANLAR ==================== */
function drawAnimals() {
  const cam = game.camera;

  game.animals.forEach(animal => {
    const sx = animal.x - cam.x;
    const sy = animal.y - cam.y;
    if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) return;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(animal.facing, 1);

    // Gölge
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, animal.size * 0.6, animal.size * 0.8, animal.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    const bob = animal.animation.walking ? Math.sin(animal.animation.frame * Math.PI / 2) * 2 : 0;

    // Gövde
    ctx.fillStyle = animal.color;
    ctx.beginPath();
    ctx.ellipse(0, bob, animal.size, animal.size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Baş
    ctx.beginPath();
    ctx.arc(animal.size * 0.7, bob - animal.size * 0.3, animal.size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Kulaklar
    ctx.beginPath();
    ctx.arc(animal.size * 0.6, bob - animal.size * 0.8, animal.size * 0.25, 0, Math.PI * 2);
    ctx.arc(animal.size * 0.9, bob - animal.size * 0.8, animal.size * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Göz
    ctx.fillStyle = '#0a0e1a';
    ctx.beginPath();
    ctx.arc(animal.size * 0.9, bob - animal.size * 0.35, 2, 0, Math.PI * 2);
    ctx.fill();

    // Düşman işareti
    if (animal.hostile) {
      ctx.fillStyle = 'rgba(255,50,50,0.8)';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️', 0, -animal.size * 1.8);
    }

    // HP bar
    if (animal.hp < animal.maxHp) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(-20, -animal.size * 2, 40, 5);
      ctx.fillStyle = '#ff0844';
      ctx.fillRect(-20, -animal.size * 2, 40 * (animal.hp / animal.maxHp), 5);
    }

    ctx.restore();
  });
}

/* ==================== YAVRU EVCİL ==================== */
function drawBabyPets() {
  if (!game.babyPets) return;
  const cam = game.camera;

  game.babyPets.forEach(baby => {
    if (baby.adopted) return;
    const sx = baby.x - cam.x;
    const sy = baby.y - cam.y;
    if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) return;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(baby.facing, 1);

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, baby.size * 0.6, baby.size * 0.8, baby.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    const bob = baby.animation.walking ? Math.sin(baby.animation.frame * Math.PI / 2) * 2 : 0;

    // Gövde
    ctx.fillStyle = baby.color;
    ctx.beginPath();
    ctx.ellipse(0, bob, baby.size, baby.size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Baş
    ctx.beginPath();
    ctx.arc(baby.size * 0.6, bob - baby.size * 0.3, baby.size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Gözler (büyük sevimli)
    ctx.fillStyle = '#0a0e1a';
    ctx.beginPath();
    ctx.arc(baby.size * 0.5, bob - baby.size * 0.4, 1.5, 0, Math.PI * 2);
    ctx.arc(baby.size * 0.8, bob - baby.size * 0.4, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Kalp ikonu
    ctx.fillStyle = 'rgba(255, 100, 150, 0.8)';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('❤️', 0, -baby.size * 1.5);

    ctx.restore();
  });
}

/* ==================== DÜŞMANLAR ==================== */
function drawEnemies() {
  const cam = game.camera;

  game.enemies.forEach(enemy => {
    const sx = enemy.x - cam.x;
    const sy = enemy.y - cam.y;
    if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) return;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(enemy.facing, 1);

    const bob = Math.sin(enemy.animation.frame * Math.PI / 2) * 2;

    // Gölge
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gövde
    ctx.fillStyle = '#1a0a1a';
    ctx.beginPath();
    ctx.ellipse(0, bob, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Kafa
    ctx.fillStyle = '#2a0a2a';
    ctx.beginPath();
    ctx.arc(0, -15 + bob, 12, 0, Math.PI * 2);
    ctx.fill();

    // Kırmızı gözler
    const glow = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
    ctx.fillStyle = `rgba(255,0,0,${glow})`;
    ctx.beginPath();
    ctx.arc(-5, -18 + bob, 3, 0, Math.PI * 2);
    ctx.arc(5, -18 + bob, 3, 0, Math.PI * 2);
    ctx.fill();

    // Ağız
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -10 + bob, 6, 0, Math.PI);
    ctx.stroke();

    // Dişler
    ctx.fillStyle = '#fff';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 4, -10 + bob);
      ctx.lineTo(i * 4 - 1, -6 + bob);
      ctx.lineTo(i * 4 + 1, -6 + bob);
      ctx.fill();
    }

    // HP bar
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-20, -45, 40, 5);
    ctx.fillStyle = '#ff0844';
    ctx.fillRect(-20, -45, 40 * (enemy.hp / enemy.maxHp), 5);

    ctx.restore();
  });
}

/* ==================== OYUNCU ==================== */
function drawPlayer() {
  // ✅ TRANSFORM'U SIFIRLA (güvenlik)
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  const cx = W / 2;
  const cy = H / 2;
  const p = game.player;

  const skinColors = ['#8d5524', '#c68642', '#e0ac69', '#ffdbac', '#5a3a1a', '#6b4423', '#f1c27d', '#edb98a', '#d08b5b', '#ae5d29', '#694d3d', '#ffdbac'];
  const hairColors = ['#1a1a1a', '#654321', '#8b4513', '#d4a574', '#c9c9c9', '#ffdb58', '#8b0000', '#4b0082', '#00008b', '#006400', '#ff69b4', '#f5f5dc'];
  const shirtColors = ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c', '#34495e', '#e91e63', '#ff5722', '#673ab7', '#00bcd4', '#795548'];

  const sc = skinColors[p.appearance.skin - 1] || skinColors[0];
  const hc = hairColors[p.appearance.hair - 1] || hairColors[0];
  const shc = shirtColors[p.appearance.shirt - 1] || shirtColors[0];

  const walkBob = p.animation.walking ? Math.sin(p.animation.frame * Math.PI / 2) * 2 : 0;
  const legSwing = p.animation.walking ? Math.sin(p.animation.frame * Math.PI / 2) * 4 : 0;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(p.facing, 1);

  // Gölge
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 25, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bacaklar
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(-9, 10 + legSwing * 0.3, 7, 20 - Math.abs(legSwing) * 0.5);
  ctx.fillRect(2, 10 - legSwing * 0.3, 7, 20 - Math.abs(legSwing) * 0.5);

  // Ayakkabı
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-10, 28 + legSwing * 0.3, 9, 5);
  ctx.fillRect(1, 28 - legSwing * 0.3, 9, 5);

  // Gövde
  ctx.fillStyle = shc;
  ctx.fillRect(-11, -15 + walkBob, 22, 28);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(-11, -15 + walkBob, 22, 6);
  ctx.fillStyle = shc;
  ctx.fillRect(-16, -12 + walkBob, 6, 18);
  ctx.fillRect(10, -12 + walkBob, 6, 18);

  // Eller
  ctx.fillStyle = sc;
  ctx.beginPath();
  ctx.arc(-13, 8 + walkBob, 4, 0, Math.PI * 2);
  ctx.arc(13, 8 + walkBob, 4, 0, Math.PI * 2);
  ctx.fill();

  // Boyun + Baş
  ctx.fillRect(-4, -22 + walkBob, 8, 8);
  ctx.beginPath();
  ctx.arc(0, -35 + walkBob, 15, 0, Math.PI * 2);
  ctx.fill();

  // Saç
  ctx.fillStyle = hc;
  ctx.beginPath();
  ctx.arc(0, -40 + walkBob, 16, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-16, -40 + walkBob, 32, 8);

  // Gözler
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(-5, -37 + walkBob, 3.5, 0, Math.PI * 2);
  ctx.arc(5, -37 + walkBob, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0a0e1a';
  ctx.beginPath();
  ctx.arc(-5 + p.facing * 1, -37 + walkBob, 2, 0, Math.PI * 2);
  ctx.arc(5 + p.facing * 1, -37 + walkBob, 2, 0, Math.PI * 2);
  ctx.fill();

  // Ağız
  ctx.strokeStyle = '#5a3a2a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -30 + walkBob, 4, 0, Math.PI);
  ctx.stroke();

  // Silah (elde)
  if (p.equipped === 'axe') {
    ctx.save();
    ctx.translate(13, 5 + walkBob);
    ctx.rotate(-0.3);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-2, -20, 4, 20);
    ctx.fillStyle = '#aaa';
    ctx.fillRect(-8, -20, 16, 6);
    ctx.restore();
  } else if (p.equipped === 'sword') {
    ctx.save();
    ctx.translate(13, 5 + walkBob);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-2, -5, 4, 8);
    ctx.fillStyle = '#ddd';
    ctx.fillRect(-2, -25, 4, 20);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-5, -8, 10, 4);
    ctx.restore();
  }

  ctx.restore();

  // İsim + Level
  ctx.fillStyle = '#4cc9f0';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${p.name} [Lv.${p.level}]`, cx, cy - 65);
}

/* ==================== EVCİL HAYVANLAR ==================== */
function drawPets() {
  if (typeof PetSystem === 'undefined') return;
  PetSystem.draw(ctx, game.camera.x, game.camera.y);
}

/* ==================== PARTİKÜLLER ==================== */
function drawParticles() {
  game.particles.forEach(p => {
    ctx.fillStyle = `rgba(${p.color},${p.life})`;
    ctx.beginPath();
    ctx.arc(p.x - game.camera.x, p.y - game.camera.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  });
}

console.log('✅ render/entities.js yüklendi');