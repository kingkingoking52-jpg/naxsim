/* ==========================================
   ORION FOREST v6.7 - MAIN / GAMEPLAY
   Update, interact, attack, level
   ========================================== */

'use strict';

/* ==================== ETKİLEŞİM ==================== */
function findNearestInteractable() {
  const p = game.player;
  let nearest = null;
  let minDist = 80;

  const cfDist = Math.hypot(p.x - game.world.campfire.x, p.y - game.world.campfire.y);
  if (cfDist < minDist) {
    minDist = cfDist;
    nearest = { type: 'campfire', target: game.world.campfire };
  }

  const nearby = getNearbyObjects(p.x, p.y, 100);
  nearby.forEach(obj => {
    if (obj.collected) return;
    const dist = Math.hypot(p.x - obj.x, p.y - obj.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = { type: 'object', target: obj };
    }
  });

  game.animals.forEach(animal => {
    const dist = Math.hypot(p.x - animal.x, p.y - animal.y);
    if (dist < 70 && dist < minDist) {
      minDist = dist;
      nearest = { type: 'animal', target: animal };
    }
  });

  if (game.babyPets) {
    game.babyPets.forEach(baby => {
      if (baby.adopted) return;
      const dist = Math.hypot(p.x - baby.x, p.y - baby.y);
      if (dist < 70 && dist < minDist) {
        minDist = dist;
        nearest = { type: 'babyPet', target: baby };
      }
    });
  }

  game.enemies.forEach(enemy => {
    const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
    if (dist < 70 && dist < minDist) {
      minDist = dist;
      nearest = { type: 'enemy', target: enemy };
    }
  });

  if (typeof StructureSystem !== 'undefined') {
    const structure = StructureSystem.getNearest(p.x, p.y, minDist);
    if (structure) {
      minDist = Math.hypot(p.x - structure.x, p.y - structure.y);
      nearest = { type: 'structure', target: structure };
    }
  }

  if (game.waterBodies) {
    game.waterBodies.forEach(water => {
      const dist = Math.hypot(p.x - water.x, p.y - water.y);
      if (dist < water.radius + 50 && dist > water.radius - 30 && dist < minDist) {
        minDist = dist;
        nearest = { type: 'water', target: water };
      }
    });
  }

  // Özel hayvanlar
  if (typeof AnimalSystemV2 !== 'undefined') {
    AnimalSystemV2.specialAnimals.forEach(animal => {
      const dist = Math.hypot(p.x - animal.x, p.y - animal.y);
      if (dist < 70 && dist < minDist) {
        minDist = dist;
        nearest = { type: 'specialAnimal', target: animal };
      }
    });
  }

  // NPC Kamp loot
  if (typeof NPCCampSystem !== 'undefined') {
    NPCCampSystem.camps.forEach(camp => {
      camp.loots.forEach((loot, idx) => {
        if (loot.taken) return;
        const dist = Math.hypot(p.x - loot.x, p.y - loot.y);
        if (dist < 50 && dist < minDist) {
          minDist = dist;
          nearest = { type: 'campLoot', target: loot, camp, lootIndex: idx };
        }
      });
    });

    NPCCampSystem.camps.forEach(camp => {
      camp.npcs.forEach(npc => {
        if (npc.dead) return;
        const dist = Math.hypot(p.x - npc.x, p.y - npc.y);
        if (dist < 80 && dist < minDist) {
          minDist = dist;
          nearest = { type: 'campNPC', target: npc, camp };
        }
      });
    });
  }

  return nearest;
}

function showInteractHint() {
  const hint = $('interactHint');
  if (!hint) return;

  if (typeof FishingSystem !== 'undefined' && FishingSystem.active) return;

  if (game.buildMode) {
    hint.style.display = 'block';
    hint.textContent = 'E - YERLEŞTİR';
    return;
  }

  const nearest = findNearestInteractable();
  if (nearest) {
    hint.style.display = 'block';
    switch (nearest.type) {
      case 'campfire':
        hint.textContent = nearest.target.lit ? 'E - Odun Ekle' : 'E - ATEŞ YAK';
        break;
      case 'object':
        hint.textContent = 'E - TOPLA';
        break;
      case 'animal':
      case 'enemy':
        hint.textContent = 'F - SALDIR';
        break;
      case 'babyPet':
        hint.textContent = 'E - EVCİLLEŞTİR (1 et)';
        break;
      case 'water':
        hint.textContent = 'E - BALIK TUT';
        break;
      case 'structure':
        if (nearest.target.npc && !nearest.target.npc.dead) {
          hint.textContent = 'Sağ Tık - KONUŞ';
        } else if (nearest.target.hasChest && !nearest.target.chestOpened) {
          hint.textContent = 'E - SANDIK AÇ';
        } else if (nearest.target.loot && nearest.target.loot.some(l => !l.taken)) {
          hint.textContent = 'E - LOOT TOPLA';
        } else {
          hint.textContent = 'E - BAK';
        }
        break;
      case 'campLoot':
        hint.textContent = nearest.target.isRare ? '✨ E - NADİR LOOT' : '📦 E - LOOT TOPLA';
        break;
      case 'campNPC':
        hint.textContent = 'Sağ Tık - KONUŞ';
        break;
      case 'specialAnimal':
        if (nearest.target.isBoss) {
          hint.textContent = `F - 👑 ${nearest.target.name} (${Math.round(nearest.target.hp)}/${nearest.target.maxHp})`;
        } else {
          hint.textContent = `F - 🐗 ${nearest.target.name} (${Math.round(nearest.target.hp)}/${nearest.target.maxHp})`;
        }
        break;
    }
  } else {
    hint.style.display = 'none';
  }
}

function interact() {
  if (typeof FishingSystem !== 'undefined' && FishingSystem.active) {
    FishingSystem.tryCatch();
    return;
  }

  if (game.buildMode) {
    BuildingSystem.place();
    return;
  }

  const nearest = findNearestInteractable();
  if (!nearest) {
    addMessage('❌ Yakında etkileşim yok');
    return;
  }

  const p = game.player;

  switch (nearest.type) {
    case 'campfire': {
      const cf = nearest.target;
      if (!cf.lit) {
        if (p.inventory.odun >= 3) {
          p.inventory.odun -= 3;
          cf.lit = true;
          cf.fuel = 60;
          addMessage('🔥 Ateş yakıldı!');
          if (audio && audio.fire) audio.fire();
          AchievementSystem.unlock('firstFire');
          updateUI();
        } else {
          showToast('3 odun gerekli!', 'warning');
        }
      } else {
        if (p.inventory.odun >= 1) {
          p.inventory.odun -= 1;
          cf.fuel += 30;
          addMessage('🔥 Ateşe odun eklendi');
          if (audio && audio.fire) audio.fire();
          updateUI();
        } else {
          showToast('Odun yok!', 'warning');
        }
      }
      break;
    }

    case 'object': {
      const obj = nearest.target;
      obj.collected = true;
      obj.shake = 1;

      const conv = {
        tree: ['odun', '🪵 Odun', 2],
        stone: ['tas', '🪨 Taş', 1],
        bush: ['cali', '🌿 Çalı', 1],
        bush_berry: ['cilek', '🍓 Çilek', 2],
        grass: ['yaprak', '🍃 Yaprak', 1],
        mushroom: ['mantar', '🍄 Mantar', 1],
        cilek: ['cilek', '🍓 Çilek', 1],
        berry: ['cilek', '🍓 Çilek', 1],
        flower: ['yaprak', '🌸 Çiçek', 1]
      };

      if (conv[obj.type]) {
        const [item, msg, baseAmount] = conv[obj.type];
        const amount = baseAmount + Math.floor(Math.random() * 2);
        p.inventory[item] = (p.inventory[item] || 0) + amount;
        addMessage(`${msg} x${amount}`);
        if (audio && audio.collect) audio.collect();

        if (obj.type === 'tree') {
          p.stats.treesCollected++;
          if (p.stats.treesCollected === 1) AchievementSystem.unlock('firstTree');
          if (p.inventory.odun >= 100) AchievementSystem.unlock('rich');
          if (p.inventory.odun >= 1000) AchievementSystem.unlock('rich2');
        }
        if (obj.type === 'stone' && p.stats.treesCollected > 0) {
          AchievementSystem.unlock('firstStone');
        }

        p.xp += 5;
        checkLevelUp();
      }
      updateUI();
      break;
    }

    case 'babyPet': {
      if (typeof PetSystem !== 'undefined') PetSystem.adopt(nearest.target);
      break;
    }

    case 'water': {
      if (typeof FishingSystem !== 'undefined') FishingSystem.startFishing(nearest.target);
      break;
    }

    case 'structure': {
      const structure = nearest.target;

      if (structure.npc && !structure.npc.dead) {
        showToast('💬 Konuşmak için NPC\'ye SAĞ TIKLA', 'info', 2500);
        break;
      }

      if (structure.hasChest && !structure.chestOpened) {
        StructureSystem.openChest(structure);
        break;
      }

      if (structure.loot && structure.loot.some(l => !l.taken)) {
        const untaken = structure.loot.findIndex(l => !l.taken);
        StructureSystem.takeLoot(structure, untaken);
        break;
      }

      addMessage(`🏠 ${structure.name} - boş`);
      break;
    }

    case 'campLoot': {
      if (typeof NPCCampSystem !== 'undefined') {
        NPCCampSystem.takeLoot(nearest.camp, nearest.lootIndex);
      }
      break;
    }

    case 'campNPC': {
      showToast('💬 Konuşmak için NPC\'ye SAĞ TIKLA', 'info', 2500);
      break;
    }

    case 'specialAnimal': {
      showToast('⚔️ Saldırmak için F bas', 'info', 2000);
      break;
    }
  }
}

/* ==================== SALDIRI ==================== */
function attack() {
  const p = game.player;
  if (p.attackCooldown > 0) return;

  p.attackCooldown = 0.4;
  p.animation.attack = 0.3;
  if (audio && audio.attack) audio.attack();

  let target = null;
  let minDist = 85;

  game.animals.forEach(a => {
    const d = Math.hypot(p.x - a.x, p.y - a.y);
    if (d < minDist) { minDist = d; target = { type: 'animal', entity: a }; }
  });

  game.enemies.forEach(e => {
    const d = Math.hypot(p.x - e.x, p.y - e.y);
    if (d < minDist) { minDist = d; target = { type: 'enemy', entity: e }; }
  });

  if (typeof StructureSystem !== 'undefined') {
    StructureSystem.structures.forEach(s => {
      if (s.enemy && s.enemy.hp > 0) {
        const d = Math.hypot(p.x - s.enemy.x, p.y - s.enemy.y);
        if (d < minDist) { minDist = d; target = { type: 'structEnemy', entity: s.enemy, structure: s }; }
      }
      if (s.npc && !s.npc.dead && (s.npc.type === 'hostile')) {
        const d = Math.hypot(p.x - s.npc.x, p.y - s.npc.y);
        if (d < minDist) { minDist = d; target = { type: 'hostileNPC', entity: s.npc, structure: s }; }
      }
    });
  }

  if (typeof AnimalSystemV2 !== 'undefined') {
    AnimalSystemV2.specialAnimals.forEach(animal => {
      const d = Math.hypot(p.x - animal.x, p.y - animal.y);
      if (d < minDist) { minDist = d; target = { type: 'specialAnimal', entity: animal }; }
    });
  }

  if (typeof NPCCampSystem !== 'undefined') {
    NPCCampSystem.camps.forEach(camp => {
      camp.npcs.forEach(npc => {
        if (npc.dead) return;
        if (npc.type !== 'hostile' && npc.type !== 'ghost') return;
        const d = Math.hypot(p.x - npc.x, p.y - npc.y);
        if (d < minDist) { minDist = d; target = { type: 'campNPC', entity: npc, camp }; }
      });
    });
  }

  if (!target) {
    addMessage('⚔️ Boşa vurdun');
    return;
  }

  let damage = p.equipped === 'sword' ? 3 : p.equipped === 'axe' ? 2 : 1;
  if (p.attackBonus) damage += p.attackBonus;

  target.entity.hp -= damage;
  if (audio && audio.hit) audio.hit();

  if (game.settings.particlesEnabled && game.settings.bloodEnabled) {
    for (let i = 0; i < 8; i++) {
      game.particles.push({
        x: target.entity.x,
        y: target.entity.y - 10,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3,
        life: 0.8,
        color: '255,50,50',
        size: 3
      });
    }
  }

  if (game.settings.shakeEnabled) game.camera.shake = 5;

  if (target.entity.hp <= 0) {
    if (target.type === 'animal') {
      p.inventory.cig_et = (p.inventory.cig_et || 0) + (target.entity.food || 1);
      addMessage(`🥩 ${target.entity.type} avlandı!`);
      const idx = game.animals.indexOf(target.entity);
      if (idx > -1) game.animals.splice(idx, 1);
      p.xp += target.entity.xp || 15;
      p.stats.kills++;
      if (p.stats.kills === 1) AchievementSystem.unlock('firstKill');
      if (p.stats.kills >= 10) AchievementSystem.unlock('kill10');
      if (p.stats.kills >= 50) AchievementSystem.unlock('kill50');
      if (p.stats.kills >= 100) AchievementSystem.unlock('kill100');
    } else if (target.type === 'enemy') {
      addMessage('👹 Yaratık öldürüldü!');
      const idx = game.enemies.indexOf(target.entity);
      if (idx > -1) game.enemies.splice(idx, 1);
      p.xp += 25;
      p.stats.monstersKilled++;
      if (p.stats.monstersKilled >= 10) AchievementSystem.unlock('nightHunter');
    } else if (target.type === 'structEnemy') {
      addMessage('👹 Yapı yaratığı öldürüldü!');
      target.structure.enemy = null;
      p.xp += 30;
    } else if (target.type === 'hostileNPC') {
      addMessage('💀 Haydut öldürüldü!');
      target.structure.npc.dead = true;
      target.structure.npc = null;
      p.xp += 40;
    } else if (target.type === 'campNPC') {
      addMessage(`💀 ${target.entity.type === 'hostile' ? 'Haydut' : 'Hayalet'} öldürüldü!`);
      target.entity.dead = true;
      p.xp += 35;
    } else if (target.type === 'specialAnimal') {
      if (typeof AnimalSystemV2 !== 'undefined') AnimalSystemV2.onKill(target.entity);
    }
    checkLevelUp();
    updateUI();
  } else {
    addMessage(`⚔️ ${damage} hasar!`);
  }
}

/* ==================== YEME ==================== */
function useQuickFood() {
  const p = game.player;
  const foods = ['pismis_et', 'pismis_balik', 'cig_et', 'elma', 'cilek', 'mantar', 'havuc', 'patates', 'bugday'];

  for (const f of foods) {
    if (p.inventory[f] > 0) {
      InventorySystem.useFood(f);
      return;
    }
  }
  showToast('Yiyecek yok!', 'warning');
}

/* ==================== LEVEL ==================== */
function checkLevelUp() {
  const p = game.player;
  const needed = p.level * 100;
  if (p.xp >= needed) {
    p.xp -= needed;
    p.level++;
    p.maxHealth += 10;
    p.health = p.maxHealth;
    p.maxStamina += 10;
    addMessage(`🎉 Seviye atladın! Lv.${p.level}`);
    if (audio && audio.levelUp) audio.levelUp();
    if (p.level >= 5) AchievementSystem.unlock('level5');
    if (p.level >= 10) AchievementSystem.unlock('level10');
    if (p.level >= 25) AchievementSystem.unlock('level25');
    if (p.level >= 50) AchievementSystem.unlock('level50');
  }
}

/* ==================== HASAR ==================== */
function damagePlayer(amount, reason = '') {
  game.player.health = Math.max(0, game.player.health - amount);
  if (game.settings.shakeEnabled) game.camera.shake = 8;
  if (audio && audio.hurt) audio.hurt();

  const overlay = $('damageOverlay');
  if (overlay) {
    overlay.classList.add('active');
    setTimeout(() => overlay.classList.remove('active'), 200);
  }

  if (game.player.health <= 0) die(reason);
}

function die(reason) {
  game.state = State.DEAD;
  if (audio && audio.death) audio.death();

  const ds = $('deathScreen');
  if (ds) ds.classList.add('show');

  const dr = $('deathReason');
  if (dr) dr.textContent = reason ? `${reason} yüzünden hayatını kaybettin` : 'Hayatını kaybettin';

  if (game.settings.autoSave) SaveSystem.save();
}

/* ==================== KAMERA ==================== */
function updateCamera(dt) {
  const targetX = game.player.x - W / 2;
  const targetY = game.player.y - H / 2;
  game.camera.x += (targetX - game.camera.x) * Math.min(1, dt * 8);
  game.camera.y += (targetY - game.camera.y) * Math.min(1, dt * 8);

  if (game.settings.shakeEnabled && game.camera.shake > 0) {
    game.camera.x += (Math.random() - 0.5) * game.camera.shake;
    game.camera.y += (Math.random() - 0.5) * game.camera.shake;
    game.camera.shake *= 0.9;
    if (game.camera.shake < 0.1) game.camera.shake = 0;
  }
}

/* ==================== OYUNCU GÜNCELLE ==================== */
function updatePlayer(dt) {
  const p = game.player;
  let speed = p.speed;
  if (p.isRunning && p.stamina > 0) speed *= 1.6;
  if (p.temperature < 0.3) speed *= 0.8;

  if (typeof FishingSystem !== 'undefined' && FishingSystem.active) {
    p.animation.walking = false;
    return;
  }

  let dx = 0, dy = 0;

  if (Input.keys['w'] || Input.keys['arrowup']) dy -= 1;
  if (Input.keys['s'] || Input.keys['arrowdown']) dy += 1;
  if (Input.keys['a'] || Input.keys['arrowleft']) dx -= 1;
  if (Input.keys['d'] || Input.keys['arrowright']) dx += 1;

  if (Input.joystick.active) {
    dx += Input.joystick.dx;
    dy += Input.joystick.dy;
  }

  const mag = Math.hypot(dx, dy);
  if (mag > 0) {
    dx /= mag;
    dy /= mag;

    const moveX = dx * speed * dt * 60;
    const moveY = dy * speed * dt * 60;

    p.x += moveX;
    p.y += moveY;
    p.animation.walking = true;
    if (Math.abs(dx) > 0.1) p.facing = dx > 0 ? 1 : -1;

    p.animation.time += dt;
    if (p.animation.time > 0.15) {
      p.animation.frame = (p.animation.frame + 1) % 4;
      p.animation.time = 0;
    }

    p.stats.distanceTraveled += Math.abs(moveX) + Math.abs(moveY);
    if (p.stats.distanceTraveled >= 5000) AchievementSystem.unlock('explorer');
  } else {
    p.animation.walking = false;
  }

  p.x = clamp(p.x, 0, WORLD_SIZE);
  p.y = clamp(p.y, 0, WORLD_SIZE);
}

/* ==================== HAYVAN GÜNCELLE ==================== */
function updateAnimals(dt) {
  const p = game.player;

  for (let i = game.animals.length - 1; i >= 0; i--) {
    const animal = game.animals[i];
    const dist = Math.hypot(animal.x - p.x, animal.y - p.y);

    if (dist > 3000) { game.animals.splice(i, 1); continue; }

    animal.stateTime -= dt;

    if (dist < 150 && animal.stateTime <= 0 && !animal.hostile) {
      animal.state = 'flee';
      animal.stateTime = 1.5;
      animal.targetX = animal.x + (animal.x - p.x) * 2;
      animal.targetY = animal.y + (animal.y - p.y) * 2;
    }

    if (animal.stateTime <= 0) {
      if (animal.state === 'idle') {
        animal.state = 'walk';
        animal.stateTime = 2 + Math.random() * 3;
        animal.targetX = animal.x + (Math.random() - 0.5) * 400;
        animal.targetY = animal.y + (Math.random() - 0.5) * 400;
      } else {
        animal.state = 'idle';
        animal.stateTime = 1 + Math.random() * 2;
      }
    }

    if (animal.state === 'walk' || animal.state === 'flee') {
      const dx = animal.targetX - animal.x;
      const dy = animal.targetY - animal.y;
      const d = Math.hypot(dx, dy);
      const speed = animal.state === 'flee' ? animal.speed * 2 : animal.speed;

      if (d > 5) {
        animal.x += (dx / d) * speed;
        animal.y += (dy / d) * speed;
        animal.facing = dx > 0 ? 1 : -1;
        animal.animation.walking = true;
      } else {
        animal.state = 'idle';
        animal.animation.walking = false;
      }
    } else {
      animal.animation.walking = false;
    }

    animal.x = clamp(animal.x, 0, WORLD_SIZE);
    animal.y = clamp(animal.y, 0, WORLD_SIZE);

    animal.animation.time += dt;
    if (animal.animation.walking && animal.animation.time > 0.18) {
      animal.animation.frame = (animal.animation.frame + 1) % 4;
      animal.animation.time = 0;
    }
  }

  if (game.animals.length < 50 && Math.random() < 0.005) spawnAnimal();
}

/* ==================== YAVRU EVCİL GÜNCELLE ==================== */
function updateBabyPets(dt) {
  if (!game.babyPets) return;
  const p = game.player;

  for (let i = game.babyPets.length - 1; i >= 0; i--) {
    const baby = game.babyPets[i];
    if (baby.adopted) continue;

    const dist = Math.hypot(baby.x - p.x, baby.y - p.y);
    if (dist > 3000) { game.babyPets.splice(i, 1); continue; }

    baby.stateTime -= dt;
    if (baby.stateTime <= 0) {
      baby.state = 'walk';
      baby.stateTime = 2 + Math.random() * 2;
      baby.targetX = baby.x + (Math.random() - 0.5) * 200;
      baby.targetY = baby.y + (Math.random() - 0.5) * 200;
    }

    if (baby.state === 'walk') {
      const dx = baby.targetX - baby.x;
      const dy = baby.targetY - baby.y;
      const d = Math.hypot(dx, dy);
      if (d > 5) {
        baby.x += (dx / d) * 0.8;
        baby.y += (dy / d) * 0.8;
        baby.facing = dx > 0 ? 1 : -1;
        baby.animation.walking = true;
      } else {
        baby.state = 'idle';
        baby.animation.walking = false;
      }
    }

    baby.animation.time += dt;
    if (baby.animation.walking && baby.animation.time > 0.2) {
      baby.animation.frame = (baby.animation.frame + 1) % 4;
      baby.animation.time = 0;
    }
  }

  if (game.babyPets.filter(b => !b.adopted).length < 8 && Math.random() < 0.002) spawnBabyPet();
}

/* ==================== YARATIK GÜNCELLE ==================== */
function updateEnemies(dt) {
  const p = game.player;

  for (let i = game.enemies.length - 1; i >= 0; i--) {
    const enemy = game.enemies[i];
    const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);

    enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);

    if (dist < 500) {
      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      const d = Math.hypot(dx, dy);

      if (d > 25) {
        enemy.x += (dx / d) * enemy.speed;
        enemy.y += (dy / d) * enemy.speed;
        enemy.facing = dx > 0 ? 1 : -1;
      }

      if (d < 30 && enemy.attackCooldown <= 0) {
        damagePlayer(enemy.damage, 'Yaratık saldırısı');
        enemy.attackCooldown = 1.5;
      }
    } else {
      enemy.stateTime -= dt;
      if (enemy.stateTime <= 0) {
        enemy.stateTime = 2 + Math.random() * 3;
        const angle = Math.random() * Math.PI * 2;
        enemy.x += Math.cos(angle) * 100;
        enemy.y += Math.sin(angle) * 100;
      }
    }

    if (dist > 2500) { game.enemies.splice(i, 1); continue; }

    enemy.animation.time += dt;
    if (enemy.animation.time > 0.15) {
      enemy.animation.frame = (enemy.animation.frame + 1) % 4;
      enemy.animation.time = 0;
    }
  }

  if (!game.world.isDay && game.enemies.length < 6 && Math.random() < 0.008) spawnNightEnemy();
}

/* ==================== PARTİKÜLLER ==================== */
function updateParticles(dt) {
  if (!game.settings.particlesEnabled) {
    game.particles = [];
    return;
  }

  game.particles = game.particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.life -= dt * 1.5;
    return p.life > 0;
  });
}

/* ==================== DÜNYA DÖNGÜSÜ ==================== */
let worldInterval = null;
let autoSaveInterval = null;

function worldCycle() {
  if (game.state !== State.PLAYING) return;

  const w = game.world;
  const p = game.player;

  const daySpeed = game.settings.timeSpeed === 'slow' ? 0.05 :
                   game.settings.timeSpeed === 'fast' ? 0.15 : 0.08;
  w.time += daySpeed;

  if (w.time >= 24) {
    w.time = 0;
    w.day++;
    addMessage(`☀️ Gün ${w.day} başladı!`);
  }

  const wasDay = w.isDay;
  w.isDay = w.time >= 6 && w.time < 20;

  if (wasDay && !w.isDay) {
    addMessage('🌙 Gece çöktü...');
    for (let i = 0; i < 3; i++) spawnNightEnemy();
  }
  if (!wasDay && w.isDay) {
    addMessage('☀️ Gün doğdu!');
    game.enemies = [];
    p.stats.nightsSurvived++;
    if (p.stats.nightsSurvived === 1) AchievementSystem.unlock('surviveNight');
    if (p.stats.nightsSurvived >= 7) AchievementSystem.unlock('survive7Days');
    if (p.stats.nightsSurvived >= 30) AchievementSystem.unlock('survive30Days');
  }

  if (w.campfire.lit) {
    w.campfire.fuel -= 1;
    if (w.campfire.fuel <= 0) {
      w.campfire.lit = false;
      addMessage('🔥 Ateş söndü!');
    }
  }

  p.hunger = Math.max(0, p.hunger - (p.isRunning ? 0.6 : 0.3));
  p.thirst = Math.max(0, p.thirst - (p.isRunning ? 0.7 : 0.4));

  if (p.isRunning && p.stamina > 0) {
    p.stamina = Math.max(0, p.stamina - 3);
  } else if (!p.isRunning && p.stamina < p.maxStamina) {
    p.stamina = Math.min(p.maxStamina, p.stamina + 1.5);
  }

  if (p.hunger < 10 || p.thirst < 10) {
    damagePlayer(2, 'Açlık/Susuzluk');
  } else if (p.hunger > 50 && p.thirst > 50 && p.health < p.maxHealth) {
    p.health = Math.min(p.maxHealth, p.health + 0.5);
  }

  if (w.campfire.lit && Math.hypot(p.x - w.campfire.x, p.y - w.campfire.y) < 150) {
    p.health = Math.min(p.maxHealth, p.health + 1.5);
  }

  updateUI();
  AchievementSystem.checkStats();
}

console.log('✅ main/gameplay.js yüklendi');