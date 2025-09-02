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
            const settingsMenu = document.getElementById('settings-menu');
            if (settingsMenu) {
              settingsMenu.style.display = 'none';
            }
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
