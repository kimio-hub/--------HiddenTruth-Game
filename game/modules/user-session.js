// ========================================
//           用户会话管理模块
// ========================================

const UserSession = (() => {
    const SESSION_KEY = 'HTG_SESSION';
    
    // 检查会话
    function checkSession() {
        try {
            const session = localStorage.getItem(SESSION_KEY);
            if (!session) return null;
            
            const sessionData = JSON.parse(session);
            if (Date.now() > sessionData.expires) {
                localStorage.removeItem(SESSION_KEY);
                return null;
            }
            
            return sessionData;
        } catch (error) {
            console.error('检查会话失败:', error);
            localStorage.removeItem(SESSION_KEY);
            return null;
        }
    }
    
    // 获取当前用户信息
    function getCurrentUser() {
        const session = checkSession();
        if (!session) return null;
        
        try {
            const users = localStorage.getItem('HTG_USERS');
            if (!users) return null;
            
            const userData = JSON.parse(users);
            return userData[session.username] || null;
        } catch (error) {
            console.error('获取用户信息失败:', error);
            return null;
        }
    }
    
    // 登出
    function logout() {
        try {
            localStorage.removeItem(SESSION_KEY);
            return true;
        } catch (error) {
            console.error('登出失败:', error);
            return false;
        }
    }
    
    // 验证登录状态
    function requireLogin() {
        const session = checkSession();
        if (!session) {
            showLoginRequiredDialog();
            return false;
        }
        return true;
    }
    
    // 显示需要登录的对话框
    function showLoginRequiredDialog() {
        if (confirm('您需要登录才能访问此功能。是否前往登录页面？')) {
            window.location.href = '../login/login.html';
        }
    }
    
    // 格式化登录时间
    function formatLoginTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMinutes < 1) {
            return '刚刚';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}分钟前`;
        } else if (diffHours < 24) {
            return `${diffHours}小时前`;
        } else if (diffDays < 7) {
            return `${diffDays}天前`;
        } else {
            return date.toLocaleDateString();
        }
    }
    
    // 更新UI显示
    function updateUserDisplay() {
        const user = getCurrentUser();
        const session = checkSession();
        
        // 更新用户名显示
        const userNameElement = document.getElementById('current-user-name');
        const loginInfoElement = document.getElementById('user-login-info');
        
        if (user && session) {
            if (userNameElement) {
                userNameElement.textContent = user.username;
            }
            if (loginInfoElement) {
                loginInfoElement.textContent = `登录时间: ${formatLoginTime(session.loginTime)}`;
            }
            
            // 显示用户信息区域
            const userInfoSection = document.querySelector('.user-info-section');
            if (userInfoSection) {
                userInfoSection.style.display = 'block';
            }
            
            // 显示登出按钮
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.style.display = 'block';
            }
        } else {
            // 未登录状态
            if (userNameElement) {
                userNameElement.textContent = '未登录';
            }
            if (loginInfoElement) {
                loginInfoElement.textContent = '点击登录按钮进入';
            }
            
            // 隐藏用户信息区域
            const userInfoSection = document.querySelector('.user-info-section');
            if (userInfoSection) {
                userInfoSection.style.display = 'none';
            }
            
            // 隐藏登出按钮
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.style.display = 'none';
            }
        }
    }
    
    // 初始化会话管理
    function init() {
        // 检查登录状态
        const session = checkSession();
        if (!session) {
            console.log('用户未登录');
        } else {
            console.log(`用户 ${session.username} 已登录`);
            // 触发存档迁移（如果需要）
            if (typeof SaveManager !== 'undefined' && SaveManager.migrateOldSaves) {
                SaveManager.migrateOldSaves(session.username);
            }
        }
        
        // 更新用户显示
        updateUserDisplay();
        
        // 绑定登出按钮事件
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // 定时检查会话有效性（每5分钟检查一次）
        setInterval(() => {
            if (!checkSession()) {
                console.log('会话已过期');
                updateUserDisplay();
            }
        }, 5 * 60 * 1000);
    }
    
    // 处理登出
    function handleLogout() {
        if (confirm('确定要退出登录吗？未保存的游戏进度可能会丢失。')) {
            if (logout()) {
                alert('已成功退出登录');
                window.location.href = '../login/login.html';
            } else {
                alert('退出登录失败，请重试');
            }
        }
    }
    
    return {
        checkSession,
        getCurrentUser,
        logout,
        requireLogin,
        updateUserDisplay,
        init
    };
})();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserSession;
}
