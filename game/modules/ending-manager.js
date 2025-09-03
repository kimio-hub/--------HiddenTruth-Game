// 结局管理系统 - 多重结局分支逻辑
const EndingManager = (() => {
  const endings = {
    ending_one: {
      id: 'ending_one',
      name: '疑虑重重',
      description: '时间到了，催眠失效，夏洛记忆不全，被释放但内心充满疑虑',
      triggerConditions: {
        timeUp: true,
        minEvidence: 0
      },
      unlocked: false
    },
    ending_two: {
      id: 'ending_two', 
      name: '沉冤难雪',
      description: '夏洛未能发现隐藏证据，被错误定罪',
      triggerConditions: {
        timeUp: false,
        allEvidenceFound: true,
        hiddenEvidenceFound: false
      },
      unlocked: false
    },
    ending_three: {
      id: 'ending_three',
      name: '真相大白',
      description: '夏洛发现隐藏证据，拼合完整记忆，证明自己清白',
      triggerConditions: {
        timeUp: false,
        allEvidenceFound: true,
        hiddenEvidenceFound: true,
        memoryPuzzleComplete: true
      },
      unlocked: false
    }
  };

  let currentEndingPath = null;
  let endingTriggered = false;

  function initialize() {
    // 监听各种游戏事件
    document.addEventListener('timeUp', handleTimeUp);
    document.addEventListener('evidenceAnalysisComplete', checkEndingConditions);
    document.addEventListener('hiddenEvidenceFound', handleHiddenEvidenceFound);
    document.addEventListener('truthRevealed', handleTruthRevealed);
    document.addEventListener('investigationAbandoned', handleInvestigationAbandoned);
    
    console.log('EndingManager: 初始化完成');
  }

  function handleTimeUp(event) {
    if (endingTriggered) return;
    
    console.log('EndingManager: 时间到期，触发结局一');
    triggerEnding('ending_one', {
      reason: '时间耗尽',
      details: '催眠时间到期，记忆恢复不完整'
    });
  }

  function handleHiddenEvidenceFound(event) {
    const { evidenceId } = event.detail;
    console.log('EndingManager: 发现隐藏证据', evidenceId);
    
    // 发现隐藏证据后，开启真结局路径
    currentEndingPath = 'ending_three';
    
    // 显示特殊提示
    showSpecialMessage('关键证据', '你发现了一个重要线索...这改变了一切');
  }

  function handleTruthRevealed(event) {
    if (endingTriggered) return;
    
    console.log('EndingManager: 真相揭示，触发真结局');
    triggerEnding('ending_three', {
      reason: '记忆完全恢复',
      details: '拼图完成，真相大白'
    });
  }

  function handleInvestigationAbandoned(event) {
    if (endingTriggered) return;
    
    // 玩家选择放弃调查
    const gameState = Store.getState();
    const evidenceCount = gameState.inventory?.length || 0;
    
    if (evidenceCount >= 5) {
      // 有足够证据但选择放弃，触发结局二
      triggerEnding('ending_two', {
        reason: '放弃调查',
        details: '虽然收集了证据，但选择相信表面现象'
      });
    } else {
      // 证据不足就放弃，触发结局一
      triggerEnding('ending_one', {
        reason: '调查不充分',
        details: '过早放弃调查，真相永远埋藏'
      });
    }
  }

  function checkEndingConditions() {
    if (endingTriggered) return;
    
    const gameState = Store.getState();
    const timeStatus = TimeManager.getTimeStatus();
    const evidenceCount = gameState.inventory?.length || 0;
    const hasHiddenEvidence = hasFoundHiddenEvidence();
    const memoryComplete = MemoryFragmentManager.checkPuzzleComplete();
    
    console.log('EndingManager: 检查结局条件', {
      evidenceCount,
      hasHiddenEvidence,
      memoryComplete,
      timeUp: timeStatus.isTimeUp
    });
    
    // 如果时间到了，触发结局一
    if (timeStatus.isTimeUp) {
      triggerEnding('ending_one', {
        reason: '时间耗尽',
        details: '催眠时间到期'
      });
      return;
    }
    
    // 如果收集了所有普通证据
    if (evidenceCount >= 5) {
      if (hasHiddenEvidence && memoryComplete) {
        // 真结局：发现隐藏证据且拼图完成
        triggerEnding('ending_three', {
          reason: '真相大白',
          details: '发现了所有证据并恢复了完整记忆'
        });
      } else if (!hasHiddenEvidence) {
        // 结局二：未发现隐藏证据
        showEndingChoicePrompt();
      }
    }
  }

  function showEndingChoicePrompt() {
    // 显示结局分支选择
    const choiceModal = document.createElement('div');
    choiceModal.className = 'ending-choice-modal';
    choiceModal.innerHTML = `
      <div class="choice-content">
        <h2>调查结论</h2>
        <p>你已经收集了足够的证据，可以得出结论了。</p>
        <p>但是...你的直感告诉你，事情可能没那么简单。</p>
        <div class="choice-buttons">
          <button id="continue-investigation" class="choice-btn primary">
            继续深入调查
          </button>
          <button id="conclude-investigation" class="choice-btn secondary">
            结束调查，得出结论
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(choiceModal);
    
    // 绑定选择事件
    document.getElementById('continue-investigation').addEventListener('click', () => {
      choiceModal.remove();
      enableHiddenEvidenceSearch();
    });
    
    document.getElementById('conclude-investigation').addEventListener('click', () => {
      choiceModal.remove();
      triggerEnding('ending_two', {
        reason: '选择结束调查',
        details: '基于现有证据得出了错误结论'
      });
    });
    
    setTimeout(() => {
      choiceModal.classList.add('show');
    }, 100);
  }

  function enableHiddenEvidenceSearch() {
    // 启用隐藏证据搜索模式
    console.log('EndingManager: 启用隐藏证据搜索');
    
    // 给玩家一些额外时间
    TimeManager.extendTime(5 * 60 * 1000); // 延长5分钟
    
    // 显示提示
    showSpecialMessage('深入调查', '你决定更仔细地检查现场...');
    
    // 触发隐藏证据激活事件
    const event = new CustomEvent('hiddenEvidenceSearchEnabled');
    document.dispatchEvent(event);
  }

  function hasFoundHiddenEvidence() {
    const gameState = Store.getState();
    const inventory = gameState.inventory || [];
    
    // 检查是否有隐藏证据标记的道具
    return inventory.some(itemId => {
      const itemData = InventoryManager.ITEMS_DATA?.[itemId];
      return itemData?.category === 'hidden_evidence';
    });
  }

  function triggerEnding(endingId, context = {}) {
    if (endingTriggered) return;
    
    endingTriggered = true;
    const ending = endings[endingId];
    
    if (!ending) {
      console.error('EndingManager: 未知的结局ID', endingId);
      return;
    }
    
    ending.unlocked = true;
    console.log('EndingManager: 触发结局', endingId, context);
    
    // 停止时间管理
    TimeManager.stopInvestigation();
    
    // 保存结局到游戏状态
    Store.setState({ 
      currentEnding: endingId,
      endingContext: context,
      gameCompleted: true
    });
    
    // 显示结局界面
    showEndingScreen(ending, context);
  }

  function showEndingScreen(ending, context) {
    const endingScreen = document.createElement('div');
    endingScreen.className = 'ending-screen';
    endingScreen.innerHTML = `
      <div class="ending-content">
        <div class="ending-header">
          <h1 class="ending-title">${ending.name}</h1>
          <div class="ending-subtitle">${getEndingSubtitle(ending.id)}</div>
        </div>
        <div class="ending-description">
          <p>${ending.description}</p>
          ${context.details ? `<p class="ending-details">${context.details}</p>` : ''}
        </div>
        <div class="ending-stats">
          ${generateEndingStats()}
        </div>
        <div class="ending-actions">
          <button id="restart-game" class="ending-btn primary">重新开始</button>
          <button id="return-menu" class="ending-btn secondary">返回主菜单</button>
          ${ending.id !== 'ending_three' ? '<button id="try-again" class="ending-btn">再试一次</button>' : ''}
        </div>
      </div>
    `;
    
    document.body.appendChild(endingScreen);
    
    // 绑定按钮事件
    setupEndingButtons(endingScreen);
    
    setTimeout(() => {
      endingScreen.classList.add('show');
    }, 100);
  }

  function getEndingSubtitle(endingId) {
    const subtitles = {
      ending_one: '记忆模糊，疑虑重重',
      ending_two: '被错误定罪，沉冤莫雪', 
      ending_three: '真相大白，正义得以伸张'
    };
    return subtitles[endingId] || '';
  }

  function generateEndingStats() {
    const gameState = Store.getState();
    const timeStatus = TimeManager.getTimeStatus();
    const evidenceCount = gameState.inventory?.length || 0;
    const fragmentsUnlocked = MemoryFragmentManager.getUnlockedFragments().length;
    
    return `
      <div class="stat-item">
        <span class="stat-label">证据收集：</span>
        <span class="stat-value">${evidenceCount} 个</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">记忆碎片：</span>
        <span class="stat-value">${fragmentsUnlocked} 片</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">调查用时：</span>
        <span class="stat-value">${formatTime(timeStatus.elapsed)}</span>
      </div>
    `;
  }

  function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  }

  function setupEndingButtons(endingScreen) {
    const restartBtn = endingScreen.querySelector('#restart-game');
    const menuBtn = endingScreen.querySelector('#return-menu');
    const tryAgainBtn = endingScreen.querySelector('#try-again');
    
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        location.reload();
      });
    }
    
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        window.location.href = '../index.html';
      });
    }
    
    if (tryAgainBtn) {
      tryAgainBtn.addEventListener('click', () => {
        // 重置到调查开始状态
        resetToInvestigationStart();
        endingScreen.remove();
      });
    }
  }

  function resetToInvestigationStart() {
    // 重置游戏状态到调查开始
    endingTriggered = false;
    currentEndingPath = null;
    
    Store.setState({
      phase: 'investigation',
      currentEnding: null,
      endingContext: null,
      gameCompleted: false,
      inventory: []
    });
    
    // 重新初始化相关系统
    TimeManager.startInvestigation();
    MemoryFragmentManager.initialize();
    DetectiveIntuition.initialize();
  }

  function showSpecialMessage(title, message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'special-message';
    messageElement.innerHTML = `
      <div class="message-content">
        <h3>${title}</h3>
        <p>${message}</p>
      </div>
    `;
    
    document.body.appendChild(messageElement);
    
    setTimeout(() => {
      messageElement.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      messageElement.remove();
    }, 4000);
  }

  return {
    initialize,
    triggerEnding,
    checkEndingConditions,
    hasFoundHiddenEvidence,
    getUnlockedEndings: () => Object.values(endings).filter(e => e.unlocked),
    getCurrentEndingPath: () => currentEndingPath,
    isEndingTriggered: () => endingTriggered
  };
})();
