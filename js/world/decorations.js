/* ==========================================
   ORION FOREST v6.7 - DECORATIONS (FIXED)
   Map güzelleştirme + ağaç çeşitliliği
   ========================================== */

'use strict';

const DecorationSystem = {
  decorations: [],

  /* ==================== OLUŞTUR ==================== */
  generate() {
    this.decorations = [];

    for (let i = 0; i < 18; i++) this.spawnFlowerCluster();
    for (let i = 0; i < 5; i++) this.spawnMushroomRing();
    for (let i = 0; i < 15; i++) this.spawnRockFormation();
    for (let i = 0; i < 10; i++) this.spawnFallenLog();
    for (let i = 0; i < 8; i++) this.spawnPuddle();
    for (let i = 0; i < 25; i++) this.spawnTallGrass();

    console.log(`🌸 ${this.decorations.length} dekorasyon oluşturuldu`);
  },

  /* ==================== ÇİÇEK KÜMESİ ==================== */
  spawnFlowerCluster() {
    const pos = this.findSpot(500, 4500);
    if (!pos) return;

    const flowerCount = 8 + Math.floor(rnd() * 8);
    const colorSet = Math.floor(rnd() * 4);
    const flowers = [];

    for (let i = 0; i < flowerCount; i++) {
      const a = rnd() * Math.PI * 2;
      const d = rnd() * 35;
      flowers.push({
        x: pos.x + Math.cos(a) * d,
        y: pos.y + Math.sin(a) * d,
        size: 0.7 + rnd() * 0.6,
        rotation: rnd() * Math.PI * 2
      });
    }

    this.decorations.push({
      type: 'flower_cluster',
      x: pos.x, y: pos.y,
      flowers,
      colorSet
    });
  },

  /* ==================== MANTAR HALKASI ==================== */
  spawnMushroomRing() {
    const pos = this.findSpot(1000, 4000);
    if (!pos) return;

    const count = 6 + Math.floor(rnd() * 4);
    const radius = 25 + rnd() * 20;
    const mushrooms = [];

    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      mushrooms.push({
        x: pos.x + Math.cos(a) * radius,
        y: pos.y + Math.sin(a) * radius,
        size: 0.8 + rnd() * 0.4,
        isRed: rnd() < 0.7
      });
    }

    this.decorations.push({
      type: 'mushroom_ring',
      x: pos.x, y: pos.y,
      mushrooms,
      radius,
      glowTime: 0,
      hasCenter: rnd() < 0.4
    });
  },

  /* ==================== KAYA KÜMESİ ==================== */
  spawnRockFormation() {
    const pos = this.findSpot(300, 4500);
    if (!pos) return;

    const count = 3 + Math.floor(rnd() * 3);
    const rocks = [];

    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2;
      const d = rnd() * 30;
      rocks.push({
        x: pos.x + Math.cos(a) * d,
        y: pos.y + Math.sin(a) * d,
        size: 0.6 + rnd() * 1.2,
        rotation: rnd() * Math.PI,
        tone: rnd()
      });
    }

    this.decorations.push({
      type: 'rock_formation',
      x: pos.x, y: pos.y,
      rocks
    });
  },

  /* ==================== DEVRİLMİŞ KÜTÜK ==================== */
  spawnFallenLog() {
    const pos = this.findSpot(400, 4500);
    if (!pos) return;

    this.decorations.push({
      type: 'fallen_log',
      x: pos.x, y: pos.y,
      length: 40 + rnd() * 40,
      rotation: rnd() * Math.PI * 2,
      hasMoss: rnd() < 0.6,
      hasMushroom: rnd() < 0.3
    });
  },

  /* ==================== SU BİRİKİNTİSİ ==================== */
  spawnPuddle() {
    const pos = this.findSpot(800, 4000);
    if (!pos) return;

    this.decorations.push({
      type: 'puddle',
      x: pos.x, y: pos.y,
      radius: 15 + rnd() * 20,
      animTime: rnd() * Math.PI * 2
    });
  },

  /* ==================== UZUN OT ==================== */
  spawnTallGrass() {
    const pos = this.findSpot(200, 4500);
    if (!pos) return;

    const count = 5 + Math.floor(rnd() * 5);
    const tufts = [];

    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2;
      const d = rnd() * 20;
      tufts.push({
        x: pos.x + Math.cos(a) * d,
        y: pos.y + Math.sin(a) * d,
        height: 12 + rnd() * 10,
        sway: rnd() * Math.PI * 2
      });
    }

    this.decorations.push({
      type: 'tall_grass',
      x: pos.x, y: pos.y,
      tufts
    });
  },

  /* ==================== YER BUL ==================== */
  findSpot(minDist, maxDist) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const angle = rnd() * Math.PI * 2;
      const dist = minDist + rnd() * (maxDist - minDist);
      const x = CAMP_X + Math.cos(angle) * dist;
      const y = CAMP_Y + Math.sin(angle) * dist;

      if (x < 300 || x > WORLD_SIZE - 300) continue;
      if (y < 300 || y > WORLD_SIZE - 300) continue;
      if (Math.hypot(x - CAMP_X, y - CAMP_Y) < 300) continue;

      return { x, y };
    }
    return null;
  },

  /* ==================== GÜNCELLE ==================== */
  update(dt) {
    this.decorations.forEach(d => {
      if (d.type === 'mushroom_ring') {
        d.glowTime = (d.glowTime || 0) + dt;
      }
      if (d.type === 'puddle') {
        d.animTime = (d.animTime || 0) + dt;
      }
    });
  },

  /* ==================== ÇİZİM ==================== */
  draw(ctx, camX, camY, darkness) {
    this.decorations.forEach(d => {
      const sx = d.x - camX;
      const sy = d.y - camY;

      if (sx < -150 || sx > W + 150 || sy < -150 || sy > H + 150) return;

      switch (d.type) {
        case 'flower_cluster': this.drawFlowerCluster(ctx, d, sx, sy, darkness, camX, camY); break;
        case 'mushroom_ring': this.drawMushroomRing(ctx, d, sx, sy, darkness, camX, camY); break;
        case 'rock_formation': this.drawRockFormation(ctx, d, sx, sy, darkness, camX, camY); break;
        case 'fallen_log': this.drawFallenLog(ctx, d, sx, sy, darkness); break;
        case 'puddle': this.drawPuddle(ctx, d, sx, sy, darkness); break;
        case 'tall_grass': this.drawTallGrass(ctx, d, sx, sy, darkness, camX, camY); break;
      }
    });
  },

  /* ==================== ÇİÇEK ÇİZ ==================== */
  drawFlowerCluster(ctx, d, sx, sy, darkness, camX, camY) {
    const palettes = [
      { petal: '#ff69b4', center: '#ffdd00' },
      { petal: '#ffdd00', center: '#ff8800' },
      { petal: '#9370db', center: '#ffdd00' },
      { petal: '#fff', center: '#ffdd00' }
    ];
    const p = palettes[d.colorSet] || palettes[0];

    d.flowers.forEach(f => {
      const fx = f.x - camX;
      const fy = f.y - camY;

      ctx.save();
      ctx.translate(fx, fy);
      ctx.scale(f.size, f.size);
      ctx.rotate(f.rotation);

      // Yaprak
      ctx.fillStyle = `rgba(50, 130, 60, ${darkness})`;
      ctx.beginPath();
      ctx.ellipse(0, 4, 2.5, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Taç yapraklar
      ctx.fillStyle = p.petal;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 4, Math.sin(a) * 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Merkez
      ctx.fillStyle = p.center;
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  },

  /* ==================== MANTAR HALKASI ÇİZ ==================== */
  drawMushroomRing(ctx, d, sx, sy, darkness, camX, camY) {
    const glowAlpha = 0.15 + Math.sin(d.glowTime * 2) * 0.08;
    const glowGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, d.radius + 20);
    glowGrad.addColorStop(0, `rgba(147, 112, 219, ${glowAlpha})`);
    glowGrad.addColorStop(0.7, `rgba(147, 112, 219, ${glowAlpha * 0.4})`);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, d.radius + 20, 0, Math.PI * 2);
    ctx.fill();

    // Sihirli çember
    ctx.strokeStyle = `rgba(147, 112, 219, ${0.3 * darkness})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, d.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Mantarlar
    d.mushrooms.forEach(m => {
      const mx = m.x - camX;
      const my = m.y - camY;

      ctx.save();
      ctx.translate(mx, my);
      ctx.scale(m.size, m.size);

      // Sap
      ctx.fillStyle = `rgba(245, 245, 220, ${darkness})`;
      ctx.fillRect(-2, -2, 4, 10);

      // Şapka
      ctx.fillStyle = m.isRed ? `rgba(220, 60, 60, ${darkness})` : `rgba(147, 112, 219, ${darkness})`;
      ctx.beginPath();
      ctx.arc(0, -3, 8, Math.PI, 0);
      ctx.fill();

      // Beyaz noktalar
      ctx.fillStyle = `rgba(255, 255, 255, ${darkness})`;
      ctx.beginPath();
      ctx.arc(-3, -6, 1.5, 0, Math.PI * 2);
      ctx.arc(2, -7, 1.5, 0, Math.PI * 2);
      ctx.arc(-1, -3, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // Merkez büyülü obje
    if (d.hasCenter) {
      const pulse = 0.7 + Math.sin(d.glowTime * 3) * 0.3;

      ctx.fillStyle = `rgba(200, 100, 255, ${pulse * darkness})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 220, 255, ${pulse * darkness * 0.6})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fill();

      if (Math.random() < 0.15 && game.settings.particlesEnabled) {
        game.particles.push({
          x: d.x,
          y: d.y,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -Math.random() * 1.5 - 0.5,
          life: 1.5,
          color: '200, 100, 255',
          size: 3
        });
      }
    }
  },

  /* ==================== KAYA KÜMESİ ÇİZ ==================== */
  drawRockFormation(ctx, d, sx, sy, darkness, camX, camY) {
    d.rocks.forEach(r => {
      const rx = r.x - camX;
      const ry = r.y - camY;

      ctx.save();
      ctx.translate(rx, ry);
      ctx.scale(r.size, r.size);
      ctx.rotate(r.rotation);

      // Gölge
      ctx.fillStyle = `rgba(0, 0, 0, ${0.25 * darkness})`;
      ctx.beginPath();
      ctx.ellipse(2, 4, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ana kaya
      const grayTone = 90 + r.tone * 40;
      ctx.fillStyle = `rgba(${grayTone}, ${grayTone}, ${grayTone + 10}, ${darkness})`;
      ctx.beginPath();
      ctx.moveTo(-12, 4);
      ctx.lineTo(-8, -8);
      ctx.lineTo(4, -12);
      ctx.lineTo(12, -2);
      ctx.lineTo(8, 6);
      ctx.lineTo(-6, 8);
      ctx.closePath();
      ctx.fill();

      // Highlight
      ctx.fillStyle = `rgba(${grayTone + 40}, ${grayTone + 40}, ${grayTone + 50}, ${darkness * 0.6})`;
      ctx.beginPath();
      ctx.moveTo(-8, -8);
      ctx.lineTo(0, -11);
      ctx.lineTo(4, -8);
      ctx.closePath();
      ctx.fill();

      // Yosun
      if (r.tone > 0.6) {
        ctx.fillStyle = `rgba(60, 120, 60, ${darkness * 0.5})`;
        ctx.beginPath();
        ctx.arc(-4, -4, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  },

  /* ==================== KÜTÜK ÇİZ ==================== */
  drawFallenLog(ctx, d, sx, sy, darkness) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(d.rotation);

    const len = d.length;
    const width = 12;

    // Gölge
    ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * darkness})`;
    ctx.fillRect(-len / 2 + 3, -width / 2 + 4, len, width);

    // Ana kütük
    ctx.fillStyle = `rgba(90, 60, 40, ${darkness})`;
    ctx.fillRect(-len / 2, -width / 2, len, width);

    // Uç daire
    ctx.fillStyle = `rgba(120, 85, 55, ${darkness})`;
    ctx.beginPath();
    ctx.ellipse(len / 2, 0, width * 0.3, width / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Yıllık halkalar
    ctx.strokeStyle = `rgba(70, 45, 30, ${darkness})`;
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(len / 2, 0, (width * 0.3) - i * 2, (width / 2) - i * 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Gövde çizgileri
    ctx.strokeStyle = `rgba(60, 40, 25, ${darkness * 0.5})`;
    for (let i = 0; i < 4; i++) {
      const x = -len / 2 + (i + 1) * (len / 5);
      ctx.beginPath();
      ctx.moveTo(x, -width / 2 + 2);
      ctx.lineTo(x, width / 2 - 2);
      ctx.stroke();
    }

    // Yosun
    if (d.hasMoss) {
      ctx.fillStyle = `rgba(60, 130, 60, ${darkness * 0.7})`;
      ctx.fillRect(-len / 3, -width / 2, len / 3, 4);
      ctx.beginPath();
      ctx.arc(-len / 4, -width / 2 + 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mantar
    if (d.hasMushroom) {
      ctx.fillStyle = `rgba(220, 60, 60, ${darkness})`;
      ctx.beginPath();
      ctx.arc(0, -width / 2 - 3, 4, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = `rgba(245, 245, 220, ${darkness})`;
      ctx.fillRect(-1, -width / 2 - 3, 2, 4);
    }

    ctx.restore();
  },

  /* ==================== SU BİRİKİNTİSİ ÇİZ ==================== */
  drawPuddle(ctx, d, sx, sy, darkness) {
    const wave = Math.sin(d.animTime * 2) * 1.5;

    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, d.radius);
    grad.addColorStop(0, `rgba(60, 130, 200, ${0.5 * darkness})`);
    grad.addColorStop(0.7, `rgba(40, 100, 180, ${0.4 * darkness})`);
    grad.addColorStop(1, `rgba(30, 70, 140, ${0.2 * darkness})`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(sx, sy, d.radius, d.radius * 0.6 + wave, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(200, 230, 255, ${0.15 * darkness})`;
    ctx.beginPath();
    ctx.ellipse(sx - d.radius * 0.3, sy - d.radius * 0.25, d.radius * 0.4, d.radius * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(80, 60, 40, ${0.4 * darkness})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx, sy, d.radius, d.radius * 0.6 + wave, 0, 0, Math.PI * 2);
    ctx.stroke();
  },

  /* ==================== UZUN OT ÇİZ ==================== */
  drawTallGrass(ctx, d, sx, sy, darkness, camX, camY) {
    d.tufts.forEach(t => {
      const tx = t.x - camX;
      const ty = t.y - camY;

      ctx.save();
      ctx.translate(tx, ty);

      const sway = Math.sin(Date.now() * 0.002 + t.sway) * 2;

      ctx.strokeStyle = `rgba(80, 150, 60, ${darkness})`;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 3, 3);
        ctx.quadraticCurveTo(i * 4 + sway, -t.height * 0.5, i * 5 + sway * 1.5, -t.height);
        ctx.stroke();
      }

      ctx.strokeStyle = `rgba(60, 130, 50, ${darkness * 0.7})`;
      ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 2, 3);
        ctx.quadraticCurveTo(i * 3 + sway, -t.height * 0.6, i * 3.5 + sway, -t.height * 0.9);
        ctx.stroke();
      }

      ctx.restore();
    });
  }
};

window.DecorationSystem = DecorationSystem;

console.log('✅ decorations.js yüklendi (FIXED)');