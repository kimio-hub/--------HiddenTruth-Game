// -------- 全局UI工具：轻量提示 --------
function showTip(text) {
  const tip = document.createElement('div');
  tip.textContent = text;
  tip.style.position = 'absolute';
  tip.style.left = '50%';
  tip.style.bottom = '120px';
  tip.style.transform = 'translateX(-50%)';
  tip.style.padding = '8px 12px';
  tip.style.background = 'rgba(0,0,0,0.7)';
  tip.style.color = '#fff';
  tip.style.borderRadius = '8px';
  tip.style.fontSize = '14px';
  tip.style.zIndex = '200';
  tip.style.opacity = '0';
  tip.style.transition = 'opacity .2s, transform .2s';
  document.body.appendChild(tip);
  requestAnimationFrame(() => {
    tip.style.opacity = '1';
    tip.style.transform = 'translateX(-50%) translateY(-10px)';
  });
  setTimeout(() => {
    tip.style.opacity = '0';
    tip.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => {
      if (tip.parentNode) {
        tip.parentNode.removeChild(tip);
      }
    }, 200);
  }, 2000);
}

// 工具函数集合
const Utils = {
  // 生成唯一ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // 防抖函数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // 节流函数
  throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function() {
      const context = this;
      const args = arguments;
      if (!lastRan) {
        func.apply(context, args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(function() {
          if ((Date.now() - lastRan) >= limit) {
            func.apply(context, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  },

  // 格式化时间
  formatTime(date = new Date()) {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // 深拷贝
  deepClone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
    if (typeof obj === "object") {
      const clonedObj = {};
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = Utils.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  },

  // 检查碰撞
  checkCollision(x, y, interactable) {
    return x >= interactable.x && 
           x <= interactable.x + interactable.width &&
           y >= interactable.y && 
           y <= interactable.y + interactable.height;
  },

  // 计算距离
  calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  },

  // 加载图片
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  },

  // 等待指定时间
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // 验证localStorage可用性
  isLocalStorageAvailable() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
};
