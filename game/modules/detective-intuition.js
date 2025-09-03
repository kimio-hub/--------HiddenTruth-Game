// 侦探直感系统 - 选择高亮和禁用机制
const DetectiveIntuition = (() => {
  let isActive = true;
  let intuitionLevel = 100; // 直感强度
  
  function initialize() {
    // 监听对话选择事件
    document.addEventListener('dialogueChoice', handleDialogueChoice);
    
    // 监听证据发现事件
    document.addEventListener('evidenceFound', handleEvidenceFound);
    
    // 监听时间事件
    document.addEventListener('timeWarning', handleTimeWarning);
  }
  
  function handleDialogueChoice(event) {
    const { choices, correctChoiceId } = event.detail;
    
    if (!isActive) {
      // 直感失效时，所有选择都可用
      return;
    }
    
    // 高亮正确选择，禁用错误选择
    choices.forEach(choice => {
      const choiceElement = document.getElementById(`choice-${choice.id}`);
      if (!choiceElement) return;
      
      if (choice.id === correctChoiceId) {
        // 正确选择 - 添加直感高亮效果
        choiceElement.classList.add('intuition-highlight');
        choiceElement.style.cursor = 'pointer';
        choiceElement.disabled = false;
      } else {
        // 错误选择 - 禁用
        choiceElement.classList.add('intuition-disabled');
        choiceElement.style.cursor = 'not-allowed';
        choiceElement.disabled = true;
      }
    });
  }
  
  function handleEvidenceFound(event) {
    const { evidenceId } = event.detail;
    
    // 某些证据会触发记忆碎片
    const fragment = MemoryFragmentManager.unlockFragment(evidenceId);
    if (fragment) {
      showIntuitionFlash();
    }
    
    // 检查是否是关键证据点，可能影响直感强度
    if (isKeyEvidence(evidenceId)) {
      updateIntuitionLevel();
    }
  }
  
  function handleTimeWarning(event) {
    const { timeRemaining } = event.detail;
    
    // 时间压力影响直感
    if (timeRemaining < 300000) { // 少于5分钟
      reduceIntuitionLevel(10);
    }
  }
  
  function showIntuitionFlash() {
    // 显示直感激活的视觉效果
    const flash = document.createElement('div');
    flash.className = 'intuition-flash';
    flash.textContent = '侦探的直感！';
    document.body.appendChild(flash);
    
    setTimeout(() => {
      flash.classList.add('flash-animation');
    }, 100);
    
    setTimeout(() => {
      flash.remove();
    }, 2000);
  }
  
  function updateIntuitionLevel() {
    // 根据游戏进度更新直感强度
    const gameState = Store.getState();
    const evidenceCount = gameState.inventory.length;
    
    // 随着证据增多，直感可能减弱（接近真相时的心理压力）
    if (evidenceCount > 5) {
      reduceIntuitionLevel(5);
    }
  }
  
  function reduceIntuitionLevel(amount) {
    intuitionLevel = Math.max(0, intuitionLevel - amount);
    
    // 直感水平低于阈值时完全失效
    if (intuitionLevel < 20) {
      deactivateIntuition();
    }
    
    updateIntuitionDisplay();
  }
  
  function deactivateIntuition() {
    isActive = false;
    
    // 移除所有直感效果
    document.querySelectorAll('.intuition-highlight').forEach(el => {
      el.classList.remove('intuition-highlight');
    });
    
    document.querySelectorAll('.intuition-disabled').forEach(el => {
      el.classList.remove('intuition-disabled');
      el.disabled = false;
      el.style.cursor = 'pointer';
    });
    
    // 显示直感失效提示
    showIntuitionLossMessage();
  }
  
  function showIntuitionLossMessage() {
    const message = document.createElement('div');
    message.className = 'intuition-loss-message';
    message.innerHTML = `
      <div class="message-content">
        <h3>直感失效</h3>
        <p>奇怪...我的直感突然消失了...</p>
        <p>接下来只能靠逻辑推理了。</p>
      </div>
    `;
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      message.remove();
    }, 4000);
  }
  
  function updateIntuitionDisplay() {
    // 更新UI中的直感强度显示
    const intuitionBar = document.getElementById('intuition-level');
    if (intuitionBar) {
      intuitionBar.style.width = `${intuitionLevel}%`;
      intuitionBar.className = `intuition-bar ${getIntuitionLevelClass()}`;
    }
  }
  
  function getIntuitionLevelClass() {
    if (intuitionLevel > 70) return 'high';
    if (intuitionLevel > 40) return 'medium';
    if (intuitionLevel > 20) return 'low';
    return 'critical';
  }
  
  function isKeyEvidence(evidenceId) {
    // 定义哪些证据是关键证据
    const keyEvidences = ['bloodknife', 'insurance', 'hidden_evidence'];
    return keyEvidences.includes(evidenceId);
  }
  
  function forceDeactivate() {
    // 强制失效（剧情需要）
    deactivateIntuition();
  }
  
  function saveIntuitionState() {
    // 保存当前直感状态到Store
    const gameState = Store.getState();
    Store.setState({
      ...gameState,
      intuitionLevel: intuitionLevel,
      intuitionActive: isActive
    });
  }

  function restoreFromSave(gameState) {
    console.log('DetectiveIntuition: 从存档恢复直感状态');
    
    // 恢复直感状态
    intuitionLevel = gameState.intuitionLevel || 100;
    isActive = gameState.intuitionActive !== undefined ? gameState.intuitionActive : true;
    
    // 更新直感显示
    updateIntuitionDisplay();
    
    // 如果直感已失效，确保界面状态正确
    if (!isActive) {
      document.querySelectorAll('.intuition-highlight').forEach(el => {
        el.classList.remove('intuition-highlight');
      });
      
      document.querySelectorAll('.intuition-disabled').forEach(el => {
        el.classList.remove('intuition-disabled');
        el.disabled = false;
        el.style.cursor = 'pointer';
      });
    }
  }

  return {
    initialize,
    isActive: () => isActive,
    getLevel: () => intuitionLevel,
    forceDeactivate,
    updateIntuitionLevel,
    reduceIntuitionLevel,
    saveIntuitionState,
    restoreFromSave
  };
})();
