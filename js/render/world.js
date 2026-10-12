/* ==========================================
   ORION FOREST v6.7 - RENDER / WORLD (FIXED)
   Arka plan, zemin, su, nesneler, ağaçlar
   ========================================== */

'use strict';

/* ==================== YILDIZLAR (GECE) ==================== */
const bgStars = [];
for (let i = 0; i < 100; i++) {
  bgStars.push({
    x: Math.random() * 2000,
    y: Math.random() * 1200,
    size: Math.random() * 1.5 + 0.5,
    twinkle: Math.random() * Math.PI * 2
  });
}

/* ==================== ARKA PLAN (GÖKYÜZÜ) ==================== */
function drawBackground() {
  const w = game.world;
  let skyTop, skyMid, skyBot;

  const weatherDarkness = {
    sunny: 0, cloudy: 0.15, rainy: 0.3, stormy: 0.45,
    snowy: 0.2, foggy: 0.15, rainbow: 0
  };
  const darkMod = weatherDarkness[w.weather] || 0;

  if (w.isDay) {
    const t = (w.time - 6) / 14;
    const sunset = Math.sin(t * Math.PI);

    skyTop = `hsl(${200 + sunset * 30}, ${55 + sunset * 25 - darkMod * 30}%, ${58 + sunset * 15 - darkMod * 30}%)`;
    skyMid = `hsl(${190 + sunset * 50}, ${50 + sunset * 30 - darkMod * 30}%, ${65 + sunset * 10 - darkMod * 30}%)`;
    skyBot = `hsl(${180 + sunset * 70}, ${45 + sunset * 40 - darkMod * 30}%, ${70 + sunset * 5 - darkMod * 30}%)`;
  } else {
    const nightT = w.time < 6 ? w.time / 6 : (24 - w.time) / 4;
    skyTop = `hsl(220, 40%, ${8 + nightT * 3}%)`;
    skyMid = `hsl(215, 45%, ${12 + nightT * 4}%)`;
    skyBot = `hsl(210, 35%, ${16 + nightT * 5}%)`;
  }

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, skyTop);
  grad.addColorStop(0.5, skyMid);
  grad.addColorStop(1, skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  if (!w.isDay) {
    bgStars.forEach(s => {
      s.twinkle += 0.03;
      const alpha = 0.4 + Math.sin(s.twinkle) * 0.4;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x % W, s.y % H, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = 'rgba(240,240,220,0.9)';
    ctx.beginPath();
    ctx.arc(W - 120, 80, 32, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ==================== ZEMİN ==================== */
function drawGround() {
  const cam = game.camera;
  const w = game.world;

  const weatherTint = {
    sunny: 0, cloudy: 0.05, rainy: 0.15, stormy: 0.25,
    snowy: 0.1, foggy: 0.05, rainbow: 0
  };
  const tint = weatherTint[w.weather] || 0;

  ctx.fillStyle = w.isDay ? '#2d4a2d' : '#1a2a1a';
  ctx.fillRect(0, 0, W, H);

  if (tint > 0) {
    ctx.fillStyle = `rgba(20, 30, 50, ${tint})`;
    ctx.fillRect(0, 0, W, H);
  }

  const gridSize = 80;
  const offsetX = -(cam.x % gridSize);
  const offsetY = -(cam.y % gridSize);

  ctx.strokeStyle = w.isDay ? 'rgba(40,70,40,0.3)' : 'rgba(20,30,20,0.3)';
  ctx.lineWidth = 1;

  for (let x = offsetX; x < W; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = offsetY; y < H; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

/* ==================== SU GÖLLERİ ==================== */
function drawWaterBodies() {
  const cam = game.camera;
  const darkness = game.world.isDay ? 1 : 0.6;

  game.waterBodies.forEach(water => {
    const sx = water.x - cam.x;
    const sy = water.y - cam.y;
    if (sx < -water.radius - 100 || sx > W + water.radius + 100) return;
    if (sy < -water.radius - 100 || sy > H + water.radius + 100) return;

    water.animTime = (water.animTime || 0) + 0.02;

    const waterGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, water.radius);
    waterGrad.addColorStop(0, `rgba(30, 100, 180, ${0.45 * darkness})`);
    waterGrad.addColorStop(0.7, `rgba(20, 70, 150, ${0.4 * darkness})`);
    waterGrad.addColorStop(1, `rgba(15, 50, 100, ${0.25 * darkness})`);
    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, water.radius, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      const waveR = water.radius * (0.3 + i * 0.25) + Math.sin(water.animTime + i) * 5;
      ctx.strokeStyle = `rgba(100, 180, 240, ${0.25 * darkness})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, waveR, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = `rgba(200, 230, 255, ${0.1 * darkness})`;
    ctx.beginPath();
    ctx.ellipse(sx - water.radius * 0.3, sy - water.radius * 0.3, water.radius * 0.4, water.radius * 0.15, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(120, 90, 60, ${0.4 * darkness})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx, sy, water.radius, 0, Math.PI * 2);
    ctx.stroke();

    const dist = Math.hypot(game.player.x - water.x, game.player.y - water.y);
    if (dist < water.radius + 200) {
      ctx.fillStyle = `rgba(76, 201, 240, ${darkness})`;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🌊 GÖLET', sx, sy - water.radius - 15);
    }

    if (dist < water.radius) {
      const px = W / 2;
      const py = H / 2 + 20;

      for (let i = 0; i < 3; i++) {
        const waveR = 25 + i * 15 + Math.sin(water.animTime * 2 + i) * 6;
        const alpha = 0.5 - i * 0.15;
        ctx.strokeStyle = `rgba(200, 230, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(px, py, waveR, waveR * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  });
}

/* ==================== BALIK TUTMA ÇİZGİSİ ==================== */
function drawFishingLine() {
  if (typeof FishingSystem !== 'undefined' && FishingSystem.active) {
    FishingSystem.draw(ctx, game.camera.x, game.camera.y);
  }
}

/* ==================== NESNELER ==================== */
function drawObjects() {
  const cam = game.camera;
  const w = game.world;
  const darkness = w.isDay ? 1 : 0.6;

  const visible = game.objects.filter(o => {
    if (o.collected) return false;
    const sx = o.x - cam.x;
    const sy = o.y - cam.y;
    return sx > -100 && sx < W + 100 && sy > -100 && sy < H + 100;
  });

  visible.sort((a, b) => a.y - b.y);
  visible.forEach(obj => drawObject(obj, obj.x - cam.x, obj.y - cam.y, darkness));

  FarmingSystem.draw(ctx, cam.x, cam.y, darkness);
  BuildingSystem.draw(ctx, cam.x, cam.y, darkness);
  if (typeof StructureSystem !== 'undefined') StructureSystem.draw(ctx, cam.x, cam.y, darkness);
  if (typeof NPCCampSystem !== 'undefined') NPCCampSystem.draw(ctx, cam.x, cam.y, darkness);
  if (typeof DecorationSystem !== 'undefined') DecorationSystem.draw(ctx, cam.x, cam.y, darkness);
  drawCampfires(cam.x, cam.y);

  // ✅ ÖZEL HAYVANLAR (Geyik Kralı, Yaban Domuzu)
  if (typeof AnimalSystemV2 !== 'undefined') AnimalSystemV2.draw(ctx, cam.x, cam.y);
}

function drawObject(obj, sx, sy, darkness) {
  ctx.save();
  const scale = obj.size * (1 - (obj.shake || 0) * 0.05);
  const shakeX = (obj.shake || 0) * Math.sin(Date.now() * 0.05) * 2;

  ctx.translate(sx + shakeX, sy);
  ctx.scale(scale, scale);

  switch (obj.type) {
    case 'tree': drawTree(darkness, obj.variant || 0); break;
    case 'stone': drawStone(darkness); break;
    case 'bush':
    case 'bush_berry': drawBush(darkness, obj.type === 'bush_berry'); break;
    case 'grass': drawGrass(darkness); break;
    case 'mushroom': drawMushroom(darkness); break;
    case 'cilek':
    case 'berry': drawBerry(darkness); break;
    case 'flower': drawFlower(darkness); break;
    default:
      ctx.fillStyle = `rgba(76,201,240,${darkness})`;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
  }

  ctx.restore();
}

/* ==================== AĞAÇ (3 TÜR) ==================== */
function drawTree(d, variant) {
  variant = variant || 0;

  if (variant === 1) {
    // 🌲 ÇAM
    ctx.fillStyle = `rgba(80, 55, 40, ${d})`;
    ctx.fillRect(-5, -30, 10, 30);

    for (let layer = 0; layer < 3; layer++) {
      const y = -30 - layer * 15;
      const width = 22 - layer * 5;
      const height = 20;

      ctx.fillStyle = `rgba(25, 80, 45, ${d})`;
      ctx.beginPath();
      ctx.moveTo(0, y - height);
      ctx.lineTo(-width, y);
      ctx.lineTo(width, y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = `rgba(45, 110, 65, ${d * 0.6})`;
      ctx.beginPath();
      ctx.moveTo(-width * 0.4, y - height * 0.6);
      ctx.lineTo(-width * 0.8, y - 2);
      ctx.lineTo(-width * 0.2, y - 2);
      ctx.closePath();
      ctx.fill();
    }
  }
  else if (variant === 2) {
    // 🌳 HUŞ
    ctx.fillStyle = `rgba(230, 230, 220, ${d})`;
    ctx.fillRect(-4, -32, 8, 32);

    ctx.fillStyle = `rgba(30, 30, 30, ${d})`;
    ctx.fillRect(-4, -25, 3, 2);
    ctx.fillRect(1, -18, 3, 2);
    ctx.fillRect(-4, -12, 3, 2);
    ctx.fillRect(1, -6, 3, 2);

    ctx.fillStyle = `rgba(90, 150, 70, ${d})`;
    ctx.beginPath();
    ctx.arc(-8, -40, 14, 0, Math.PI * 2);
    ctx.arc(8, -40, 14, 0, Math.PI * 2);
    ctx.arc(0, -52, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(130, 180, 100, ${d * 0.6})`;
    ctx.beginPath();
    ctx.arc(-4, -48, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  else {
    // 🌳 MEŞE
    ctx.fillStyle = `rgba(93, 64, 55, ${d})`;
    ctx.fillRect(-7, -35, 14, 35);

    ctx.fillStyle = `rgba(35, 100, 60, ${d})`;
    ctx.beginPath();
    ctx.arc(-10, -40, 20, 0, Math.PI * 2);
    ctx.arc(10, -40, 20, 0, Math.PI * 2);
    ctx.arc(0, -55, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(45, 130, 75, ${d})`;
    ctx.beginPath();
    ctx.arc(0, -50, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(70, 160, 100, ${d * 0.6})`;
    ctx.beginPath();
    ctx.arc(-5, -55, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ==================== TAŞ ==================== */
function drawStone(d) {
  ctx.fillStyle = `rgba(120,120,130,${d})`;
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(160,160,170,${d})`;
  ctx.beginPath();
  ctx.ellipse(-4, -4, 10, 7, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

/* ==================== ÇALI ==================== */
function drawBush(d, hasBerry) {
  ctx.fillStyle = `rgba(45,100,55,${d})`;
  ctx.beginPath();
  ctx.arc(-8, 0, 14, 0, Math.PI * 2);
  ctx.arc(8, 0, 14, 0, Math.PI * 2);
  ctx.arc(0, -6, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(60,130,70,${d})`;
  ctx.beginPath();
  ctx.arc(-3, -6, 9, 0, Math.PI * 2);
  ctx.fill();

  if (hasBerry) {
    ctx.fillStyle = `rgba(220,40,40,${d})`;
    ctx.beginPath();
    ctx.arc(-6, -8, 3, 0, Math.PI * 2);
    ctx.arc(2, -10, 3, 0, Math.PI * 2);
    ctx.arc(8, -6, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ==================== OT ==================== */
function drawGrass(d) {
  ctx.strokeStyle = `rgba(90,160,70,${d})`;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 4, 5);
    ctx.quadraticCurveTo(i * 5 + Math.sin(Date.now() * 0.002 + i) * 2, -5, i * 6, -12);
    ctx.stroke();
  }
}

/* ==================== MANTAR ==================== */
function drawMushroom(d) {
  ctx.fillStyle = `rgba(245,245,220,${d})`;
  ctx.fillRect(-3, -2, 6, 12);
  ctx.fillStyle = `rgba(220,60,60,${d})`;
  ctx.beginPath();
  ctx.arc(0, -4, 11, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${d})`;
  ctx.beginPath();
  ctx.arc(-4, -8, 2, 0, Math.PI * 2);
  ctx.arc(3, -7, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

/* ==================== ÇİLEK ==================== */
function drawBerry(d) {
  ctx.fillStyle = `rgba(220,40,40,${d})`;
  ctx.beginPath();
  ctx.arc(-4, 0, 6, 0, Math.PI * 2);
  ctx.arc(4, -2, 6, 0, Math.PI * 2);
  ctx.arc(0, 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(60,140,60,${d})`;
  ctx.fillRect(-1, -12, 2, 8);
}

/* ==================== ÇİÇEK ==================== */
function drawFlower(d) {
  ctx.fillStyle = `rgba(255,220,80,${d})`;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 5, Math.sin(a) * 5, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = `rgba(255,100,100,${d})`;
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
}

/* ==================== KAMP ATEŞİ ==================== */
function drawCampfires(camX, camY) {
  const cf = game.world.campfire;
  if (!cf) return;

  const sx = cf.x - camX;
  const sy = cf.y - camY;
  const darkness = game.world.isDay ? 1 : 0.7;

  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    ctx.fillStyle = `rgba(90,90,100,${darkness})`;
    ctx.beginPath();
    ctx.arc(sx + Math.cos(a) * 26, sy + Math.sin(a) * 26, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(120,120,130,${darkness})`;
    ctx.beginPath();
    ctx.arc(sx + Math.cos(a) * 26 - 2, sy + Math.sin(a) * 26 - 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = `rgba(80,50,30,${darkness})`;
  ctx.fillRect(sx - 18, sy - 4, 36, 8);
  ctx.fillRect(sx - 4, sy - 18, 8, 36);

  if (cf.lit) {
    const lightGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 200);
    lightGrad.addColorStop(0, 'rgba(255,180,80,0.35)');
    lightGrad.addColorStop(0.4, 'rgba(255,140,50,0.15)');
    lightGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, 200, 0, Math.PI * 2);
    ctx.fill();

    cf.animTime = (cf.animTime || 0) + 0.18;

    for (let i = 0; i < 4; i++) {
      const offset = i * 0.7;
      const flicker = Math.sin(cf.animTime + offset) * 4;
      const height = 25 + Math.sin(cf.animTime * 1.5 + offset) * 10;
      const width = 10 + Math.sin(cf.animTime * 2 + offset) * 2;

      const flameGrad = ctx.createLinearGradient(sx, sy, sx, sy - height);
      flameGrad.addColorStop(0, 'rgba(255,240,100,0.95)');
      flameGrad.addColorStop(0.4, 'rgba(255,150,50,0.9)');
      flameGrad.addColorStop(0.8, 'rgba(240,80,20,0.5)');
      flameGrad.addColorStop(1, 'rgba(200,40,10,0)');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(sx - width + flicker, sy);
      ctx.quadraticCurveTo(sx - width * 0.5 + flicker, sy - height * 0.6, sx + flicker, sy - height);
      ctx.quadraticCurveTo(sx + width * 0.5 + flicker, sy - height * 0.6, sx + width + flicker, sy);
      ctx.fill();
    }

    if (game.settings.particlesEnabled && Math.random() < 0.4) {
      game.particles.push({
        x: cf.x + (Math.random() - 0.5) * 30,
        y: cf.y - 10,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -Math.random() * 2.5 - 0.8,
        life: 1,
        color: '255,200,100',
        size: 2.5
      });
    }
  }
}

console.log('✅ render/world.js yüklendi (AnimalSystemV2 entegre)');