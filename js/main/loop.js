/* ==========================================
   ORION FOREST v6.7 - MAIN / LOOP
   Game loop, menü, ESC, init
   ========================================== */

'use strict';

/* ==================== ANA DÖNGÜ ==================== */
let lastFrameTime = performance.now();
let fpsCounter = 0;
let fpsTime = 0;

function gameLoop(now) {
  requestAnimationFrame(gameLoop);

  if (game.state !== State.PLAYING && game.state !== State.DEAD) return;

  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;

  fpsCounter++;
  fpsTime += dt;
  if (fpsTime >= 1) {
    game.fps = fpsCounter;
    fpsCounter = 0;
    fpsTime = 0;
  }

  if (game.state === State.PLAYING) {
    updatePlayer(dt);
    updateAnimals(dt);
    updateBabyPets(dt);
    updateEnemies(dt);
    updateParticles(dt);

    if (typeof StructureSystem !== 'undefined') StructureSystem.update(dt);
    if (typeof NPCCampSystem !== 'undefined') NPCCampSystem.update(dt);
    if (typeof AnimalSystemV2 !== 'undefined') AnimalSystemV2.update(dt);
    if (typeof DecorationSystem !== 'undefined') DecorationSystem.update(dt);
    if (typeof FishingSystem !== 'undefined') FishingSystem.update(dt);
    if (typeof PetSystem !== 'undefined') PetSystem.update(dt);
    if (typeof NPCDialog !== 'undefined') NPCDialog.update(dt);

    if (typeof WeatherSystem !== 'undefined') {
      WeatherSystem.update(dt);
      WeatherSystem.updateParticles(dt);
    }

    updateCamera(dt);
    FarmingSystem.update(dt);
    showInteractHint();

    if (game.player.attackCooldown > 0) game.player.attackCooldown -= dt;
    if (game.player.animation.attack > 0) game.player.animation.attack -= dt;
  }

  render();

  if (typeof WeatherSystem !== 'undefined') WeatherSystem.draw();
}

/* ==================== ESC MENÜ ==================== */
function toggleEscMenu() {
  if (game.state === State.PLAYING) {
    game.state = State.PAUSED;

    safeText('escName', game.player.name);
    safeText('escLevel', game.player.level);
    safeText('escDay', game.world.day);
    safeText('escKills', game.player.stats.kills);
    safeText('escWood', game.player.inventory.odun);
    safeText('escFire', game.world.campfire.lit ? 'Yanıyor' : 'Yok');

    const escMenu = $('escMenu');
    if (escMenu) escMenu.classList.add('show');
    if (audio && audio.click) audio.click();
  } else if (game.state === State.PAUSED) {
    game.state = State.PLAYING;
    const escMenu = $('escMenu');
    if (escMenu) escMenu.classList.remove('show');
    if (audio && audio.click) audio.click();
  }
}

/* ==================== OYUN BAŞLAT ==================== */
async function startGame() {
  if (typeof SeedSystem !== 'undefined') {
    await SeedSystem.init();

    const seedEl = $('seedDisplay');
    if (seedEl) seedEl.textContent = '🌱 Seed: ' + SeedSystem.currentSeed;
    const seedInfoEl = $('seedInfo');
    if (seedInfoEl) seedInfoEl.textContent = SeedSystem.currentSeed;
  }

  const cc = $('characterCreation');
  if (cc) cc.classList.remove('show');

  const gc = $('gameContainer');
  if (gc) gc.classList.add('show');

  const mm = $('mainMenu');
  if (mm) mm.style.display = 'none';

  applyClassBonuses();
  createWorld();
  resizeCanvas();
  updateUI();
  initBigMap();

  game.state = State.PLAYING;
  game.player.x = CAMP_X;
  game.player.y = CAMP_Y + 120;

  addMessage(`🎮 Hoş geldin ${game.player.name}!`);
  addMessage(`🌱 Seed: ${typeof SeedSystem !== 'undefined' ? SeedSystem.currentSeed : 'YOK'}`);

  lastFrameTime = performance.now();
  requestAnimationFrame(gameLoop);

  if (!worldInterval) worldInterval = setInterval(worldCycle, 1000);
  if (!autoSaveInterval) autoSaveInterval = setInterval(autoSave, 30000);

  if (!SaveSystem.tutorialDone()) {
    setTimeout(() => {
      if (typeof TutorialSystem !== 'undefined') TutorialSystem.start('game');
    }, 1500);
  }
}

function applyClassBonuses() {
  switch (game.player.class) {
    case 'hunter': game.player.speed = 5; game.player.maxStamina = 120; game.player.inventory.odun += 3; break;
    case 'builder': game.player.maxHealth = 130; game.player.health = 130; game.player.inventory.tas += 8; break;
    case 'scout': game.player.speed = 6; game.player.maxStamina = 150; break;
    case 'farmer': game.player.inventory.tohum_bugday += 5; game.player.inventory.tohum_havuc += 3; break;
    case 'warrior': game.player.attackBonus = 1; break;
    case 'survivor': game.player.inventory.elma += 3; break;
  }
  game.player.stamina = game.player.maxStamina;
}

/* ==================== OYUN YÜKLE ==================== */
async function loadGame(save) {
  if (!save || !save.player || !save.world) {
    showToast('❌ Bozuk kayıt!', 'error');
    return;
  }

  console.log('💾 Oyun yükleniyor:', save.player.name);

  try {
    if (typeof SeedSystem !== 'undefined') {
      if (save.seed) {
        await SeedSystem.init(save.seed);
        if (save.seedHash) {
          const valid = await SeedSystem.verify(save.seed, save.seedHash);
          if (!valid) console.warn('⚠️ Seed hash uyuşmuyor!');
        }
        const seedEl = $('seedDisplay');
        if (seedEl) seedEl.textContent = '🌱 Seed: ' + save.seed;
        const seedInfoEl = $('seedInfo');
        if (seedInfoEl) seedInfoEl.textContent = save.seed;
      } else {
        await SeedSystem.init();
      }
    }

    if (audio && audio.init) audio.init();
    if (audio && audio.resume) audio.resume();
    if (audio && game.settings.musicEnabled && audio.startMusic) audio.startMusic();

    const mm = $('mainMenu');
    if (mm) mm.style.display = 'none';

    const gc = $('gameContainer');
    if (gc) gc.classList.add('show');

    Object.assign(game.player, save.player);

    if (save.player.stats && save.player.stats.weathersSeen) {
      if (Array.isArray(save.player.stats.weathersSeen)) {
        game.player.stats.weathersSeen = new Set(save.player.stats.weathersSeen);
      } else {
        game.player.stats.weathersSeen = new Set();
      }
    } else {
      game.player.stats.weathersSeen = new Set();
    }

    if (!game.player.stats) {
      game.player.stats = {
        treesCollected: 0, kills: 0, buildsCount: 0,
        farmsPlanted: 0, harvests: 0, nightsSurvived: 0,
        weathersSeen: new Set(), fishCaught: 0,
        distanceTraveled: 0, npcFriends: 0, monstersKilled: 0
      };
    }

    game.world.time = save.world.time || 8;
    game.world.day = save.world.day || 1;
    game.world.isDay = save.world.isDay !== undefined ? save.world.isDay : true;
    game.world.weather = save.world.weather || 'sunny';
    game.world.temperature = save.world.temperature || 25;
    game.world.weatherTimer = 0;
    game.world.weatherDuration = 80;

    console.log('🌍 Dünya seed\'den yeniden oluşturuluyor...');
    createWorld();

    if (save.world.campfire) {
      game.world.campfire.lit = save.world.campfire.lit || false;
      game.world.campfire.fuel = save.world.campfire.fuel || 0;
    }

    if (save.buildings && save.buildings.length > 0) game.buildings = save.buildings;
    if (save.crops && save.crops.length > 0) game.crops = save.crops;
    if (save.pets && save.pets.length > 0 && typeof PetSystem !== 'undefined') PetSystem.pets = save.pets;
    if (save.npcCamps && save.npcCamps.length > 0 && typeof NPCCampSystem !== 'undefined') NPCCampSystem.camps = save.npcCamps;

    if (!game.player.x || game.player.x === 0) {
      game.player.x = CAMP_X;
      game.player.y = CAMP_Y + 120;
    }

    resizeCanvas();
    updateUI();
    initBigMap();
    game.state = State.PLAYING;

    addMessage(`💾 Hoş geldin ${game.player.name}!`);
    addMessage(`🌱 Seed: ${save.seed || 'YENİ'}`);

    lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);

    if (!worldInterval) worldInterval = setInterval(worldCycle, 1000);
    if (!autoSaveInterval) autoSaveInterval = setInterval(autoSave, 30000);

    console.log('✅ Oyun başarıyla yüklendi!');
  } catch (e) {
    console.error('❌ loadGame hatası:', e);
    showToast('Yükleme hatası: ' + e.message, 'error', 5000);
  }
}

function autoSave() {
  if (game.state === State.PLAYING && game.settings.autoSave) {
    SaveSystem.save();
    showToast('💾 Otomatik kaydedildi', 'info', 1500);
  }
}

/* ==================== AYARLAR UI ==================== */
function loadSettingsUI() {
  const s = game.settings;
  const setV = (id, v) => {
    const el = $(id);
    if (el) {
      el.value = v;
      const vEl = $(id + 'Val');
      if (vEl) vEl.textContent = v;
    }
  };
  setV('masterVolume', Math.round(s.masterVolume * 100));
  setV('musicVolume', Math.round(s.musicVolume * 100));
  setV('sfxVolume', Math.round(s.sfxVolume * 100));

  const toggleMap = {
    toggleShake: 'shakeEnabled', toggleAutoSave: 'autoSave',
    toggleParticles: 'particlesEnabled', toggleBlood: 'bloodEnabled',
    toggleWeatherEffects: 'weatherEffectsEnabled'
  };
  Object.entries(toggleMap).forEach(([id, key]) => {
    const el = $(id);
    if (el) el.classList.toggle('active', s[key] !== false);
  });

  const ds = $('difficultySelect'); if (ds) ds.value = s.difficulty;
  const ts = $('timeSpeed'); if (ts) ts.value = s.timeSpeed;
  const qs = $('qualitySelect'); if (qs) qs.value = s.quality;
  const si = $('saveInfo'); if (si) si.textContent = SaveSystem.hasSave() ? 'Var ✓' : 'Yok';

  const seedInfo = $('seedInfo');
  if (seedInfo) {
    const save = SaveSystem.load();
    seedInfo.textContent = (save && save.seed) ? save.seed : (typeof SeedSystem !== 'undefined' && SeedSystem.currentSeed ? SeedSystem.currentSeed : '-');
  }
}

function saveSettings() {
  SaveSystem.saveSettings(game.settings);
}

function initSettings() {
  $$('.setting-tab').forEach(t => {
    t.onclick = () => {
      if (audio && audio.click) audio.click();
      $$('.setting-tab').forEach(x => x.classList.remove('active'));
      $$('.setting-panel').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const p = document.querySelector(`[data-panel="${t.dataset.tab}"]`);
      if (p) p.classList.add('active');
    };
  });

  bind($('masterVolume'), 'input', e => { game.settings.masterVolume = e.target.value / 100; audio.setMasterVolume(game.settings.masterVolume); safeText('masterVolumeVal', e.target.value); saveSettings(); });
  bind($('musicVolume'), 'input', e => { game.settings.musicVolume = e.target.value / 100; audio.setMusicVolume(game.settings.musicVolume); safeText('musicVolumeVal', e.target.value); saveSettings(); });
  bind($('sfxVolume'), 'input', e => { game.settings.sfxVolume = e.target.value / 100; audio.setSFXVolume(game.settings.sfxVolume); safeText('sfxVolumeVal', e.target.value); saveSettings(); });

  const toggleMap = {
    toggleShake: 'shakeEnabled', toggleAutoSave: 'autoSave',
    toggleParticles: 'particlesEnabled', toggleBlood: 'bloodEnabled',
    toggleWeatherEffects: 'weatherEffectsEnabled'
  };
  Object.entries(toggleMap).forEach(([id, key]) => {
    const el = $(id);
    if (el) el.onclick = function () {
      this.classList.toggle('active');
      game.settings[key] = this.classList.contains('active');
      saveSettings();
    };
  });

  bind($('difficultySelect'), 'change', e => { game.settings.difficulty = e.target.value; saveSettings(); });
  bind($('timeSpeed'), 'change', e => { game.settings.timeSpeed = e.target.value; saveSettings(); });
  bind($('qualitySelect'), 'change', e => { game.settings.quality = e.target.value; saveSettings(); });

  bindClick('btnClearSave', () => {
    showAlert({
      icon: '🗑️', title: 'KAYIT SİL',
      message: 'Tüm kayıtlar silinsin mi? (Seed de silinecek)',
      buttons: [
        { text: 'İPTAL', value: false, secondary: true },
        { text: 'SİL', value: true }
      ]
    }).then(r => {
      if (r) {
        SaveSystem.resetAll();
        updateMenuStats();
        showToast('Tüm kayıtlar silindi!', 'success');
        safeText('saveInfo', 'Yok');
        safeText('seedInfo', '-');
      }
    });
  });

  bindClick('btnExportSave', () => {
    if (SaveSystem.exportSave()) showToast('Dışa aktarıldı!', 'success');
    else showToast('Kayıt yok!', 'error');
  });

  bindClick('btnImportSave', () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      SaveSystem.importSave(file, (success) => {
        if (success) { updateMenuStats(); showToast('İçe aktarıldı!', 'success'); }
        else showToast('Geçersiz dosya!', 'error');
      });
    };
    input.click();
  });
}

/* ==================== MENÜ ==================== */
function updateMenuStats() {
  const el = $('menuStats');
  if (!el) return;

  if (SaveSystem.hasSave()) {
    const info = SaveSystem.getSaveInfo();
    if (info) {
      el.innerHTML = `<span>💾 ${info.playerName} [Lv.${info.playerLevel}]</span><span>📅 Gün ${info.day}</span>`;
      return;
    }
  }
  el.innerHTML = '<span>🌲 Yeni Macera</span>';
}

function initMenu() {
  $$('[data-close]').forEach(b => {
    b.onclick = () => { if (audio && audio.click) audio.click(); closeModal(b.dataset.close); };
  });

  $$('[data-close-panel]').forEach(b => {
    b.onclick = () => { if (audio && audio.click) audio.click(); const p = $(b.dataset.closePanel); if (p) p.classList.remove('open'); };
  });

  bindClick('btnNewGame', () => {
    audio.init(); audio.resume(); audio.click();
    const mm = $('mainMenu');
    if (mm) mm.classList.add('hidden');
    setTimeout(() => {
      if (mm) mm.style.display = 'none';
      const cc = $('characterCreation');
      if (cc) cc.classList.add('show');
      updateCharacterPreview();
    }, 400);
  });

  bindClick('btnBackToMenu', () => {
    if (audio && audio.click) audio.click();
    const cc = $('characterCreation');
    if (cc) cc.classList.remove('show');
    const mm = $('mainMenu');
    if (mm) { mm.style.display = 'flex'; setTimeout(() => mm.classList.remove('hidden'), 50); }
  });

  bindClick('btnContinue', async () => {
    try {
      if (audio && audio.init) audio.init();
      if (audio && audio.resume) audio.resume();
      if (audio && audio.click) audio.click();
    } catch (e) { console.warn(e); }

    const save = SaveSystem.load();
    if (!save) {
      showToast('💾 Kayıtlı oyun bulunamadı!', 'error', 3000);
      return;
    }

    try {
      await loadGame(save);
    } catch (e) {
      console.error('❌ Yükleme hatası:', e);
      showToast('Yükleme hatası: ' + e.message, 'error', 5000);
    }
  });

  bindClick('btnSettings', () => { if (audio && audio.click) audio.click(); openModal('settingsModal'); loadSettingsUI(); });
  bindClick('btnCredits', () => { if (audio && audio.click) audio.click(); openModal('creditsModal'); });
  bindClick('btnAchievements', () => { if (audio && audio.click) audio.click(); AchievementSystem.showPanel(); });

  bindClick('btnTutorial', () => {
    if (audio && audio.click) audio.click();
    if (typeof TutorialSystem !== 'undefined') TutorialSystem.start('menu');
  });

  bindClick('btnQuit', () => {
    if (audio && audio.click) audio.click();
    showAlert({
      icon: '🚪', title: 'ÇIKIŞ',
      message: 'Çıkmak istediğine emin misin?',
      buttons: [
        { text: 'HAYIR', value: false, secondary: true },
        { text: 'EVET', value: true }
      ]
    }).then(r => { if (r) window.close(); });
  });

  bindClick('startGameBtn', async () => {
    const ne = $('charName');
    if (ne && ne.value.trim()) game.player.name = ne.value.trim();
    audio.init(); audio.resume();
    if (game.settings.musicEnabled && audio.startMusic) audio.startMusic();
    await startGame();
  });

  bindClick('escResume', () => toggleEscMenu());

  bindClick('escSave', () => {
    SaveSystem.save();
    showToast('💾 Kaydedildi!', 'success');
  });

  bindClick('escSettings', () => {
    if (audio && audio.click) audio.click();
    const esc = $('escMenu'); if (esc) esc.classList.remove('show');
    openModal('settingsModal');
    loadSettingsUI();
  });

  bindClick('escTutorial', () => {
    if (audio && audio.click) audio.click();
    const esc = $('escMenu'); if (esc) esc.classList.remove('show');
    if (typeof TutorialSystem !== 'undefined') TutorialSystem.start('game');
  });

  bindClick('escMainMenu', () => {
    showAlert({
      icon: '🏠', title: 'ANA MENÜ',
      message: 'Ana menüye dönmek istediğine emin misin?',
      buttons: [
        { text: 'İPTAL', value: false, secondary: true },
        { text: 'DÖN', value: true }
      ]
    }).then(r => {
      if (!r) return;
      SaveSystem.save();
      const esc = $('escMenu'); if (esc) esc.classList.remove('show');
      const gc = $('gameContainer'); if (gc) gc.classList.remove('show');
      const mm = $('mainMenu'); if (mm) mm.style.display = 'flex';
      setTimeout(() => { if (mm) mm.classList.remove('hidden'); updateMenuStats(); }, 50);
      game.state = State.MENU;
      if (worldInterval) { clearInterval(worldInterval); worldInterval = null; }
      if (autoSaveInterval) { clearInterval(autoSaveInterval); autoSaveInterval = null; }
    });
  });
}

/* ==================== YENİDEN DOĞ ==================== */
bindClick('btnRespawn', () => {
  const p = game.player;
  p.health = p.maxHealth;
  p.hunger = 100; p.thirst = 100; p.stamina = p.maxStamina;
  p.temperature = 0.6;
  p.x = CAMP_X; p.y = CAMP_Y + 120;

  game.enemies = [];
  game.world.isDay = true;
  game.world.time = 12;

  const ds = $('deathScreen'); if (ds) ds.classList.remove('show');
  game.state = State.PLAYING;
  addMessage('🔄 Yeniden doğdun!');
  if (audio && audio.click) audio.click();
});

/* ==================== YÜKLEME ==================== */
const loadingTips = [
  'İpucu: 👑 Geyik Kralı nadir bir avdır!',
  'İpucu: 🐗 Yaban domuzu sürüsüne dikkat et!',
  'İpucu: Boynuz topla, değerli malzeme!',
  'İpucu: M tuşu ile haritayı büyütebilirsin!',
  'İpucu: NPC\'lerle konuşmak için SAĞ TIKLA!',
  'İpucu: Aynı seed = aynı dünya!',
  'İpucu: Yağmurda ıslanırsın, şimşek çakar!'
];

function initLoadingScreen() {
  let progress = 0;
  const progressEl = $('loadingProgress');
  const percentEl = $('loadingPercent');
  const textEl = $('loadingText');
  const tipEl = $('loadingTip');
  const loadTexts = ['SİSTEM BAŞLATILIYOR...', 'SEED OLUŞTURULUYOR...', 'HAYVANLAR...', 'DÜNYA ÜRETİLİYOR...', 'HAZIR!'];

  const interval = setInterval(() => {
    progress += 6 + Math.random() * 10;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => { const ls = $('loadingScreen'); if (ls) ls.classList.add('hidden'); }, 500);
    }
    if (progressEl) progressEl.style.width = progress + '%';
    if (percentEl) percentEl.textContent = Math.floor(progress) + '%';
    if (textEl) textEl.textContent = loadTexts[Math.min(4, Math.floor(progress / 22))];
    if (tipEl) tipEl.textContent = loadingTips[Math.floor(progress / 20) % loadingTips.length];
  }, 150);
}

/* ==================== KAYIT UYARI ==================== */
window.addEventListener('beforeunload', () => {
  if (game.state === State.PLAYING && game.settings.autoSave) SaveSystem.save();
});

/* ==================== KLAVYE ==================== */
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (key === 'm' && game.state === State.PLAYING) {
    e.preventDefault();
    toggleBigMap();
    return;
  }

  if (e.key === 'Escape') {
    const mm = $('miniMap');
    if (mm && mm.classList.contains('big')) {
      mm.classList.remove('big');
      e.preventDefault();
      e.stopPropagation();
      if (audio && audio.click) audio.click();
      return;
    }
  }

  if (key === 'p' && game.state === State.PLAYING) {
    e.preventDefault();
    togglePanel('petPanel');
    return;
  }
});

/* ==================== BAŞLAT ==================== */
function initAll() {
  console.log('%c🌲 ORION FOREST v6.7', 'color:#4cc9f0;font-size:20px;font-weight:bold');
  console.log('%c🌸 Decorations + Tüm sistemler hazır', 'color:#00d68f;font-size:12px');

  if (audio && audio.init) audio.init();
  if (audio) {
    audio.setMasterVolume(game.settings.masterVolume);
    audio.setMusicVolume(game.settings.musicVolume);
    audio.setSFXVolume(game.settings.sfxVolume);
  }

  AchievementSystem.init();
  Input.init();

  if (typeof NPCDialog !== 'undefined') NPCDialog.init();
  if (typeof PetSystem !== 'undefined') PetSystem.init();

  initMenu();
  initSettings();
  initLoadingScreen();
  initBigMap();

  generateOptions('skinOptions', 'skin', 12);
  generateOptions('hairOptions', 'hair', 12);
  generateOptions('shirtOptions', 'shirt', 12);
  updateCharacterPreview();

  $$('.class-card').forEach(card => {
    card.onclick = function () {
      $$('.class-card').forEach(el => el.classList.remove('selected'));
      this.classList.add('selected');
      game.player.class = this.dataset.class;
    };
  });

  InventorySystem.initTabs();

  if (!SaveSystem.hasSave()) {
    const bc = $('btnContinue');
    if (bc) { bc.style.opacity = '0.4'; bc.disabled = true; }
  }

  updateMenuStats();

  CraftingSystem.render();
  BuildingSystem.render();

  console.log('%c✅ Tüm sistemler hazır!', 'color:#00d68f;font-size:12px');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}