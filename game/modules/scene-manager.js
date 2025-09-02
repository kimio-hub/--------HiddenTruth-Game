// -------- 场景管理系统 --------
const SceneManager = (() => {
  let currentRoom = null;
  const gameContainer = document.getElementById('game-container');
  const backgroundImage = document.querySelector('.background-image');

  function renderRoom(roomId) {
    const roomData = ROOM_DATA[roomId];
    if (!roomData) {
      console.error(`房间数据不存在: ${roomId}`);
      return false;
    }

    currentRoom = roomId;
    Store.visitRoom(roomId);
    
    // 更新背景图片
    if (backgroundImage) {
      backgroundImage.src = roomData.background;
      backgroundImage.alt = roomData.name;
    }

    // 清除现有的交互对象
    clearInteractables();
    
    // 渲染新的交互对象
    renderInteractables(roomData.interactables, roomId);
    
    // 更新玩家位置（可选）
    updatePlayerPosition();
    
    // 触发房间切换事件
    Store.triggerEvent(EVENT_TYPES.ROOM_CHANGED, { 
      roomId, 
      roomName: roomData.name,
      roomData 
    });

    return true;
  }

  function clearInteractables() {
    const existingInteractables = document.querySelectorAll('.interactable');
    existingInteractables.forEach(el => el.remove());
  }

  function renderInteractables(interactables, roomId) {
    const roomState = Store.getState().roomStates[roomId] || {};
    
    interactables.forEach(interactable => {
      // 检查是否已经被收集或隐藏
      if (interactable.type === 'item' && roomState[interactable.id + '_collected']) {
        return; // 不渲染已收集的道具
      }

      const element = createInteractableElement(interactable);
      gameContainer.appendChild(element);
    });
  }

  function createInteractableElement(interactable) {
    const element = document.createElement('div');
    element.className = `interactable interactable-${interactable.type}`;
    element.dataset.interactableId = interactable.id;
    element.dataset.action = interactable.action || '';
    element.dataset.target = interactable.target || '';
    
    // 设置位置和大小
    element.style.position = 'absolute';
    element.style.left = `${interactable.x}px`;
    element.style.top = `${interactable.y}px`;
    element.style.width = `${interactable.width}px`;
    element.style.height = `${interactable.height}px`;
    
    // 根据类型设置样式和内容
    switch (interactable.type) {
      case 'door':
        element.style.border = '2px dashed rgba(0, 255, 0, 0.5)';
        element.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
        element.innerHTML = `<div class="door-label">${ROOM_NAMES[interactable.target] || interactable.description}</div>`;
        break;
        
      case 'item':
        element.style.border = '2px solid rgba(255, 215, 0, 0.8)';
        element.style.backgroundColor = 'rgba(255, 215, 0, 0.3)';
        element.style.borderRadius = '50%';
        element.innerHTML = `<div class="item-highlight">💎</div>`;
        element.style.animation = 'item-pulse 2s infinite';
        break;
        
      case 'search':
        element.style.border = '2px dashed rgba(0, 150, 255, 0.5)';
        element.style.backgroundColor = 'rgba(0, 150, 255, 0.1)';
        element.innerHTML = `<div class="search-label">🔍 ${interactable.description}</div>`;
        break;
        
      case 'examine':
        element.style.border = '2px dotted rgba(150, 0, 255, 0.5)';
        element.style.backgroundColor = 'rgba(150, 0, 255, 0.1)';
        element.innerHTML = `<div class="examine-label">👁️ ${interactable.description}</div>`;
        break;
        
      default:
        element.style.border = '2px solid rgba(255, 255, 255, 0.5)';
        element.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        break;
    }
    
    // 添加鼠标悬停效果
    element.addEventListener('mouseenter', () => {
      element.style.transform = 'scale(1.05)';
      showInteractionPrompt(interactable.description || '交互对象');
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.transform = 'scale(1)';
      hideInteractionPrompt();
    });
    
    return element;
  }

  function updatePlayerPosition() {
    // 简单的玩家位置更新，可以根据需要扩展
    const player = document.getElementById('player-character');
    if (player) {
      // 可以根据房间设置默认玩家位置
      player.style.left = '400px';
      player.style.top = '300px';
    }
  }

  function showInteractionPrompt(text) {
    const prompt = document.getElementById('interaction-prompt');
    if (prompt) {
      prompt.textContent = `按 E 键 ${text}`;
      prompt.style.display = 'block';
    }
  }

  function hideInteractionPrompt() {
    const prompt = document.getElementById('interaction-prompt');
    if (prompt) {
      prompt.style.display = 'none';
    }
  }

  function getInteractableAt(x, y) {
    if (!currentRoom) return null;
    
    const roomData = ROOM_DATA[currentRoom];
    if (!roomData) return null;
    
    return roomData.interactables.find(interactable => 
      Utils.checkCollision(x, y, interactable)
    );
  }

  function removeInteractable(interactableId) {
    const element = document.querySelector(`[data-interactable-id="${interactableId}"]`);
    if (element) {
      element.remove();
    }
    
    // 更新房间状态
    Store.updateRoomState(currentRoom, {
      [interactableId + '_collected']: true
    });
  }

  function getCurrentRoom() {
    return currentRoom;
  }

  function getRoomData(roomId) {
    return ROOM_DATA[roomId] || null;
  }

  function isValidRoom(roomId) {
    return ROOM_DATA.hasOwnProperty(roomId);
  }

  // 房间切换动画
  function changeRoomWithTransition(newRoomId, transitionType = 'fade') {
    return new Promise((resolve) => {
      const container = document.getElementById('game-container');
      
      // 淡出效果
      container.style.transition = 'opacity 0.3s ease-in-out';
      container.style.opacity = '0';
      
      setTimeout(() => {
        renderRoom(newRoomId);
        
        // 淡入效果
        setTimeout(() => {
          container.style.opacity = '1';
          resolve();
        }, 50);
      }, 300);
    });
  }

  return {
    renderRoom,
    changeRoomWithTransition,
    clearInteractables,
    getInteractableAt,
    removeInteractable,
    getCurrentRoom,
    getRoomData,
    isValidRoom,
    showInteractionPrompt,
    hideInteractionPrompt
  };
})();
