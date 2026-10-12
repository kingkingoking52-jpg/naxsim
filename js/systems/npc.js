/* ==========================================
   ORION FOREST v6.1 - NPC DIALOG SYSTEM
   Sağ tıkla + hazır yanıtlar + ilişki sistemi
   ========================================== */

'use strict';

const NPCDialog = {
  currentNPC: null,
  currentStructure: null,
  relationships: {},  // { npcId: score (-10 to +10) }
  dialogueHistory: [], // Son diyaloglar

  /* ==================== BAŞLATMA ==================== */
  init() {
    // Sağ tıkla algılama
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.handleRightClick(e);
      });
    }

    // Kaydedilmiş ilişkileri yükle
    try {
      const saved = localStorage.getItem('orion_npc_relations');
      if (saved) this.relationships = JSON.parse(saved);
    } catch (e) { /* geç */ }

    console.log('👥 NPC Dialog sistemi başlatıldı');
  },

  /* ==================== SAĞ TIK ==================== */
  handleRightClick(e) {
    if (game.state !== 'playing') return;

    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Ekran koordinatı → dünya koordinatı
    const worldX = mouseX + game.camera.x;
    const worldY = mouseY + game.camera.y;

    // Yapılardaki NPC'leri kontrol et
    if (typeof StructureSystem !== 'undefined') {
      let found = null;
      let minDist = 50;

      StructureSystem.structures.forEach(s => {
        if (!s.npc || s.npc.dead) return;
        const dist = Math.hypot(s.npc.x - worldX, s.npc.y - worldY);
        if (dist < minDist) {
          minDist = dist;
          found = { npc: s.npc, structure: s };
        }
      });

      if (found) {
        const playerDist = Math.hypot(found.npc.x - game.player.x, found.npc.y - game.player.y);
        if (playerDist > 200) {
          showToast('NPC çok uzak! Yaklaş!', 'warning');
          return;
        }
        this.open(found.npc, found.structure);
        return;
      }
    }

    // Yakın NPC yok
    showToast('Burada konuşacak kimse yok', 'info');
  },

  /* ==================== NPC AÇ ==================== */
  open(npc, structure) {
    this.currentNPC = npc;
    this.currentStructure = structure;

    const npcId = this.getNPCId(npc);
    const rel = this.relationships[npcId] || 0;
    const greeting = this.getGreeting(npc.type, rel);
    const responses = this.getInitialResponses(npc.type, rel);

    this.renderDialog(greeting, responses);
    if (audio && audio.click) audio.click();
  },

  getNPCId(npc) {
    return `${npc.type}_${Math.round(npc.x)}_${Math.round(npc.y)}`;
  },

  /* ==================== KARŞILAMA ==================== */
  getGreeting(type, rel) {
    const greetings = {
      friendly: {
        high: ['Selam dostum! Seni görmek ne güzel!', 'Hoş geldin! Senin için her zaman yer var.'],
        normal: [
          'Merhaba gezgin!',
          'Hoş geldin yolcu. Yorgun görünüyorsun.',
          'Selam! Bu ormanda kimse uğramıyor artık...',
          'Merhaba! Uzun zamandır yalnız kaldım.',
          'Günaydın! Ya da akşam... Zaman burada karışıyor.'
        ],
        low: ['Sen yine mi geldin?', 'Ne istiyorsun?', 'Yüzünü gösterme bana.']
      },
      trader: {
        high: ['Merhaba ortağım! Yine iş yapalım mı?', 'Hoş geldin dostum! Sana özel indirim var.'],
        normal: [
          'Hoş geldin! Alışveriş yapmak ister misin?',
          'Selam! Buraya mal getirdim, bakmak ister misin?',
          'Merhaba! Ucuz mal, sağlam mal!',
          'Hey sen! Para var mı para?'
        ],
        low: ['Seni görmek istemiyorum.', 'Alışveriş yapmıyorum senden!']
      },
      witch: {
        high: ['Kaderin parlıyor, sevgili dostum.', 'Seni bekliyordum, ruhun güçlü.'],
        normal: [
          'Hmm... Kaderin ilginç, gezgin.',
          'Seni bekliyordum... Ya da beklediğimi sanmıştım.',
          'Ruhun güçlü. Onu hissediyorum.',
          'Karanlıkta bile yolunu bulabilirsin, sen.',
          'Yaklaş... Sana bir şey söylemem lazım.'
        ],
        low: ['Defol! Ruhun kirlenmiş.', 'Sen bir tehditsin, uzak dur.']
      },
      hostile: {
        high: ['Eh... Seni sevmiyorum ama saygı duyuyorum.', 'Yine geldin. Peki, ne istiyorsun?'],
        normal: [
          'Bu bölge benim! Ne işin var?',
          'Defol buradan!',
          'Yaklaşma yoksa canını yakarım!',
          'Kimsin sen? Buraya nasıl geldin?'
        ],
        low: ['Seni öldüreceğim!', 'Son günün bu!']
      }
    };

    let group;
    if (rel >= 5) group = 'high';
    else if (rel <= -3) group = 'low';
    else group = 'normal';

    const pool = greetings[type]?.[group] || greetings.friendly.normal;
    return pickRandom(pool);
  },

  /* ==================== İLK YANITLAR ==================== */
  getInitialResponses(type, rel) {
    const pools = {
      friendly: [
        { id: 'greet',  text: '👋 Merhaba, ben de seni görmekten mutluyum.', next: 'friendly_greet' },
        { id: 'land',   text: '❓ Bu ormanda neler oluyor?',                 next: 'friendly_land' },
        { id: 'help',   text: '🤝 Sana nasıl yardım edebilirim?',           next: 'friendly_help' },
        { id: 'bye',    text: '👋 İyi günler, hoşça kal.',                   next: 'friendly_bye' }
      ],
      trader: [
        { id: 'trade',  text: '💰 Alışveriş yapmak istiyorum.',              next: 'trader_trade' },
        { id: 'goods',  text: '📦 Neler satıyorsun?',                        next: 'trader_goods' },
        { id: 'best',   text: '⭐ En değerli eşyan nedir?',                  next: 'trader_best' },
        { id: 'bye',    text: '👋 Belki başka zaman.',                       next: 'trader_bye' }
      ],
      witch: [
        { id: 'bless',    text: '🔮 Bana iyi şans ver.',                     next: 'witch_bless' },
        { id: 'who',      text: '❓ Sen kimsin?',                            next: 'witch_who' },
        { id: 'prophecy', text: '🌟 Geleceğimi göster.',                     next: 'witch_prophecy' },
        { id: 'bye',      text: '👋 Gitmem gerek.',                          next: 'witch_bye' }
      ],
      hostile: [
        { id: 'peace',     text: '🕊️ Barış içinde geldim, sorun istemiyorum.', next: 'hostile_peace' },
        { id: 'challenge', text: '⚔️ Bana bulaşma, yoksa pişman olursun!',     next: 'hostile_challenge' },
        { id: 'bribe',     text: '💰 Sana eşya vereyim, beni bırak.',          next: 'hostile_bribe' },
        { id: 'flee',      text: '🏃 Hemen gidiyorum, kavga istemem.',         next: 'hostile_flee' }
      ]
    };

    let pool = [...(pools[type] || pools.friendly)];

    // Yüksek ilişki ekstra seçenek
    if (rel >= 5 && type === 'friendly') {
      pool[3] = { id: 'gift', text: '🎁 Bana bir şey verir misin?', next: 'friendly_gift' };
    }
    if (rel >= 5 && type === 'trader') {
      pool[3] = { id: 'discount', text: '💰 İndirim yapar mısın?', next: 'trader_discount' };
    }

    return pool;
  },

  /* ==================== DİYALOG RENDER ==================== */
  renderDialog(npcMessage, responses) {
    const content = document.getElementById('npcDialogContent');
    if (!content) return;

    const npc = this.currentNPC;
    if (!npc) return;

    const npcId = this.getNPCId(npc);
    const rel = this.relationships[npcId] || 0;

    // NPC bilgileri
    let npcName = 'Köylü';
    let npcIcon = '👤';
    let npcColor = '#4cc9f0';

    if (npc.type === 'trader') { npcName = 'Tüccar';  npcIcon = '💰'; npcColor = '#ffd700'; }
    else if (npc.type === 'witch') { npcName = 'Cadı'; npcIcon = '🧙'; npcColor = '#a29bfe'; }
    else if (npc.type === 'hostile') { npcName = 'Haydut'; npcIcon = '👹'; npcColor = '#ff0844'; }

    // İlişki etiketi
    let relText = '😐 Nötr';
    if (rel >= 7) relText = '❤️ Çok Dost';
    else if (rel >= 4) relText = '😊 Samimi';
    else if (rel >= 1) relText = '🙂 İyi';
    else if (rel <= -7) relText = '💀 Düşman';
    else if (rel <= -4) relText = '💢 Kızgın';
    else if (rel <= -1) relText = '😠 Gergin';

    content.innerHTML = `
      <div class="npc-header" style="border-bottom-color:${npcColor}">
        <div class="npc-avatar" style="background:linear-gradient(135deg, ${npcColor}, ${npcColor}dd)">
          ${npcIcon}
        </div>
        <div class="npc-info">
          <div class="npc-name">${npcName}</div>
          <div class="npc-rel">${relText} <span class="npc-rel-score">(${rel})</span></div>
        </div>
      </div>
      <div class="npc-message">
        <div class="npc-message-text">"${npcMessage}"</div>
      </div>
      <div class="npc-responses" id="npcResponses"></div>
    `;

    const respBox = document.getElementById('npcResponses');
    responses.forEach((r, i) => {
      const btn = document.createElement('button');
      btn.className = 'npc-response-btn';
      btn.innerHTML = `<span class="npc-resp-num">${i + 1}</span> ${r.text}`;
      btn.onclick = () => this.chooseResponse(r);
      respBox.appendChild(btn);
    });

    openModal('npcDialogModal');
  },

  /* ==================== YANIT SEÇ ==================== */
  chooseResponse(response) {
    if (!response) return;
    if (audio && audio.click) audio.click();

    // Kapat
    if (response.next === 'close') {
      this.close();
      return;
    }

    // Savaş başlat
    if (response.next === 'fight') {
      this.startFight();
      return;
    }

    // İlişki puanı ekle
    const npcId = this.getNPCId(this.currentNPC);
    if (!this.relationships[npcId]) this.relationships[npcId] = 0;

    const relationChanges = {
      friendly_greet: +1,
      friendly_land: +1,
      friendly_help: +2,
      friendly_bye: 0,
      friendly_gift: +3,
      trader_trade: +1,
      trader_goods: +1,
      trader_best: +1,
      trader_bye: 0,
      trader_discount: +2,
      witch_bless: 0,
      witch_who: +1,
      witch_prophecy: +1,
      witch_bye: 0,
      hostile_peace: +2,
      hostile_challenge: -3,
      hostile_bribe: +1,
      hostile_flee: -1,
      trade_axe: +1,
      trade_sword: +1,
      trade_food: +1
    };

    const delta = relationChanges[response.next] || 0;
    this.relationships[npcId] = Math.max(-10, Math.min(10, this.relationships[npcId] + delta));
    this.saveRelationships();

    // Aksiyonları tetikle
    const handled = this.handleAction(response.next);
    if (handled === 'closed') return;

    // NPC cevabı al
    const reply = this.getNPCReply(response.next);

    // Yeni yanıtlar
    const newResponses = this.getNextResponses(response.next, this.relationships[npcId]);

    // Ekranı güncelle
    this.renderDialog(reply, newResponses);
  },

  /* ==================== NPC CEVABI ==================== */
  getNPCReply(nextId) {
    const replies = {
      // Dost
      friendly_greet: [
        'Ne demek, her zaman! Sen iyi birisin.',
        'Seninle konuşmak güzel. Uzun zamandır kimse gelmiyor.',
        'Rica ederim dostum!'
      ],
      friendly_land: [
        'Orman değişti... Vahşi yaratıklar çoğaldı. Gece dışarı çıkma!',
        'Eskiden huzurlu bir yerdi. Şimdi tehlikelerle dolu.',
        'Ateş yak, kampını sağlam kur. Yoksa hayatta kalamazsın.'
      ],
      friendly_help: [
        'Odun toplamama yardım eder misin? 10 odun karşılığı sana yemek veririm.',
        'Bir iyilik isteyeceğim: 8 taş getir, sana kılıç yapayım.',
        '5 et getir, karşılığında altın vereyim.'
      ],
      friendly_bye: [
        'Hoşça kal gezgin! Yolun açık olsun.',
        'İyi şanslar! Dikkatli ol.',
        'Güle güle! Tekrar gel, çayımı içersin.'
      ],
      friendly_gift: [
        'Al bu senin! Sen iyi birisin, bunu hak ettin.',
        'Sana küçük bir hediye... Umarım işine yarar.',
        'Al, ihtiyacın olabilir. Kendine iyi bak!'
      ],

      // Tüccar
      trader_trade: [
        'İşte mallarım! Cebindekini göster, sana uygun bir şey bulurum.',
        'Hadi bakalım! Ne lazımsa söyle.',
        'Al kardeşim, ucuz, sağlam, güvenilir!'
      ],
      trader_goods: [
        'Balta, kılıç, yemek, ip... Her şeyim var!',
        'Silah, yiyecek, alet. Ne ararsan bende!',
        'Özel mal geldi bu hafta, bakmak ister misin?'
      ],
      trader_best: [
        'Kılıçlarım meşhur! Bir tanesi sana çok yakışır.',
        'En değerli malım demir baltalar. Efsanevi!',
        'Altın işlemeli kılıçlarım var, tam bir servet.'
      ],
      trader_bye: [
        'Kapım her zaman açık! İyi yolculuklar.',
        'Yine beklerim! Paranı hazır tut.',
        'Görüşürüz! Kârlı alışverişler.'
      ],
      trader_discount: [
        'Senin için %20 indirim yaptım! Ama kimseye söyleme.',
        'Tamam tamam, eski dostuz. İndirim uyguladım.',
        'Bugün güzel günümdeyim. Sana özel fiyat!'
      ],

      // Cadı
      witch_bless: [
        'Sihrimi işittim... Kaderin artık farklı.',
        'İşte sana bir kutsama. Umarım hak ediyorsun.',
        'Büyü yerleşti. Sonuçları bekleyeceğiz.'
      ],
      witch_who: [
        'Ben eskilerden biriyim. Yüzyıllar boyu bu ormanda yaşadım.',
        'Adımı sorma. Sadece bil ki ben hep buradaydım.',
        'Sen sormadan önce ben seni tanıyordum, gezgin.'
      ],
      witch_prophecy: [
        'Karanlık günler yakın... Ama ışık seninle.',
        'Gördüğüm şey: kaderin ikiye bölünmüş. Seçim senin.',
        'Yıldızlar fısıldıyor... Değişim geliyor.'
      ],
      witch_bye: [
        'Kader seni bekler. Git.',
        'Yolun uzun, ama kalbin güçlü. Hoşça kal.',
        'Gölgeler seni izliyor... Dikkatli ol.'
      ],

      // Haydut
      hostile_peace: [
        'Hmph... Bu sefer şanslısın. Defol!',
        'Barış mı? Tamam ama bir daha gelme.',
        'Peki... Ama gözüm üzerinde.'
      ],
      hostile_challenge: [
        'Cesur öleceksin!',
        'Yanlış kişiye bulaştın!',
        'Kanını göreceğim!'
      ],
      hostile_bribe: [
        'Eşya mı? Tamam... Bu sefer geç. Ama bir daha görmeyeyim seni!',
        'Hmm, işe yarar. Kaybol şimdi!',
        'İyi teklif. Seni bırakıyorum. Bu sefer.'
      ],
      hostile_flee: [
        'Kaç, korkak!',
        'İyi ki kaçtın, yoksa ölürdün!',
        'Bir daha görmeyeyim seni!'
      ],
      hostile_fight_start: [
        'Hazır ol, öleceksin!'
      ],

      // Ticaret
      trade_axe: ['Balta senin oldu. Güle güle kullan!', 'İşte baltan, sağlamdır.'],
      trade_sword: ['Kılıç elinde, keskin olsun!', 'İyi bir seçim yaptın.'],
      trade_food: ['Afiyet olsun!', 'Yemek taze, ye gitsin.']
    };

    const pool = replies[nextId];
    if (!pool || pool.length === 0) return '...';
    return pickRandom(pool);
  },

  /* ==================== SONRAKİ YANITLAR ==================== */
  getNextResponses(prevId, rel) {
    // Veda veya kapat
    if (prevId.includes('bye') || prevId.includes('flee')) {
      return [{ id: 'close', text: '🚪 Görüşürüz', next: 'close' }];
    }

    // Savaş
    if (prevId === 'hostile_challenge') {
      return [
        { id: 'fight',     text: '⚔️ Savaş başlasın!',         next: 'fight' },
        { id: 'apologize', text: '😔 Özür dilerim, yanlış anladım.', next: 'hostile_peace' },
        { id: 'flee',      text: '🏃 Kaç!',                     next: 'close' }
      ];
    }

    // Ticaret menüsü
    if (prevId === 'trader_trade') {
      return [
        { id: 'buy_axe',   text: '🪓 Balta al (5 odun)',        next: 'trade_axe' },
        { id: 'buy_sword', text: '🗡️ Kılıç al (10 taş)',       next: 'trade_sword' },
        { id: 'buy_food',  text: '🍖 Pişmiş et al (2 çiğ et)',  next: 'trade_food' },
        { id: 'back',      text: '🔙 Geri',                     next: 'trader_bye' }
      ];
    }

    // İndirim
    if (prevId === 'trader_discount') {
      return [
        { id: 'buy_axe',   text: '🪓 Balta al (3 odun)',        next: 'trade_axe' },
        { id: 'buy_sword', text: '🗡️ Kılıç al (7 taş)',        next: 'trade_sword' },
        { id: 'buy_food',  text: '🍖 Pişmiş et al (1 çiğ et)',  next: 'trade_food' },
        { id: 'back',      text: '🔙 Geri',                     next: 'trader_bye' }
      ];
    }

    // Hediye alındı
    if (prevId === 'friendly_gift') {
      return [
        { id: 'thank',  text: '🙏 Çok teşekkürler!',  next: 'friendly_greet' },
        { id: 'bye',    text: '👋 Görüşürüz!',         next: 'friendly_bye' }
      ];
    }

    // Büyü yapıldı
    if (prevId === 'witch_bless') {
      return [
        { id: 'thanks', text: '🙏 Teşekkür ederim.',   next: 'witch_bye' },
        { id: 'more',   text: '🔮 Bir şey daha yap.', next: 'witch_prophecy' }
      ];
    }

    // Görev devam
    if (prevId === 'friendly_help') {
      return [
        { id: 'accept',  text: '✅ Görevi kabul ediyorum.', next: 'friendly_bye' },
        { id: 'decline', text: '❌ Şimdi olmaz.',            next: 'friendly_bye' }
      ];
    }

    // Varsayılan: ilk menüye dön
    return this.getInitialResponses(this.currentNPC.type, rel);
  },

  /* ==================== AKSİYONLAR ==================== */
  handleAction(actionId) {
    // Hediye
    if (actionId === 'friendly_gift') {
      const gifts = ['elma', 'pismis_et', 'ip', 'tas', 'cali'];
      const gift = pickRandom(gifts);
      const amount = randomInt(1, 3);
      game.player.inventory[gift] = (game.player.inventory[gift] || 0) + amount;
      addMessage(`🎁 Hediye aldın: ${ITEM_DATA[gift]?.icon || ''} ${gift} x${amount}`);
      if (audio && audio.success) audio.success();
      updateUI();
      return;
    }

    // Cadı büyüsü
    if (actionId === 'witch_bless') {
      const roll = Math.random();
      if (roll < 0.6) {
        game.player.health = game.player.maxHealth;
        addMessage('✨ Cadı seni iyileştirdi! Can ful!');
        if (audio && audio.success) audio.success();
      } else {
        const damage = randomInt(10, 25);
        game.player.health = Math.max(1, game.player.health - damage);
        addMessage(`💀 Cadı kötü büyü yaptı! -${damage} HP`);
        if (audio && audio.hurt) audio.hurt();
      }
      updateUI();
      return;
    }

    // Kehanet
    if (actionId === 'witch_prophecy') {
      const prophecies = [
        '🌙 Gece yakında, ateşini hazırla.',
        '⚔️ Kan dökülecek... Ama sen mi, düşmanın mı?',
        '🌲 Orman seni tanıyor. Dikkatli ol.',
        '💎 Yerde saklı hazineler var. Kaz!',
        '🐺 Kurtlar seni izliyor. Ama dost mu, düşman mı?'
      ];
      const p = pickRandom(prophecies);
      addMessage(p);
      return;
    }

    // Ticaret işlemleri
    if (actionId === 'trade_axe')   { this.trade('balta', { odun: 5 }); return; }
    if (actionId === 'trade_sword') { this.trade('kilic', { tas: 10 }); return; }
    if (actionId === 'trade_food')  { this.trade('pismis_et', { cig_et: 2 }); return; }

    return null;
  },

  trade(item, cost) {
    const inv = game.player.inventory;
    for (const [res, amt] of Object.entries(cost)) {
      if ((inv[res] || 0) < amt) {
        showToast(`Yetersiz: ${ITEM_DATA[res]?.name || res}`, 'error');
        return;
      }
    }
    for (const [res, amt] of Object.entries(cost)) inv[res] -= amt;
    inv[item] = (inv[item] || 0) + 1;
    addMessage(`✅ ${ITEM_DATA[item]?.icon || ''} ${ITEM_DATA[item]?.name || item} satın alındı!`);
    if (audio && audio.craft) audio.craft();
    updateUI();
  },

  /* ==================== SAVAŞ BAŞLAT ==================== */
  startFight() {
    const npc = this.currentNPC;
    if (!npc) { this.close(); return; }

    // NPC'yi düşmana çevir
    game.enemies.push({
      x: npc.x,
      y: npc.y,
      type: 'bandit',
      hp: 8,
      maxHp: 8,
      speed: 1.5,
      size: 15,
      damage: 5,
      color: '#dc143c',
      attackCooldown: 0,
      facing: 1,
      stateTime: 0,
      animation: { frame: 0, time: 0 },
      isNPC: true
    });

    if (this.currentStructure) {
      this.currentStructure.npc.dead = true;
      this.currentStructure.npc = null;
    }

    addMessage('⚔️ Haydut seninle savaşmak istiyor!');
    if (audio && audio.attack) audio.attack();
    this.close();
  },

  /* ==================== KAPAT ==================== */
  close() {
    closeModal('npcDialogModal');
    this.currentNPC = null;
    this.currentStructure = null;
  },

  /* ==================== KAYDET ==================== */
  saveRelationships() {
    try {
      localStorage.setItem('orion_npc_relations', JSON.stringify(this.relationships));
    } catch (e) { /* geç */ }
  },

  /* ==================== GÜNCELLE ==================== */
  update(dt) {
    // NPC'lerin küçük idle hareketi
    if (typeof StructureSystem !== 'undefined') {
      StructureSystem.structures.forEach(s => {
        if (s.npc && !s.npc.dead) {
          if (!s.npc.idleBase) s.npc.idleBase = s.npc.x;
          s.npc.x += Math.sin(Date.now() * 0.001 + s.npc.idleBase) * 0.02;
        }
      });
    }

    // Klavye 1-4 seçim
    // (keydown event zaten main.js'de var, burada ayrı bir handler ekleyelim)
  }
};

window.NPCDialog = NPCDialog;

// Klavye 1-4 kısayolu (diyalog açıkken)
window.addEventListener('keydown', (e) => {
  const modal = document.getElementById('npcDialogModal');
  if (!modal || !modal.classList.contains('show')) return;

  const key = e.key;
  if (key >= '1' && key <= '4') {
    const idx = parseInt(key) - 1;
    const btns = document.querySelectorAll('#npcResponses .npc-response-btn');
    if (btns[idx]) {
      e.preventDefault();
      btns[idx].click();
    }
  } else if (key === 'Escape') {
    e.preventDefault();
    NPCDialog.close();
  }
});

console.log('✅ npc.js yüklendi');