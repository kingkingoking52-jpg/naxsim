/* ==========================================
   ORION FOREST v6.1 - PETS SYSTEM
   Evcil hayvan sistemi (evcilleştir + eğit + savaş)
   ========================================== */

'use strict';

const PetSystem = {
  pets: [],         // Evcilleştirilmiş hayvanlar
  maxPets: 3,       // Maksimum evcil hayvan
  selectedPet: null,

  // Pet türleri (yetişkin halleri)
  PET_TYPES: {
    baby_wolf: {
      adultType: 'wolf',
      name: 'Kurt',
      icon: '🐺',
      hp: 15, damage: 4, speed: 2.5, size: 12,
      color: '#5a5a5a',
      foodNeeded: 3, // Büyümesi için gereken et
      desc: 'Saldırgan ve sadık dost'
    },
    baby_dog: {
      adultType: 'dog',
      name: 'Köpek',
      icon: '🐕',
      hp: 12, damage: 3, speed: 3, size: 11,
      color: '#c8a882',
      foodNeeded: 2,
      desc: 'Hızlı ve zeki yardımcı'
    },
    baby_cat: {
      adultType: 'cat',
      name: 'Kedi',
      icon: '🐈',
      hp: 8, damage: 2, speed: 3.5, size: 9,
      color: '#ff8c42',
      foodNeeded: 2,
      desc: 'Çevik fare avcısı'
    }
  },

  /* ==================== BAŞLAT ==================== */
  init() {
    console.log('🐾 Evcil hayvan sistemi başlatıldı');
  },

  /* ==================== EVCİLLEŞTİR ==================== */
  adopt(baby) {
    if (!baby || baby.adopted) return;

    // Max sınırı
    if (this.pets.length >= this.maxPets) {
      showToast(`❌ En fazla ${this.maxPets} evcil hayvan!`, 'warning', 3000);
      return;
    }

    // Et gerekli mi? (yem ile evcilleştirme)
    if (!game.player.inventory.cig_et || game.player.inventory.cig_et < 1) {
      showToast('🍖 1 çiğ et gerekli!', 'warning', 3000);
      return;
    }

    // Eti al
    game.player.inventory.cig_et -= 1;

    // Evcilleştir
    baby.adopted = true;
    const petType = this.PET_TYPES[baby.type];
    if (!petType) return;

    // Pet oluştur (yavru olarak başlar)
    const pet = {
      id: Math.random(),
      name: baby.name,       // "Kurt Yavrusu"
      type: baby.type,       // baby_wolf
      stage: 'baby',         // baby → adult
      x: game.player.x - 30,
      y: game.player.y,
      hp: baby.hp,
      maxHp: baby.hp,
      damage: 1,
      speed: 2,
      size: baby.size,
      color: baby.color,
      feeding: 0,            // Kaç et yedi
      needed: petType.foodNeeded,
      happy: 100,            // Mutluluk (0-100)
      facing: 1,
      target: null,          // Saldıracağı düşman
      state: 'following',    // following, attacking, idle
      stateTime: 0,
      animation: { frame: 0, time: 0, walking: false },
      bornAt: Date.now()
    };

    this.pets.push(pet);

    // Yavruyu listeden çıkar
    const idx = game.babyPets.indexOf(baby);
    if (idx > -1) game.babyPets.splice(idx, 1);

    addMessage(`🐾 ${baby.name} evcilleştirildi!`);
    if (audio && audio.pet) audio.pet();
    else if (audio && audio.success) audio.success();

    // Başarım
    if (typeof AchievementSystem !== 'undefined') {
      AchievementSystem.unlock('firstPet');
    }

    if (typeof updateUI === 'function') updateUI();
    this.renderPanel();
  },

  /* ==================== BESLE ==================== */
  feedPet(petId) {
    const pet = this.pets.find(p => p.id === petId);
    if (!pet) return;

    if (!game.player.inventory.cig_et || game.player.inventory.cig_et < 1) {
      showToast('🍖 Çiğ et yok!', 'warning');
      return;
    }

    game.player.inventory.cig_et -= 1;
    pet.feeding++;
    pet.happy = Math.min(100, pet.happy + 20);
    pet.hp = Math.min(pet.maxHp, pet.hp + 3);

    addMessage(`🍖 ${pet.name} beslendi! (${pet.feeding}/${pet.needed})`);
    if (audio && audio.eat) audio.eat();

    // Büyüdü mü?
    if (pet.feeding >= pet.needed && pet.stage === 'baby') {
      this.growUp(pet);
    }

    if (typeof updateUI === 'function') updateUI();
    this.renderPanel();
  },

  /* ==================== BÜYÜT ==================== */
  growUp(pet) {
    const petType = this.PET_TYPES[pet.type];
    if (!petType) return;

    pet.stage = 'adult';
    pet.name = petType.name;
    pet.hp = petType.hp;
    pet.maxHp = petType.hp;
    pet.damage = petType.damage;
    pet.speed = petType.speed;
    pet.size = petType.size;
    pet.color = petType.color;

    addMessage(`🎉 ${pet.name} büyüdü! Artık savaşabilir!`);
    if (audio && audio.levelUp) audio.levelUp();

    if (typeof AchievementSystem !== 'undefined') {
      AchievementSystem.unlock('pet_trained');
    }

    // Partikül efekti
    for (let i = 0; i < 15; i++) {
      game.particles.push({
        x: pet.x,
        y: pet.y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 5,
        life: 1.5,
        color: '255,215,0',
        size: 4
      });
    }
  },

  /* ==================== GÜNCELLE ==================== */
  update(dt) {
    if (!this.pets || this.pets.length === 0) return;

    const p = game.player;

    this.pets.forEach(pet => {
      // Mutluluk zamanla azalır
      pet.happy = Math.max(0, pet.happy - dt * 0.5);

      // Çok uzaksa ışınlan (buggy olmasın)
      const distToPlayer = Math.hypot(pet.x - p.x, pet.y - p.y);
      if (distToPlayer > 400) {
        pet.x = p.x + (Math.random() - 0.5) * 40;
        pet.y = p.y + (Math.random() - 0.5) * 40;
      }

      // Yaratık ara (savaş için)
      let nearestEnemy = null;
      let nearestDist = 250;

      game.enemies.forEach(e => {
        const d = Math.hypot(e.x - pet.x, e.y - pet.y);
        if (d < nearestDist) { nearestDist = d; nearestEnemy = e; }
      });

      // Yapı yaratıkları
      if (typeof StructureSystem !== 'undefined') {
        StructureSystem.structures.forEach(s => {
          if (s.enemy && s.enemy.hp > 0) {
            const d = Math.hypot(s.enemy.x - pet.x, s.enemy.y - pet.y);
            if (d < nearestDist) { nearestDist = d; nearestEnemy = s.enemy; }
          }
        });
      }

      // Saldırı modu
      if (nearestEnemy && nearestDist < 200) {
        pet.state = 'attacking';
        pet.target = nearestEnemy;

        const dx = nearestEnemy.x - pet.x;
        const dy = nearestEnemy.y - pet.y;
        const d = Math.hypot(dx, dy);

        if (d > 25) {
          pet.x += (dx / d) * pet.speed;
          pet.y += (dy / d) * pet.speed;
          pet.facing = dx > 0 ? 1 : -1;
          pet.animation.walking = true;
        } else {
          // Saldır!
          if (!pet.attackCooldown || pet.attackCooldown <= 0) {
            nearestEnemy.hp -= pet.damage;
            pet.attackCooldown = 1;
            if (audio && audio.hit) audio.hit();

            // Partikül
            for (let i = 0; i < 5; i++) {
              game.particles.push({
                x: nearestEnemy.x,
                y: nearestEnemy.y - 10,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 3,
                life: 0.6,
                color: '255,50,50',
                size: 3
              });
            }
          }
        }

        if (pet.attackCooldown) pet.attackCooldown -= dt;
      }
      // Takip modu
      else {
        pet.state = 'following';
        pet.target = null;

        const dx = p.x - pet.x;
        const dy = p.y - pet.y;
        const d = Math.hypot(dx, dy);

        // Çok yakınsa dur
        if (d > 50) {
          pet.x += (dx / d) * pet.speed * 0.8;
          pet.y += (dy / d) * pet.speed * 0.8;
          pet.facing = dx > 0 ? 1 : -1;
          pet.animation.walking = true;
        } else {
          // Oyuncunun etrafında dolan
          pet.stateTime -= dt;
          if (pet.stateTime <= 0) {
            pet.stateTime = 1 + Math.random() * 2;
            pet.idleAngle = Math.random() * Math.PI * 2;
          }

          const targetX = p.x + Math.cos(pet.idleAngle || 0) * 40;
          const targetY = p.y + Math.sin(pet.idleAngle || 0) * 40;

          const idx = targetX - pet.x;
          const idy = targetY - pet.y;
          const id = Math.hypot(idx, idy);

          if (id > 5) {
            pet.x += (idx / id) * pet.speed * 0.5;
            pet.y += (idy / id) * pet.speed * 0.5;
            pet.facing = idx > 0 ? 1 : -1;
            pet.animation.walking = true;
          } else {
            pet.animation.walking = false;
          }
        }
      }

      // Animasyon
      pet.animation.time += dt;
      if (pet.animation.walking && pet.animation.time > 0.15) {
        pet.animation.frame = (pet.animation.frame + 1) % 4;
        pet.animation.time = 0;
      }

      // Mutluluk düşükse kaçma eğilimi
      if (pet.happy < 20 && pet.stage === 'adult') {
        // Uyarı ver (bir kez)
        if (!pet.warned) {
          pet.warned = true;
          addMessage(`⚠️ ${pet.name} mutsuz! Besle yoksa kaçacak!`);
        }
      }
    });
  },

  /* ==================== ÇİZİM ==================== */
  draw(ctx, camX, camY) {
    if (!this.pets || this.pets.length === 0) return;

    const darkness = game.world.isDay ? 1 : 0.7;

    this.pets.forEach(pet => {
      const sx = pet.x - camX;
      const sy = pet.y - camY;

      if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) return;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(pet.facing, 1);

      // Gölge
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(0, pet.size * 0.6, pet.size * 0.8, pet.size * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      const bob = pet.animation.walking ? Math.sin(pet.animation.frame * Math.PI / 2) * 2 : 0;

      // Gövde
      ctx.fillStyle = pet.color;
      ctx.beginPath();
      ctx.ellipse(0, bob, pet.size, pet.size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Baş
      ctx.beginPath();
      ctx.arc(pet.size * 0.6, bob - pet.size * 0.3, pet.size * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Kulaklar (yetişkinse)
      if (pet.stage === 'adult') {
        ctx.beginPath();
        ctx.moveTo(pet.size * 0.4, bob - pet.size * 0.7);
        ctx.lineTo(pet.size * 0.5, bob - pet.size * 1.1);
        ctx.lineTo(pet.size * 0.7, bob - pet.size * 0.7);
        ctx.closePath();
        ctx.fill();
      }

      // Gözler
      ctx.fillStyle = '#0a0e1a';
      ctx.beginPath();
      ctx.arc(pet.size * 0.5, bob - pet.size * 0.4, 1.8, 0, Math.PI * 2);
      ctx.arc(pet.size * 0.8, bob - pet.size * 0.4, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Burun
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(pet.size * 1, bob - pet.size * 0.2, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Üstünde mutluluk göstergesi
      const happy = pet.happy;
      let moodIcon = '😊';
      if (happy < 30) moodIcon = '😢';
      else if (happy < 60) moodIcon = '😐';

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(moodIcon, sx, sy - pet.size * 2);

      // İsim + level
      ctx.fillStyle = '#4cc9f0';
      ctx.font = 'bold 10px Arial';
      ctx.fillText(`${pet.name}${pet.stage === 'baby' ? ' (Yavru)' : ''}`, sx, sy - pet.size * 2.7);

      // HP bar (hasarlıysa)
      if (pet.hp < pet.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(sx - 20, sy - pet.size * 3.3, 40, 4);
        ctx.fillStyle = '#00d68f';
        ctx.fillRect(sx - 20, sy - pet.size * 3.3, 40 * (pet.hp / pet.maxHp), 4);
      }

      // Saldırı göstergesi
      if (pet.state === 'attacking') {
        ctx.fillStyle = 'rgba(255, 8, 68, 0.9)';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('⚔️', sx, sy - pet.size * 3.8);
      }
    });
  },

  /* ==================== PANEL ==================== */
  renderPanel() {
    const list = $('petList');
    if (!list) return;

    list.innerHTML = '';

    if (this.pets.length === 0) {
      list.innerHTML = '<div class="inv-empty" style="padding:20px;text-align:center;color:#8892b0;font-size:13px">🐾 Henüz evcil hayvanın yok!<br><br>Ormanda ❤️ işaretli yavruları bul ve E ile evcilleştir.</div>';
      return;
    }

    this.pets.forEach(pet => {
      const happy = pet.happy;
      let happyColor = '#00d68f';
      let happyText = '😊 Mutlu';
      if (happy < 30) { happyColor = '#ff0844'; happyText = '😢 Mutsuz'; }
      else if (happy < 60) { happyColor = '#ff9800'; happyText = '😐 İdare eder'; }

      const div = document.createElement('div');
      div.className = 'craft-item';
      div.style.flexDirection = 'column';
      div.style.alignItems = 'stretch';
      div.style.gap = '8px';

      const needed = pet.needed || 2;
      const feeding = pet.feeding || 0;
      const progress = pet.stage === 'baby' ? `${feeding}/${needed}` : 'Yetişkin ✅';

      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:28px">${pet.type === 'baby_wolf' ? '🐺' : pet.type === 'baby_dog' ? '🐕' : '🐈'}</span>
            <div>
              <div style="font-weight:800;color:#fff;font-size:13px">${pet.name}${pet.stage === 'baby' ? ' (Yavru)' : ''}</div>
              <div style="color:${happyColor};font-size:11px">${happyText} (${Math.round(happy)}%)</div>
            </div>
          </div>
          <div style="text-align:right">
            <div style="color:#4cc9f0;font-size:11px;font-weight:700">❤️ ${pet.hp}/${pet.maxHp}</div>
            <div style="color:#ff6b35;font-size:10px">⚔️ ${pet.damage} hasar</div>
          </div>
        </div>
        <div style="background:rgba(10,20,40,0.6);border-radius:8px;padding:8px;font-size:11px;color:#8892b0">
          ${pet.stage === 'baby' ? `🍖 Besleme: ${progress}` : '✅ Yetişkin - Savaşa hazır!'}
        </div>
        <div style="display:flex;gap:8px">
          <button class="setting-btn" style="flex:1;font-size:11px" onclick="PetSystem.feedPet(${pet.id})">
            🍖 BESLE
          </button>
          <button class="setting-btn danger" style="flex:1;font-size:11px" onclick="PetSystem.releasePet(${pet.id})">
            🚪 SALIVER
          </button>
        </div>
      `;

      list.appendChild(div);
    });
  },

  /* ==================== SALIVER ==================== */
  releasePet(petId) {
    const idx = this.pets.findIndex(p => p.id === petId);
    if (idx < 0) return;

    const pet = this.pets[idx];

    showAlert({
      icon: '🚪',
      title: 'SALIVER',
      message: `${pet.name}'i serbest bırakmak istediğine emin misin?`,
      buttons: [
        { text: 'HAYIR', value: false, secondary: true },
        { text: 'EVET', value: true }
      ]
    }).then(r => {
      if (!r) return;

      // Kurt olarak serbest bırak
      if (pet.stage === 'adult') {
        game.animals.push({
          type: 'wolf',
          hp: 3, speed: 2, size: 13, color: '#5a5a5a',
          food: 2, xp: 40, hostile: true,
          x: pet.x, y: pet.y,
          maxHp: 3,
          state: 'idle',
          stateTime: 2,
          facing: 1,
          targetX: pet.x, targetY: pet.y,
          animation: { frame: 0, time: 0, walking: false }
        });
      }

      this.pets.splice(idx, 1);
      addMessage(`🐾 ${pet.name} serbest bırakıldı`);
      if (audio && audio.click) audio.click();
      this.renderPanel();
    });
  }
};

window.PetSystem = PetSystem;

// Klavye kısayolu için global
window.togglePetPanel = () => {
  if (typeof togglePanel === 'function') togglePanel('petPanel');
  PetSystem.renderPanel();
};

console.log('✅ pets.js yüklendi');