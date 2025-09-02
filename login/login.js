// 登录/注册界面切换
document.getElementById('toRegister').onclick = function(e) {
    e.preventDefault();
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
};
document.getElementById('toLogin').onclick = function(e) {
    e.preventDefault();
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
};
// 密码显示/隐藏
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.onclick = () => {
        const input = document.getElementById(btn.dataset.target);
        const icon = btn.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        }
    };
});
// 通知提示
function showNotification(msg, isSuccess = true) {
    const notification = document.getElementById('notification');
    const icon = document.getElementById('notificationIcon');
    const text = document.getElementById('notificationText');
    icon.className = isSuccess ? 'fa fa-check-circle' : 'fa fa-exclamation-circle';
    text.textContent = msg;
    notification.classList.remove('hidden');
    notification.style.opacity = '1';
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.classList.add('hidden');
    }, 2000);
}
// 登录验证
document.getElementById('loginBtn').onclick = () => {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!username || !password) {
        showNotification('你的侦探证件我们检索不到', false);
        return;
    }
    // 这里可以接入真实验证逻辑
    showNotification('登录成功，正在进入案件现场...');
    setTimeout(() => {
        window.location.href = '../index/index.html';
    }, 1500);
};
// 注册验证
document.getElementById('registerBtn').onclick = () => {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirmPassword').value;
    
    if (password.length < 6) {
        showNotification('密钥至少需要6位字符', false);
        return;
    }
    if (password !== confirm) {
        showNotification('两次输入的密钥不一致', false);
        return;
    }
    showNotification('档案创建成功，请登录');
    setTimeout(() => document.getElementById('toLogin').click(), 1500);
};