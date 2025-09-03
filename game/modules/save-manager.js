// -------- 存档管理系统 --------
const SaveManager = (() => {
  const SAVE_SLOTS_KEY = 'HTG_SAVE_SLOTS_V1';
  const USER_SAVES_KEY = 'HTG_USER_SAVES_V1'; // 新增：用户存档键
  const MAX_SAVE_SLOTS = 5;

  // 获取当前用户的存档键
  function getUserSaveKey() {
    const session = UserSession?.checkSession();
    if (!session) {
      return SAVE_SLOTS_KEY; // 兼容旧版本，未登录用户使用全局存档
    }
    return `${USER_SAVES_KEY}_${session.username}`;
  }

  // 获取当前用户名
  function getCurrentUsername() {
    const session = UserSession?.checkSession();
    return session ? session.username : 'guest';
  }

  function getSaveSlots() {
    try {
      const saveKey = getUserSaveKey();
      const raw = localStorage.getItem(saveKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  // 迁移旧存档到用户存档（仅在用户首次登录时执行）
  function migrateOldSaves(username) {
    try {
      const migrationKey = `HTG_MIGRATION_${username}`;
      if (localStorage.getItem(migrationKey)) {
        return; // 已经迁移过了
      }

      const oldSaves = localStorage.getItem(SAVE_SLOTS_KEY);
      if (oldSaves) {
        const userSaveKey = `${USER_SAVES_KEY}_${username}`;
        const existingUserSaves = localStorage.getItem(userSaveKey);
        
        if (!existingUserSaves) {
          // 只有在用户还没有存档时才迁移
          localStorage.setItem(userSaveKey, oldSaves);
          console.log(`已为用户 ${username} 迁移旧存档`);
        }
      }

      // 标记已完成迁移
      localStorage.setItem(migrationKey, 'true');
    } catch (error) {
      console.error('迁移旧存档失败:', error);
    }
  }

  function saveToSlot(slotId, customName) {
    // 检查登录状态
    if (typeof UserSession !== 'undefined' && !UserSession.checkSession()) {
      showTip('请先登录后再保存游戏');
      if (confirm('是否前往登录页面？')) {
        window.location.href = '../login/login.html';
      }
      return false;
    }

    // 执行存档迁移（如果需要）
    const username = getCurrentUsername();
    if (username !== 'guest') {
      migrateOldSaves(username);
    }
    
    // 在保存前更新所有模块状态
    if (window.TimeManager && typeof TimeManager.saveTimeState === 'function') {
      TimeManager.saveTimeState();
    }
    if (window.MemoryFragmentManager && typeof MemoryFragmentManager.saveFragmentState === 'function') {
      MemoryFragmentManager.saveFragmentState();
    }
    if (window.DetectiveIntuition && typeof DetectiveIntuition.saveIntuitionState === 'function') {
      DetectiveIntuition.saveIntuitionState();
    }
    
    const currentState = Store.getState();
    const saveData = {
      id: slotId,
      name: customName || `存档${slotId.split('_')[1]}`,
      timestamp: Utils.formatTime(),
      roomName: ROOM_NAMES[currentState.currentRoom] || currentState.currentRoom,
      progress: getSaveProgress(currentState),
      timeStatus: getTimeStatusForSave(currentState),
      gameState: currentState,
      owner: username // 添加存档所有者信息
    };
    
    const allSlots = getSaveSlots();
    allSlots[slotId] = saveData;
    
    try {
      const saveKey = getUserSaveKey();
      localStorage.setItem(saveKey, JSON.stringify(allSlots));
      showTip(`已保存到 ${saveData.name} (用户: ${username})`);
      return true;
    } catch (error) {
      showTip('保存失败：存储空间不足');
      return false;
    }
  }

  function loadFromSlot(slotId) {
    // 检查登录状态
    if (typeof UserSession !== 'undefined' && !UserSession.checkSession()) {
      showTip('请先登录后再读取存档');
      if (confirm('是否前往登录页面？')) {
        window.location.href = '../login/login.html';
      }
      return false;
    }

    const allSlots = getSaveSlots();
    const saveData = allSlots[slotId];
    
    if (!saveData || !saveData.gameState) {
      showTip('存档不存在或已损坏');
      return false;
    }

    // 验证存档所有者（如果存档有所有者信息）
    const currentUser = getCurrentUsername();
    if (saveData.owner && saveData.owner !== currentUser) {
      showTip(`此存档属于用户 "${saveData.owner}"，无法读取`);
      return false;
    }
    
    try {
      Store.setState(saveData.gameState);
      
      // 恢复场景
      if (window.SceneManager && typeof SceneManager.renderRoom === 'function') {
        SceneManager.renderRoom(saveData.gameState.currentRoom);
      }
      
      // 恢复道具栏
      if (window.InventoryManager && typeof InventoryManager.updateInventoryDisplay === 'function') {
        InventoryManager.updateInventoryDisplay();
      }
      
      // 恢复记忆碎片状态
      if (window.MemoryFragmentManager && typeof MemoryFragmentManager.restoreFromSave === 'function') {
        MemoryFragmentManager.restoreFromSave(saveData.gameState);
      }
      
      // 恢复侦探直感状态
      if (window.DetectiveIntuition && typeof DetectiveIntuition.restoreFromSave === 'function') {
        DetectiveIntuition.restoreFromSave(saveData.gameState);
      }
      
      // 恢复时间管理状态
      if (window.TimeManager && typeof TimeManager.restoreFromSave === 'function') {
        TimeManager.restoreFromSave(saveData.gameState);
      }
      
      showTip(`已读取存档：${saveData.name}`);
      return true;
    } catch (error) {
      console.error('读取存档失败:', error);
      showTip('读取存档失败：数据损坏');
      return false;
    }
  }

  function deleteSlot(slotId) {
    // 检查登录状态
    if (typeof UserSession !== 'undefined' && !UserSession.checkSession()) {
      showTip('请先登录后再删除存档');
      return false;
    }

    const allSlots = getSaveSlots();
    const saveData = allSlots[slotId];
    
    if (!saveData) {
      showTip('存档不存在');
      return false;
    }

    // 验证存档所有者
    const currentUser = getCurrentUsername();
    if (saveData.owner && saveData.owner !== currentUser) {
      showTip(`此存档属于用户 "${saveData.owner}"，无法删除`);
      return false;
    }
    
    if (confirm(`确定要删除存档"${saveData.name}"吗？此操作不可恢复。`)) {
      delete allSlots[slotId];
      const saveKey = getUserSaveKey();
      localStorage.setItem(saveKey, JSON.stringify(allSlots));
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

  function getTimeStatusForSave(gameState) {
    // 获取时间状态信息用于存档显示
    if (gameState.investigationStartTime && gameState.timeManagerActive) {
      const elapsed = Date.now() - gameState.investigationStartTime;
      const remaining = Math.max(0, (gameState.timeLimit || 15 * 60 * 1000) - elapsed);
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      
      return {
        timeRemaining: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        isActive: true,
        elapsed: elapsed
      };
    }
    
    return {
      timeRemaining: '15:00',
      isActive: false,
      elapsed: 0
    };
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

  // 自动保存功能（用户隔离）
  function autoSave() {
    const username = getCurrentUsername();
    const currentState = Store.getState();
    
    try {
      const autoSaveKey = `HTG_AUTO_SAVE_${username}`;
      localStorage.setItem(autoSaveKey, JSON.stringify(currentState));
      return true;
    } catch (error) {
      console.warn('自动保存失败:', error);
      return false;
    }
  }

  // 读取自动保存（用户隔离）
  function loadAutoSave() {
    const username = getCurrentUsername();
    
    try {
      const autoSaveKey = `HTG_AUTO_SAVE_${username}`;
      const raw = localStorage.getItem(autoSaveKey);
      if (raw) {
        const saveData = JSON.parse(raw);
        Store.setState(saveData);
        return true;
      }
    } catch (error) {
      console.warn('读取自动保存失败:', error);
    }
    return false;
  }

  return {
    saveToSlot,
    loadFromSlot,
    deleteSlot,
    getAllSlotData,
    getSaveSlots,
    getSaveProgress,
    getTimeStatusForSave,
    migrateOldSaves,
    autoSave,
    loadAutoSave
  };
})();
