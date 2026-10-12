/* ==========================================
   ORION FOREST v6.7 - MAIN / CORE
   State, types, world, karakter
   ========================================== */

'use strict';

/* ==================== SABITLER ==================== */
const WORLD_SIZE = 10000;
const CAMP_X = WORLD_SIZE / 2;
const CAMP_Y = WORLD_SIZE / 2;

/* ==================== OYUN DURUMU ==================== */
const State = {
  MENU: 'menu',
  CREATION: 'creation',
  PLAYING: 'playing',
  PAUSED: 'paused',
  DEAD: 'dead',
  TUTORIAL: 'tutorial'
};

const defaultSettings = {
  masterVolume: 0.7, musicVolume: 0.5, sfxVolume: 0.7,
  musicEnabled: true, ambientEnabled: true, weatherSoundEnabled: true,
  difficulty: 'normal', timeSpeed: 'normal',
  shakeEnabled: true, autoSave: true,
  quality: 'high', particlesEnabled: true, bloodEnabled: true,
  weatherEffectsEnabled: true, joystickSize: 130
};

const game = {
  state: State.MENU,
  settings: SaveSystem.loadSettings() || { ...defaultSettings },
  player: {
    name: 'Oyuncu', class: 'survivor',
    appearance: { skin: 1, hair: 1, shirt: 1 },
    x: 0, y: 0,
    health: 100, maxHealth: 100,
    hunger: 100, maxHunger: 100,
    thirst: 100, maxThirst: 100,
    stamina: 100, maxStamina: 100,
    temperature: 0.6,
    xp: 0, level: 1,
    speed: 4, isRunning: false, facing: 1,
    attackCooldown: 0, attackBonus: 0,
    animation: { frame: 0, time: 0, walking: false, attack: 0 },
    inventory: {
      odun: 10, tas: 5, yaprak: 10, ip: 3, cali: 5, elma: 3,
      cilek: 0, mantar: 0, cig_et: 0, pismis_et: 0, su: 0,
      balik: 0, pismis_balik: 0,
      balta: 0, yay: 0, kilic: 0, kazma: 0, olta: 0,
      tohum_bugday: 3, tohum_havuc: 2, tohum_patates: 1,
      bugday: 0, havuc: 0, patates: 0, boynuz: 0
    },
    equipped: null,
    stats: {
      treesCollected: 0, kills: 0, buildsCount: 0,
      farmsPlanted: 0, harvests: 0, nightsSurvived: 0,
      weathersSeen: new Set(), fishCaught: 0,
      distanceTraveled: 0, npcFriends: 0, monstersKilled: 0
    }
  },
  world: {
    time: 8, day: 1, weather: 'sunny', isDay: true,
    temperature: 25, weatherTimer: 0, weatherDuration: 80,
    campfire: { x: CAMP_X, y: CAMP_Y, lit: false, fuel: 0, animTime: 0 }
  },
  objects: [], animals: [], enemies: [], particles: [], messages: [],
  buildings: [], crops: [], campfires: [], waterBodies: [], babyPets: [],
  camera: { x: 0, y: 0, shake: 0 },
  fps: 60, buildMode: null, inventoryCategory: 'all'
};

window.game = game;
window.State = State;

/* ==================== CANVAS ==================== */
const canvas = $('gameCanvas');
const ctx = canvas ? canvas.getContext('2d', { alpha: false, desynchronized: true }) : null;
const weatherCanvas = $('weatherCanvas');
const wctx = weatherCanvas ? weatherCanvas.getContext('2d') : null;

let W = window.innerWidth;
let H = window.innerHeight;
let DPR = 1;

function resizeCanvas() {
  if (!canvas || !ctx) return;
  DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.imageSmoothingEnabled = true;

  if (weatherCanvas && wctx) {
    weatherCanvas.width = W * DPR;
    weatherCanvas.height = H * DPR;
    weatherCanvas.style.width = W + 'px';
    weatherCanvas.style.height = H + 'px';
    wctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
}
resizeCanvas();
window.addEventListener('resize', () => setTimeout(resizeCanvas, 100));

if (isMobile) {
  const mc = $('mobileControls');
  if (mc) mc.classList.add('active');
}

/* ==================== MODAL YÖNETİMİ ==================== */
function openModal(id) {
  const m = $(id);
  if (!m) return;
  m.style.zIndex = '9900';
  m.classList.add('show');
}

function closeModal(id) {
  const m = $(id);
  if (!m) return;
  m.classList.remove('show');
  setTimeout(() => { m.style.zIndex = ''; }, 300);
}

/* ==================== BÜYÜK HARİTA ==================== */
function toggleBigMap() {
  const mm = $('miniMap');
  if (!mm) return;
  mm.classList.toggle('big');
  if (audio && audio.click) audio.click();
}

function initBigMap() {
  const miniMap = $('miniMap');
  if (miniMap) {
    miniMap.style.cursor = 'pointer';
    miniMap.onclick = toggleBigMap;
  }
}

/* ==================== HAYVAN VERİLERİ ==================== */
const ANIMAL_TYPES = [
  { type: 'rabbit', hp: 1, speed: 1.8, size: 9, color: '#d4c5b0', food: 1, xp: 10 },
  { type: 'deer', hp: 2, speed: 1.4, size: 16, color: '#8b6f47', food: 2, xp: 20 },
  { type: 'boar', hp: 3, speed: 1.6, size: 14, color: '#4a3728', food: 3, xp: 30 },
  { type: 'chicken', hp: 1, speed: 1.2, size: 8, color: '#f5e6c8', food: 1, xp: 8 },
  { type: 'sheep', hp: 2, speed: 1, size: 14, color: '#f0ead6', food: 1, xp: 15 },
  { type: 'cow', hp: 3, speed: 1.1, size: 18, color: '#8b5a3c', food: 2, xp: 25 },
  { type: 'wolf', hp: 3, speed: 2.2, size: 13, color: '#5a5a5a', food: 2, xp: 40, hostile: true },
  { type: 'fox', hp: 2, speed: 2, size: 11, color: '#d2691e', food: 1, xp: 25 },
  { type: 'horse', hp: 4, speed: 2.8, size: 20, color: '#8b4513', food: 2, xp: 50 },
  { type: 'pig', hp: 2, speed: 1.3, size: 15, color: '#ffb6c1', food: 3, xp: 22 },
  { type: 'duck', hp: 1, speed: 1.5, size: 10, color: '#f5deb3', food: 1, xp: 12 },
  { type: 'bear', hp: 5, speed: 1.9, size: 22, color: '#3d2817', food: 4, xp: 80, hostile: true },
  { type: 'goat', hp: 2, speed: 1.7, size: 13, color: '#b8b8a8', food: 2, xp: 20 },
  { type: 'spider', hp: 2, speed: 2.5, size: 10, color: '#1a1a1a', food: 1, xp: 35, hostile: true }
];

const ENEMY_TYPES = [
  { type: 'shadow', hp: 4, speed: 1.2, size: 15, damage: 3, color: '#1a0a1a' },
  { type: 'ghost', hp: 3, speed: 1.6, size: 14, damage: 2, color: '#a0a0c0' },
  { type: 'skeleton', hp: 5, speed: 1.0, size: 15, damage: 4, color: '#e0e0d0' },
  { type: 'goblin', hp: 3, speed: 1.4, size: 12, damage: 3, color: '#4a5a2a' }
];

/* ==================== SEED RNG ==================== */
function rnd() {
  if (typeof SeedSystem !== 'undefined' && SeedSystem.initialized) {
    return SeedSystem.random();
  }
  return Math.random();
}

function rndRange(min, max) { return min + rnd() * (max - min); }
function rndInt(min, max) { return Math.floor(rnd() * (max - min + 1)) + min; }
function rndPick(arr) { return arr[Math.floor(rnd() * arr.length)]; }

/* ==================== KARAKTER ÖNİZLEME ==================== */
function generateOptions(containerId, type, count) {
  const container = $(containerId);
  if (!container) return;
  container.innerHTML = '';
  const prefixes = { skin: 'skin', hair: 'hair', shirt: 'shirt' };

  for (let i = 1; i <= count; i++) {
    const opt = document.createElement('div');
    opt.className = `char-option ${prefixes[type]}${i} ${i === 1 ? 'selected' : ''}`;
    opt.dataset.type = type;
    opt.dataset.value = i;
    opt.onclick = function () {
      container.querySelectorAll('.char-option').forEach(o => o.classList.remove('selected'));
      this.classList.add('selected');
      game.player.appearance[type] = i;
      updateCharacterPreview();
    };
    container.appendChild(opt);
  }
}

function updateCharacterPreview() {
  const preview = $('charPreview');
  if (!preview) return;
  preview.innerHTML = '';

  const sc = ['#8d5524', '#c68642', '#e0ac69', '#ffdbac', '#5a3a1a', '#6b4423', '#f1c27d', '#edb98a', '#d08b5b', '#ae5d29', '#694d3d', '#ffdbac'];
  const hc = ['#1a1a1a', '#654321', '#8b4513', '#d4a574', '#c9c9c9', '#ffdb58', '#8b0000', '#4b0082', '#00008b', '#006400', '#ff69b4', '#f5f5dc'];
  const shc = ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c', '#34495e', '#e91e63', '#ff5722', '#673ab7', '#00bcd4', '#795548'];

  const skin = sc[game.player.appearance.skin - 1] || sc[0];
  const hair = hc[game.player.appearance.hair - 1] || hc[0];
  const shirt = shc[game.player.appearance.shirt - 1] || shc[0];

  const c = document.createElement('canvas');
  c.width = 200;
  c.height = 270;
  const cx = c.getContext('2d');

  cx.fillStyle = 'rgba(0,0,0,0.3)';
  cx.beginPath();
  cx.ellipse(100, 250, 50, 12, 0, 0, Math.PI * 2);
  cx.fill();

  cx.fillStyle = '#2c3e50';
  cx.fillRect(72, 200, 18, 42);
  cx.fillRect(110, 200, 18, 42);

  cx.fillStyle = '#1a1a1a';
  cx.fillRect(66, 236, 28, 12);
  cx.fillRect(106, 236, 28, 12);

  cx.fillStyle = shirt;
  cx.fillRect(72, 135, 56, 68);
  cx.fillStyle = 'rgba(0,0,0,0.15)';
  cx.fillRect(72, 135, 56, 10);
  cx.fillRect(52, 140, 20, 52);
  cx.fillRect(128, 140, 20, 52);
  cx.fillStyle = 'rgba(0,0,0,0.15)';
  cx.fillRect(52, 140, 20, 8);
  cx.fillRect(128, 140, 20, 8);

  cx.fillStyle = skin;
  cx.beginPath();
  cx.arc(62, 194, 10, 0, Math.PI * 2);
  cx.arc(138, 194, 10, 0, Math.PI * 2);
  cx.fill();
  cx.fillRect(92, 122, 16, 16);

  cx.beginPath();
  cx.arc(100, 98, 32, 0, Math.PI * 2);
  cx.fill();
  cx.fillStyle = 'rgba(0,0,0,0.08)';
  cx.beginPath();
  cx.arc(100, 98, 32, Math.PI * 0.3, Math.PI * 1.2);
  cx.fill();

  cx.fillStyle = hair;
  cx.beginPath();
  cx.arc(100, 85, 34, Math.PI, 0);
  cx.fill();
  cx.fillRect(66, 85, 68, 20);

  cx.fillStyle = 'white';
  cx.beginPath();
  cx.arc(88, 101, 6, 0, Math.PI * 2);
  cx.arc(112, 101, 6, 0, Math.PI * 2);
  cx.fill();

  cx.fillStyle = '#0a0e1a';
  cx.beginPath();
  cx.arc(89, 101, 3, 0, Math.PI * 2);
  cx.arc(113, 101, 3, 0, Math.PI * 2);
  cx.fill();

  cx.strokeStyle = '#5a3a2a';
  cx.lineWidth = 2.5;
  cx.beginPath();
  cx.arc(100, 115, 9, 0, Math.PI);
  cx.stroke();

  preview.appendChild(c);
}

/* ==================== DÜNYA OLUŞTUR ==================== */
function createWorld() {
  game.objects = [];
  game.animals = [];
  game.enemies = [];
  game.particles = [];
  game.buildings = [];
  game.crops = [];
  game.campfires = [];
  game.waterBodies = [];
  game.babyPets = [];

  if (typeof WeatherSystem !== 'undefined') WeatherSystem.reset();

  const totalObjects = Math.floor(WORLD_SIZE * WORLD_SIZE * 0.000035);

  for (let i = 0; i < totalObjects; i++) {
    const x = rnd() * WORLD_SIZE;
    const y = rnd() * WORLD_SIZE;
    if (Math.hypot(x - CAMP_X, y - CAMP_Y) < 180) continue;

    const r = rnd();
    let type;
    if (r < 0.55) type = 'tree';
    else if (r < 0.68) type = 'bush';
    else if (r < 0.76) type = 'grass';
    else if (r < 0.83) type = 'stone';
    else if (r < 0.88) type = 'mushroom';
    else if (r < 0.93) type = 'cilek';
    else if (r < 0.97) type = 'flower';
    else type = 'bush_berry';

    game.objects.push({
      x, y, type,
      collected: false,
      size: type === 'tree' ? 1 + rnd() * 0.8 : 1,
      shake: 0,
      variant: Math.floor(rnd() * 3)
    });
  }

  for (let i = 0; i < 5; i++) {
    const angle = rnd() * Math.PI * 2;
    const dist = 1000 + rnd() * 2500;
    const x = CAMP_X + Math.cos(angle) * dist;
    const y = CAMP_Y + Math.sin(angle) * dist;

    if (x < 500 || x > WORLD_SIZE - 500) continue;
    if (y < 500 || y > WORLD_SIZE - 500) continue;

    game.waterBodies.push({
      x, y,
      radius: 150 + rnd() * 100,
      animTime: 0
    });
  }

  game.world.campfire = { x: CAMP_X, y: CAMP_Y, lit: false, fuel: 0, animTime: 0 };

  for (let i = 0; i < 60; i++) spawnAnimal();
  for (let i = 0; i < 8; i++) spawnBabyPet();

  buildSpatialGrid();

  if (typeof StructureSystem !== 'undefined') StructureSystem.generate();
  if (typeof NPCCampSystem !== 'undefined') NPCCampSystem.generate();
  if (typeof AnimalSystemV2 !== 'undefined') AnimalSystemV2.generate();
  if (typeof DecorationSystem !== 'undefined') DecorationSystem.generate();

  console.log('🌍 Dünya oluşturuldu (seed:', typeof SeedSystem !== 'undefined' ? SeedSystem.currentSeed : 'YOK', ')');
}

/* ==================== SPATIAL GRID ==================== */
const spatialGrid = new Map();
const GRID_SIZE = 200;

function buildSpatialGrid() {
  spatialGrid.clear();
  game.objects.forEach(obj => {
    const gx = Math.floor(obj.x / GRID_SIZE);
    const gy = Math.floor(obj.y / GRID_SIZE);
    const key = `${gx},${gy}`;
    if (!spatialGrid.has(key)) spatialGrid.set(key, []);
    spatialGrid.get(key).push(obj);
  });
}

function getNearbyObjects(x, y, radius = 100) {
  const result = [];
  const gx = Math.floor(x / GRID_SIZE);
  const gy = Math.floor(y / GRID_SIZE);
  const r = Math.ceil(radius / GRID_SIZE);

  for (let i = -r; i <= r; i++) {
    for (let j = -r; j <= r; j++) {
      const key = `${gx + i},${gy + j}`;
      const cell = spatialGrid.get(key);
      if (cell) result.push(...cell);
    }
  }
  return result;
}

/* ==================== SPAWN ==================== */
function spawnAnimal() {
  const angle = rnd() * Math.PI * 2;
  const dist = 600 + rnd() * 1500;
  const t = rndPick(ANIMAL_TYPES);

  game.animals.push({
    x: CAMP_X + Math.cos(angle) * dist,
    y: CAMP_Y + Math.sin(angle) * dist,
    ...t,
    maxHp: t.hp, hp: t.hp,
    state: 'idle', stateTime: Math.random() * 3,
    facing: 1, targetX: 0, targetY: 0,
    animation: { frame: 0, time: 0, walking: false }
  });
}

function spawnNightEnemy() {
  const angle = Math.random() * Math.PI * 2;
  const dist = 700 + Math.random() * 400;
  const t = pickRandom(ENEMY_TYPES);

  game.enemies.push({
    x: game.player.x + Math.cos(angle) * dist,
    y: game.player.y + Math.sin(angle) * dist,
    ...t,
    maxHp: t.hp, hp: t.hp,
    attackCooldown: 0, facing: 1, stateTime: 0,
    animation: { frame: 0, time: 0 }
  });
}

function spawnBabyPet() {
  const angle = rnd() * Math.PI * 2;
  const dist = 500 + rnd() * 1500;
  const types = [
    { type: 'baby_wolf', name: 'Kurt Yavrusu', color: '#5a5a5a', size: 8 },
    { type: 'baby_dog', name: 'Köpek Yavrusu', color: '#c8a882', size: 8 },
    { type: 'baby_cat', name: 'Kedi Yavrusu', color: '#ff8c42', size: 7 }
  ];
  const t = rndPick(types);

  game.babyPets.push({
    ...t,
    x: CAMP_X + Math.cos(angle) * dist,
    y: CAMP_Y + Math.sin(angle) * dist,
    hp: 3, maxHp: 3,
    adopted: false, facing: 1,
    state: 'idle', stateTime: Math.random() * 3,
    animation: { frame: 0, time: 0, walking: false },
    targetX: 0, targetY: 0
  });
}

/* ==================== MESAJ ==================== */
let messageFadeTimer = null;

function addMessage(text) {
  game.messages.unshift({ text, time: Date.now() });
  if (game.messages.length > 3) game.messages.pop();

  const log = $('messageLog');
  if (!log) return;

  log.innerHTML = '';
  game.messages.forEach(m => {
    const p = document.createElement('p');
    p.textContent = m.text;
    log.appendChild(p);
  });
  log.style.opacity = '1';

  clearTimeout(messageFadeTimer);
  messageFadeTimer = setTimeout(() => {
    log.style.opacity = '0';
    setTimeout(() => {
      if (log.style.opacity === '0') {
        game.messages = [];
        log.innerHTML = '';
      }
    }, 500);
  }, 3000);
}

/* ==================== UI GÜNCELLE ==================== */
function updateUI() {
  const p = game.player;

  safeWidth('healthBar', (p.health / p.maxHealth * 100));
  safeWidth('hungerBar', (p.hunger / p.maxHunger * 100));
  safeWidth('thirstBar', (p.thirst / p.maxThirst * 100));
  safeWidth('staminaBar', (p.stamina / p.maxStamina * 100));
  safeWidth('tempBar', (p.temperature * 100));

  safeText('healthText', Math.round(p.health));
  safeText('hungerText', Math.round(p.hunger));
  safeText('thirstText', Math.round(p.thirst));
  safeText('staminaText', Math.round(p.stamina));

  const tempStatus = p.temperature < 0.3 ? '🥶 Soğuk' : p.temperature > 0.8 ? '🥵 Sıcak' : 'Normal';
  safeText('tempText', tempStatus);

  InventorySystem.render();
  CraftingSystem.updateButtons();
}

/* ==================== PANEL TOGGLE ==================== */
function togglePanel(id) {
  const panel = $(id);
  if (!panel) return;

  ['inventoryPanel', 'buildPanel', 'craftPanel', 'farmPanel', 'petPanel'].forEach(pid => {
    if (pid !== id) {
      const p = $(pid);
      if (p) p.classList.remove('open');
    }
  });

  panel.classList.toggle('open');
  if (audio && audio.click) audio.click();

  if (id === 'inventoryPanel' && panel.classList.contains('open')) InventorySystem.render();
  if (id === 'craftPanel' && panel.classList.contains('open')) CraftingSystem.render();
  if (id === 'buildPanel' && panel.classList.contains('open')) BuildingSystem.render();
  if (id === 'farmPanel' && panel.classList.contains('open')) FarmingSystem.render();
  if (id === 'petPanel' && panel.classList.contains('open') && typeof PetSystem !== 'undefined') PetSystem.renderPanel();
}

console.log('✅ main/core.js yüklendi');