// -------- 全局常量 --------
const ROOM_NAMES = {
  'entrance': '玄关',
  'living-room': '客厅', 
  'kitchen': '厨房',
  'study': '书房',
  'bedroom': '卧室',
  'balcony': '阳台',
  'bathroom': '卫生间'
};

// 房间数据配置
const ROOM_DATA = {
  'living-room': {
    name: '客厅',
    background: '../assets/image/living-room.jpg',
    interactables: [
      { id: 'to-kitchen', type: 'door', x: 50, y: 150, width: 80, height: 120, target: 'kitchen', description: '前往厨房' },
      { id: 'to-study', type: 'door', x: 350, y: 100, width: 80, height: 120, target: 'study', description: '前往书房' },
      { id: 'to-bedroom', type: 'door', x: 600, y: 120, width: 80, height: 120, target: 'bedroom', description: '前往卧室' },
      { id: 'to-entrance', type: 'door', x: 400, y: 300, width: 100, height: 80, target: 'entrance', description: '前往玄关' },
      { id: 'sofa', type: 'search', x: 200, y: 200, width: 150, height: 100, description: '沙发', action: 'searchSofa' },
      { id: 'tv', type: 'examine', x: 450, y: 180, width: 120, height: 80, description: '电视', action: 'examineTV' }
    ]
  },
  'kitchen': {
    name: '厨房',
    background: '../assets/image/kitchen.jpg',
    interactables: [
      { id: 'to-living-room', type: 'door', x: 500, y: 200, width: 80, height: 120, target: 'living-room', description: '返回客厅' },
      { id: 'to-balcony', type: 'door', x: 100, y: 80, width: 80, height: 120, target: 'balcony', description: '前往阳台' },
      { id: 'refrigerator', type: 'search', x: 200, y: 100, width: 100, height: 150, description: '冰箱', action: 'searchRefrigerator' },
      { id: 'stove', type: 'examine', x: 350, y: 150, width: 120, height: 80, description: '炉灶', action: 'examineStove' },
      { id: 'bloodknife', type: 'item', x: 300, y: 180, width: 30, height: 50, description: '带血菜刀', action: 'collectBloodKnife' }
    ]
  },
  'study': {
    name: '书房',
    background: '../assets/image/study.jpg',
    interactables: [
      { id: 'to-living-room', type: 'door', x: 50, y: 200, width: 80, height: 120, target: 'living-room', description: '返回客厅' },
      { id: 'desk', type: 'search', x: 300, y: 150, width: 150, height: 100, description: '书桌', action: 'searchDesk' },
      { id: 'bookshelf', type: 'examine', x: 500, y: 100, width: 80, height: 200, description: '书架', action: 'examineBookshelf' },
      { id: 'insurance', type: 'item', x: 320, y: 160, width: 40, height: 30, description: '保险单', action: 'collectInsurance' }
    ]
  },
  'bedroom': {
    name: '卧室',
    background: '../assets/image/bedroom.jpg',
    interactables: [
      { id: 'to-living-room', type: 'door', x: 100, y: 250, width: 80, height: 120, target: 'living-room', description: '返回客厅' },
      { id: 'to-bathroom', type: 'door', x: 500, y: 100, width: 80, height: 120, target: 'bathroom', description: '前往卫生间' },
      { id: 'bed', type: 'search', x: 300, y: 200, width: 200, height: 120, description: '床', action: 'searchBed' },
      { id: 'wardrobe', type: 'examine', x: 600, y: 150, width: 100, height: 180, description: '衣柜', action: 'examineWardrobe' },
      { id: 'tornletter', type: 'item', x: 450, y: 300, width: 35, height: 25, description: '撕碎的信件', action: 'collectTornLetter' }
    ]
  },
  'bathroom': {
    name: '卫生间',
    background: '../assets/image/bathroom.jpg',
    interactables: [
      { id: 'to-bedroom', type: 'door', x: 300, y: 350, width: 80, height: 120, target: 'bedroom', description: '返回卧室' },
      { id: 'mirror', type: 'examine', x: 200, y: 100, width: 100, height: 80, description: '镜子', action: 'examineMirror' },
      { id: 'toilet', type: 'search', x: 400, y: 200, width: 80, height: 100, description: '马桶', action: 'searchToilet' }
    ]
  },
  'balcony': {
    name: '阳台',
    background: '../assets/image/balcony.jpg',
    interactables: [
      { id: 'to-kitchen', type: 'door', x: 400, y: 300, width: 80, height: 120, target: 'kitchen', description: '返回厨房' },
      { id: 'plants', type: 'examine', x: 100, y: 200, width: 120, height: 100, description: '植物', action: 'examinePlants' },
      { id: 'railing', type: 'examine', x: 50, y: 100, width: 500, height: 50, description: '阳台栏杆', action: 'examineRailing' }
    ]
  },
  'entrance': {
    name: '玄关',
    background: '../assets/image/entrance.jpg',
    interactables: [
      { id: 'to-living-room', type: 'door', x: 300, y: 100, width: 80, height: 120, target: 'living-room', description: '进入客厅' },
      { id: 'shoe-cabinet', type: 'search', x: 500, y: 200, width: 100, height: 150, description: '鞋柜', action: 'searchShoeCabinet' },
      { id: 'coat-rack', type: 'examine', x: 100, y: 150, width: 60, height: 120, description: '衣架', action: 'examineCoatRack' }
    ]
  }
};

// 游戏阶段常量
const GAME_PHASES = {
  DREAM: 'dream',
  POLICE_CAR: 'police-car',
  INVESTIGATION: 'investigation'
};

// 事件类型常量
const EVENT_TYPES = {
  ITEM_COLLECTED: 'item_collected',
  EVIDENCE_FOUND: 'evidence_found',
  ROOM_CHANGED: 'room_changed',
  DIALOGUE_STARTED: 'dialogue_started'
};
