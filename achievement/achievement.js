const achievements = [
    { id: 1, title: "好结局？坏结局？", desc: "往好处想，你脱罪了，罪犯先生？", img: "../assets/image/0002.jpg", condition: "超时", done: true },
    { id: 2, title: "你被逮捕了", desc: "找到全部线索？反正你是找到了一个“凶手”", img: "../assets/image/0003.jpg", condition: "获胜？", done: true },
    { id: 3, title: "隐藏的真相", desc: "你相信你的记忆了吗？", img: "../assets/image/0004.jpg", condition: "全部真相", done: false },
    { id: 4, title: "极速推理", desc: "嘶，你好快啊", img: "../assets/image/0011.jpg", condition: "10min之内完成推理", done: true },
    { id: 5, title: "不完全推理", desc: "虽然你没找到全部线索，但最关键的你已经发现了，这就可以了，不是吗？", img: "../assets/image/0006.jpg", condition: "在案件中获得部分线索", done: false },
    { id: 6, title: "好像不对劲", desc: "死去的记忆在攻击我", img: "../assets/image/0005.jpg", condition: "找到意料之外的东西", done: true },
    { id: 7, title: "游戏王", desc: "现在是我的回合，抽卡", img: "../assets/image/0010.jpg", condition: "完成所有小游戏", done: false },
    { id: 8, title: "颂吾真名", desc: "只要打完一局，就送的成就，嘿嘿，白嫖", img: "../assets/image/0006.jpg", condition: "完成一句游戏", done: true }
];

// 改为使用所有成就（不再再筛选已完成的）
const allAchievements = achievements; 
const groupSize = 3; 
let currentGroup = 0; 
let flippedState = {}; 


// 初始化所有成就的翻转状态（包括未完成的）
allAchievements.forEach(a => {
    flippedState[a.id] = false;
});


function getTotalGroups() {
    // 计算总页数时使用全部成就
    return Math.ceil(allAchievements.length / groupSize);
}

function renderAchievements() {
    const list = document.getElementById('achievementList');
    list.innerHTML = '';
    
  
    const startIdx = currentGroup * groupSize;
    const endIdx = Math.min(startIdx + groupSize, allAchievements.length);
    // 从所有成就中截取当前页数据
    const displayItems = allAchievements.slice(startIdx, endIdx);
    
    displayItems.forEach(a => {
        const item = document.createElement('div');
        item.className = 'achievement-item';
        item.dataset.id = a.id;
        
     
        if (flippedState[a.id]) {
            item.classList.add('flipped');
        }
        
        // 判断图片路径：已完成用原图片，未完成用问号图片（需替换为你的问号图片路径）
        const imgSrc = a.done ? a.img : "../assets/image/0012.jpg";
        
        item.innerHTML = `
            <div class="achievement-flip">
                <div class="achievement-front">
                    <span class="file-tag">卷宗</span>
                    <img class="achievement-img" src="${imgSrc}" alt="${a.title}">
                    <div class="achievement-title">${a.title}</div>
                </div>
                <div class="achievement-back">
                    <span class="file-tag">条件</span>
                    <div class="achievement-condition">${a.condition}</div>
                    <div class="achievement-desc">${a.desc}</div>
                </div>
            </div>
        `;
        
 
        item.addEventListener('click', (function(id) {
            return function() {
                flippedState[id] = !flippedState[id];
                this.classList.toggle('flipped', flippedState[id]);
            };
        })(a.id));
        
        list.appendChild(item);
    });

   
    document.getElementById('carouselPrev').disabled = currentGroup === 0;
    document.getElementById('carouselNext').disabled = currentGroup >= getTotalGroups() - 1;
}


document.getElementById('carouselPrev').onclick = function() {
    if (currentGroup > 0) {
        currentGroup--;
        renderAchievements();
    }
};

document.getElementById('carouselNext').onclick = function() {
    if (currentGroup < getTotalGroups() - 1) {
        currentGroup++;
        renderAchievements();
    }
};


renderAchievements();