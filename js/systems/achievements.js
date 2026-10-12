/* ==========================================
   ORION FOREST v6.0 - ACHIEVEMENTS
   Başarım sistemi (40 başarım)
   ========================================== */

'use strict';

/* ==================== BAŞARIM LİSTESİ ==================== */
const ACHIEVEMENTS = {
  // İlk adımlar
  firstTree:     { icon: '🌲', name: 'İlk Ağaç',       desc: 'İlk odunu topladın' },
  firstStone:    { icon: '🪨', name: 'İlk Taş',         desc: 'İlk taşı topladın' },
  firstFire:     { icon: '🔥', name: 'Ateş Ustası',     desc: 'İlk ateşi yaktın' },
  firstKill:     { icon: '⚔️', name: 'Avcı',            desc: 'İlk hayvanı avladın' },
  firstBuild:    { icon: '🏗️', name: 'İnşaatçı',        desc: 'İlk yapıyı inşa ettin' },
  firstFarm:     { icon: '🌾', name: 'Çiftçi',          desc: 'İlk tohumu ektin' },
  firstHarvest:  { icon: '🌾', name: 'Hasat',           desc: 'İlk hasadı yaptın' },
  firstFish:     { icon: '🎣', name: 'Balıkçı',         desc: 'İlk balığı tuttun' },
  firstPet:      { icon: '🐕', name: 'Dost',            desc: 'İlk evcil hayvanı edindin' },
  firstNPC:      { icon: '👤', name: 'Sosyal',          desc: 'İlk NPC ile konuştun' },

  // Seviyeler
  level5:        { icon: '⭐', name: 'Deneyimli',       desc: 'Seviye 5\'e ulaştın' },
  level10:       { icon: '🌟', name: 'Uzman',           desc: 'Seviye 10\'a ulaştın' },
  level25:       { icon: '💫', name: 'Usta',            desc: 'Seviye 25\'e ulaştın' },
  level50:       { icon: '✨', name: 'Efsane',          desc: 'Seviye 50\'ye ulaştın' },

  // Hayatta kalma
  surviveNight:  { icon: '🌙', name: 'Gece Kuşu',       desc: 'İlk geceyi atlattın' },
  survive7Days:  { icon: '📅', name: 'Bir Hafta',       desc: '7 gün hayatta kaldın' },
  survive30Days: { icon: '🗓️', name: 'Bir Ay',          desc: '30 gün hayatta kaldın' },

  // Avcılık
  kill10:        { icon: '🏹', name: 'Keskin Nişancı',  desc: '10 hayvan avladın' },
  kill50:        { icon: '🎯', name: 'Usta Avcı',       desc: '50 hayvan avladın' },
  kill100:       { icon: '💀', name: 'Kıyımcı',         desc: '100 hayvan avladın' },

  // İnşa
  build10:       { icon: '🏰', name: 'Mimar',           desc: '10 yapı inşa ettin' },
  build50:       { icon: '🏯', name: 'İnşaat Devi',     desc: '50 yapı inşa ettin' },
  builder_house: { icon: '🏠', name: 'Ev Sahibi',       desc: 'İlk evini inşa ettin' },

  // Tarım
  farm10:        { icon: '🌾', name: 'Çiftlik',         desc: '10 bitki yetiştirdin' },
  farm50:        { icon: '🚜', name: 'Çiftçi Ustası',   desc: '50 bitki yetiştirdin' },

  // Hava
  weather:       { icon: '🌦️', name: 'Hava Durumu',     desc: 'Tüm havaları gördün' },

  // Yemek
  cook:          { icon: '🍖', name: 'Şef',             desc: 'İlk yemeği pişirdin' },

  // Ekonomi
  rich:          { icon: '💰', name: 'Zengin',          desc: '100 odun biriktirdin' },
  rich2:         { icon: '💎', name: 'Milyoner',        desc: '1000 odun biriktirdin' },
  trader:        { icon: '💱', name: 'Tüccar',          desc: 'İlk ticaretini yaptın' },

  // Balık
  fisher:        { icon: '🐟', name: 'Balık Ustası',    desc: '20 balık tuttun' },

  // Hayvanlar
  hunter:        { icon: '🐺', name: 'Kurt Avcısı',     desc: 'Kurt avladın' },
  bearKill:      { icon: '🐻', name: 'Ayı Avcısı',      desc: 'Ayı öldürdün' },

  // Yaratık
  nightHunter:   { icon: '👹', name: 'Yaratık Avcısı',  desc: '10 yaratık öldürdün' },

  // Keşif
  explorer:      { icon: '🗺️', name: 'Kaşif',           desc: '5000 birim uzaklığa gittin' },

  // Evcil
  pet_trained:   { icon: '🐾', name: 'Hayvan Eğitmeni', desc: 'Evcil hayvanını büyüttün' },

  // NPC
  npcFriend:     { icon: '🤝', name: 'Dostluk',         desc: 'Bir NPC ile arkadaş oldun' },
  witchMet:      { icon: '🧙', name: 'Cadıyla Karşılaşma', desc: 'Bir cadı ile karşılaştın' },

  // Final
  master:        { icon: '👑', name: 'Orman Efendisi',  desc: 'Tüm başarımları tamamla' }
};

/* ==================== BAŞARIM YÖNETİCİSİ ==================== */
const AchievementSystem = {
  unlocked: {},

  /* ==================== BAŞLATMA ==================== */
  init() {
    this.unlocked = SaveSystem.loadAchievements() || {};
    console.log('🏆 Başarım sistemi başlatıldı - ' + this.getUnlockedCount() + '/' + this.getTotalCount());
  },

  /* ==================== AÇMA ==================== */
  unlock(id) {
    if (this.unlocked[id]) return false;
    if (!ACHIEVEMENTS[id]) return false;

    this.unlocked[id] = true;
    SaveSystem.saveAchievements(this.unlocked);

    const achievement = ACHIEVEMENTS[id];
    showToast(`${achievement.icon} ${achievement.name}`, 'success', 4000);
    if (audio && audio.levelUp) audio.levelUp();

    // Ana başarım kontrolü
    if (id !== 'master' && this.getUnlockedCount() >= this.getTotalCount() - 1) {
      this.unlock('master');
    }

    return true;
  },

  /* ==================== KONTROL ==================== */
  isUnlocked(id) {
    return this.unlocked[id] === true;
  },

  getUnlockedCount() {
    return Object.values(this.unlocked).filter(x => x).length;
  },

  getTotalCount() {
    return Object.keys(ACHIEVEMENTS).length;
  },

  /* ==================== İSTATİSTİK BAZLI KONTROL ==================== */
  checkStats() {
    if (typeof game === 'undefined' || !game.player) return;
    const stats = game.player.stats;
    if (!stats) return;

    if (stats.treesCollected >= 1) this.unlock('firstTree');
    if (stats.kills >= 1) this.unlock('firstKill');
    if (stats.kills >= 10) this.unlock('kill10');
    if (stats.kills >= 50) this.unlock('kill50');
    if (stats.kills >= 100) this.unlock('kill100');
    if (stats.buildsCount >= 1) this.unlock('firstBuild');
    if (stats.buildsCount >= 10) this.unlock('build10');
    if (stats.buildsCount >= 50) this.unlock('build50');
    if (stats.farmsPlanted >= 1) this.unlock('firstFarm');
    if (stats.harvests >= 1) this.unlock('firstHarvest');
    if (stats.harvests >= 10) this.unlock('farm10');
    if (stats.harvests >= 50) this.unlock('farm50');
    if (stats.nightsSurvived >= 1) this.unlock('surviveNight');
    if (stats.nightsSurvived >= 7) this.unlock('survive7Days');
    if (stats.nightsSurvived >= 30) this.unlock('survive30Days');
    if (stats.fishCaught >= 1) this.unlock('firstFish');
    if (stats.fishCaught >= 20) this.unlock('fisher');
    if (stats.monstersKilled >= 10) this.unlock('nightHunter');
    if (stats.distanceTraveled >= 5000) this.unlock('explorer');
    if (stats.npcFriends >= 1) this.unlock('npcFriend');
    if (stats.weathersSeen && stats.weathersSeen.size >= 6) this.unlock('weather');

    // Seviye
    if (game.player.level >= 5) this.unlock('level5');
    if (game.player.level >= 10) this.unlock('level10');
    if (game.player.level >= 25) this.unlock('level25');
    if (game.player.level >= 50) this.unlock('level50');

    // Odun
    if (game.player.inventory.odun >= 100) this.unlock('rich');
    if (game.player.inventory.odun >= 1000) this.unlock('rich2');
  },

  /* ==================== MODAL GÖSTER ==================== */
  showPanel() {
    const list = $('achievementsList');
    if (!list) return;

    list.innerHTML = '';

    const unlockedCount = this.getUnlockedCount();
    const totalCount = this.getTotalCount();

    // Başlık
    const header = document.createElement('div');
    header.style.cssText = 'text-align:center;margin-bottom:15px;padding:12px;background:rgba(76,201,240,0.1);border-radius:12px;border:1px solid rgba(76,201,240,0.3)';
    header.innerHTML = `
      <div style="font-size:24px;font-weight:900;color:#4cc9f0">${unlockedCount} / ${totalCount}</div>
      <div style="font-size:11px;color:#8892b0;letter-spacing:2px;margin-top:5px">BAŞARIM TAMAMLANDI</div>
      <div style="height:6px;background:rgba(76,201,240,0.2);border-radius:3px;margin-top:8px;overflow:hidden">
        <div style="height:100%;background:linear-gradient(90deg,#4cc9f0,#f72585);width:${(unlockedCount/totalCount*100)}%;border-radius:3px;transition:width 0.5s"></div>
      </div>
    `;
    list.appendChild(header);

    // Grid
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px';

    Object.entries(ACHIEVEMENTS).forEach(([id, achievement]) => {
      const isUnlocked = this.isUnlocked(id);
      const card = document.createElement('div');
      card.style.cssText = `
        background:${isUnlocked ? 'rgba(76,201,240,0.15)' : 'rgba(10,20,40,0.6)'};
        border:1px solid ${isUnlocked ? '#4cc9f0' : 'rgba(76,201,240,0.2)'};
        border-radius:10px;
        padding:10px;
        text-align:center;
        opacity:${isUnlocked ? 1 : 0.5};
        transition:all 0.3s;
      `;

      card.innerHTML = `
        <div style="font-size:28px;margin-bottom:5px">${isUnlocked ? achievement.icon : '🔒'}</div>
        <div style="color:#4cc9f0;font-weight:800;font-size:11px;letter-spacing:1px">${achievement.name}</div>
        <div style="color:#8892b0;font-size:9px;margin-top:3px">${achievement.desc}</div>
      `;

      grid.appendChild(card);
    });

    list.appendChild(grid);

    const modal = $('achievementsModal');
    if (modal) modal.classList.add('show');
  },

  /* ==================== SIFIRLA ==================== */
  reset() {
    this.unlocked = {};
    SaveSystem.saveAchievements(this.unlocked);
    console.log('🏆 Başarımlar sıfırlandı');
  }
};

/* ==================== GLOBAL EXPORT ==================== */
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.AchievementSystem = AchievementSystem;

// Kısayol fonksiyonu
window.unlockAchievement = (id) => AchievementSystem.unlock(id);

console.log('✅ achievements.js yüklendi');