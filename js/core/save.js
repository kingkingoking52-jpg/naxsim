/* ==========================================
   ORION FOREST v6.2 - SAVE SYSTEM
   Seed destekli kayıt sistemi
   ========================================== */

'use strict';

const SaveSystem = {
  KEY: 'orion_forest_v6_save',
  SETTINGS_KEY: 'orion_forest_v6_settings',
  ACHIEVEMENTS_KEY: 'orion_forest_v6_achievements',
  TUTORIAL_KEY: 'orion_forest_v6_tutorial_done',
  SEED_KEY: 'orion_forest_v6_seed',
  HASH_KEY: 'orion_forest_v6_seed_hash',

  /* ==================== ANA KAYIT ==================== */
  save() {
    try {
      if (typeof game === 'undefined' || !game.player) return false;

      const data = {
        version: '6.2',
        timestamp: Date.now(),

        // ✅ SEED BİLGİSİ
        seed: (typeof SeedSystem !== 'undefined') ? SeedSystem.currentSeed : null,
        seedHash: (typeof SeedSystem !== 'undefined') ? SeedSystem.hashedSeed : null,

        // Oyuncu
        player: JSON.parse(JSON.stringify({
          ...game.player,
          stats: {
            ...game.player.stats,
            weathersSeen: Array.from(game.player.stats.weathersSeen || [])
          }
        })),

        // Dünya zaman/hava
        world: {
          time: game.world.time,
          day: game.world.day,
          isDay: game.world.isDay,
          weather: game.world.weather,
          campfire: { ...game.world.campfire },
          temperature: game.world.temperature
        },

        // ✅ Kalıcı veriler
        buildings: game.buildings || [],
        crops: game.crops || [],
        pets: (typeof PetSystem !== 'undefined') ? PetSystem.pets : []
      };

      localStorage.setItem(this.KEY, JSON.stringify(data));
      console.log('💾 Kaydedildi:', data.player.name, 'Lv.' + data.player.level);
      return true;
    } catch (e) {
      console.warn('Kayıt hatası:', e);
      return false;
    }
  },

  /* ==================== ANA YÜKLEME ==================== */
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return null;

      const data = JSON.parse(raw);

      // Kontroller
      if (!data.player || !data.world) {
        console.warn('⚠️ Bozuk kayıt');
        return null;
      }

      console.log('✅ Kayıt yüklendi:', data.player.name, 'Lv.' + data.player.level);
      return data;
    } catch (e) {
      console.error('❌ Yükleme hatası:', e);
      return null;
    }
  },

  hasSave() {
    return localStorage.getItem(this.KEY) !== null;
  },

  clear() {
    try {
      localStorage.removeItem(this.KEY);
      return true;
    } catch (e) {
      return false;
    }
  },

  /* ==================== SEED ==================== */
  saveSeed(seed, hash) {
    try {
      localStorage.setItem(this.SEED_KEY, seed);
      localStorage.setItem(this.HASH_KEY, hash);
      return true;
    } catch (e) {
      return false;
    }
  },

  loadSeed() {
    try {
      return {
        seed: localStorage.getItem(this.SEED_KEY),
        hash: localStorage.getItem(this.HASH_KEY)
      };
    } catch (e) {
      return { seed: null, hash: null };
    }
  },

  hasSeed() {
    return localStorage.getItem(this.SEED_KEY) !== null;
  },

  clearSeed() {
    try {
      localStorage.removeItem(this.SEED_KEY);
      localStorage.removeItem(this.HASH_KEY);
      return true;
    } catch (e) {
      return false;
    }
  },

  /* ==================== AYARLAR ==================== */
  saveSettings(settings) {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (e) {
      return false;
    }
  },

  loadSettings() {
    try {
      const raw = localStorage.getItem(this.SETTINGS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  /* ==================== BAŞARIMLAR ==================== */
  saveAchievements(achievements) {
    try {
      localStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify(achievements));
      return true;
    } catch (e) {
      return false;
    }
  },

  loadAchievements() {
    try {
      const raw = localStorage.getItem(this.ACHIEVEMENTS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  },

  /* ==================== TUTORIAL ==================== */
  tutorialDone() {
    return localStorage.getItem(this.TUTORIAL_KEY) === 'true';
  },

  setTutorialDone() {
    try {
      localStorage.setItem(this.TUTORIAL_KEY, 'true');
      return true;
    } catch (e) {
      return false;
    }
  },

  resetTutorial() {
    localStorage.removeItem(this.TUTORIAL_KEY);
  },

  /* ==================== DIŞA/İÇE ==================== */
  exportSave() {
    try {
      const save = this.load();
      if (!save) return null;

      const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orion_save_${save.seed || Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      return false;
    }
  },

  importSave(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.player || !data.world) {
          if (callback) callback(false, null);
          return;
        }
        localStorage.setItem(this.KEY, JSON.stringify(data));
        if (callback) callback(true, data);
      } catch (err) {
        if (callback) callback(false, null);
      }
    };
    reader.readAsText(file);
  },

  getSaveInfo() {
    const save = this.load();
    if (!save) return null;
    return {
      version: save.version || '?',
      timestamp: save.timestamp || 0,
      playerName: save.player?.name || 'Oyuncu',
      playerLevel: save.player?.level || 1,
      day: save.world?.day || 1,
      seed: save.seed || 'YOK'
    };
  },

  /* ==================== TÜM VERİYİ SİL ==================== */
  resetAll() {
    try {
      localStorage.removeItem(this.KEY);
      localStorage.removeItem(this.SETTINGS_KEY);
      localStorage.removeItem(this.ACHIEVEMENTS_KEY);
      localStorage.removeItem(this.TUTORIAL_KEY);
      localStorage.removeItem(this.SEED_KEY);
      localStorage.removeItem(this.HASH_KEY);
      localStorage.removeItem('orion_npc_relations');
      console.log('🗑️ Tüm kayıtlar silindi');
      return true;
    } catch (e) {
      return false;
    }
  }
};

window.SaveSystem = SaveSystem;

console.log('✅ save.js yüklendi (v6.2 - seed destekli)');