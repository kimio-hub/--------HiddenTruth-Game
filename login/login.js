// ========================================
//           隐藏的真相 - 登录系统
// ========================================

// 用户管理系统
const UserManager = (() => {
    const STORAGE_KEY = 'HTG_USERS';
    const SESSION_KEY = 'HTG_SESSION';
    
    // 获取所有用户数据
    function getUsers() {
        try {
            const users = localStorage.getItem(STORAGE_KEY);
            return users ? JSON.parse(users) : {};
        } catch (error) {
            console.error('读取用户数据失败:', error);
            return {};
        }
    }
    
    // 保存用户数据
    function saveUsers(users) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
            return true;
        } catch (error) {
            console.error('保存用户数据失败:', error);
            return false;
        }
    }
    
    // 密码加密（简单哈希）
    function hashPassword(password, salt = '') {
        let hash = 0;
        const str = password + salt + 'HTG_SALT_2024';
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash).toString(36);
    }
    
    // 用户名验证
    function validateUsername(username) {
        if (!username || username.length < 2) {
            return { valid: false, message: '侦探代号至少需要2个字符' };
        }
        if (username.length > 20) {
            return { valid: false, message: '侦探代号不能超过20个字符' };
        }
        if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(username)) {
            return { valid: false, message: '侦探代号只能包含字母、数字、中文、下划线或横线' };
        }
        return { valid: true };
    }
    
    // 密码验证
    function validatePassword(password) {
        if (!password || password.length < 6) {
            return { valid: false, message: '密钥至少需要6位字符' };
        }
        if (password.length > 50) {
            return { valid: false, message: '密钥不能超过50个字符' };
        }
        return { valid: true };
    }
    
    // 注册用户
    function registerUser(username, password) {
        const users = getUsers();
        
        // 验证用户名
        const usernameCheck = validateUsername(username);
        if (!usernameCheck.valid) {
            return { success: false, message: usernameCheck.message };
        }
        
        // 验证密码
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.valid) {
            return { success: false, message: passwordCheck.message };
        }
        
        // 检查用户是否已存在
        if (users[username]) {
            return { success: false, message: '此侦探代号已被使用' };
        }
        
        // 创建用户
        const salt = Date.now().toString();
        const hashedPassword = hashPassword(password, salt);
        
        users[username] = {
            username: username,
            password: hashedPassword,
            salt: salt,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            loginCount: 0
        };
        
        if (saveUsers(users)) {
            return { success: true, message: '档案创建成功' };
        } else {
            return { success: false, message: '档案创建失败，请重试' };
        }
    }
    
    // 用户登录
    function loginUser(username, password) {
        const users = getUsers();
        
        if (!username || !password) {
            return { success: false, message: '请输入完整的登录信息' };
        }
        
        const user = users[username];
        if (!user) {
            return { success: false, message: '侦探代号不存在' };
        }
        
        const hashedPassword = hashPassword(password, user.salt);
        if (hashedPassword !== user.password) {
            return { success: false, message: '密钥错误' };
        }
        
        // 更新登录信息
        user.lastLogin = new Date().toISOString();
        user.loginCount = (user.loginCount || 0) + 1;
        saveUsers(users);
        
        // 创建会话
        const session = {
            username: username,
            loginTime: Date.now(),
            expires: Date.now() + (24 * 60 * 60 * 1000) // 24小时过期
        };
        
        try {
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } catch (error) {
            console.error('创建会话失败:', error);
        }
        
        return { success: true, message: '登录成功', user: user };
    }
    
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
    
    // 获取当前用户信息
    function getCurrentUser() {
        const session = checkSession();
        if (!session) return null;
        
        const users = getUsers();
        return users[session.username] || null;
    }
    
    return {
        registerUser,
        loginUser,
        checkSession,
        logout,
        getCurrentUser
    };
})();

// UI 控制器
const LoginUI = (() => {
    let currentForm = 'login'; // 'login' 或 'register'
    
    // 初始化
    function init() {
        bindEvents();
        checkAutoLogin();
    }
    
    // 绑定事件
    function bindEvents() {
        // 表单切换
        document.getElementById('toRegister').addEventListener('click', switchToRegister);
        document.getElementById('toLogin').addEventListener('click', switchToLogin);
        
        // 密码显示/隐藏
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', togglePasswordVisibility);
        });
        
        // 登录按钮
        document.getElementById('loginBtn').addEventListener('click', handleLogin);
        
        // 注册按钮
        document.getElementById('registerBtn').addEventListener('click', handleRegister);
        
        // 回车键支持
        document.addEventListener('keypress', handleKeyPress);
        
        // 输入验证
        document.getElementById('regUsername').addEventListener('blur', validateUsernameInput);
        document.getElementById('regPassword').addEventListener('input', validatePasswordInput);
        document.getElementById('regConfirmPassword').addEventListener('input', validateConfirmPassword);
    }
    
    // 检查自动登录
    function checkAutoLogin() {
        const session = UserManager.checkSession();
        if (session) {
            showNotification('检测到有效会话，正在自动登录...', 'success');
            setTimeout(() => {
                redirectToGame();
            }, 1000);
        }
    }
    
    // 切换到注册表单
    function switchToRegister(e) {
        e.preventDefault();
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
        currentForm = 'register';
        clearInputs();
    }
    
    // 切换到登录表单
    function switchToLogin(e) {
        e.preventDefault();
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
        currentForm = 'login';
        clearInputs();
    }
    
    // 清空输入
    function clearInputs() {
        document.querySelectorAll('input').forEach(input => {
            input.value = '';
            input.classList.remove('error', 'success');
        });
    }
    
    // 密码显示/隐藏
    function togglePasswordVisibility() {
        const targetId = this.dataset.target;
        const input = document.getElementById(targetId);
        const icon = this.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        }
    }
    
    // 回车键处理
    function handleKeyPress(e) {
        if (e.key === 'Enter') {
            if (currentForm === 'login') {
                handleLogin();
            } else {
                handleRegister();
            }
        }
    }
    
    // 用户名验证
    function validateUsernameInput() {
        const input = this;
        const username = input.value.trim();
        
        if (!username) return;
        
        // 实时验证用户名格式
        if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(username)) {
            setInputState(input, 'error');
            showInputMessage(input, '只能包含字母、数字、中文、下划线或横线');
        } else if (username.length < 2) {
            setInputState(input, 'error');
            showInputMessage(input, '至少需要2个字符');
        } else if (username.length > 20) {
            setInputState(input, 'error');
            showInputMessage(input, '不能超过20个字符');
        } else {
            setInputState(input, 'success');
            hideInputMessage(input);
        }
    }
    
    // 密码验证
    function validatePasswordInput() {
        const input = this;
        const password = input.value;
        
        if (!password) return;
        
        if (password.length < 6) {
            setInputState(input, 'error');
            showInputMessage(input, '至少需要6位字符');
        } else if (password.length > 50) {
            setInputState(input, 'error');
            showInputMessage(input, '不能超过50个字符');
        } else {
            setInputState(input, 'success');
            hideInputMessage(input);
        }
    }
    
    // 确认密码验证
    function validateConfirmPassword() {
        const input = this;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = input.value;
        
        if (!confirmPassword) return;
        
        if (password !== confirmPassword) {
            setInputState(input, 'error');
            showInputMessage(input, '两次输入的密钥不一致');
        } else {
            setInputState(input, 'success');
            hideInputMessage(input);
        }
    }
    
    // 设置输入框状态
    function setInputState(input, state) {
        input.classList.remove('error', 'success');
        if (state) {
            input.classList.add(state);
        }
    }
    
    // 显示输入提示
    function showInputMessage(input, message) {
        let messageEl = input.parentNode.querySelector('.input-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.className = 'input-message';
            input.parentNode.appendChild(messageEl);
        }
        messageEl.textContent = message;
        messageEl.style.display = 'block';
    }
    
    // 隐藏输入提示
    function hideInputMessage(input) {
        const messageEl = input.parentNode.querySelector('.input-message');
        if (messageEl) {
            messageEl.style.display = 'none';
        }
    }
    
    // 处理登录
    function handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!username || !password) {
            showNotification('请输入完整的登录信息', 'error');
            return;
        }
        
        // 显示加载状态
        const btn = document.getElementById('loginBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i><span>验证中...</span>';
        btn.disabled = true;
        
        // 模拟网络延迟
        setTimeout(() => {
            const result = UserManager.loginUser(username, password);
            
            btn.innerHTML = originalText;
            btn.disabled = false;
            
            if (result.success) {
                showNotification('登录成功，正在进入案件现场...', 'success');
                setTimeout(() => {
                    redirectToGame();
                }, 1500);
            } else {
                showNotification(result.message, 'error');
            }
        }, 800);
    }
    
    // 处理注册
    function handleRegister() {
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        
        if (!username || !password || !confirmPassword) {
            showNotification('请填写所有必需信息', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('两次输入的密钥不一致', 'error');
            return;
        }
        
        // 显示加载状态
        const btn = document.getElementById('registerBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i><span>创建中...</span>';
        btn.disabled = true;
        
        // 模拟网络延迟
        setTimeout(() => {
            const result = UserManager.registerUser(username, password);
            
            btn.innerHTML = originalText;
            btn.disabled = false;
            
            if (result.success) {
                showNotification('档案创建成功，请登录', 'success');
                setTimeout(() => {
                    switchToLogin({ preventDefault: () => {} });
                    // 自动填入用户名
                    document.getElementById('loginUsername').value = username;
                }, 1500);
            } else {
                showNotification(result.message, 'error');
            }
        }, 800);
    }
    
    // 跳转到游戏
    function redirectToGame() {
        window.location.href = '../index/index.html';
    }
    
    return {
        init
    };
})();

// 通知系统
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const icon = document.getElementById('notificationIcon');
    const text = document.getElementById('notificationText');
    
    // 设置图标和样式
    notification.className = 'notification'; // 重置类名
    if (type === 'success') {
        icon.className = 'fa fa-check-circle';
        notification.classList.add('success');
    } else if (type === 'error') {
        icon.className = 'fa fa-exclamation-circle';
        notification.classList.add('error');
    } else if (type === 'warning') {
        icon.className = 'fa fa-exclamation-triangle';
        notification.classList.add('warning');
    } else {
        icon.className = 'fa fa-info-circle';
        notification.classList.add('info');
    }
    
    text.textContent = message;
    notification.classList.remove('hidden');
    notification.style.opacity = '1';
    
    // 自动隐藏
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 300);
    }, 3000);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    LoginUI.init();
});