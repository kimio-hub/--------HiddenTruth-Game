// 序章逻辑
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否是临时重播
    const tempReplay = localStorage.getItem('HTG_PROLOGUE_TEMP_REPLAY');
    if (tempReplay === 'true') {
        // 清除临时重播标记
        localStorage.removeItem('HTG_PROLOGUE_TEMP_REPLAY');
        console.log('临时重播序章');
    } else {
        // 检查是否已完成序章，如果已完成直接跳转
        const prologueCompleted = localStorage.getItem('HTG_PROLOGUE_COMPLETED');
        if (prologueCompleted === 'true') {
            console.log('序章已完成，跳转到游戏');
            window.location.href = '../game/game.html?skipPrologue=true&startRoom=living-room';
            return;
        }
    }
    
    const prologueContainer = document.getElementById('prologue-container');
    const prologueContent = document.getElementById('prologue-content');
    const prologuePrompt = document.getElementById('prologue-prompt');
    
    // 确认需要显示序章后，再将容器设为可见
    prologueContainer.style.visibility = 'visible';
    prologueContainer.style.opacity = '1';
    
    // 序章内容（可自定义）
    const prologueData = [
        {
            type: 'title',
            content: '隐藏的真相'
        },
        {
            type: 'text',
            content: '在这个看似平静的住宅里，隐藏着一个令人震惊的秘密...'
        },
        {
            type: 'text',
            content: '作为一名资深刑警，你被派遣到这里调查一起神秘的案件。'
        },
        {
            type: 'text',
            content: '但是，事情远比表面看起来的复杂...'
        }
    ];
    
    let currentIndex = 0;
    let isProcessing = false;
    
    function showCurrentContent() {
        if (currentIndex >= prologueData.length) {
            // 序章结束，跳转到游戏
            finishPrologue();
            return;
        }
        
        const item = prologueData[currentIndex];
        const element = document.createElement('div');
        
        if (item.type === 'title') {
            element.className = 'prologue-title';
        } else {
            element.className = 'prologue-text';
        }
        
        element.textContent = item.content;
        element.style.animationDelay = '0.5s';
        
        prologueContent.appendChild(element);
        
        // 显示提示
        setTimeout(() => {
            prologuePrompt.style.display = 'block';
        }, 1500);
    }
    
    function nextContent() {
        if (isProcessing) return;
        isProcessing = true;
        
        prologuePrompt.style.display = 'none';
        
        // 淡出当前内容
        const currentElements = prologueContent.children;
        for (let element of currentElements) {
            element.style.transition = 'opacity 0.5s ease-out';
            element.style.opacity = '0';
        }
        
        setTimeout(() => {
            prologueContent.innerHTML = '';
            currentIndex++;
            isProcessing = false;
            showCurrentContent();
        }, 600);
    }
    
    function finishPrologue() {
        // 检查是否是临时重播
        const wasReplay = localStorage.getItem('HTG_PROLOGUE_TEMP_REPLAY') === null && 
                         localStorage.getItem('HTG_PROLOGUE_COMPLETED') === 'true';
        
        // 标记序章已完成（如果还没完成的话）
        if (localStorage.getItem('HTG_PROLOGUE_COMPLETED') !== 'true') {
            localStorage.setItem('HTG_PROLOGUE_COMPLETED', 'true');
        }
        
        // 渐隐效果
        document.body.style.transition = 'opacity 1s ease-out';
        document.body.style.opacity = '0';
        
        setTimeout(() => {
            if (wasReplay) {
                // 如果是重播，返回主菜单
                window.location.href = '../index/index.html';
            } else {
                // 如果是首次播放，跳转到游戏
                window.location.href = '../game/game.html?skipPrologue=true&startRoom=living-room';
            }
        }, 1000);
    }
    
    // 事件监听
    function handleNext(e) {
        if (e.type === 'keydown') {
            e.preventDefault();
        }
        nextContent();
    }
    
    document.addEventListener('keydown', handleNext);
    document.addEventListener('click', handleNext);
    
    // 开始显示序章
    showCurrentContent();
});

// 跳过序章的快捷键（开发用）
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        e.preventDefault();
        // 检查是否是重播
        const wasReplay = localStorage.getItem('HTG_PROLOGUE_TEMP_REPLAY') === null && 
                         localStorage.getItem('HTG_PROLOGUE_COMPLETED') === 'true';
        
        localStorage.setItem('HTG_PROLOGUE_COMPLETED', 'true');
        
        if (wasReplay) {
            window.location.href = '../index/index.html';
        } else {
            window.location.href = '../game/game.html?skipPrologue=true&startRoom=living-room';
        }
    }
});
