// -------- 状态管理系统 --------
const Store = (() => {
  let data = {
    phase: 'dream', // 'dream', 'police-car', 'investigation'
    currentRoom: null,
    inventory: [], // 存储玩家收集的道具
    evidences: {}, // 存储发现的证据
    roomStates: {}, // 存储各房间的状态
    dialogueHistory: [], // 对话历史
    gameProgress: {
      itemsCollected: 0,
      evidencesFound: 0,
      roomsVisited: []
    }
  };

  // 事件监听器
  const listeners = {};

  function getState() {
    return { ...data };
  }

  function setState(newData) {
    const oldData = { ...data };
    data = { ...data, ...newData };
    
    // 触发状态变化事件
    triggerEvent('stateChanged', { oldData, newData: data });
  }

  function updateInventory(item) {
    if (!data.inventory.includes(item)) {
      data.inventory.push(item);
      data.gameProgress.itemsCollected = data.inventory.length;
      triggerEvent(EVENT_TYPES.ITEM_COLLECTED, { item, inventory: data.inventory });
    }
  }

  function addEvidence(evidenceId, evidence) {
    data.evidences[evidenceId] = evidence;
    data.gameProgress.evidencesFound = Object.keys(data.evidences).length;
    triggerEvent(EVENT_TYPES.EVIDENCE_FOUND, { evidenceId, evidence });
  }

  function updateRoomState(roomId, state) {
    if (!data.roomStates[roomId]) {
      data.roomStates[roomId] = {};
    }
    data.roomStates[roomId] = { ...data.roomStates[roomId], ...state };
  }

  function visitRoom(roomId) {
    if (!data.gameProgress.roomsVisited.includes(roomId)) {
      data.gameProgress.roomsVisited.push(roomId);
      triggerEvent(EVENT_TYPES.ROOM_CHANGED, { roomId, visitedRooms: data.gameProgress.roomsVisited });
    }
    data.currentRoom = roomId;
  }

  function resetToInitialState() {
    data = {
      phase: 'investigation',
      currentRoom: 'living-room',
      inventory: [],
      evidences: {},
      roomStates: {},
      dialogueHistory: [],
      gameProgress: {
        itemsCollected: 0,
        evidencesFound: 0,
        roomsVisited: []
      }
    };
    triggerEvent('stateReset', { newData: data });
  }

  // 事件系统
  function addEventListener(eventType, callback) {
    if (!listeners[eventType]) {
      listeners[eventType] = [];
    }
    listeners[eventType].push(callback);
  }

  function removeEventListener(eventType, callback) {
    if (listeners[eventType]) {
      listeners[eventType] = listeners[eventType].filter(cb => cb !== callback);
    }
  }

  function triggerEvent(eventType, data) {
    if (listeners[eventType]) {
      listeners[eventType].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Event listener error for ${eventType}:`, error);
        }
      });
    }
  }

  return {
    getState,
    setState,
    updateInventory,
    addEvidence,
    updateRoomState,
    visitRoom,
    resetToInitialState,
    addEventListener,
    removeEventListener,
    triggerEvent
  };
})();
