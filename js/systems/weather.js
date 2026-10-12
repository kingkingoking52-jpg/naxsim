/* ==========================================
   ORION FOREST v6.3 - WEATHER SYSTEM
   Yağmur, kar, sis, fırtına, gökkuşağı
   ========================================== */

'use strict';

const WeatherSystem = {
  // Hava tipleri
  TYPES: {
    sunny:   { icon: '☀️', name: 'Güneşli',   particle: null },
    cloudy:  { icon: '☁️', name: 'Bulutlu',   particle: null },
    rainy:   { icon: '🌧️', name: 'Yağmurlu',  particle: 'rain' },
    stormy:  { icon: '⛈️', name: 'Fırtınalı', particle: 'storm' },
    snowy:   { icon: '❄️', name: 'Karlı',     particle: 'snow' },
    foggy:   { icon: '🌫️', name: 'Sisli',     particle: 'fog' },
    rainbow: { icon: '🌈', name: 'Gökkuşağı', particle: null }
  },

  // Partiküller
  particles: [],
  splashes: [],
  lastType: null,
  lightningFlash: 0,
  flashCooldown: 0,

  // Sis katmanları (önbellek)
  fogLayers: [],
  fogTime: 0,

  /* ==================== GÜNCELLE (Ana) ==================== */
  update(dt) {
    const w = game.world;
    w.weatherTimer += dt;

    // Hava değişim zamanı
    if (w.weatherTimer >= w.weatherDuration) {
      w.weatherTimer = 0;
      w.weatherDuration = 40 + Math.random() * 60;

      const oldWeather = w.weather;

      // Yeni hava seç
      const possible = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy'];
      const weights = [3, 3, 2, 1, 1, 1];
      let total = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;

      for (let i = 0; i < possible.length; i++) {
        r -= weights[i];
        if (r <= 0) { w.weather = possible[i]; break; }
      }

      // Yağmur sonrası gökkuşağı şansı
      if (oldWeather === 'rainy' && Math.random() < 0.3) {
        w.weather = 'rainbow';
      }

      // Hava değiştiyse mesaj ve ses
      if (w.weather !== oldWeather) {
        const wInfo = this.TYPES[w.weather];
        if (typeof addMessage === 'function') addMessage(`${wInfo.icon} Hava: ${wInfo.name}`);

        game.player.stats.weathersSeen.add(w.weather);
        if (game.player.stats.weathersSeen.size >= 6 && typeof AchievementSystem !== 'undefined') {
          AchievementSystem.unlock('weather');
        }

        if (game.settings.weatherSoundEnabled && typeof audio !== 'undefined') {
          if (w.weather === 'stormy' && audio.thunder) audio.thunder();
          else if (w.weather === 'rainy' && audio.rain) audio.rain();
          else if (w.weather === 'snowy' && audio.snow) audio.snow();
        }
      }
    }

    // Sıcaklık hedefi
    let targetTemp = 25;
    if (w.weather === 'snowy') targetTemp = 5;
    else if (w.weather === 'rainy') targetTemp = 15;
    else if (w.weather === 'stormy') targetTemp = 12;
    else if (w.weather === 'sunny') targetTemp = 28;
    else if (w.weather === 'cloudy') targetTemp = 22;
    else if (w.weather === 'foggy') targetTemp = 18;

    w.temperature += (targetTemp - w.temperature) * 0.01;

    // Vücut sıcaklığı
    const campfireHeat = (w.campfire.lit && Math.hypot(game.player.x - w.campfire.x, game.player.y - w.campfire.y) < 180) ? 0.4 : 0;
    const targetBodyTemp = 0.3 + ((w.temperature - 5) / 30) * 0.4 + campfireHeat;
    game.player.temperature += (targetBodyTemp - game.player.temperature) * 0.005;

    // Aşırı soğuk hasarı
    if (game.player.temperature < 0.2) {
      game.player.health = Math.max(0, game.player.health - 0.3);
    }
  },

  /* ==================== PARTİKÜLLERİ GÜNCELLE ==================== */
  updateParticles(dt) {
    const w = game.world;
    const type = this.TYPES[w.weather];

    // Hava değiştiyse temizle
    if (this.lastType !== w.weather) {
      this.particles.length = 0;
      this.splashes.length = 0;
      this.lastType = w.weather;
    }

    if (!type.particle || !game.settings.weatherEffectsEnabled) {
      this.particles.length = 0;
      this.splashes.length = 0;
      return;
    }

    // Hedef sayı
    let targetCount = 0;
    if (type.particle === 'rain') targetCount = 220;
    else if (type.particle === 'snow') targetCount = 130;
    else if (type.particle === 'storm') targetCount = 380;

    // Yeni partikül ekle
    while (this.particles.length < targetCount) {
      if (type.particle === 'rain' || type.particle === 'storm') {
        this.particles.push(this.createRainDrop());
      } else if (type.particle === 'snow') {
        this.particles.push(this.createSnowFlake());
      }
    }

    // Güncelle
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.type === 'rain') {
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;

        // Yere düştü → splash
        if (p.y > H - 8 && Math.random() < 0.08) {
          this.splashes.push({
            x: p.x, y: H - 8,
            size: 1, maxSize: 6 + Math.random() * 8,
            life: 1
          });
        }
      } else if (p.type === 'snow') {
        p.sway += 0.04;
        p.x += p.vx * dt * 60 + Math.sin(p.sway) * 0.7;
        p.y += p.vy * dt * 60;
        p.rot += p.rotSpeed;
      }

      // Ekrandan çıktıysa sil
      if (p.y > H + 50 || p.x < -120 || p.x > W + 120) {
        this.particles.splice(i, 1);
      }
    }

    // Splash'leri güncelle
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const s = this.splashes[i];
      s.size += dt * 45;
      s.life -= dt * 2.5;
      if (s.life <= 0) this.splashes.splice(i, 1);
    }

    // Şimşek cooldown
    if (this.flashCooldown > 0) this.flashCooldown -= dt;
  },

  /* ==================== OLUŞTURUCULAR ==================== */
  createRainDrop() {
    return {
      x: Math.random() * (W + 300) - 150,
      y: Math.random() * -H,
      vx: -3 - Math.random() * 5,
      vy: 18 + Math.random() * 12,
      length: 15 + Math.random() * 25,
      width: 1 + Math.random() * 1.8,
      alpha: 0.5 + Math.random() * 0.4,
      type: 'rain'
    };
  },

  createSnowFlake() {
    return {
      x: Math.random() * (W + 100) - 50,
      y: Math.random() * -H,
      vx: (Math.random() - 0.5) * 2,
      vy: 1.2 + Math.random() * 2,
      size: 2 + Math.random() * 4,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.08,
      sway: Math.random() * Math.PI * 2,
      alpha: 0.6 + Math.random() * 0.4,
      type: 'snow'
    };
  },

  /* ==================== ÇİZİM ==================== */
  draw() {
    if (!wctx) return;
    wctx.clearRect(0, 0, W, H);
    if (!game.settings.weatherEffectsEnabled) return;

    const w = game.world;

    // ==================== YAĞMUR / FIRTINA ====================
    if (w.weather === 'rainy' || w.weather === 'stormy') {
      this.drawRain(w.weather === 'stormy');
    }
    // ==================== KAR ====================
    else if (w.weather === 'snowy') {
      this.drawSnow();
    }
    // ==================== SİS ====================
    else if (w.weather === 'foggy') {
      this.drawFog();
    }
    // ==================== GÖKKUŞAĞI ====================
    else if (w.weather === 'rainbow') {
      this.drawRainbow();
    }
    // ==================== BULUTLU ====================
    else if (w.weather === 'cloudy') {
      wctx.fillStyle = 'rgba(180, 190, 200, 0.06)';
      wctx.fillRect(0, 0, W, H);
    }
  },

  /* ==================== YAĞMUR ==================== */
  drawRain(isStorm) {
    // Atmosfer koyuluğu
    wctx.fillStyle = isStorm ? 'rgba(30, 40, 60, 0.25)' : 'rgba(50, 60, 80, 0.15)';
    wctx.fillRect(0, 0, W, H);

    // Yağmur damlaları
    this.particles.forEach(p => {
      if (p.type !== 'rain') return;

      // Açı hesapla
      const angle = Math.atan2(p.vy, p.vx);
      const tailX = p.x - Math.cos(angle) * p.length;
      const tailY = p.y - Math.sin(angle) * p.length;

      // Gradient (kuyruk açık → baş koyu)
      const grad = wctx.createLinearGradient(tailX, tailY, p.x, p.y);
      grad.addColorStop(0, 'rgba(180, 210, 255, 0)');
      grad.addColorStop(0.5, `rgba(180, 210, 255, ${p.alpha * 0.5})`);
      grad.addColorStop(1, `rgba(220, 235, 255, ${p.alpha})`);

      wctx.strokeStyle = grad;
      wctx.lineWidth = p.width;
      wctx.lineCap = 'round';
      wctx.beginPath();
      wctx.moveTo(tailX, tailY);
      wctx.lineTo(p.x, p.y);
      wctx.stroke();
    });

    // Splash (yere düşen)
    this.splashes.forEach(s => {
      const alpha = s.life * 0.7;
      wctx.strokeStyle = `rgba(200, 220, 255, ${alpha})`;
      wctx.lineWidth = 1.5;
      wctx.beginPath();
      wctx.ellipse(s.x, s.y, s.size, s.size * 0.35, 0, 0, Math.PI * 2);
      wctx.stroke();
    });

    // Şimşek (fırtınada)
    if (isStorm) {
      if (this.flashCooldown <= 0 && Math.random() < 0.01) {
        this.lightningFlash = 1;
        this.flashCooldown = 3;
        if (typeof audio !== 'undefined' && audio.thunder) audio.thunder();
      }

      if (this.lightningFlash > 0) {
        wctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.75})`;
        wctx.fillRect(0, 0, W, H);
        this.lightningFlash -= 0.08;
        if (this.lightningFlash < 0) this.lightningFlash = 0;
      }
    }
  },

  /* ==================== KAR ==================== */
  drawSnow() {
    // Soğuk mavi atmosfer
    wctx.fillStyle = 'rgba(150, 180, 220, 0.12)';
    wctx.fillRect(0, 0, W, H);

    this.particles.forEach(p => {
      if (p.type !== 'snow') return;

      wctx.save();
      wctx.translate(p.x, p.y);
      wctx.rotate(p.rot);

      // Kar tanesi glow
      const grad = wctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2.5);
      grad.addColorStop(0, `rgba(255, 255, 255, ${p.alpha})`);
      grad.addColorStop(0.5, `rgba(230, 240, 255, ${p.alpha * 0.5})`);
      grad.addColorStop(1, 'rgba(200, 220, 255, 0)');

      wctx.fillStyle = grad;
      wctx.beginPath();
      wctx.arc(0, 0, p.size * 2.5, 0, Math.PI * 2);
      wctx.fill();

      // Kar kristali (küçük yıldız)
      wctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha * 0.8})`;
      wctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        wctx.beginPath();
        wctx.moveTo(0, 0);
        const a = (i / 6) * Math.PI * 2;
        wctx.lineTo(Math.cos(a) * p.size, Math.sin(a) * p.size);
        wctx.stroke();
      }

      wctx.restore();
    });
  },

  /* ==================== SİS ==================== */
  drawFog() {
    this.fogTime = (this.fogTime || 0) + 0.008;

    // Genel sis
    wctx.fillStyle = 'rgba(200, 210, 225, 0.2)';
    wctx.fillRect(0, 0, W, H);

    // Dalgalı sis katmanları
    for (let i = 0; i < 4; i++) {
      const alpha = 0.06 + i * 0.03;
      const speed = 0.3 + i * 0.15;
      const waveY = H * (0.3 + i * 0.15);

      for (let x = -200; x < W + 200; x += 150) {
        const offsetY = Math.sin(x * 0.008 + this.fogTime * speed + i) * 40;
        const size = 200 + Math.sin(x * 0.005 + this.fogTime) * 60;

        const fogGrad = wctx.createRadialGradient(x, waveY + offsetY, 0, x, waveY + offsetY, size);
        fogGrad.addColorStop(0, `rgba(215, 220, 235, ${alpha})`);
        fogGrad.addColorStop(1, 'rgba(200, 210, 220, 0)');

        wctx.fillStyle = fogGrad;
        wctx.beginPath();
        wctx.arc(x, waveY + offsetY, size, 0, Math.PI * 2);
        wctx.fill();
      }
    }

    // Üst kısımda ekstra sis
    const topFog = wctx.createLinearGradient(0, 0, 0, H * 0.6);
    topFog.addColorStop(0, 'rgba(200, 210, 220, 0.2)');
    topFog.addColorStop(1, 'rgba(200, 210, 220, 0)');
    wctx.fillStyle = topFog;
    wctx.fillRect(0, 0, W, H * 0.6);
  },

  /* ==================== GÖKKUŞAĞI ==================== */
  drawRainbow() {
    // Gökkuşağı yayı
    const rainbowColors = [
      'rgba(255, 0, 0, 0.12)',
      'rgba(255, 165, 0, 0.12)',
      'rgba(255, 255, 0, 0.12)',
      'rgba(0, 255, 0, 0.12)',
      'rgba(0, 0, 255, 0.12)',
      'rgba(75, 0, 130, 0.12)',
      'rgba(238, 130, 238, 0.12)'
    ];

    // 7 renkli yay
    for (let i = 0; i < 7; i++) {
      wctx.strokeStyle = rainbowColors[i];
      wctx.lineWidth = 20;
      wctx.beginPath();
      wctx.arc(W / 2, H + 200 - i * 20, W * 0.55, Math.PI * 1.1, Math.PI * 1.9);
      wctx.stroke();
    }

    // Yağmur damlaları az kalsın
    this.particles.forEach(p => {
      if (p.type !== 'rain') return;
      wctx.strokeStyle = `rgba(180, 210, 255, ${p.alpha * 0.4})`;
      wctx.lineWidth = p.width * 0.5;
      wctx.beginPath();
      wctx.moveTo(p.x, p.y);
      wctx.lineTo(p.x + p.vx * 0.5, p.y + p.vy * 0.5);
      wctx.stroke();
    });
  },

  /* ==================== BİLGİ AL ==================== */
  getInfo() {
    return this.TYPES[game.world.weather] || this.TYPES.sunny;
  },

  /* ==================== SIFIRLA ==================== */
  reset() {
    this.particles.length = 0;
    this.splashes.length = 0;
    this.lastType = null;
    this.lightningFlash = 0;
    this.flashCooldown = 0;
  }
};

window.WeatherSystem = WeatherSystem;

console.log('✅ weather.js yüklendi');