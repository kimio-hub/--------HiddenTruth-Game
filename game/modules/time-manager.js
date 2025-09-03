// 时间管理系统 - 15分钟调查限制
const TimeManager = (() => {
  let investigationStartTime = null;
  let timeLimit = 15 * 60 * 1000; // 15分钟（毫秒）
  let warningThresholds = [5 * 60 * 1000, 2 * 60 * 1000, 1 * 60 * 1000]; // 5分钟、2分钟、1分钟警告
  let warningsTriggered = [];
  let timeEndCallback = null;
  let isActive = false;

  function initialize() {
    // 创建时间显示UI
    createTimeDisplay();
    
    // 监听游戏阶段变化
    Store.addEventListener(EVENT_TYPES.PHASE_CHANGED, handlePhaseChange);
    
    console.log('TimeManager: 初始化完成');
  }

  function startInvestigation() {
    // 检查是否从存档恢复，如果是则不重新开始计时
    const gameState = Store.getState();
    if (gameState.investigationStartTime && isActive) {
      console.log('TimeManager: 从存档恢复，继续计时');
      return;
    }
    
    investigationStartTime = Date.now();
    isActive = true;
    warningsTriggered = [];
    
    // 更新游戏状态
    Store.setState({ investigationStartTime: investigationStartTime });
    
    console.log('TimeManager: 调查开始，时间限制15分钟');
    
    // 开始时间循环检查
    startTimeLoop();
    
    // 触发调查开始事件
    const event = new CustomEvent('investigationStarted', {
      detail: { startTime: investigationStartTime, timeLimit }
    });
    document.dispatchEvent(event);
  }

  function startTimeLoop() {
    if (!isActive) return;
    
    const elapsed = getElapsedTime();
    const remaining = getRemainingTime();
    
    // 更新时间显示
    updateTimeDisplay(remaining);
    
    // 检查警告阈值
    checkTimeWarnings(remaining);
    
    // 检查时间到期
    if (remaining <= 0) {
      handleTimeUp();
      return;
    }
    
    // 继续循环（每秒更新）
    setTimeout(startTimeLoop, 1000);
  }

  function checkTimeWarnings(remaining) {
    warningThresholds.forEach((threshold, index) => {
      if (remaining <= threshold && !warningsTriggered.includes(threshold)) {
        warningsTriggered.push(threshold);
        showTimeWarning(threshold);
        
        // 触发时间警告事件（影响侦探直感）
        const event = new CustomEvent('timeWarning', {
          detail: { timeRemaining: remaining, threshold }
        });
        document.dispatchEvent(event);
      }
    });
  }

  function showTimeWarning(threshold) {
    const minutes = Math.floor(threshold / 60000);
    let message = '';
    let urgencyClass = '';
    
    if (minutes === 5) {
      message = '还有5分钟...时间有些紧迫了';
      urgencyClass = 'warning-medium';
    } else if (minutes === 2) {
      message = '只剩2分钟！必须加快速度';
      urgencyClass = 'warning-high';
    } else if (minutes === 1) {
      message = '最后1分钟！快没时间了！';
      urgencyClass = 'warning-critical';
    }
    
    const warningElement = document.createElement('div');
    warningElement.className = `time-warning ${urgencyClass}`;
    warningElement.innerHTML = `
      <div class="warning-content">
        <div class="warning-icon">⏰</div>
        <div class="warning-text">${message}</div>
      </div>
    `;
    
    document.body.appendChild(warningElement);
    
    setTimeout(() => {
      warningElement.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      warningElement.remove();
    }, 3000);
  }

  function handleTimeUp() {
    isActive = false;
    console.log('TimeManager: 时间到期');
    
    // 触发时间到期事件
    const event = new CustomEvent('timeUp', {
      detail: { 
        message: '时间到了！催眠效果正在消失...',
        triggerEnding: 'ending_one'
      }
    });
    document.dispatchEvent(event);
    
    // 显示时间到期提示
    showTimeUpMessage();
    
    // 强制结束调查，触发结局一
    setTimeout(() => {
      triggerEnding('ending_one');
    }, 3000);
  }

  function showTimeUpMessage() {
    const messageElement = document.createElement('div');
    messageElement.className = 'time-up-message';
    messageElement.innerHTML = `
      <div class="message-content">
        <h2>时间到了</h2>
        <p>催眠效果正在消失...</p>
        <p>你感到头脑逐渐清醒，但记忆仍然模糊...</p>
      </div>
    `;
    
    document.body.appendChild(messageElement);
    
    setTimeout(() => {
      messageElement.classList.add('show');
    }, 100);
  }

  function createTimeDisplay() {
    const timeDisplay = document.createElement('div');
    timeDisplay.id = 'time-display';
    timeDisplay.innerHTML = `
      <div class="time-container">
        <div class="time-label">调查时间</div>
        <div class="time-value" id="time-value">15:00</div>
        <div class="time-bar-container">
          <div class="time-bar" id="time-bar"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(timeDisplay);
  }

  function updateTimeDisplay(remaining) {
    const timeValue = document.getElementById('time-value');
    const timeBar = document.getElementById('time-bar');
    
    if (!timeValue || !timeBar) return;
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    timeValue.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const percentage = (remaining / timeLimit) * 100;
    timeBar.style.width = `${Math.max(0, percentage)}%`;
    
    // 根据剩余时间改变颜色
    if (percentage > 50) {
      timeBar.className = 'time-bar normal';
    } else if (percentage > 25) {
      timeBar.className = 'time-bar warning';
    } else {
      timeBar.className = 'time-bar critical';
    }
  }

  function handlePhaseChange(event) {
    const { newPhase } = event.detail;
    
    if (newPhase === 'investigation' && !isActive) {
      // 开始调查时启动时间管理
      startInvestigation();
    } else if (newPhase !== 'investigation' && isActive) {
      // 离开调查阶段时停止时间管理
      stopInvestigation();
    }
  }

  function stopInvestigation() {
    isActive = false;
    console.log('TimeManager: 调查结束');
  }

  function getElapsedTime() {
    if (!investigationStartTime) return 0;
    return Date.now() - investigationStartTime;
  }

  function getRemainingTime() {
    const elapsed = getElapsedTime();
    return Math.max(0, timeLimit - elapsed);
  }

  function getTimeStatus() {
    const remaining = getRemainingTime();
    const elapsed = getElapsedTime();
    
    return {
      elapsed,
      remaining,
      isActive,
      percentage: (remaining / timeLimit) * 100,
      isTimeUp: remaining <= 0
    };
  }

  function extendTime(additionalMs) {
    // 特殊情况下延长时间（如发现关键证据）
    timeLimit += additionalMs;
    
    // 更新存档中的时间限制
    const gameState = Store.getState();
    Store.setState({ 
      ...gameState,
      timeLimit: timeLimit 
    });
    
    console.log(`TimeManager: 时间延长 ${additionalMs / 1000} 秒`);
  }

  function saveTimeState() {
    // 保存当前时间状态到Store
    const gameState = Store.getState();
    Store.setState({
      ...gameState,
      investigationStartTime: investigationStartTime,
      timeLimit: timeLimit,
      timeWarnings: warningsTriggered,
      timeManagerActive: isActive
    });
  }

  function restoreFromSave(gameState) {
    console.log('TimeManager: 从存档恢复时间状态', gameState);
    
    // 恢复时间相关状态
    investigationStartTime = gameState.investigationStartTime || null;
    timeLimit = gameState.timeLimit || 15 * 60 * 1000;
    warningsTriggered = gameState.timeWarnings || [];
    isActive = gameState.timeManagerActive || false;
    
    // 如果调查正在进行，重新启动时间循环
    if (isActive && investigationStartTime) {
      console.log('TimeManager: 恢复调查计时');
      startTimeLoop();
      
      // 更新时间显示
      const remaining = getRemainingTime();
      updateTimeDisplay(remaining);
    }
    
    // 确保时间显示器可见（如果在调查阶段）
    if (gameState.phase === 'investigation') {
      const timeDisplay = document.getElementById('time-display');
      if (timeDisplay) {
        timeDisplay.style.display = 'block';
      }
    }
  }

  function triggerEnding(endingType) {
    // 触发对应的结局
    const event = new CustomEvent('gameEnding', {
      detail: { endingType, reason: 'timeUp' }
    });
    document.dispatchEvent(event);
  }

  return {
    initialize,
    startInvestigation,
    stopInvestigation,
    getTimeStatus,
    extendTime,
    saveTimeState,
    restoreFromSave,
    isActive: () => isActive,
    getRemainingTime,
    getElapsedTime
  };
})();
