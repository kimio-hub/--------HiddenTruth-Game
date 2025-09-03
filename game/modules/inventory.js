// -------- 道具系统管理 --------
const InventoryManager = (() => {
  const inventoryPanel = document.getElementById('inventory-panel');
  const inventorySlots = document.getElementById('inventory-slots');
  const toggleBtn = document.getElementById('inventory-toggle');
  const itemDetailModal = document.getElementById('item-detail-modal');
  
  let isExpanded = false;

  // 道具数据库
  const ITEMS_DATA = {
    'bloodknife': {
      id: 'bloodknife',
      name: '带血菜刀',
      icon: '🔪',
      description: '一把沾满血迹的菜刀，看起来很可疑。血迹已经干涸，但仍然清晰可见。',
      category: 'evidence',
      rarity: 'rare'
    },
    'insurance': {
      id: 'insurance',
      name: '保险单',
      icon: '📄',
      description: '一份人寿保险单，受益人栏写着一个陌生的名字。保额相当可观。',
      category: 'document',
      rarity: 'common'
    },
    'tornletter': {
      id: 'tornletter',
      name: '撕碎的信件',
      icon: '📝',
      description: '被撕碎的信件片段，隐约能看到一些威胁性的字句。看起来像是某种警告。',
      category: 'evidence',
      rarity: 'uncommon'
    }
  };

  function initialize() {
    console.log('InventoryManager: 开始初始化');
    console.log('inventoryPanel:', inventoryPanel);
    console.log('inventorySlots:', inventorySlots);
    console.log('toggleBtn:', toggleBtn);
    
    if (!inventoryPanel || !inventorySlots) {
      console.error('InventoryManager: 必要的DOM元素未找到');
      return false;
    }

    // 设置初始状态为收缩
    inventoryPanel.classList.add('collapsed');
    inventoryPanel.classList.remove('expanded');

    // 为整个道具栏面板添加点击事件
    inventoryPanel.addEventListener('click', function(e) {
      console.log('道具栏面板被点击', e.target);
      // 如果点击的是道具槽位内容，不触发toggle
      if (e.target.closest('.inventory-slots')) {
        console.log('点击的是道具槽位，不触发toggle');
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      toggleInventory();
    });

    // 切换道具栏展开/收缩状态
    const inventoryHeader = document.querySelector('.inventory-header');
    console.log('inventoryHeader:', inventoryHeader);
    if (inventoryHeader) {
      inventoryHeader.addEventListener('click', function(e) {
        console.log('道具栏标题被点击');
        e.preventDefault();
        e.stopPropagation();
        toggleInventory();
      });
    }
    
    // 也为toggle按钮单独添加事件监听
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function(e) {
        console.log('toggle按钮被点击');
        e.preventDefault();
        e.stopPropagation();
        toggleInventory();
      });
    }
    
    // 监听状态变化
    if (typeof Store !== 'undefined' && typeof EVENT_TYPES !== 'undefined') {
      Store.addEventListener(EVENT_TYPES.ITEM_COLLECTED, handleItemCollected);
    }
    
    // 点击道具显示详情
    inventorySlots.addEventListener('click', handleItemClick);
    
    // 关闭道具详情弹窗
    const closeBtn = document.getElementById('close-item-detail');
    if (closeBtn) {
      closeBtn.addEventListener('click', hideItemDetail);
    }
    
    // 点击弹窗背景关闭
    if (itemDetailModal) {
      itemDetailModal.addEventListener('click', (e) => {
        if (e.target === itemDetailModal) {
          hideItemDetail();
        }
      });
    }

    updateInventoryDisplay();
    console.log('InventoryManager: 初始化完成');
    return true;
  }

  function toggleInventory() {
    console.log('toggleInventory被调用，当前状态:', isExpanded);
    isExpanded = !isExpanded;
    console.log('新状态:', isExpanded);
    
    if (isExpanded) {
      inventoryPanel.classList.remove('collapsed');
      inventoryPanel.classList.add('expanded');
      console.log('设置为展开状态');
    } else {
      inventoryPanel.classList.remove('expanded');
      inventoryPanel.classList.add('collapsed');
      console.log('设置为收缩状态');
    }
    
    // 更新按钮图标
    const toggleIcon = document.querySelector('.inventory-toggle');
    if (toggleIcon) {
      toggleIcon.textContent = isExpanded ? '🔽' : '📦';
      console.log('图标更新为:', toggleIcon.textContent);
    } else {
      console.error('找不到toggle图标元素');
    }
  }

  function handleItemCollected(eventData) {
    const { item } = eventData;
    updateInventoryDisplay();
    showTip(`获得道具：${ITEMS_DATA[item]?.name || item}`);
  }

  function updateInventoryDisplay() {
    if (!inventorySlots) return;
    
    const gameState = typeof Store !== 'undefined' ? Store.getState() : { inventory: [] };
    const inventory = gameState.inventory || [];
    
    inventorySlots.innerHTML = '';
    
    // 创建道具槽位（12个槽位，4x3网格）
    for (let i = 0; i < 12; i++) {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      
      if (i < inventory.length) {
        const item = inventory[i];
        const itemData = ITEMS_DATA[item];
        
        if (itemData) {
          slot.innerHTML = `
            <div class="item-icon" data-item-id="${item}">
              ${itemData.icon}
            </div>
            <div class="item-name">${itemData.name}</div>
          `;
          slot.classList.add('has-item', itemData.rarity);
        } else {
          slot.innerHTML = `<div class="item-icon">?</div><div class="item-name">未知道具</div>`;
          slot.classList.add('has-item');
        }
      } else {
        slot.innerHTML = '<div class="empty-slot">空</div>';
        slot.classList.add('empty');
      }
      
      inventorySlots.appendChild(slot);
    }
  }

  function handleItemClick(e) {
    const itemIcon = e.target.closest('.item-icon[data-item-id]');
    if (itemIcon) {
      const itemId = itemIcon.dataset.itemId;
      showItemDetail(itemId);
    }
  }

  function showItemDetail(itemId) {
    const itemData = ITEMS_DATA[itemId];
    if (!itemData || !itemDetailModal) return;

    const iconElement = document.getElementById('item-detail-icon');
    const nameElement = document.getElementById('item-detail-name');
    const descElement = document.getElementById('item-detail-description');
    const obtainedElement = document.getElementById('item-detail-obtained');

    if (iconElement) iconElement.textContent = itemData.icon;
    if (nameElement) nameElement.textContent = itemData.name;
    if (descElement) descElement.textContent = itemData.description;
    if (obtainedElement) obtainedElement.textContent = `类型: ${getCategoryName(itemData.category)} | 稀有度: ${getRarityName(itemData.rarity)}`;

    itemDetailModal.style.display = 'flex';
  }

  function hideItemDetail() {
    if (itemDetailModal) {
      itemDetailModal.style.display = 'none';
    }
  }

  function getCategoryName(category) {
    const categoryNames = {
      'evidence': '证据',
      'document': '文件',
      'tool': '工具',
      'key': '钥匙'
    };
    return categoryNames[category] || '未知';
  }

  function getRarityName(rarity) {
    const rarityNames = {
      'common': '普通',
      'uncommon': '罕见',
      'rare': '稀有',
      'epic': '史诗',
      'legendary': '传说'
    };
    return rarityNames[rarity] || '未知';
  }

  function addItem(itemId) {
    if (typeof Store !== 'undefined') {
      const gameState = Store.getState();
      if (!gameState.inventory.includes(itemId)) {
        Store.updateInventory(itemId);
      }
    }
  }

  function removeItem(itemId) {
    if (typeof Store !== 'undefined') {
      const gameState = Store.getState();
      const newInventory = gameState.inventory.filter(item => item !== itemId);
      Store.setState({ inventory: newInventory });
      updateInventoryDisplay();
    }
  }

  function hasItem(itemId) {
    if (typeof Store !== 'undefined') {
      const gameState = Store.getState();
      return gameState.inventory.includes(itemId);
    }
    return false;
  }

  function showTip(message) {
    // 简单的提示显示函数
    console.log('提示:', message);
  }

  return {
    initialize,
    updateInventoryDisplay,
    addItem,
    removeItem,
    hasItem,
    showItemDetail,
    hideItemDetail,
    toggleInventory
  };
})();
