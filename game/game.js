// 基础引用
const introScreen = document.getElementById('intro-screen');
const bgm = document.getElementById('bgm');
let bgmPlayed = false;

// -------- State Store（极简） --------
const Store = (() => {
  const KEY = 'HTG_SAVE_V1';
  const defaultState = {
    phase: 'dream', // dream -> police-car -> dialogue -> investigation
    currentRoom: 'entrance',
    evidences: {}, // { evidenceId: true }
    flags: {},     // 通用开关
    interactions: {}, // 交互记录
    playerPosition: { x: 50, y: 50 }, // 玩家位置（百分比）
    discoveredClues: [], // 发现的线索列表
    inventory: [], // 道具栏：[{ id, name, description, icon, obtainedAt }]
    meta: { version: 1, createdAt: Date.now(), updatedAt: Date.now() }
  };

  let state = null;
  const subs = new Set();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) throw new Error('no save');
      const parsed = JSON.parse(raw);
      state = { ...defaultState, ...parsed, meta: { ...defaultState.meta, ...parsed.meta, updatedAt: Date.now() } };
    } catch {
      state = { ...defaultState };
    }
  }

  function save() {
    state.meta.updatedAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function getState() { return JSON.parse(JSON.stringify(state)); }

  function setState(patch) {
    state = { ...state, ...patch };
    save();
    subs.forEach(fn => fn(getState()));
  }

  function update(fn) {
    const next = fn(getState());
    setState(next);
  }

  function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }

  load();
  return { getState, setState, update, subscribe };
})();

// -------- 全局常量 --------
const ROOM_NAMES = {
  'entrance': '玄关',
  'living-room': '客厅', 
  'kitchen': '厨房',
  'study': '书房',
  'bedroom': '卧室',
  'balcony': '阳台',
  'bathroom': '卫生间'
};

// -------- 存档管理系统 --------
const SaveManager = (() => {
  const SAVE_SLOTS_KEY = 'HTG_SAVE_SLOTS_V1';
  const MAX_SAVE_SLOTS = 5;

  function getSaveSlots() {
    try {
      const raw = localStorage.getItem(SAVE_SLOTS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveToSlot(slotId, customName) {
    const currentState = Store.getState();
    const saveData = {
      id: slotId,
      name: customName || `存档${slotId.split('_')[1]}`,
      timestamp: new Date().toLocaleString('zh-CN'),
      roomName: ROOM_NAMES[currentState.currentRoom] || currentState.currentRoom,
      progress: getSaveProgress(currentState),
      gameState: currentState
    };
    
    const allSlots = getSaveSlots();
    allSlots[slotId] = saveData;
    
    try {
      localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(allSlots));
      showTip(`已保存到 ${saveData.name}`);
      return true;
    } catch (error) {
      showTip('保存失败：存储空间不足');
      return false;
    }
  }

  function loadFromSlot(slotId) {
    const allSlots = getSaveSlots();
    const saveData = allSlots[slotId];
    
    if (!saveData || !saveData.gameState) {
      showTip('存档不存在或已损坏');
      return false;
    }
    
    try {
      Store.setState(saveData.gameState);
      SceneManager.renderRoom(saveData.gameState.currentRoom);
      InventoryManager.updateInventoryDisplay();
      showTip(`已读取存档：${saveData.name}`);
      return true;
    } catch (error) {
      showTip('读取存档失败：数据损坏');
      return false;
    }
  }

  function deleteSlot(slotId) {
    const allSlots = getSaveSlots();
    const saveData = allSlots[slotId];
    
    if (!saveData) {
      showTip('存档不存在');
      return false;
    }
    
    if (confirm(`确定要删除存档"${saveData.name}"吗？此操作不可恢复。`)) {
      delete allSlots[slotId];
      localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(allSlots));
      showTip(`已删除存档：${saveData.name}`);
      return true;
    }
    return false;
  }

  function getSaveProgress(gameState) {
    const totalItems = 3; // 当前总道具数（血迹菜刀、保险单、撕碎信件）
    const collectedItems = gameState.inventory?.length || 0;
    const totalEvidence = Object.keys(gameState.evidences || {}).length;
    
    return `道具 ${collectedItems}/${totalItems} • 线索 ${totalEvidence}个`;
  }

  function getAllSlotData() {
    const allSlots = getSaveSlots();
    const result = [];
    
    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
      const slotId = `slot_${i}`;
      const saveData = allSlots[slotId];
      result.push({
        slotId,
        isEmpty: !saveData,
        data: saveData || null
      });
    }
    
    return result;
  }

  return {
    saveToSlot,
    loadFromSlot,
    deleteSlot,
    getAllSlotData,
    getSaveSlots
  };
})();

// -------- 全局UI工具：轻量提示 --------
// 供各模块调用，避免作用域问题
function showTip(text) {
  const tip = document.createElement('div');
  tip.textContent = text;
  tip.style.position = 'absolute';
  tip.style.left = '50%';
  tip.style.bottom = '120px';
  tip.style.transform = 'translateX(-50%)';
  tip.style.padding = '8px 12px';
  tip.style.background = 'rgba(0,0,0,0.7)';
  tip.style.color = '#fff';
  tip.style.borderRadius = '8px';
  tip.style.fontSize = '14px';
  tip.style.zIndex = '200';
  tip.style.opacity = '0';
  tip.style.transition = 'opacity .2s, transform .2s';
  document.body.appendChild(tip);
  requestAnimationFrame(() => {
    tip.style.opacity = '1';
    tip.style.transform = 'translate(-50%, -6px)';
  });
  setTimeout(() => {
    tip.style.opacity = '0';
    tip.style.transform = 'translate(-50%, 0)';
    setTimeout(() => tip.remove(), 220);
  }, 1400);
}

// -------- 玩家移动控制器 --------
const PlayerController = (() => {
  const playerEl = document.getElementById('player-character');
  const gameContainer = document.getElementById('game-container');
  
  let playerPos = { x: 50, y: 50 }; // 百分比位置
  let isMoving = false;
  let moveSpeed = 1.5; // 每次移动的百分比
  let keys = { w: false, a: false, s: false, d: false };
  let moveInterval = null;
  
  function updatePosition() {
    playerEl.style.left = `${playerPos.x}%`;
    playerEl.style.top = `${playerPos.y}%`;
    
    // 更新Store中的玩家位置
    Store.setState({ playerPosition: { ...playerPos } });
  }
  
  function constrainPosition() {
    // 限制在游戏区域内（考虑角色大小）
    const margin = 2; // 百分比边距
    playerPos.x = Math.max(margin, Math.min(100 - margin, playerPos.x));
    playerPos.y = Math.max(margin, Math.min(100 - margin, playerPos.y));
  }
  
  function startMoving() {
    if (isMoving) return;
    isMoving = true;
    playerEl.classList.add('moving');
    
    moveInterval = setInterval(() => {
      let moved = false;
      
      if (keys.w) { playerPos.y -= moveSpeed; moved = true; }
      if (keys.s) { playerPos.y += moveSpeed; moved = true; }
      if (keys.a) { playerPos.x -= moveSpeed; moved = true; }
      if (keys.d) { playerPos.x += moveSpeed; moved = true; }
      
      if (moved) {
        constrainPosition();
        updatePosition();
        checkInteractables();
      } else {
        stopMoving();
      }
    }, 50); // 20 FPS
  }
  
  function stopMoving() {
    if (!isMoving) return;
    isMoving = false;
    playerEl.classList.remove('moving');
    
    if (moveInterval) {
      clearInterval(moveInterval);
      moveInterval = null;
    }
  }
  
  function checkInteractables() {
    // 这个函数将被SceneManager调用，检查附近的交互对象
    if (typeof SceneManager !== 'undefined' && SceneManager.checkPlayerProximity) {
      SceneManager.checkPlayerProximity(playerPos);
    }
  }
  
  function handleKeyDown(e) {
    if (!isEnabled()) return;
    
    switch(e.code) {
      case 'KeyW': keys.w = true; break;
      case 'KeyA': keys.a = true; break;
      case 'KeyS': keys.s = true; break;
      case 'KeyD': keys.d = true; break;
    }
    
    if (keys.w || keys.a || keys.s || keys.d) {
      e.preventDefault();
      startMoving();
    }
  }
  
  function handleKeyUp(e) {
    if (!isEnabled()) return;
    
    switch(e.code) {
      case 'KeyW': keys.w = false; break;
      case 'KeyA': keys.a = false; break;
      case 'KeyS': keys.s = false; break;
      case 'KeyD': keys.d = false; break;
    }
    
    if (!keys.w && !keys.a && !keys.s && !keys.d) {
      stopMoving();
    }
  }
  
  function isEnabled() {
    const state = Store.getState();
    if (state.phase !== 'investigation') return false;
    // 当UI覆盖层打开时，禁用移动
    const settingsOpen = document.getElementById('settings-menu')?.style.display === 'flex';
    const itemModalOpen = document.getElementById('item-detail-modal')?.style.display === 'flex';
    const dialogueOpen = document.getElementById('dialogue-box')?.style.display !== 'none';
    if (settingsOpen || itemModalOpen || dialogueOpen) return false;
    return true;
  }
  
  function show() {
    playerEl.style.display = 'block';
    // 从Store恢复位置
    const state = Store.getState();
    if (state.playerPosition) {
      playerPos = { ...state.playerPosition };
    }
    updatePosition();
  }
  
  function hide() {
    playerEl.style.display = 'none';
    stopMoving();
  }
  
  function setPosition(x, y) {
    playerPos.x = x;
    playerPos.y = y;
    constrainPosition();
    updatePosition();
  }
  
  function getPosition() {
    return { ...playerPos };
  }
  
  // 初始化事件监听
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  
  return { show, hide, setPosition, getPosition, updatePosition };
})();

// -------- 场景管理（重构：交互系统） --------
const SceneManager = (() => {
  const backgroundImage = document.querySelector('.background-image');
  const dialogueContainer = document.getElementById('dialogue-container');
  const gameContainer = document.getElementById('game-container');
  const interactionPrompt = document.getElementById('interaction-prompt');
  const dialogueBox = document.getElementById('dialogue-box');
  const dialogueSpeaker = document.getElementById('dialogue-speaker');
  const dialogueText = document.getElementById('dialogue-text');

  let currentInteractables = [];
  let nearbyInteractable = null;
  let isDialogueActive = false;

  // 热点容器（懒创建）
  let interactablesLayer = null;
  function ensureInteractablesLayer() {
    if (!interactablesLayer) {
      interactablesLayer = document.createElement('div');
      interactablesLayer.className = 'hotspots-layer';
      gameContainer.appendChild(interactablesLayer);
    } else {
      interactablesLayer.innerHTML = '';
    }
    return interactablesLayer;
  }

  function changeBackground(src) {
    const temp = new Image();
    temp.src = src;
    temp.onload = () => {
      backgroundImage.style.opacity = '0';
      setTimeout(() => {
        backgroundImage.src = src;
        backgroundImage.style.opacity = '1';
      }, 300);
    };
  }

  // 房间名称映射
  // 房间数据 - 增加丰富的交互内容
  const ROOMS = {
    'entrance': {
      bg: '../assets/image/entrance.svg',
      text: '玄关',
      interactables: [
        {
          id: 'door-to-living',
          type: 'door',
          x: '70%', y: '30%', w: '25%', h: '40%',
          target: 'living-room',
          description: '客厅'
        },
        {
          id: 'entrance-shoes',
          type: 'item',
          x: '10%', y: '70%', w: '30%', h: '20%',
          name: '鞋架',
          dialogue: {
            speaker: '调查',
            text: '鞋架上摆放着几双鞋子，其中有一双女士高跟鞋显得格外凌乱，鞋跟上似乎有深色的污渍...'
          },
          evidence: 'entrance-shoes-clue'
        },
        {
          id: 'entrance-mirror',
          type: 'item',
          x: '45%', y: '20%', w: '20%', h: '35%',
          name: '玄关镜子',
          dialogue: {
            speaker: '调查',
            text: '镜子表面有一处明显的裂痕，看起来像是被重物击中造成的。'
          }
        }
      ]
    },
    'living-room': {
      bg: '../assets/image/living-room.jpg',
      text: '客厅',
      interactables: [
        {
          id: 'door-to-entrance',
          type: 'door',
          x: '2%', y: '30%', w: '18%', h: '40%',
          target: 'entrance',
          description: '玄关'
        },
        {
          id: 'door-to-kitchen',
          type: 'door',
          x: '82%', y: '55%', w: '16%', h: '35%',
          target: 'kitchen',
          description: '厨房'
        },
        {
          id: 'door-to-study',
          type: 'door',
          x: '80%', y: '10%', w: '18%', h: '35%',
          target: 'study',
          description: '书房'
        },
        {
          id: 'door-to-bedroom',
          type: 'door',
          x: '40%', y: '2%', w: '30%', h: '18%',
          target: 'bedroom',
          description: '卧室'
        },
        {
          id: 'door-to-balcony',
          type: 'door',
          x: '10%', y: '80%', w: '35%', h: '18%',
          target: 'balcony',
          description: '阳台'
        },
        {
          id: 'living-sofa',
          type: 'item',
          x: '30%', y: '50%', w: '35%', h: '25%',
          name: '沙发',
          dialogue: {
            speaker: '调查',
            text: '沙发垫子被翻动过，其中一个垫子下面有明显的血迹。看起来有人试图掩盖什么。'
          },
          evidence: 'sofa-blood-stain'
        },
        {
          id: 'living-table',
          type: 'item',
          x: '25%', y: '25%', w: '25%', h: '20%',
          name: '茶几',
          dialogue: {
            speaker: '调查',
            text: '茶几上的花瓶碎了，碎片散落在地面上。桌面上还有一本翻开的杂志，上面有血滴。'
          }
        },
        {
          id: 'living-tv',
          type: 'item',
          x: '55%', y: '15%', w: '20%', h: '25%',
          name: '电视',
          dialogue: {
            speaker: '调查',
            text: '电视仍在播放，但屏幕上有裂纹。遥控器掉在地上，电池仓盖打开了。'
          }
        }
      ]
    },
    'kitchen': {
      bg: '../assets/image/kitchen.jpg',
      text: '厨房',
      interactables: [
        {
          id: 'door-to-living-kitchen',
          type: 'door',
          x: '2%', y: '40%', w: '18%', h: '35%',
          target: 'living-room',
          description: '客厅'
        },
        {
          id: 'kitchen-sink',
          type: 'item',
          x: '55%', y: '55%', w: '30%', h: '25%',
          name: '洗涤池',
          dialogue: {
            speaker: '调查',
            text: '洗涤池里有明显冲洗过的痕迹，排水口附近有暗红色的污渍。水龙头还在微微滴水。'
          },
          evidence: 'sink-blood-traces'
        },
        {
          id: 'kitchen-knife-block',
          type: 'item',
          x: '35%', y: '40%', w: '25%', h: '20%',
          name: '刀具架',
          dialogue: {
            speaker: '调查',
            text: '刀具架上少了一把菜刀。其他刀具都整齐地插在架子上，但那个空位置很显眼。'
          },
          evidence: 'missing-knife'
        },
        {
          id: 'kitchen-trash',
          type: 'item',
          x: '15%', y: '65%', w: '20%', h: '25%',
          name: '垃圾桶',
          dialogue: {
            speaker: '调查',
            text: '垃圾桶里有撕碎的纸片和一些血迹斑斑的纸巾。看起来有人匆忙清理过什么。'
          }
        }
      ]
    },
    'study': {
      bg: '../assets/image/study.jpg',
      text: '书房',
      interactables: [
        {
          id: 'door-to-living-study',
          type: 'door',
          x: '2%', y: '50%', w: '18%', h: '35%',
          target: 'living-room',
          description: '客厅'
        },
        {
          id: 'study-desk',
          type: 'item',
          x: '45%', y: '35%', w: '40%', h: '35%',
          name: '书桌',
          dialogue: {
            speaker: '调查',
            text: '书桌抽屉被强行拉开，里面的文件散落一地。有一张保险单引起了你的注意。'
          },
          evidence: 'insurance-document',
          item: {
            id: 'insurance-policy',
            name: '人寿保险单',
            description: '一份高额人寿保险单，受益人是受害者的丈夫。保险金额高达500万元。',
            icon: '📄'
          }
        },
        {
          id: 'study-safe',
          type: 'item',
          x: '70%', y: '60%', w: '25%', h: '30%',
          name: '保险箱',
          dialogue: {
            speaker: '调查',
            text: '保险箱门敞开着，里面空无一物。锁孔周围有撬锁的痕迹。'
          }
        },
        {
          id: 'study-books',
          type: 'item',
          x: '10%', y: '15%', w: '30%', h: '50%',
          name: '书架',
          dialogue: {
            speaker: '调查',
            text: '书架上的书被人翻得乱七八糟，有几本书掉在地上，其中一本日记本摊开着。'
          }
        }
      ]
    },
    'bedroom': {
      bg: '../assets/image/bedroom.jpg',
      text: '卧室',
      interactables: [
        {
          id: 'door-to-living-bedroom',
          type: 'door',
          x: '40%', y: '82%', w: '30%', h: '16%',
          target: 'living-room',
          description: '客厅'
        },
        {
          id: 'door-to-bathroom',
          type: 'door',
          x: '80%', y: '30%', w: '18%', h: '40%',
          target: 'bathroom',
          description: '卫生间'
        },
        {
          id: 'bedroom-bed',
          type: 'item',
          x: '25%', y: '30%', w: '45%', h: '40%',
          name: '床铺',
          dialogue: {
            speaker: '调查',
            text: '床单严重撕裂，上面有大片的血迹。枕头也被血染红，看起来这里发生过激烈的斗争。'
          },
          evidence: 'bedroom-blood-scene'
        },
        {
          id: 'bedroom-wardrobe',
          type: 'item',
          x: '70%', y: '55%', w: '25%', h: '40%',
          name: '衣柜',
          dialogue: {
            speaker: '调查',
            text: '衣柜门半开着，里面的衣服被翻得一团糟。有几件女士衣物被撕破了。'
          }
        },
        {
          id: 'bedroom-window',
          type: 'item',
          x: '2%', y: '15%', w: '25%', h: '35%',
          name: '窗户',
          dialogue: {
            speaker: '调查',
            text: '窗户紧闭着，但窗帘被扯掉了一半。窗台上有手印，看起来像是有人想要逃跑。'
          }
        }
      ]
    },
    'balcony': {
      bg: '../assets/image/balcony.jpg',
      text: '阳台',
      interactables: [
        {
          id: 'door-to-living-balcony',
          type: 'door',
          x: '40%', y: '2%', w: '35%', h: '18%',
          target: 'living-room',
          description: '客厅'
        },
        {
          id: 'balcony-plants',
          type: 'item',
          x: '65%', y: '55%', w: '30%', h: '35%',
          name: '花盆',
          dialogue: {
            speaker: '调查',
            text: '几个花盆被打翻了，泥土散落在地。其中一个花盆里埋着什么东西...'
          },
          evidence: 'buried-evidence',
          item: {
            id: 'torn-letter',
            name: '撕碎的信件',
            description: '从花盆中找到的撕碎信件碎片，拼凑后可以看出是一封威胁信。',
            icon: '💌'
          }
        },
        {
          id: 'balcony-railing',
          type: 'item',
          x: '15%', y: '65%', w: '45%', h: '20%',
          name: '阳台栏杆',
          dialogue: {
            speaker: '调查',
            text: '栏杆上有明显的血迹和撞击痕迹。下面的地面上也有血滴。'
          }
        }
      ]
    },
    'bathroom': {
      bg: '../assets/image/bathroom.jpg',
      text: '卫生间',
      interactables: [
        {
          id: 'door-to-bedroom-bathroom',
          type: 'door',
          x: '2%', y: '30%', w: '18%', h: '40%',
          target: 'bedroom',
          description: '卧室'
        },
        {
          id: 'bathroom-mirror',
          type: 'item',
          x: '45%', y: '15%', w: '35%', h: '30%',
          name: '镜子',
          dialogue: {
            speaker: '调查',
            text: '镜子上有血手印，看起来像是受伤的人试图抓住什么东西。镜子的角落有裂痕。'
          },
          evidence: 'mirror-handprint'
        },
        {
          id: 'bathroom-bathtub',
          type: 'item',
          x: '55%', y: '50%', w: '40%', h: '40%',
          name: '浴缸',
          dialogue: {
            speaker: '调查',
            text: '浴缸里有大量的血迹，看起来凶手试图在这里清洗证据。排水口被血块堵塞了。'
          },
          evidence: 'bathtub-blood-pool'
        },
        {
          id: 'bathroom-toilet',
          type: 'item',
          x: '15%', y: '60%', w: '30%', h: '30%',
          name: '马桶',
          dialogue: {
            speaker: '调查',
            text: '马桶水箱盖被移开了，里面泡着一把血迹斑斑的菜刀。这就是凶器！'
          },
          evidence: 'murder-weapon',
          item: {
            id: 'bloody-knife',
            name: '血迹菜刀',
            description: '从马桶水箱中找到的凶器，刀刃上还残留着血迹。这是破案的关键证据。',
            icon: '🔪'
          }
        }
      ]
    }
  };

  // showTip 已提升为全局函数，避免重复定义

  function showDialogue(speaker, text) {
    dialogueSpeaker.textContent = speaker;
    dialogueText.textContent = text;
    dialogueBox.style.display = 'block';
    isDialogueActive = true;
  }

  function hideDialogue() {
    dialogueBox.style.display = 'none';
    isDialogueActive = false;
  }

  function checkNearbyInteractables() {
    // 移除自动激活，改为基于玩家位置的距离检测
    const playerPos = PlayerController.getPosition();
    const room = ROOMS[Store.getState().currentRoom];
    if (!room || !room.interactables.length) return;
    
    let closestInteractable = null;
    let minDistance = Infinity;
    const interactionRange = 15; // 交互范围（百分比）
    
    room.interactables.forEach(interactable => {
      const objX = parseFloat(interactable.x) + parseFloat(interactable.w) / 2;
      const objY = parseFloat(interactable.y) + parseFloat(interactable.h) / 2;
      
      const distance = Math.sqrt(
        Math.pow(playerPos.x - objX, 2) + 
        Math.pow(playerPos.y - objY, 2)
      );
      
      if (distance < interactionRange && distance < minDistance) {
        minDistance = distance;
        closestInteractable = interactable;
      }
    });
    
    setNearbyInteractable(closestInteractable);
  }

  function checkPlayerProximity(playerPos) {
    // 这个函数由PlayerController调用
    checkNearbyInteractables();
  }

  function setNearbyInteractable(interactable) {
    // 清除之前的高亮
    currentInteractables.forEach(el => el.classList.remove('active'));
    
    if (interactable) {
      nearbyInteractable = interactable;
      // 找到对应的DOM元素并高亮
      const el = document.querySelector(`[data-id="${interactable.id}"]`);
      if (el) {
        el.classList.add('active');
      }
      
      // 显示交互提示，如果是门则显示目标房间
      if (interactable.type === 'door') {
        const targetRoomName = ROOM_NAMES[interactable.target] || interactable.target;
        interactionPrompt.textContent = `按 E 键 - 进入${targetRoomName}`;
      } else {
        interactionPrompt.textContent = `按 E 键 - 调查${interactable.name}`;
      }
      
      interactionPrompt.style.display = 'block';
    } else {
      nearbyInteractable = null;
      interactionPrompt.style.display = 'none';
    }
  }

  function handleInteraction() {
    if (isDialogueActive) {
      hideDialogue();
      return;
    }

    if (!nearbyInteractable) return;

    const interactable = nearbyInteractable;

    if (interactable.type === 'door') {
      // 门切换场景的特殊效果
      const targetRoomName = ROOM_NAMES[interactable.target] || interactable.target;
      showTip(`进入${targetRoomName}`);
      
      // 添加切换动画
      const gameContainer = document.getElementById('game-container');
      gameContainer.style.transition = 'opacity 0.3s ease-out';
      gameContainer.style.opacity = '0.7';
      
      setTimeout(() => {
        Store.update(s => ({ ...s, currentRoom: interactable.target }));
        renderRoom(interactable.target);
        gameContainer.style.opacity = '1';
      }, 300);
    } else if (interactable.type === 'item') {
      // 显示对话或收集线索
      if (interactable.dialogue) {
        showDialogue(interactable.dialogue.speaker, interactable.dialogue.text);
      }
      
      if (interactable.evidence) {
        Store.update(s => ({ 
          ...s, 
          evidences: { ...s.evidences, [interactable.evidence]: true } 
        }));
        setTimeout(() => {
          showTip(`获得线索：${interactable.name}`);
        }, 100);
      }
      
      // 收集道具
      if (interactable.item) {
        const state = Store.getState();
        const alreadyHave = state.inventory.some(item => item.id === interactable.item.id);
        
        if (!alreadyHave) {
          const newItem = {
            ...interactable.item,
            obtainedAt: new Date().toLocaleString('zh-CN')
          };
          
          Store.update(s => ({
            ...s,
            inventory: [...s.inventory, newItem]
          }));
          
          setTimeout(() => {
            showTip(`获得道具：${interactable.item.name}`);
            InventoryManager.updateInventoryDisplay();
          }, 500);
        }
      }
    }
  }

  function renderRoom(roomId) {
    const room = ROOMS[roomId];
    if (!room) return;
    
  changeBackground(room.bg);
  // 调查阶段不显示顶部大标题，避免遮挡视线
  dialogueContainer.style.opacity = '0';
  dialogueContainer.textContent = '';
    
    // 渲染交互对象
    const layer = ensureInteractablesLayer();
    currentInteractables = [];
    
    (room.interactables || []).forEach(interactable => {
      const el = document.createElement('div');
      el.className = `interactable ${interactable.type}`;
      el.style.left = interactable.x;
      el.style.top = interactable.y;
      el.style.width = interactable.w;
      el.style.height = interactable.h;
      el.setAttribute('data-id', interactable.id);
      el.title = interactable.description || interactable.name || '';
      // 为门元素设置常显目标标签
      if (interactable.type === 'door') {
        const label = ROOM_NAMES[interactable.target] || interactable.description || '';
        if (label) el.setAttribute('data-label', label);
      } else if (interactable.name) {
        // 物品可选显示名称，当前不常显，保留为 title
      }
      layer.appendChild(el);
      currentInteractables.push(el);
    });
    
    // 隐藏所有UI
    hideDialogue();
    interactionPrompt.style.display = 'none';
    nearbyInteractable = null;
    
    // 显示玩家角色
    PlayerController.show();
    
    // 设置玩家初始位置（如果是第一次进入房间）
    const state = Store.getState();
    if (!state.playerPosition || state.playerPosition.x === 50 && state.playerPosition.y === 50) {
      // 根据房间设置不同的初始位置（避开门的位置）
      const spawnPoints = {
        'entrance': { x: 30, y: 60 },      // 玄关中央偏左
        'living-room': { x: 50, y: 50 },   // 客厅中央
        'kitchen': { x: 50, y: 30 },       // 厨房中央偏上
        'study': { x: 60, y: 25 },         // 书房桌子附近
        'bedroom': { x: 50, y: 20 },       // 卧室床头附近
        'balcony': { x: 50, y: 40 },       // 阳台中央
        'bathroom': { x: 35, y: 45 }       // 卫生间中央
      };
      
      const spawn = spawnPoints[roomId] || { x: 50, y: 50 };
      PlayerController.setPosition(spawn.x, spawn.y);
    }
    
    // 初始检查交互对象
    setTimeout(() => {
      checkNearbyInteractables();
    }, 100);
  }

  function renderPhase(phase) {
    const inventoryPanel = document.getElementById('inventory-panel');
    
    switch(phase) {
      case 'investigation':
        const state = Store.getState();
        renderRoom(state.currentRoom);
        // 显示道具栏
        if (inventoryPanel) inventoryPanel.style.display = 'block';
        break;
      default:
        // 其他阶段隐藏玩家角色和道具栏
        PlayerController.hide();
        if (inventoryPanel) inventoryPanel.style.display = 'none';
        break;
    }
  }

  // 按键事件监听
  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyE') {
      e.preventDefault();
      handleInteraction();
    }
  });

  return { renderRoom, renderPhase, changeBackground, checkPlayerProximity };
})();

// -------- 游戏流程控制 --------
function enterPrologue() {
    introScreen.style.opacity = '0';
    setTimeout(() => {
        introScreen.style.zIndex = '-1';
    }, 800);

    if (!bgmPlayed && bgm) {
        bgm.play().catch(() => {
            bgm.play();
        });
        bgmPlayed = true;
    }

    initDream();
}

function initDream() {
    const dialogueContainer = document.getElementById('dialogue-container');
    const prompt = document.getElementById('prompt');
    
    const dreamSequence = [
        "血... 到处都是血...",
        "刀刃上的反光格外刺眼...",
        "女人的尖叫声回荡在耳边...",
        "为什么... 为什么会这样..."
    ];
    
    let currentIndex = 0;
    let isProcessing = false; // 防止重复点击
    
    // 设置梦境背景
    SceneManager.changeBackground('../assets/image/dream.svg');
    
    function showCurrentDialogue() {
        dialogueContainer.innerHTML = '';
        const dialogueElement = document.createElement('div');
        dialogueElement.className = 'text-white text-lg md:text-xl lg:text-2xl font-serif text-shadow fade-in';
        dialogueElement.textContent = dreamSequence[currentIndex];
        dialogueContainer.appendChild(dialogueElement);
        
        setTimeout(() => {
            prompt.style.opacity = '1';
            prompt.style.display = 'block';
        }, 500);
    }
    
    function nextDialogue() {
        if (isProcessing) return;
        isProcessing = true;
        
        prompt.style.opacity = '0';
        
        if (currentIndex < dreamSequence.length - 1) {
            currentIndex++;
            setTimeout(() => {
                showCurrentDialogue();
                isProcessing = false;
            }, 300);
        } else {
            // 梦境结束，转入警车场景
            setTimeout(() => {
                // 移除事件监听器
                document.removeEventListener('keydown', handleNext);
                document.removeEventListener('click', handleNext);
                Store.setState({ phase: 'police-car' });
                initPoliceCar();
            }, 1000);
        }
    }
    
    // 事件监听
    const handleNext = (e) => {
        if (e.type === 'keydown') {
            e.preventDefault();
        }
        nextDialogue();
    };
    document.addEventListener('keydown', handleNext);
    document.addEventListener('click', handleNext);
    
    showCurrentDialogue();
}

function initPoliceCar() {
    const dialogueContainer = document.getElementById('dialogue-container');
    const prompt = document.getElementById('prompt');
    
    const policeCarSequence = [
        "\"嘿，醒醒！\"",
        "\"我们到了，准备下车吧。\"",
        "你缓缓睁开眼睛，发现自己坐在警车里...",
        "刚才的梦境如此真实，让你不寒而栗。",
        "\"今天这个案子有点特殊，你要做好心理准备。\""
    ];
    
    let currentIndex = 0;
    
    // 切换到警车背景
    SceneManager.changeBackground('../assets/image/police-car.svg');
    
    function showCurrentDialogue() {
        dialogueContainer.innerHTML = '';
        const dialogueElement = document.createElement('div');
        dialogueElement.className = 'text-white text-lg md:text-xl lg:text-2xl font-serif text-shadow fade-in';
        dialogueElement.textContent = policeCarSequence[currentIndex];
        dialogueContainer.appendChild(dialogueElement);
        
        setTimeout(() => {
            prompt.style.opacity = '1';
            prompt.style.display = 'block';
        }, 500);
    }
    
    function nextDialogue() {
        prompt.style.opacity = '0';
        
        if (currentIndex < policeCarSequence.length - 1) {
            currentIndex++;
            setTimeout(showCurrentDialogue, 300);
        } else {
            // 警车场景结束，开始案发现场调查
            setTimeout(() => {
                // 移除事件监听器
                document.removeEventListener('keydown', handleNext);
                document.removeEventListener('click', handleNext);
                Store.setState({ phase: 'investigation' });
                startInvestigation();
            }, 1000);
        }
    }
    
    // 事件监听
    const handleNext = (e) => {
        if (e.type === 'keydown') {
            e.preventDefault();
        }
        nextDialogue();
    };
    document.addEventListener('keydown', handleNext);
    document.addEventListener('click', handleNext);
    
    showCurrentDialogue();
}

function startInvestigation() {
    const prompt = document.getElementById('prompt');
    const dialogueContainer = document.getElementById('dialogue-container');
    
    prompt.style.display = 'none'; // 隐藏提示文字
    
    // 显示操作提示
    dialogueContainer.innerHTML = `
        <div style="text-align: center; color: #fff; padding: 20px;">
            <h3>案发现场调查</h3>
            <p>使用 <strong>WASD</strong> 移动角色</p>
            <p>靠近物品时按 <strong>E键</strong> 进行交互</p>
            <p>仔细观察，寻找真相的线索...</p>
        </div>
    `;
    
    // 进入房间系统
    SceneManager.renderPhase('investigation');
    
    // 3秒后隐藏操作提示
    setTimeout(() => {
        dialogueContainer.style.opacity = '0';
        setTimeout(() => {
            SceneManager.renderRoom(Store.getState().currentRoom);
        }, 500);
    }, 3000);
}

// 初始化和恢复游戏状态
function initializeGame() {
    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const skipPrologue = urlParams.get('skipPrologue');
    const startRoom = urlParams.get('startRoom');
    const newGame = urlParams.get('newGame');
    const loadSlot = urlParams.get('loadSlot');
    
    // 如果是从主菜单加载特定存档
    if (loadSlot) {
        if (SaveManager.loadFromSlot(loadSlot)) {
            showTip('存档加载成功！');
            introScreen.style.display = 'none';
            startInvestigation();
            return;
        } else {
            showTip('存档加载失败，开始新游戏');
            Store.setState({ 
                phase: 'investigation', 
                currentRoom: 'living-room' 
            });
            introScreen.style.display = 'none';
            startInvestigation();
            return;
        }
    }
    
    // 如果是从序章跳转过来的，直接开始调查
    if (skipPrologue === 'true') {
        const initialRoom = startRoom || 'living-room';
        Store.setState({ 
            phase: 'investigation', 
            currentRoom: initialRoom 
        });
        introScreen.style.display = 'none';
        startInvestigation();
        return;
    }
    
    // 如果是新游戏且指定了起始房间
    if (newGame === 'true' && startRoom) {
        Store.setState({ 
            phase: 'investigation', 
            currentRoom: startRoom 
        });
        introScreen.style.display = 'none';
        startInvestigation();
        return;
    }
    
    const state = Store.getState();
    
    switch(state.phase) {
        case 'dream':
            // 显示开始界面
            introScreen.style.display = 'flex';
            break;
        case 'police-car':
            initPoliceCar();
            break;
        case 'investigation':
            introScreen.style.display = 'none';
            startInvestigation();
            break;
        default:
            // 默认显示开始界面
            introScreen.style.display = 'flex';
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupSettingsMenu(); // 初始化设置菜单
    InventoryManager.initialize(); // 初始化道具系统
    SaveLoadUI.initialize(); // 初始化存档读档界面
});

// 初始化事件：仅在处于梦境阶段时才绑定入口
function bindIntroListenersIfNeeded() {
  const state = Store.getState();
  if (state.phase !== 'dream') return;
  const onAny = (e) => {
    if (Store.getState().phase !== 'dream') return; // 双重校验
    if (e.type === 'keydown') e.preventDefault();
    enterPrologue();
    // 销毁监听，避免重复触发
    introScreen.removeEventListener('click', onAny);
    document.removeEventListener('keydown', onAny);
  };
  introScreen.addEventListener('click', onAny);
  document.addEventListener('keydown', onAny, { once: true });
}
bindIntroListenersIfNeeded();

// 调试功能：快捷键直接进入调查阶段（开发时使用）
document.addEventListener('keydown', (e) => {
    if (e.key === 'F1') {
        e.preventDefault();
        console.log('跳转到调查阶段（调试模式）');
        Store.setState({ phase: 'investigation', currentRoom: 'entrance' });
        introScreen.style.display = 'none';
        startInvestigation();
    }
    if (e.key === 'F2') {
        e.preventDefault();
        console.log('重置游戏进度');
        localStorage.removeItem('HTG_SAVE_V1');
        location.reload();
    }
    if (e.key === 'F3') {
        e.preventDefault();
        console.log('重置序章状态（将重新显示序章）');
        localStorage.removeItem('HTG_PROLOGUE_COMPLETED');
        alert('序章状态已重置，下次点击"新游戏"将重新显示序章');
    }
    if (e.key === 'F5') {
        e.preventDefault();
        console.log('快速保存');
        const state = Store.getState();
        if (state.phase === 'investigation') {
            const allSlots = SaveManager.getAllSlotData();
            const targetSlot = allSlots.find(slot => slot.isEmpty) || allSlots[0];
            SaveManager.saveToSlot(targetSlot.slotId, null);
        }
    }
    if (e.key === 'F9') {
        e.preventDefault();
        console.log('打开读档菜单');
        const state = Store.getState();
        if (state.phase === 'investigation') {
            SaveLoadUI.showLoadMenu();
        }
    }
});

// -------- 存档读档界面管理 --------
const SaveLoadUI = (() => {
  // 确保在DOM加载完成后获取元素
  let saveMenu, loadMenu, saveSlotsList, loadSlotsList;
  
  function initElements() {
    saveMenu = document.getElementById('save-menu');
    loadMenu = document.getElementById('load-menu');
    saveSlotsList = document.getElementById('save-slots-list');
    loadSlotsList = document.getElementById('load-slots-list');
    
    if (!saveMenu || !loadMenu || !saveSlotsList || !loadSlotsList) {
      console.error('SaveLoadUI: 必要的DOM元素未找到');
      return false;
    }
    return true;
  }

  function renderSaveSlot(slotData) {
    const { slotId, isEmpty, data } = slotData;
    const slotNumber = slotId.split('_')[1];
    
    if (isEmpty) {
      return `
        <div class="save-slot empty" data-slot-id="${slotId}">
          <div class="slot-info">
            <h4>存档槽 ${slotNumber}</h4>
            <div class="slot-time">空存档位</div>
          </div>
          <div class="slot-actions">
            <button class="save-here-btn" data-action="save" data-slot-id="${slotId}">保存到此</button>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="save-slot" data-slot-id="${slotId}">
          <div class="slot-info">
            <h4>${data.name}</h4>
            <div class="slot-time">${data.timestamp}</div>
            <div class="slot-location">位置：${data.roomName}</div>
            <div class="slot-progress">${data.progress}</div>
          </div>
          <div class="slot-actions">
            <button class="overwrite-btn" data-action="overwrite" data-slot-id="${slotId}">覆盖</button>
            <button class="delete-btn" data-action="delete" data-slot-id="${slotId}">删除</button>
          </div>
        </div>
      `;
    }
  }

  function renderLoadSlot(slotData) {
    const { slotId, isEmpty, data } = slotData;
    const slotNumber = slotId.split('_')[1];
    
    if (isEmpty) {
      return `
        <div class="save-slot empty" data-slot-id="${slotId}">
          <div class="slot-info">
            <h4>存档槽 ${slotNumber}</h4>
            <div class="slot-time">空存档位</div>
          </div>
          <div class="slot-actions">
            <button disabled style="opacity: 0.5; cursor: not-allowed;">无存档</button>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="save-slot" data-slot-id="${slotId}">
          <div class="slot-info">
            <h4>${data.name}</h4>
            <div class="slot-time">${data.timestamp}</div>
            <div class="slot-location">位置：${data.roomName}</div>
            <div class="slot-progress">${data.progress}</div>
          </div>
          <div class="slot-actions">
            <button class="load-btn" data-action="load" data-slot-id="${slotId}">读取</button>
            <button class="delete-btn" data-action="delete" data-slot-id="${slotId}">删除</button>
          </div>
        </div>
      `;
    }
  }

  function showSaveMenu() {
    if (!saveMenu || !saveSlotsList) {
      console.error('SaveLoadUI: 存档菜单元素未找到');
      return;
    }
    
    const allSlots = SaveManager.getAllSlotData();
    saveSlotsList.innerHTML = allSlots.map(renderSaveSlot).join('');
    saveMenu.style.display = 'flex';
    
    // 先移除旧的事件监听器，避免重复绑定
    saveSlotsList.removeEventListener('click', handleSaveSlotClick);
    // 添加新的事件监听器
    saveSlotsList.addEventListener('click', handleSaveSlotClick);
  }

  function showLoadMenu() {
    if (!loadMenu || !loadSlotsList) {
      console.error('SaveLoadUI: 读档菜单元素未找到');
      return;
    }
    
    const allSlots = SaveManager.getAllSlotData();
    loadSlotsList.innerHTML = allSlots.map(renderLoadSlot).join('');
    loadMenu.style.display = 'flex';
    
    // 先移除旧的事件监听器，避免重复绑定
    loadSlotsList.removeEventListener('click', handleLoadSlotClick);
    // 添加新的事件监听器
    loadSlotsList.addEventListener('click', handleLoadSlotClick);
  }

  function hideSaveMenu() {
    if (saveMenu) {
      saveMenu.style.display = 'none';
    }
    if (saveSlotsList) {
      saveSlotsList.removeEventListener('click', handleSaveSlotClick);
    }
  }

  function hideLoadMenu() {
    if (loadMenu) {
      loadMenu.style.display = 'none';
    }
    if (loadSlotsList) {
      loadSlotsList.removeEventListener('click', handleLoadSlotClick);
    }
  }

  function handleSaveSlotClick(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    
    const action = button.dataset.action;
    const slotId = button.dataset.slotId;
    
    switch (action) {
      case 'save':
      case 'overwrite':
        const customName = prompt('请输入存档名称（留空使用默认名称）：', '');
        if (customName !== null) { // 用户没有取消
          SaveManager.saveToSlot(slotId, customName.trim() || null);
          hideSaveMenu();
        }
        break;
      case 'delete':
        if (SaveManager.deleteSlot(slotId)) {
          showSaveMenu(); // 刷新列表
        }
        break;
    }
  }

  function handleLoadSlotClick(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    
    const action = button.dataset.action;
    const slotId = button.dataset.slotId;
    
    switch (action) {
      case 'load':
        const allSlots = SaveManager.getSaveSlots();
        const saveData = allSlots[slotId];
        if (saveData && confirm(`确定要读取"${saveData.name}"吗？当前进度将被覆盖。`)) {
          if (SaveManager.loadFromSlot(slotId)) {
            hideLoadMenu();
            // 关闭所有菜单
            document.getElementById('settings-menu').style.display = 'none';
          }
        }
        break;
      case 'delete':
        if (SaveManager.deleteSlot(slotId)) {
          showLoadMenu(); // 刷新列表
        }
        break;
    }
  }

  function initialize() {
    // 初始化DOM元素
    if (!initElements()) {
      return false;
    }
    
    // 关闭按钮事件
    document.getElementById('close-save-menu')?.addEventListener('click', hideSaveMenu);
    document.getElementById('close-load-menu')?.addEventListener('click', hideLoadMenu);
    
    // 点击背景关闭
    saveMenu?.addEventListener('click', (e) => {
      if (e.target === saveMenu) hideSaveMenu();
    });
    loadMenu?.addEventListener('click', (e) => {
      if (e.target === loadMenu) hideLoadMenu();
    });
    
    return true;
  }

  return {
    showSaveMenu,
    showLoadMenu,
    hideSaveMenu,
    hideLoadMenu,
    initialize
  };
})();

// -------- 道具系统管理 --------
const InventoryManager = (() => {
  const inventoryPanel = document.getElementById('inventory-panel');
  const inventorySlots = document.getElementById('inventory-slots');
  const toggleBtn = document.getElementById('toggle-inventory');
  const itemDetailModal = document.getElementById('item-detail-modal');
  const closeDetailBtn = document.getElementById('close-item-detail');
  
  let isCollapsed = false;

  function updateInventoryDisplay() {
    const state = Store.getState();
    const inventory = state.inventory || [];
    
    if (!inventorySlots) return;
    
    inventorySlots.innerHTML = '';
    
    inventory.forEach(item => {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.innerHTML = `
        <div class="item-icon">${item.icon}</div>
        <div class="item-name">${item.name}</div>
      `;
      
      slot.addEventListener('click', () => showItemDetail(item));
      inventorySlots.appendChild(slot);
    });
    
    // 如果没有道具，显示空槽提示
    if (inventory.length === 0) {
      const emptySlot = document.createElement('div');
      emptySlot.className = 'inventory-slot empty';
      emptySlot.innerHTML = '<div style="color: #666; font-size: 12px;">暂无道具</div>';
      inventorySlots.appendChild(emptySlot);
    }
  }

  function showItemDetail(item) {
    const iconEl = document.getElementById('item-detail-icon');
    const nameEl = document.getElementById('item-detail-name');
    const descEl = document.getElementById('item-detail-description');
    const obtainedEl = document.getElementById('item-detail-obtained');
    
    if (iconEl) iconEl.textContent = item.icon;
    if (nameEl) nameEl.textContent = item.name;
    if (descEl) descEl.textContent = item.description;
    if (obtainedEl) obtainedEl.textContent = `获得时间：${item.obtainedAt}`;
    
    if (itemDetailModal) itemDetailModal.style.display = 'flex';
  }

  function hideItemDetail() {
    if (itemDetailModal) itemDetailModal.style.display = 'none';
  }

  function toggleInventory() {
    isCollapsed = !isCollapsed;
    if (inventoryPanel) {
      if (isCollapsed) {
        inventoryPanel.classList.add('collapsed');
      } else {
        inventoryPanel.classList.remove('collapsed');
      }
    }
  }

  function initialize() {
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleInventory);
    }
    
    if (closeDetailBtn) {
      closeDetailBtn.addEventListener('click', hideItemDetail);
    }
    
    if (itemDetailModal) {
      itemDetailModal.addEventListener('click', (e) => {
        if (e.target === itemDetailModal) {
          hideItemDetail();
        }
      });
    }
    
    // 初始显示
    updateInventoryDisplay();
  }

  return {
    updateInventoryDisplay,
    showItemDetail,
    hideItemDetail,
    toggleInventory,
    initialize
  };
})();

// -------- 设置菜单逻辑 --------
// -------- 设置菜单逻辑 --------
function setupSettingsMenu() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const quickSaveBtn = document.getElementById('quick-save-btn');
    const saveMenuBtn = document.getElementById('save-menu-btn');
    const loadMenuBtn = document.getElementById('load-menu-btn');
    const returnToMenuBtn = document.getElementById('return-to-menu-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');

    // 确保这些元素存在
    if (!settingsBtn || !settingsMenu) return;

    settingsBtn.addEventListener('click', () => {
        settingsMenu.style.display = 'flex';
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsMenu.style.display = 'none';
    });

    // 快速保存：保存到最近使用的槽位或第一个空槽位
    quickSaveBtn.addEventListener('click', () => {
        const allSlots = SaveManager.getAllSlotData();
        // 寻找第一个空槽位或使用slot_1
        const targetSlot = allSlots.find(slot => slot.isEmpty) || allSlots[0];
        SaveManager.saveToSlot(targetSlot.slotId, null);
        settingsMenu.style.display = 'none';
    });

    // 打开存档管理
    saveMenuBtn.addEventListener('click', () => {
        SaveLoadUI.showSaveMenu();
    });

    // 打开读档管理
    loadMenuBtn.addEventListener('click', () => {
        SaveLoadUI.showLoadMenu();
    });

    returnToMenuBtn.addEventListener('click', () => {
        // 添加一个确认，防止误触
        if (confirm('确定要返回主菜单吗？未保存的进度将会丢失。')) {
            window.location.href = '../index/index.html';
        }
    });
}
