# 游戏模块化重构说明

## 📁 新的文件结构

```
game/
├── modules/               # 模块化代码目录
│   ├── constants.js      # 全局常量定义
│   ├── utils.js          # 工具函数集合
│   ├── store.js          # 状态管理系统
│   ├── save-manager.js   # 存档管理逻辑
│   ├── save-ui.js        # 存档界面管理
│   ├── inventory.js      # 道具系统管理
│   ├── scene-manager.js  # 场景管理系统
│   └── main.js           # 主游戏逻辑
├── game.html             # 游戏主页面（已更新引用）
├── game.css              # 游戏样式文件
├── game.js               # 原始文件（保留作为备份）
└── game.js.backup        # 备份文件
```

## 🎯 模块功能说明

### 1. constants.js - 全局常量
- **ROOM_NAMES**: 房间名称映射
- **ROOM_DATA**: 详细房间数据配置
- **GAME_PHASES**: 游戏阶段常量
- **EVENT_TYPES**: 事件类型定义

### 2. utils.js - 工具函数
- **showTip()**: 全局提示函数
- **Utils.debounce()**: 防抖函数
- **Utils.throttle()**: 节流函数
- **Utils.formatTime()**: 时间格式化
- **Utils.deepClone()**: 深拷贝
- **Utils.checkCollision()**: 碰撞检测

### 3. store.js - 状态管理
- **Store.getState()**: 获取游戏状态
- **Store.setState()**: 设置游戏状态
- **Store.updateInventory()**: 更新道具栏
- **Store.addEvidence()**: 添加证据
- **Store.addEventListener()**: 事件监听

### 4. save-manager.js - 存档管理
- **SaveManager.saveToSlot()**: 保存到指定槽位
- **SaveManager.loadFromSlot()**: 从槽位加载
- **SaveManager.deleteSlot()**: 删除存档槽
- **SaveManager.getAllSlotData()**: 获取所有槽位数据

### 5. save-ui.js - 存档界面
- **SaveLoadUI.showSaveMenu()**: 显示存档菜单
- **SaveLoadUI.showLoadMenu()**: 显示读档菜单
- **SaveLoadUI.hideSaveMenu()**: 隐藏存档菜单
- **SaveLoadUI.initialize()**: 初始化界面

### 6. inventory.js - 道具系统
- **InventoryManager.addItem()**: 添加道具
- **InventoryManager.removeItem()**: 移除道具
- **InventoryManager.hasItem()**: 检查是否拥有道具
- **InventoryManager.updateInventoryDisplay()**: 更新显示

### 7. scene-manager.js - 场景管理
- **SceneManager.renderRoom()**: 渲染房间
- **SceneManager.changeRoomWithTransition()**: 带动画的房间切换
- **SceneManager.getInteractableAt()**: 获取位置上的交互对象
- **SceneManager.removeInteractable()**: 移除交互对象

### 8. main.js - 主游戏逻辑
- **PlayerController**: 玩家控制系统
- **GameActions**: 游戏动作处理
- **setupSettingsMenu()**: 设置菜单
- **initializeGame()**: 游戏初始化

## 🚀 优势与好处

### 1. **可维护性提升**
- 每个模块职责单一，容易理解和修改
- 文件大小合理，避免巨大的单一文件
- 模块间依赖关系清晰

### 2. **开发效率提高**
- 多人协作时可以同时编辑不同模块
- 问题定位更精确，调试更容易
- 新功能添加更简单

### 3. **代码复用**
- 工具函数可以在多个模块中使用
- 状态管理系统统一，数据流清晰
- 事件系统解耦各模块间的通信

### 4. **扩展性更强**
- 新增功能只需创建新模块
- 现有模块可以独立升级
- 更容易进行单元测试

## 📝 使用说明

### 1. **新增功能模块**
1. 在 `modules/` 目录下创建新的 `.js` 文件
2. 按照现有模块的模式编写代码
3. 在 `game.html` 中添加 `<script>` 标签引用
4. 在 `main.js` 中初始化新模块

### 2. **修改现有功能**
1. 找到对应的模块文件
2. 修改相关函数或添加新功能
3. 保持模块间接口的一致性
4. 测试功能是否正常

### 3. **调试和开发**
- 浏览器开发者工具中可以通过 `window.GameModules` 访问所有模块
- 每个模块都有清晰的函数命名和注释
- 使用事件系统进行模块间通信

## 🔧 迁移注意事项

### 1. **兼容性**
- 保留了原有的 `game.js` 文件作为备份
- 所有原有功能都已迁移到新的模块中
- 游戏逻辑和数据结构保持不变

### 2. **性能**
- 多个小文件的加载时间可能略有增加
- 可以考虑在生产环境中合并文件
- 模块化带来的开发效率提升远大于性能影响

### 3. **扩展建议**
- 可以继续拆分更细的功能模块
- 考虑使用 ES6 模块系统进一步优化
- 添加自动化构建流程

## 🎮 测试建议

1. **功能测试**: 确保所有原有功能正常工作
2. **存档测试**: 验证存档和读档功能完整性
3. **兼容性测试**: 检查不同浏览器的兼容性
4. **性能测试**: 对比重构前后的加载和运行性能

通过这次模块化重构，代码结构更加清晰，维护和扩展都变得更加容易！
