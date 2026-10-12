/* ==========================================
   ORION FOREST v6.7 - RENDER / UI (FIXED)
   Mini harita + render + kamera fix
   ========================================== */

'use strict';

/* ==================== MİNİ HARİTA ==================== */
function drawMiniMap() {
  // ✅ TRANSFORM'U SIFIRLA
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  const mm = $('miniMapCanvas');
  const container = $('miniMap');
  if (!mm || !container) return;

  const isBig = container.classList.contains('big');
  const containerSize = isBig ? 700 : 130;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const pixelSize = Math.floor(containerSize * dpr);

  if (mm.width !== pixelSize || mm.height !== pixelSize) {
    mm.width = pixelSize;
    mm.height = pixelSize;
  }

  const mctx = mm.getContext('2d');
  const size = pixelSize;

  // Arka plan
  const bgGrad = mctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  bgGrad.addColorStop(0, '#1a3a1a');
  bgGrad.addColorStop(1, '#0a1a0a');
  mctx.fillStyle = bgGrad;
  mctx.fillRect(0, 0, size, size);

  // Izgara
  mctx.strokeStyle = 'rgba(76, 201, 240, 0.08)';
  mctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    const p = (size / 8) * i;
    mctx.beginPath();
    mctx.moveTo(p, 0);
    mctx.lineTo(p, size);
    mctx.stroke();
    mctx.beginPath();
    mctx.moveTo(0, p);
    mctx.lineTo(size, p);
    mctx.stroke();
  }

  const scale = size / WORLD_SIZE;
  const centerX = game.player.x * scale;
  const centerY = game.player.y * scale;

  mctx.save();
  mctx.translate(size / 2 - centerX, size / 2 - centerY);

  // Su alanları
  if (game.waterBodies) {
    game.waterBodies.forEach(w => {
      const ox = w.x * scale;
      const oy = w.y * scale;
      mctx.fillStyle = 'rgba(30, 100, 180, 0.7)';
      mctx.beginPath();
      mctx.arc(ox, oy, w.radius * scale, 0, Math.PI * 2);
      mctx.fill();
    });
  }

  // Ağaçlar ve taşlar
  const dotSize = isBig ? 2 : 1;
  game.objects.forEach(o => {
    if (o.collected) return;
    const ox = o.x * scale;
    const oy = o.y * scale;

    if (ox < centerX - size || ox > centerX + size) return;
    if (oy < centerY - size || oy > centerY + size) return;

    if (o.type === 'tree') {
      mctx.fillStyle = '#2d7a4a';
      mctx.fillRect(ox - dotSize / 2, oy - dotSize / 2, dotSize, dotSize);
    } else if (o.type === 'stone') {
      mctx.fillStyle = '#7a7a82';
      mctx.fillRect(ox - dotSize / 2, oy - dotSize / 2, dotSize, dotSize);
    }
  });

  // Hayvanlar
  mctx.fillStyle = '#4caf50';
  game.animals.forEach(a => {
    const ox = a.x * scale;
    const oy = a.y * scale;
    mctx.beginPath();
    mctx.arc(ox, oy, isBig ? 3 : 1.8, 0, Math.PI * 2);
    mctx.fill();
  });

  // Düşmanlar
  mctx.fillStyle = '#ff0844';
  game.enemies.forEach(e => {
    const ox = e.x * scale;
    const oy = e.y * scale;
    mctx.beginPath();
    mctx.arc(ox, oy, isBig ? 3.5 : 2.2, 0, Math.PI * 2);
    mctx.fill();
  });

  // Yapılar
  if (typeof StructureSystem !== 'undefined') {
    mctx.fillStyle = '#ff9800';
    StructureSystem.structures.forEach(s => {
      const ox = s.x * scale;
      const oy = s.y * scale;
      const bSize = isBig ? 6 : 3;
      mctx.fillRect(ox - bSize / 2, oy - bSize / 2, bSize, bSize);

      if (s.npc && !s.npc.dead) {
        mctx.fillStyle = '#4cc9f0';
        mctx.beginPath();
        mctx.arc(ox, oy - 5, isBig ? 3 : 2, 0, Math.PI * 2);
        mctx.fill();
        mctx.fillStyle = '#ff9800';
      }
    });
  }

  // NPC Kampları
  if (typeof NPCCampSystem !== 'undefined') {
    NPCCampSystem.camps.forEach(c => {
      const ox = c.x * scale;
      const oy = c.y * scale;
      const campSize = isBig ? 7 : 4;

      if (c.type === 'bandit') mctx.fillStyle = '#dc143c';
      else if (c.type === 'witch') mctx.fillStyle = '#9370db';
      else if (c.type === 'villager') mctx.fillStyle = '#4cc9f0';
      else if (c.type === 'merchant') mctx.fillStyle = '#ffd700';
      else mctx.fillStyle = '#666';

      mctx.beginPath();
      mctx.arc(ox, oy, campSize, 0, Math.PI * 2);
      mctx.fill();
      mctx.strokeStyle = '#fff';
      mctx.lineWidth = 1;
      mctx.stroke();
    });
  }

  // Özel hayvanlar
  if (typeof AnimalSystemV2 !== 'undefined') {
    AnimalSystemV2.specialAnimals.forEach(a => {
      const ox = a.x * scale;
      const oy = a.y * scale;

      if (a.isBoss) {
        mctx.fillStyle = '#ffd700';
        mctx.beginPath();
        mctx.arc(ox, oy, isBig ? 6 : 4, 0, Math.PI * 2);
        mctx.fill();
        mctx.strokeStyle = '#fff';
        mctx.lineWidth = 1.5;
        mctx.stroke();
      } else {
        mctx.fillStyle = '#ff6b35';
        mctx.beginPath();
        mctx.arc(ox, oy, isBig ? 3 : 2, 0, Math.PI * 2);
        mctx.fill();
      }
    });
  }

  // İnşa ettiklerin
  mctx.fillStyle = '#a29bfe';
  game.buildings.forEach(b => {
    const ox = b.x * scale;
    const oy = b.y * scale;
    const bSize = isBig ? 5 : 3;
    mctx.fillRect(ox - bSize / 2, oy - bSize / 2, bSize, bSize);
  });

  // Evcil hayvanlar
  if (typeof PetSystem !== 'undefined') {
    mctx.fillStyle = '#ff69b4';
    PetSystem.pets.forEach(p => {
      const ox = p.x * scale;
      const oy = p.y * scale;
      mctx.beginPath();
      mctx.arc(ox, oy, isBig ? 3 : 2, 0, Math.PI * 2);
      mctx.fill();
    });
  }

  // Ana kamp ateşi
  const cf = game.world.campfire;
  if (cf) {
    const ox = cf.x * scale;
    const oy = cf.y * scale;

    if (cf.lit) {
      const glow = mctx.createRadialGradient(ox, oy, 0, ox, oy, isBig ? 25 : 15);
      glow.addColorStop(0, 'rgba(255, 107, 53, 0.5)');
      glow.addColorStop(1, 'transparent');
      mctx.fillStyle = glow;
      mctx.beginPath();
      mctx.arc(ox, oy, isBig ? 25 : 15, 0, Math.PI * 2);
      mctx.fill();
    }

    mctx.fillStyle = cf.lit ? '#ff6b35' : '#666';
    mctx.beginPath();
    mctx.arc(ox, oy, isBig ? 6 : 3.5, 0, Math.PI * 2);
    mctx.fill();
    mctx.strokeStyle = '#fff';
    mctx.lineWidth = 1;
    mctx.stroke();
  }

  mctx.restore();

  // Radar (oyuncu merkez)
  mctx.save();
  mctx.translate(size / 2, size / 2);

  const radarSize = isBig ? 120 : 45;
  const radarGrad = mctx.createRadialGradient(0, 0, 0, 0, 0, radarSize);
  radarGrad.addColorStop(0, 'rgba(76, 201, 240, 0.35)');
  radarGrad.addColorStop(0.7, 'rgba(76, 201, 240, 0.1)');
  radarGrad.addColorStop(1, 'transparent');
  mctx.fillStyle = radarGrad;
  mctx.beginPath();
  mctx.arc(0, 0, radarSize, 0, Math.PI * 2);
  mctx.fill();

  const playerSize = isBig ? 8 : 5;
  mctx.fillStyle = '#4cc9f0';
  mctx.beginPath();
  mctx.arc(0, 0, playerSize, 0, Math.PI * 2);
  mctx.fill();
  mctx.strokeStyle = '#fff';
  mctx.lineWidth = 2;
  mctx.stroke();

  // Yön oku
  mctx.fillStyle = '#4cc9f0';
  mctx.beginPath();
  mctx.moveTo(0, -(playerSize * 2.8));
  mctx.lineTo(-(playerSize * 1), -(playerSize * 1.6));
  mctx.lineTo(playerSize * 1, -(playerSize * 1.6));
  mctx.closePath();
  mctx.fill();

  mctx.restore();

  // Çerçeve
  mctx.strokeStyle = '#4cc9f0';
  mctx.lineWidth = isBig ? 4 : 2;
  mctx.strokeRect(1, 1, size - 2, size - 2);

  // N harfi
  mctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  mctx.font = `bold ${isBig ? 24 : 12}px Arial`;
  mctx.textAlign = 'center';
  mctx.fillText('N', size / 2, isBig ? 30 : 16);

  // Büyük haritada alt bilgi
  if (isBig) {
    const infoH = 40;
    mctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    mctx.fillRect(0, size - infoH, size, infoH);

    mctx.font = 'bold 16px Arial';
    mctx.textAlign = 'left';
    mctx.fillStyle = '#4caf50';
    mctx.fillText(`🐾 ${game.animals.length}`, 20, size - 15);

    mctx.textAlign = 'center';
    mctx.fillStyle = '#ff0844';
    mctx.fillText(`👹 ${game.enemies.length}`, size / 2, size - 15);

    mctx.textAlign = 'right';
    mctx.fillStyle = '#ff9800';
    mctx.fillText(`🏠 ${StructureSystem ? StructureSystem.structures.length : 0}`, size - 20, size - 15);
  }
}

/* ==================== ANA RENDER ==================== */
function render() {
  // ✅✅✅ HER FRAME BAŞINDA TRANSFORM'U SIFIRLA — KAMERA FIX ✅✅✅
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  drawBackground();
  drawGround();
  drawObjects();
  drawAnimals();
  drawBabyPets();
  drawEnemies();
  drawPets();
  drawPlayer();
  drawWaterBodies();
  drawFishingLine();
  drawParticles();

  // Gece overlay
  if (!game.world.isDay) {
    const nightT = game.world.time < 6 ? game.world.time / 6 : (24 - game.world.time) / 4;
    const darkAmount = 0.25 + nightT * 0.15;
    ctx.fillStyle = `rgba(10,15,40,${darkAmount})`;
    ctx.fillRect(0, 0, W, H);

    // Kamp ateşi ışığı
    if (game.world.campfire && game.world.campfire.lit) {
      const cf = game.world.campfire;
      const sx = cf.x - game.camera.x;
      const sy = cf.y - game.camera.y;
      const lightGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 240);
      lightGrad.addColorStop(0, 'rgba(255,180,80,0.4)');
      lightGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, 240, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ✅ ÇİZİMDEN ÖNCE TEKRAR SIFIRLA
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  drawMiniMap();
}

console.log('✅ render/ui.js yüklendi (KAMERA FIX)');