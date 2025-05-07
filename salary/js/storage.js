// 存储相关功能

const SETTINGS_KEY = 'salaryCalculatorSettings';

// 存储工具
const StorageUtils = {
    // 保存设置到localStorage
    saveSettings(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    },
    
    // 从localStorage加载设置
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem(SETTINGS_KEY);
            if (savedSettings) {
                return JSON.parse(savedSettings);
            }
        } catch (error) {
            console.error('加载设置出错:', error);
        }
        return null;
    }
}; 