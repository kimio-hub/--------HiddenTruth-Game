// 记忆碎片管理器 - 扩展现有道具系统
const MemoryFragmentManager = (() => {
  const fragments = new Map();
  const puzzleGrid = Array(3).fill().map(() => Array(3).fill(null)); // 3x3拼图网格
  
  function initialize() {
    // 初始化记忆碎片数据
    const fragmentData = [
      {
        id: 'witness_1',
        name: '目击片段1',
        icon: '🧩',
        description: '模糊的身影...',
        gridPosition: {x: 0, y: 0},
        triggerEvidence: 'bloodknife'
      },
      {
        id: 'witness_2', 
        name: '目击片段2',
        icon: '🧩',
        description: '争执的声音...',
        gridPosition: {x: 1, y: 0},
        triggerEvidence: 'tornletter'
      },
      // 更多碎片...
    ];
    
    fragmentData.forEach(fragment => {
      fragments.set(fragment.id, {
        ...fragment,
        unlocked: false,
        placed: false
      });
    });
  }
  
  function unlockFragment(evidenceId) {
    // 当发现特定证据时解锁对应的记忆碎片
    for (let [id, fragment] of fragments) {
      if (fragment.triggerEvidence === evidenceId && !fragment.unlocked) {
        fragment.unlocked = true;
        showFragmentUnlockAnimation(fragment);
        updateFragmentDisplay();
        return fragment;
      }
    }
    return null;
  }
  
  function placeFragment(fragmentId, gridX, gridY) {
    const fragment = fragments.get(fragmentId);
    if (fragment && fragment.unlocked && !fragment.placed) {
      if (fragment.gridPosition.x === gridX && fragment.gridPosition.y === gridY) {
        puzzleGrid[gridY][gridX] = fragmentId;
        fragment.placed = true;
        checkPuzzleComplete();
        return true;
      }
    }
    return false;
  }
  
  function checkPuzzleComplete() {
    const allPlaced = puzzleGrid.every(row => 
      row.every(cell => cell !== null)
    );
    
    if (allPlaced) {
      revealTruth();
    }
    
    return allPlaced;
  }
  
  function revealTruth() {
    // 拼图完成，显示完整记忆
    const truthRevealEvent = new CustomEvent('truthRevealed', {
      detail: { 
        message: '真相大白！你想起了一切...',
        ending: 'true_ending'
      }
    });
    document.dispatchEvent(truthRevealEvent);
  }
  
  function showFragmentUnlockAnimation(fragment) {
    // 显示记忆碎片解锁动画
    const notification = document.createElement('div');
    notification.className = 'memory-fragment-unlock';
    notification.innerHTML = `
      <div class="fragment-icon">${fragment.icon}</div>
      <div class="fragment-name">${fragment.name}</div>
      <div class="fragment-desc">${fragment.description}</div>
    `;
    document.body.appendChild(notification);
    
    // 动画效果
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  function updateFragmentDisplay() {
    // 更新页面上的记忆碎片显示
    const fragmentContainer = document.getElementById('memory-fragments');
    if (!fragmentContainer) return;
    
    fragmentContainer.innerHTML = '';
    
    for (let [id, fragment] of fragments) {
      if (fragment.unlocked) {
        const fragmentElement = document.createElement('div');
        fragmentElement.className = `memory-fragment ${fragment.placed ? 'placed' : 'available'}`;
        fragmentElement.innerHTML = `
          <div class="fragment-piece" data-fragment-id="${id}">
            ${fragment.icon}
          </div>
        `;
        fragmentContainer.appendChild(fragmentElement);
      }
    }
  }
  
  function restoreFromSave(gameState) {
    console.log('MemoryFragmentManager: 从存档恢复记忆碎片状态');
    
    // 恢复碎片解锁状态
    if (gameState.memoryFragments && Array.isArray(gameState.memoryFragments)) {
      gameState.memoryFragments.forEach(fragmentData => {
        const fragment = fragments.get(fragmentData.id);
        if (fragment) {
          fragment.unlocked = fragmentData.unlocked;
          fragment.placed = fragmentData.placed;
          
          if (fragmentData.placed) {
            const pos = fragmentData.gridPosition;
            puzzleGrid[pos.y][pos.x] = fragmentData.id;
          }
        }
      });
    }
    
    updateFragmentDisplay();
    
    // 检查拼图是否已完成
    checkPuzzleComplete();
  }

  function saveFragmentState() {
    // 保存当前碎片状态到Store
    const fragmentData = Array.from(fragments.values()).map(fragment => ({
      id: fragment.id,
      unlocked: fragment.unlocked,
      placed: fragment.placed,
      gridPosition: fragment.gridPosition
    }));
    
    const gameState = Store.getState();
    Store.setState({
      ...gameState,
      memoryFragments: fragmentData
    });
  }

  return {
    initialize,
    unlockFragment,
    placeFragment,
    checkPuzzleComplete,
    restoreFromSave,
    saveFragmentState,
    getUnlockedFragments: () => Array.from(fragments.values()).filter(f => f.unlocked),
    getAllFragments: () => Array.from(fragments.values())
  };
})();
