# 《被隐藏的真相》技术实现方案

## 1. 核心系统设计

### 1.1 记忆碎片系统
```javascript
// 记忆碎片管理器
const MemoryFragmentManager = {
  fragments: [
    { id: 'fragment_1', unlocked: false, image: 'memory_01.jpg', position: {x: 0, y: 0} },
    { id: 'fragment_2', unlocked: false, image: 'memory_02.jpg', position: {x: 1, y: 0} },
    // ... 更多碎片
  ],
  
  unlockFragment(fragmentId) {
    // 解锁记忆碎片逻辑
  },
  
  checkPuzzleComplete() {
    // 检查拼图是否完成
  }
};
```

### 1.2 侦探直感系统
```javascript
// 侦探直感管理器
const DetectiveIntuitionManager = {
  isActive: true,
  
  highlightCorrectOption(options) {
    // 高亮正确选项
  },
  
  disableWrongOptions(options) {
    // 禁用错误选项
  },
  
  deactivate() {
    // 在特定时刻失效
    this.isActive = false;
  }
};
```

### 1.3 时间系统
```javascript
// 时间管理器
const TimeManager = {
  timeLimit: 15 * 60 * 1000, // 15分钟
  startTime: null,
  
  startTimer() {
    this.startTime = Date.now();
  },
  
  checkTimeUp() {
    return Date.now() - this.startTime > this.timeLimit;
  }
};
```

## 2. 场景扩展

### 2.1 新增场景
- 警车内（开场）
- 案发现场外围
- 记忆回放场景

### 2.2 场景文件结构
```
scenes/
├── police-car/          # 警车场景
├── crime-scene-outer/   # 案发现场外围
├── memory-flashback/    # 记忆回放
└── ending-scenes/       # 结局场景
```

## 3. 道具系统扩展

### 3.1 证据分类
- 普通证据（引导向嫌疑人）
- 隐藏证据（揭示真相）
- 伪造证据（莫雅狄设置）

### 3.2 记忆碎片道具
```javascript
const MEMORY_FRAGMENTS = {
  'fragment_witnessing': {
    id: 'fragment_witnessing',
    name: '目击记忆',
    icon: '🧩',
    description: '模糊的目击画面...',
    category: 'memory',
    puzzlePiece: true
  }
};
```

## 4. 对话系统增强

### 4.1 选择分支
- 正确选择（直感高亮）
- 错误选择（禁用状态）
- 中性选择（获取信息）

### 4.2 催眠状态显示
```css
.hypnosis-effect {
  filter: blur(1px) sepia(0.3);
  transition: all 0.5s ease;
}
```

## 5. 结局系统

### 5.1 结局触发条件
```javascript
const EndingManager = {
  checkEnding() {
    if (TimeManager.checkTimeUp()) {
      return 'ending_one'; // 结局一
    }
    
    if (!this.foundHiddenEvidence()) {
      return 'ending_two'; // 结局二
    }
    
    return 'ending_three'; // 真结局
  }
};
```

## 6. 小游戏集成

### 6.1 证据解锁小游戏
- 密码锁小游戏
- 拼图小游戏
- 记忆序列游戏

## 7. 存档系统扩展

### 7.1 新增存档数据
```javascript
const gameState = {
  // 现有数据...
  memoryFragments: [],
  detectives_intuition_active: true,
  investigation_start_time: null,
  evidence_discovered: [],
  hypnosis_state: true
};
```

## 8. UI/UX 设计

### 8.1 记忆碎片显示区
- 顶部显示已收集的碎片
- 拼图进度指示器

### 8.2 侦探直感效果
- 正确选项发光效果
- 错误选项灰化效果

### 8.3 催眠状态指示
- 屏幕边缘模糊效果
- 色彩饱和度调整

## 9. 音效设计

### 9.1 背景音乐
- 紧张悬疑BGM
- 记忆回放音效
- 真相揭示音效

### 9.2 交互音效
- 证据发现音效
- 记忆碎片解锁音效
- 侦探直感激活音效

## 10. 实现优先级

### Phase 1（核心功能）
1. 记忆碎片系统
2. 侦探直感机制
3. 时间系统
4. 基础场景扩展

### Phase 2（增强功能）
1. 小游戏集成
2. 多结局系统
3. 高级视觉效果
4. 音效系统

### Phase 3（优化润色）
1. UI/UX 优化
2. 性能优化
3. 存档系统完善
4. 测试与调试
