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
      timestamp: Utils.formatTime(),
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
      if (window.SceneManager && typeof SceneManager.renderRoom === 'function') {
        SceneManager.renderRoom(saveData.gameState.currentRoom);
      }
      if (window.InventoryManager && typeof InventoryManager.updateInventoryDisplay === 'function') {
        InventoryManager.updateInventoryDisplay();
      }
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

  // 自动保存功能（兼容性）
  function autoSave() {
    const currentState = Store.getState();
    try {
      localStorage.setItem('HTG_SAVE_V1', JSON.stringify(currentState));
      return true;
    } catch (error) {
      console.warn('自动保存失败:', error);
      return false;
    }
  }

  // 读取自动保存（兼容性）
  function loadAutoSave() {
    try {
      const raw = localStorage.getItem('HTG_SAVE_V1');
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
    autoSave,
    loadAutoSave
  };
})();
