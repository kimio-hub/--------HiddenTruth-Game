// -------- 主游戏逻辑文件 --------
// 导入所有模块（通过script标签在HTML中引入）

// -------- 玩家控制系统 --------
const PlayerController = (() => {
  const player = document.getElementById('player-character');
  let playerX = 400;
  let playerY = 300;
  const moveSpeed = 3;
  const keys = {};
  
  function initialize() {
    if (!player) {
      console.error('PlayerController: 玩家元素未找到');
      return false;
    }

    // 键盘事件监听
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // 设置初始位置
    updatePlayerPosition();
    
    // 开始游戏循环
    gameLoop();
    
    return true;
  }

  function handleKeyDown(e) {
    keys[e.key.toLowerCase()] = true;
    
    // 快捷键处理
    if (e.key === 'F5') {
      e.preventDefault();
      quickSave();
    } else if (e.key === 'F9') {
      e.preventDefault();
      quickLoad();
    } else if (e.key.toLowerCase() === 'e') {
      handleInteraction();
    }
  }

  function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
  }

  function gameLoop() {
    // 检查是否有UI界面打开，如果有则不处理移动
    const activeModals = document.querySelectorAll('.modal-overlay[style*="flex"], #settings-menu[style*="flex"]');
    if (activeModals.length === 0) {
      handleMovement();
    }
    
    updatePlayerPosition();
    requestAnimationFrame(gameLoop);
  }

  function handleMovement() {
    let newX = playerX;
    let newY = playerY;

    if (keys['w'] || keys['arrowup']) newY -= moveSpeed;
    if (keys['s'] || keys['arrowdown']) newY += moveSpeed;
    if (keys['a'] || keys['arrowleft']) newX -= moveSpeed;
    if (keys['d'] || keys['arrowright']) newX += moveSpeed;

    // 边界检查
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      const containerRect = gameContainer.getBoundingClientRect();
      newX = Math.max(0, Math.min(newX, containerRect.width - 40));
      newY = Math.max(0, Math.min(newY, containerRect.height - 60));
    }

    playerX = newX;
    playerY = newY;
  }

  function updatePlayerPosition() {
    if (player) {
      player.style.left = `${playerX}px`;
      player.style.top = `${playerY}px`;
    }
  }

  function handleInteraction() {
    const interactable = SceneManager.getInteractableAt(playerX + 20, playerY + 30);
    if (interactable) {
      GameActions.handleInteraction(interactable);
    }
  }

  function quickSave() {
    const allSlots = SaveManager.getAllSlotData();
    const firstSlot = allSlots[0];
    SaveManager.saveToSlot(firstSlot.slotId, null);
  }

  function quickLoad() {
    const allSlots = SaveManager.getAllSlotData();
    const firstSlot = allSlots[0];
    if (!firstSlot.isEmpty) {
      SaveManager.loadFromSlot(firstSlot.slotId);
    } else {
      showTip('没有可用的快速存档');
    }
  }

  function getPlayerPosition() {
    return { x: playerX, y: playerY };
  }

  function setPlayerPosition(x, y) {
    playerX = x;
    playerY = y;
    updatePlayerPosition();
  }

  return {
    initialize,
    getPlayerPosition,
    setPlayerPosition
  };
})();

// -------- 游戏动作处理 --------
const GameActions = (() => {
  
  function handleInteraction(interactable) {
    switch (interactable.type) {
      case 'door':
        handleDoorInteraction(interactable);
        break;
      case 'item':
        handleItemInteraction(interactable);
        break;
      case 'search':
        handleSearchInteraction(interactable);
        break;
      case 'examine':
        handleExamineInteraction(interactable);
        break;
      default:
        showTip('无法与此对象交互');
    }
  }

  function handleDoorInteraction(interactable) {
    if (SceneManager.isValidRoom(interactable.target)) {
      const targetRoomName = ROOM_NAMES[interactable.target] || interactable.target;
      showTip(`前往${targetRoomName}...`);
      
      SceneManager.changeRoomWithTransition(interactable.target)
        .then(() => {
          // 房间切换完成后的处理
          SaveManager.autoSave(); // 自动保存
        });
    }
  }

  function handleItemInteraction(interactable) {
    const action = interactable.action;
    
    switch (action) {
      case 'collectBloodKnife':
        if (!InventoryManager.hasItem('bloodknife')) {
          InventoryManager.addItem('bloodknife');
          SceneManager.removeInteractable(interactable.id);
          Store.addEvidence('bloodknife_evidence', {
            name: '血迹菜刀',
            description: '在厨房发现的带血菜刀，可能是凶器',
            location: '厨房',
            timestamp: Utils.formatTime()
          });
        }
        break;
        
      case 'collectInsurance':
        if (!InventoryManager.hasItem('insurance')) {
          InventoryManager.addItem('insurance');
          SceneManager.removeInteractable(interactable.id);
          Store.addEvidence('insurance_evidence', {
            name: '保险单',
            description: '一份高额人寿保险单，受益人是陌生人',
            location: '书房',
            timestamp: Utils.formatTime()
          });
        }
        break;
        
      case 'collectTornLetter':
        if (!InventoryManager.hasItem('tornletter')) {
          InventoryManager.addItem('tornletter');
          SceneManager.removeInteractable(interactable.id);
          Store.addEvidence('letter_evidence', {
            name: '撕碎信件',
            description: '威胁信件的碎片，内容令人不安',
            location: '卧室',
            timestamp: Utils.formatTime()
          });
        }
        break;
        
      default:
        showTip(`发现了${interactable.description}`);
    }
  }

  function handleSearchInteraction(interactable) {
    const action = interactable.action;
    const descriptions = {
      'searchSofa': '你搜查了沙发，但没有发现什么有用的东西。',
      'searchRefrigerator': '冰箱里有一些过期的食物，散发着奇怪的味道。',
      'searchDesk': '桌子上散落着一些文件，看起来很乱。',
      'searchBed': '床单有些凌乱，枕头下面似乎藏着什么。',
      'searchToilet': '马桶里的水有些浑浊，但没有其他发现。',
      'searchShoeCabinet': '鞋柜里摆放着各种鞋子，没有异常。'
    };
    
    showTip(descriptions[action] || `你搜查了${interactable.description}。`);
  }

  function handleExamineInteraction(interactable) {
    const action = interactable.action;
    const descriptions = {
      'examineTV': '电视屏幕是黑的，遥控器放在旁边。',
      'examineStove': '炉灶很干净，但能闻到一股淡淡的煤气味。',
      'examineBookshelf': '书架上摆满了各种书籍，大多数都很旧。',
      'examineWardrobe': '衣柜里挂着一些衣服，都很整齐。',
      'examineMirror': '镜子有些模糊，反射着浴室的灯光。',
      'examinePlants': '阳台上的植物长得很好，有人精心照料过。',
      'examineRailing': '阳台栏杆很结实，但上面有一些奇怪的划痕。',
      'examineCoatRack': '衣架上挂着一件大衣，口袋里似乎有什么东西。'
    };
    
    showTip(descriptions[action] || `你仔细观察了${interactable.description}。`);
  }

  return {
    handleInteraction,
    handleDoorInteraction,
    handleItemInteraction,
    handleSearchInteraction,
    handleExamineInteraction
  };
})();

// -------- 物品栏显示切换功能 --------
function initializeInventoryToggle() {
  const inventoryPanel = document.getElementById('inventory-panel');
  
  if (!inventoryPanel) return;
  
  // 设置初始显示状态和收缩状态
  inventoryPanel.style.display = 'none';
  
  // 注意：展开/收缩功能现在由 InventoryManager 处理
  // 这个函数现在只负责整个道具栏的显示/隐藏
}

// -------- 设置菜单管理 --------
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

  closeSettingsBtn?.addEventListener('click', () => {
    settingsMenu.style.display = 'none';
  });

  // 快速保存：保存到最近使用的槽位或第一个空槽位
  quickSaveBtn?.addEventListener('click', () => {
    const allSlots = SaveManager.getAllSlotData();
    // 寻找第一个空槽位或使用slot_1
    const targetSlot = allSlots.find(slot => slot.isEmpty) || allSlots[0];
    SaveManager.saveToSlot(targetSlot.slotId, null);
    settingsMenu.style.display = 'none';
  });

  // 打开存档管理
  saveMenuBtn?.addEventListener('click', () => {
    SaveLoadUI.showSaveMenu();
  });

  // 打开读档管理
  loadMenuBtn?.addEventListener('click', () => {
    SaveLoadUI.showLoadMenu();
  });

  returnToMenuBtn?.addEventListener('click', () => {
    // 添加一个确认，防止误触
    if (confirm('确定要返回主菜单吗？未保存的进度将会丢失。')) {
      window.location.href = '../index/index.html';
    }
  });
}

// -------- 游戏初始化 --------
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
      const introScreen = document.getElementById('intro-screen');
      if (introScreen) introScreen.style.display = 'none';
      startInvestigation();
      return;
    } else {
      showTip('存档加载失败，开始新游戏');
      Store.setState({ 
        phase: 'investigation', 
        currentRoom: 'living-room' 
      });
      const introScreen = document.getElementById('intro-screen');
      if (introScreen) introScreen.style.display = 'none';
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
    const introScreen = document.getElementById('intro-screen');
    if (introScreen) introScreen.style.display = 'none';
    startInvestigation();
    return;
  }
  
  // 如果是新游戏且指定了起始房间
  if (newGame === 'true' && startRoom) {
    Store.setState({ 
      phase: 'investigation', 
      currentRoom: startRoom 
    });
    const introScreen = document.getElementById('intro-screen');
    if (introScreen) introScreen.style.display = 'none';
    startInvestigation();
    return;
  }

  const state = Store.getState();
  
  switch(state.phase) {
    case 'dream':
      // 显示开始界面
      const introScreen = document.getElementById('intro-screen');
      if (introScreen) introScreen.style.display = 'flex';
      break;
    case 'police-car':
      initPoliceCar();
      break;
    case 'investigation':
      startInvestigation();
      break;
  }
}

function startInvestigation() {
  const state = Store.getState();
  const initialRoom = state.currentRoom || 'living-room';
  
  // 显示玩家和道具栏
  const player = document.getElementById('player-character');
  const inventory = document.getElementById('inventory-panel');
  const memoryFragments = document.getElementById('memory-fragments');
  const intuitionLevel = document.getElementById('intuition-level-container');
  
  if (player) {
    player.classList.add('show');
    player.style.display = 'block';
  }
  if (inventory) {
    inventory.classList.add('show', 'collapsed'); // 显示且为收缩状态
    inventory.style.display = 'block';
  }
  if (memoryFragments) {
    memoryFragments.style.display = 'flex';
  }
  if (intuitionLevel) {
    intuitionLevel.style.display = 'block';
  }

  // 渲染初始房间
  SceneManager.renderRoom(initialRoom);
  
  // 隐藏intro界面
  const introScreen = document.getElementById('intro-screen');
  if (introScreen) {
    introScreen.style.display = 'none';
  }
  
  // 启动时间管理系统
  TimeManager.startInvestigation();
}

// -------- 事件监听器设置 --------
document.addEventListener('DOMContentLoaded', function() {
  // 初始化用户会话管理
  UserSession.init();
  
  // 初始化所有模块
  PlayerController.initialize();
  InventoryManager.initialize();
  MemoryFragmentManager.initialize();
  DetectiveIntuition.initialize();
  TimeManager.initialize();
  EndingManager.initialize();
  SaveLoadUI.initialize();
  setupSettingsMenu();
  
  // 注释掉重复的初始化，避免冲突
  // initializeInventoryToggle();
  
  // 初始化游戏
  initializeGame();
  
  // 设置intro屏幕点击事件
  const introScreen = document.getElementById('intro-screen');
  if (introScreen) {
    introScreen.addEventListener('click', function() {
      Store.setState({ phase: 'investigation' });
      startInvestigation();
    });
    
    document.addEventListener('keydown', function(e) {
      if (introScreen.style.display !== 'none') {
        Store.setState({ phase: 'investigation' });
        startInvestigation();
      }
    });
  }
});

// -------- 导出全局变量（用于调试） --------
window.GameModules = {
  Store,
  SaveManager,
  SaveLoadUI,
  InventoryManager,
  SceneManager,
  PlayerController,
  GameActions,
  Utils
};
