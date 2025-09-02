// 初始化存档系统
document.addEventListener('DOMContentLoaded', () => {
    // 加载已保存的数据并更新UI
    loadAllSaves();
    
    // 为所有保存按钮添加事件监听
    document.querySelectorAll('.save-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const slot = e.target.closest('.slot');
            const slotNumber = slot.dataset.slot;
            saveToSlot(slotNumber);
        });
    });
    
    // 为所有加载按钮添加事件监听
    document.querySelectorAll('.load-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const slot = e.target.closest('.slot');
            const slotNumber = slot.dataset.slot;
            loadFromSlot(slotNumber);
        });
    });
    
    // 为所有删除按钮添加事件监听
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const slot = e.target.closest('.slot');
            const slotNumber = slot.dataset.slot;
            deleteSaveSlot(slotNumber);
        });
    });
});

// 从当前输入获取游戏数据
function getCurrentGameData() {
    return {
        level: parseInt(document.getElementById('level').value),
        score: parseInt(document.getElementById('score').value),
        health: parseInt(document.getElementById('health').value),
        timestamp: new Date().toLocaleString()
    };
}

// 将当前数据保存到指定槽位
function saveToSlot(slotNumber) {
    const data = getCurrentGameData();
    
    // 验证数据
    if (isNaN(data.level) || isNaN(data.score) || isNaN(data.health)) {
        showMessage('请输入有效的数值', 'error');
        return;
    }
    
    // 保存到localStorage
    localStorage.setItem(`saveSlot${slotNumber}`, JSON.stringify(data));
    
    // 更新UI
    updateSlotInfo(slotNumber, data);
    showMessage(`已成功保存到存档 ${slotNumber}`, 'success');
}

// 从指定槽位加载数据
function loadFromSlot(slotNumber) {
    const savedData = localStorage.getItem(`saveSlot${slotNumber}`);
    
    if (!savedData) {
        showMessage(`存档 ${slotNumber} 为空`, 'error');
        return;
    }
    
    const data = JSON.parse(savedData);
    
    // 更新输入字段
    document.getElementById('level').value = data.level;
    document.getElementById('score').value = data.score;
    document.getElementById('health').value = data.health;
    
    showMessage(`已从存档 ${slotNumber} 加载数据`, 'success');
}

// 删除指定槽位的存档
function deleteSaveSlot(slotNumber) {
    if (!localStorage.getItem(`saveSlot${slotNumber}`)) {
        showMessage(`存档 ${slotNumber} 已为空`, 'error');
        return;
    }
    
    localStorage.removeItem(`saveSlot${slotNumber}`);
    
    // 更新UI
    const slot = document.querySelector(`.slot[data-slot="${slotNumber}"] .slot-info`);
    slot.textContent = '未保存数据';
    
    showMessage(`已删除存档 ${slotNumber}`, 'success');
}

// 加载所有存档并更新UI
function loadAllSaves() {
    for (let i = 1; i <= 3; i++) {
        const savedData = localStorage.getItem(`saveSlot${i}`);
        if (savedData) {
            updateSlotInfo(i, JSON.parse(savedData));
        }
    }
}



// 显示消息提示
function showMessage(text, type) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = text;
    messageElement.className = `message ${type}`;
    
    // 3秒后自动隐藏消息
    setTimeout(() => {
        messageElement.className = 'message';
    }, 3000);
}
