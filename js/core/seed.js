/* ==========================================
   ORION FOREST v6.2 - SEED SYSTEM
   Her oyuncu için benzersiz dünya seed'i
   SHA-256 hash koruması
   ========================================== */

'use strict';

const SeedSystem = {
  currentSeed: null,
  hashedSeed: null,
  rng: null,
  initialized: false,

  /* ==================== YENİ SEED ÜRET ==================== */
  generateSeed() {
    // 4 ile başlar + 13 hane = 14 haneli benzersiz sayı
    let seed = '4';

    // Zaman damgası (mikrosaniye)
    const time = Date.now();
    const rand1 = Math.floor(Math.random() * 9999999);
    const rand2 = Math.floor(Math.random() * 9999999);
    const perf = Math.floor(performance.now() * 1000);

    // Karıştır
    const combined = (time % 100000000000).toString() +
                     rand1.toString().padStart(7, '0') +
                     rand2.toString().padStart(7, '0') +
                     (perf % 100000).toString().padStart(5, '0');

    // Rastgele karıştır
    let mixed = '';
    for (let i = 0; i < combined.length; i++) {
      mixed += combined[i];
      if (Math.random() > 0.5 && mixed.length < 20) {
        mixed += Math.floor(Math.random() * 10);
      }
    }

    // 4'ten sonra 13 hane al
    seed += mixed.slice(0, 13);

    // 14 hane olacak şekilde doldur
    while (seed.length < 14) {
      seed += Math.floor(Math.random() * 10);
    }

    // 14 haneye sabitle
    seed = seed.slice(0, 14);

    console.log('🌱 Yeni seed üretildi:', seed);
    return seed;
  },

  /* ==================== SHA-256 HASH ==================== */
  async hash(seed) {
    try {
      if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(seed);
        const buffer = await crypto.subtle.digest('SHA-256', data);
        const array = Array.from(new Uint8Array(buffer));
        return array.map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        throw new Error('Web Crypto yok');
      }
    } catch (e) {
      console.warn('⚠️ SHA-256 desteklenmiyor, fallback hash kullanılıyor');
      return this.fallbackHash(seed);
    }
  },

  /* ==================== FALLBACK HASH ==================== */
  fallbackHash(seed) {
    // Basit FNV-1a hash (64 karakter hex)
    let h1 = 0x811c9dc5;
    let h2 = 0x01000193;
    let h3 = 0xdeadbeef;
    let h4 = 0xcafebabe;

    for (let i = 0; i < seed.length; i++) {
      const c = seed.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
      h2 = Math.imul(h2 ^ c, 0x811c9dc5) >>> 0;
      h3 = Math.imul(h3 ^ c, 0xdeadbeef) >>> 0;
      h4 = Math.imul(h4 ^ c, 0xcafebabe) >>> 0;
    }

    const part1 = h1.toString(16).padStart(8, '0');
    const part2 = h2.toString(16).padStart(8, '0');
    const part3 = h3.toString(16).padStart(8, '0');
    const part4 = h4.toString(16).padStart(8, '0');

    return (part1 + part2 + part3 + part4).repeat(2).slice(0, 64);
  },

  /* ==================== PRNG (Deterministik) ==================== */
  createRNG(hashedSeed) {
    // Hash'in ilk 8 byte'ını sayıya çevir
    let numSeed = 0;
    for (let i = 0; i < 8; i++) {
      numSeed = (numSeed << 8) | parseInt(hashedSeed.substr(i * 2, 2), 16);
    }
    numSeed = numSeed >>> 0;

    // Mulberry32 PRNG
    let state = numSeed;
    return function() {
      state |= 0;
      state = state + 0x6D2B79F5 | 0;
      let t = Math.imul(state ^ state >>> 15, 1 | state);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  },

  /* ==================== BAŞLAT ==================== */
  async init(seed) {
    // Seed yoksa üret
    if (!seed) {
      seed = this.generateSeed();
    }

    this.currentSeed = seed;
    this.hashedSeed = await this.hash(seed);
    this.rng = this.createRNG(this.hashedSeed);
    this.initialized = true;

    // Kaydet
    SaveSystem.saveSeed(this.currentSeed, this.hashedSeed);

    console.log('%c🌱 SEED:', 'color:#00d68f;font-weight:bold', this.currentSeed);
    console.log('%c🔐 HASH:', 'color:#4cc9f0', this.hashedSeed.slice(0, 16) + '...');

    return seed;
  },

  /* ==================== DOĞRULAMA ==================== */
  async verify(seed, hash) {
    const newHash = await this.hash(seed);
    return newHash === hash;
  },

  /* ==================== RASTGELE (Seed'den) ==================== */
  random() {
    if (this.rng) return this.rng();
    return Math.random();
  },

  randomRange(min, max) {
    return min + this.random() * (max - min);
  },

  randomInt(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  },

  pick(arr) {
    return arr[Math.floor(this.random() * arr.length)];
  },

  /* ==================== SIFIRLA ==================== */
  reset() {
    this.currentSeed = null;
    this.hashedSeed = null;
    this.rng = null;
    this.initialized = false;
    SaveSystem.clearSeed();
    console.log('🌱 Seed sıfırlandı');
  }
};

window.SeedSystem = SeedSystem;

console.log('✅ seed.js yüklendi');