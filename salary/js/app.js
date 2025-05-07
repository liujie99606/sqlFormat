// 主应用文件 - 包含Vue应用的核心逻辑

// 创建Vue应用
const app = Vue.createApp({
    data() {
        return {
            // 用户输入
            salaryType: AppConfig.defaults.salaryType,
            salaryAmount: AppConfig.defaults.salaryAmount,
            
            // 工作时间选择
            startTime: AppConfig.defaults.startTime,
            endTime: AppConfig.defaults.endTime,
            
            // 时间选项列表
            timeOptions: AppConfig.timeOptions,
            
            // 状态控制 - 从TimerManager中获取
            isRunning: false,
            currentTime: null,
            elapsedTime: 0,
            
            // 当前系统时间
            systemTime: new Date(),
            
            // 计算值
            currentEarnings: 0,
            totalExpectedEarnings: 0,
            
            // 动画数据
            countUp: {
                value: 0,
                duration: 200,
            },
            
            // 工作状态
            workStatus: '',
            initialWorkProgress: 0,
            initialWorkedSeconds: 0,
        };
    },
    
    computed: {
        // 薪资输入框ID
        salaryInputId() {
            return `${this.salaryType}SalaryInput`;
        },
        
        // 根据薪资类型显示不同的标签
        salaryLabel() {
            return AppConfig.salaryTypes[this.salaryType]?.label || '时薪 (元/小时)';
        },
        
        // 计算实际工作时长
        calculatedWorkHours() {
            // 如果下班时间小于上班时间，认为是跨天（如早上8点到晚上22点）
            let hours = this.endTime >= this.startTime ? 
                this.endTime - this.startTime : 
                (24 - this.startTime) + this.endTime;
            
            return hours;
        },
        
        // 将用户输入的薪资转换为时薪
        hourlyRate() {
            const type = this.salaryType;
            const amount = this.salaryAmount;
            
            if (!amount || amount <= 0) return 0;
            
            const salaryType = AppConfig.salaryTypes[type];
            if (!salaryType) return amount; // 默认为时薪
            
            // 转换为时薪
            return amount / salaryType.hoursPerPeriod;
        },
        
        // 格式化后的收入显示
        formattedEarnings() {
            return this.currentEarnings.toFixed(2);
        },
        
        // 每秒收入
        perSecondRate() {
            return this.hourlyRate / 3600;
        },
        
        // 进度百分比
        progressPercentage() {
            if (this.calculatedWorkHours <= 0) return 0;
            
            const totalSeconds = this.calculatedWorkHours * 3600;
            const percentage = (this.elapsedTime / totalSeconds) * 100;
            // 加上初始进度
            return Math.min(100, Math.max(0, (this.initialWorkProgress + parseFloat(percentage)).toFixed(1)));
        },
        
        // 是否可以开始
        canStart() {
            return this.hourlyRate > 0 && this.calculatedWorkHours > 0;
        },
        
        // 工作状态显示文本
        workStatusText() {
            switch(this.workStatus) {
                case 'before_work':
                    return '还未上班';
                case 'working':
                    return '正在工作中';
                case 'after_work':
                    return '已经下班了';
                default:
                    return '';
            }
        },
        
        // 总的已工作时间（包括初始已工作时间和计时器记录的时间）
        totalWorkedTime() {
            return this.initialWorkedSeconds + this.elapsedTime;
        },
        
        // 格式化显示当前时间
        currentTimeFormatted() {
            const time = this.systemTime;
            const hours = time.getHours().toString().padStart(2, '0');
            const minutes = time.getMinutes().toString().padStart(2, '0');
            const seconds = time.getSeconds().toString().padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        }
    },
    
    methods: {
        // 开始计时
        startTimer() {
            if (!this.canStart) return;
            
            // 保存用户配置到localStorage
            this.saveSettings();
            
            // 配置计时器
            const timerConfig = {
                startTime: this.startTime,
                endTime: this.endTime,
                hourlyRate: this.hourlyRate,
                calculatedWorkHours: this.calculatedWorkHours,
                perSecondRate: this.perSecondRate,
                onUpdate: this.handleTimerUpdate
            };
            
            // 启动计时器
            const timerState = TimerManager.startTimer(timerConfig);
            
            // 更新状态
            this.isRunning = timerState.isRunning;
            this.workStatus = timerState.initialState.workStatus;
            this.initialWorkProgress = timerState.initialState.initialWorkProgress;
            this.currentEarnings = timerState.initialState.currentEarnings;
            this.initialWorkedSeconds = timerState.initialState.initialWorkedSeconds;
            this.totalExpectedEarnings = timerState.initialState.totalExpectedEarnings;
            this.elapsedTime = timerState.initialState.elapsedTime || 0;
            
            // 更新动画
            this.countUp.value = this.currentEarnings;
            
            // 创建UI更新定时器，每秒更新显示
            this.uiUpdateInterval = setInterval(() => {
                // 已工作时长每秒手动强制更新
                document.querySelector('.stats-grid .stat-box:first-child .stat-value').textContent = 
                    this.formatTime(this.totalWorkedTime);
            }, 1000);
        },
        
        // 停止计时
        stopTimer() {
            TimerManager.stopTimer();
            this.isRunning = false;
            
            // 清除UI更新定时器
            if (this.uiUpdateInterval) {
                clearInterval(this.uiUpdateInterval);
                this.uiUpdateInterval = null;
            }
        },
        
        // 计时器更新回调
        handleTimerUpdate(state) {
            // 更新从计时器传递来的状态
            this.elapsedTime = state.elapsedTime;
            this.currentEarnings = state.currentEarnings;
            this.systemTime = state.systemTime;
            this.workStatus = state.workStatus;
            this.initialWorkedSeconds = state.initialWorkedSeconds;
            this.totalExpectedEarnings = state.totalExpectedEarnings;
            
            // 手动更新已工作时长显示
            const workedTimeElement = document.querySelector('.stats-grid .stat-box:first-child .stat-value');
            if (workedTimeElement) {
                workedTimeElement.textContent = this.formatTime(this.totalWorkedTime);
            }
        },
        
        // 格式化时间显示
        formatTime(seconds) {
            return TimerManager.formatTime(seconds);
        },
        
        // 保存设置到localStorage
        saveSettings() {
            const settings = {
                salaryType: this.salaryType,
                salaryAmount: this.salaryAmount,
                startTime: this.startTime,
                endTime: this.endTime
            };
            
            StorageUtils.saveSettings(settings);
        },
        
        // 从localStorage加载设置
        loadSettings() {
            const savedSettings = StorageUtils.loadSettings();
            if (savedSettings) {
                this.salaryType = savedSettings.salaryType || AppConfig.defaults.salaryType;
                this.salaryAmount = savedSettings.salaryAmount || AppConfig.defaults.salaryAmount;
                this.startTime = savedSettings.startTime !== undefined ? 
                    savedSettings.startTime : AppConfig.defaults.startTime;
                this.endTime = savedSettings.endTime !== undefined ? 
                    savedSettings.endTime : AppConfig.defaults.endTime;
            }
        }
    },
    
    mounted() {
        // 页面加载时，从localStorage加载设置
        this.loadSettings();
        
        // 添加初始动画
        EffectsManager.applyPageAnimations();
        
        // 创建系统时间更新定时器，每秒更新一次
        setInterval(() => {
            this.systemTime = new Date();
        }, 1000);
    }
});

// 挂载Vue应用
app.mount('#app'); 