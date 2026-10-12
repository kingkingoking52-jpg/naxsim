/* ==========================================
   ORION FOREST v6.0 - AUDIO
   Web Audio API ses sistemi
   ========================================== */

'use strict';

class AudioSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicPlaying = false;
    this.initialized = false;
    this.musicTimeout = null;
  }

  /* ==================== BAŞLATMA ==================== */
  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.masterGain.connect(this.ctx.destination);
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);

      this.masterGain.gain.value = 0.7;
      this.musicGain.gain.value = 0.15;
      this.sfxGain.gain.value = 0.5;

      this.initialized = true;
      console.log('🔊 Audio sistemi başlatıldı');
    } catch (e) {
      console.warn('Audio başlatma hatası:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /* ==================== SES SEVİYELERİ ==================== */
  setMasterVolume(v) {
    if (this.masterGain) this.masterGain.gain.value = clamp(v, 0, 1);
  }

  setMusicVolume(v) {
    if (this.musicGain) this.musicGain.gain.value = clamp(v * 0.3, 0, 1);
  }

  setSFXVolume(v) {
    if (this.sfxGain) this.sfxGain.gain.value = clamp(v, 0, 1);
  }

  /* ==================== TEMEL SES ÜRETİCİLERİ ==================== */
  playTone(freq, duration, type = 'sine', volume = 0.3) {
    if (!this.initialized || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.value = freq;

      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) { /* sessizce geç */ }
  }

  playNoise(duration, volume = 0.3) {
    if (!this.initialized || !this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const gain = this.ctx.createGain();
      gain.gain.value = volume;
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      source.connect(gain);
      gain.connect(this.sfxGain);

      source.start();
    } catch (e) { /* sessizce geç */ }
  }

  /* ==================== SES EFEKTLERİ ==================== */
  click() {
    this.playTone(800, 0.05, 'sine', 0.2);
  }

  alert() {
    this.playTone(600, 0.1, 'sine', 0.3);
    setTimeout(() => this.playTone(800, 0.15, 'sine', 0.3), 100);
  }

  success() {
    [600, 800, 1000].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.15, 'sine', 0.3), i * 80);
    });
  }

  collect() {
    this.playTone(880, 0.1, 'sine', 0.25);
    setTimeout(() => this.playTone(1100, 0.08, 'sine', 0.2), 50);
  }

  attack() {
    this.playNoise(0.08, 0.15);
    this.playTone(200, 0.1, 'sawtooth', 0.2);
  }

  hit() {
    this.playTone(150, 0.15, 'square', 0.25);
  }

  hurt() {
    this.playTone(300, 0.2, 'sawtooth', 0.3);
  }

  eat() {
    this.playTone(600, 0.1, 'sine', 0.3);
    setTimeout(() => this.playTone(800, 0.08, 'sine', 0.25), 80);
  }

  craft() {
    [440, 660, 880].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.15, 'triangle', 0.3), i * 100);
    });
  }

  levelUp() {
    [440, 554, 659, 880].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.15, 'sine', 0.35), i * 80);
    });
  }

  fire() {
    this.playNoise(0.3, 0.05);
  }

  death() {
    [400, 350, 300, 250, 200].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.3, 'sawtooth', 0.3), i * 100);
    });
  }

  plant() {
    this.playTone(500, 0.08, 'sine', 0.25);
    setTimeout(() => this.playTone(700, 0.1, 'sine', 0.2), 80);
  }

  build() {
    this.playTone(300, 0.1, 'square', 0.25);
    setTimeout(() => this.playTone(400, 0.15, 'square', 0.2), 100);
  }

  thunder() {
    this.playNoise(0.8, 0.4);
    this.playTone(60, 0.8, 'sawtooth', 0.3);
  }

  rain() {
    this.playNoise(0.5, 0.05);
  }

  snow() {
    this.playNoise(0.3, 0.02);
  }

  fishing() {
    this.playTone(400, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(600, 0.15, 'sine', 0.25), 120);
  }

  pet() {
    this.playTone(700, 0.1, 'sine', 0.25);
    setTimeout(() => this.playTone(900, 0.12, 'sine', 0.25), 80);
  }

  witch() {
    [300, 350, 400, 380, 320].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.2, 'sine', 0.25), i * 100);
    });
  }

  tutorialStep() {
    this.playTone(523, 0.15, 'sine', 0.25);
    setTimeout(() => this.playTone(659, 0.15, 'sine', 0.25), 100);
    setTimeout(() => this.playTone(784, 0.2, 'sine', 0.25), 200);
  }

  /* ==================== MÜZİK ==================== */
  startMusic() {
    if (!this.initialized || !this.ctx || this.musicPlaying) return;
    this.musicPlaying = true;
    this.scheduleMusic();
  }

  scheduleMusic() {
    if (!this.musicPlaying) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [130.81, 164.81, 196.00, 261.63, 329.63]; // C3, E3, G3, C4, E4

      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.frequency.value = 800;

        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(0.06, now + i * 0.6);
        gain.gain.linearRampToValueAtTime(0.04, now + 9);
        gain.gain.linearRampToValueAtTime(0.06, now + 18);
        gain.gain.linearRampToValueAtTime(0, now + 26);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now + i * 0.6);
        osc.stop(now + 27);
      });

      this.musicTimeout = setTimeout(() => this.scheduleMusic(), 24000);
    } catch (e) { /* sessizce geç */ }
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimeout) clearTimeout(this.musicTimeout);
  }
}

/* ==================== GLOBAL ÖRNEK ==================== */
const audio = new AudioSystem();

window.audio = audio;

console.log('✅ audio.js yüklendi');