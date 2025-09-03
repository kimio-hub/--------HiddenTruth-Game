// ========================================
//           用户存档统计管理
// ========================================

const UserSaveStats = (() => {
    const USER_SAVES_KEY = 'HTG_USER_SAVES_V1';
    
    // 获取指定用户的存档统计
    function getUserSaveStats(username) {
        try {
            const userSaveKey = `${USER_SAVES_KEY}_${username}`;
            const raw = localStorage.getItem(userSaveKey);
            
            if (!raw) {
                return {
                    username: username,
                    totalSaves: 0,
                    lastSaveTime: null,
                    totalPlaytime: 0,
                    saves: {}
                };
            }
            
            const saves = JSON.parse(raw);
            const saveCount = Object.keys(saves).length;
            let lastSaveTime = null;
            let totalPlaytime = 0;
            
            // 计算最后保存时间和总游戏时间
            Object.values(saves).forEach(save => {
                if (save.timestamp) {
                    const saveTime = new Date(save.timestamp);
                    if (!lastSaveTime || saveTime > lastSaveTime) {
                        lastSaveTime = saveTime;
                    }
                }
                
                // 估算游戏时间（基于存档中的进度）
                if (save.gameState && save.gameState.investigationStartTime) {
                    const elapsed = save.gameState.investigationElapsed || 0;
                    totalPlaytime += elapsed;
                }
            });
            
            return {
                username: username,
                totalSaves: saveCount,
                lastSaveTime: lastSaveTime,
                totalPlaytime: totalPlaytime,
                saves: saves
            };
        } catch (error) {
            console.error('获取用户存档统计失败:', error);
            return null;
        }
    }
    
    // 获取所有用户的存档概览
    function getAllUsersSaveOverview() {
        const overview = [];
        
        // 遍历localStorage寻找用户存档
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(USER_SAVES_KEY + '_')) {
                const username = key.replace(USER_SAVES_KEY + '_', '');
                const stats = getUserSaveStats(username);
                if (stats) {
                    overview.push(stats);
                }
            }
        }
        
        return overview.sort((a, b) => {
            // 按最后保存时间排序
            if (!a.lastSaveTime) return 1;
            if (!b.lastSaveTime) return -1;
            return b.lastSaveTime - a.lastSaveTime;
        });
    }
    
    // 清理指定用户的所有存档
    function clearUserSaves(username) {
        if (!username) return false;
        
        try {
            const userSaveKey = `${USER_SAVES_KEY}_${username}`;
            const autoSaveKey = `HTG_AUTO_SAVE_${username}`;
            const migrationKey = `HTG_MIGRATION_${username}`;
            
            localStorage.removeItem(userSaveKey);
            localStorage.removeItem(autoSaveKey);
            localStorage.removeItem(migrationKey);
            
            console.log(`已清理用户 ${username} 的所有存档`);
            return true;
        } catch (error) {
            console.error('清理用户存档失败:', error);
            return false;
        }
    }
    
    // 导出用户存档数据
    function exportUserSaves(username) {
        const stats = getUserSaveStats(username);
        if (!stats) return null;
        
        const exportData = {
            username: username,
            exportTime: new Date().toISOString(),
            version: '1.0',
            stats: stats,
            saves: stats.saves
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    // 格式化游戏时间
    function formatPlaytime(milliseconds) {
        if (!milliseconds || milliseconds <= 0) return '未知';
        
        const minutes = Math.floor(milliseconds / 60000);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (hours > 0) {
            return `${hours}小时${remainingMinutes}分钟`;
        } else {
            return `${remainingMinutes}分钟`;
        }
    }
    
    // 生成用户存档报告
    function generateUserReport(username) {
        const stats = getUserSaveStats(username);
        if (!stats) return null;
        
        const report = {
            username: stats.username,
            summary: {
                totalSaves: stats.totalSaves,
                lastSaveTime: stats.lastSaveTime ? stats.lastSaveTime.toLocaleString() : '无',
                totalPlaytime: formatPlaytime(stats.totalPlaytime),
                isEmpty: stats.totalSaves === 0
            },
            saves: []
        };
        
        // 添加每个存档的详细信息
        Object.entries(stats.saves).forEach(([slotId, save]) => {
            report.saves.push({
                slotId: slotId,
                name: save.name,
                timestamp: save.timestamp,
                location: save.roomName || '未知',
                progress: save.progress || '未知',
                owner: save.owner || username
            });
        });
        
        return report;
    }
    
    return {
        getUserSaveStats,
        getAllUsersSaveOverview,
        clearUserSaves,
        exportUserSaves,
        formatPlaytime,
        generateUserReport
    };
})();

// 全局导出
if (typeof window !== 'undefined') {
    window.UserSaveStats = UserSaveStats;
}
