// 计时器相关功能

// 计时器管理工具
const TimerManager = {
    // 状态数据
    data: {
        isRunning: false,
        timerStartTime: null,
        currentTime: null,
        elapsedTime: 0,
        timerInterval: null,
        systemTime: new Date(),
        currentEarnings: 0,
        totalExpectedEarnings: 0,
        lastCoinMilestone: 0,
        countUp: { value: 0 },
        workStatus: '',
        initialWorkProgress: 0,
        initialWorkedSeconds: 0
    },
    
    // 获取当前小时和分钟，转换为小时数（包含小数部分）
    getCurrentTimeDecimal() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        return hour + (minute / 60);
    },
    
    // 计算当前工作状态和进度
    calculateWorkStatus(config) {
        const currentTimeDecimal = this.getCurrentTimeDecimal();
        const { startTime, endTime, hourlyRate } = config;
        
        // 处理跨天的情况
        const isWorkDayCrossing = endTime < startTime;
        const currentTimeAdjusted = currentTimeDecimal;
        
        // 计算工作总时长（小时）
        const calculatedWorkHours = isWorkDayCrossing ? 
            (24 - startTime) + endTime : 
            endTime - startTime;
        
        // 判断工作状态
        if (isWorkDayCrossing) {
            // 工作时间跨天的情况（如22:00-6:00）
            if (currentTimeAdjusted >= startTime || currentTimeAdjusted < endTime) {
                // 在工作时间内
                this.data.workStatus = 'working';
                
                // 计算已工作时间比例
                let workedHours;
                if (currentTimeAdjusted >= startTime) {
                    workedHours = currentTimeAdjusted - startTime;
                } else {
                    workedHours = (24 - startTime) + currentTimeAdjusted;
                }
                
                // 计算初始进度
                this.data.initialWorkProgress = (workedHours / calculatedWorkHours) * 100;
                
                // 计算已经赚取的金额
                this.data.currentEarnings = hourlyRate * workedHours;
                
                // 记录已工作的秒数
                this.data.initialWorkedSeconds = Math.floor(workedHours * 3600);
            } else {
                // 不在工作时间
                if (currentTimeAdjusted < startTime && currentTimeAdjusted >= endTime) {
                    this.data.workStatus = 'before_work';
                    this.data.initialWorkProgress = 0;
                    this.data.initialWorkedSeconds = 0;
                    this.data.currentEarnings = 0; // 还未上班，收入为0
                } else {
                    this.data.workStatus = 'after_work';
                    this.data.initialWorkProgress = 100;
                    // 已结束工作，获得全部收入
                    this.data.currentEarnings = hourlyRate * calculatedWorkHours;
                    // 记录全部工作时间
                    this.data.initialWorkedSeconds = Math.floor(calculatedWorkHours * 3600);
                }
            }
        } else {
            // 工作时间不跨天的常规情况（如9:00-17:00）
            if (currentTimeAdjusted >= startTime && currentTimeAdjusted < endTime) {
                // 正在工作中
                this.data.workStatus = 'working';
                
                // 计算已工作时间
                const workedHours = currentTimeAdjusted - startTime;
                
                // 计算初始进度
                this.data.initialWorkProgress = (workedHours / calculatedWorkHours) * 100;
                
                // 计算已经赚取的金额
                this.data.currentEarnings = hourlyRate * workedHours;
                
                // 记录已工作的秒数
                this.data.initialWorkedSeconds = Math.floor(workedHours * 3600);
            } else if (currentTimeAdjusted < startTime) {
                // 还未上班
                this.data.workStatus = 'before_work';
                this.data.initialWorkProgress = 0;
                this.data.initialWorkedSeconds = 0;
                this.data.currentEarnings = 0; // 还未上班，收入为0
            } else {
                // 已经下班
                this.data.workStatus = 'after_work';
                this.data.initialWorkProgress = 100;
                // 已结束工作，获得全部收入
                this.data.currentEarnings = hourlyRate * calculatedWorkHours;
                // 记录全部工作时间
                this.data.initialWorkedSeconds = Math.floor(calculatedWorkHours * 3600);
            }
        }
        
        // 记录当前整元里程碑，用于后续撒金币
        this.data.lastCoinMilestone = Math.floor(this.data.currentEarnings);
        this.data.countUp.value = this.data.currentEarnings;
        
        // 计算总预期收入
        this.data.totalExpectedEarnings = hourlyRate * calculatedWorkHours;
        
        return {
            workStatus: this.data.workStatus,
            initialWorkProgress: this.data.initialWorkProgress,
            initialWorkedSeconds: this.data.initialWorkedSeconds,
            currentEarnings: this.data.currentEarnings,
            lastCoinMilestone: this.data.lastCoinMilestone,
            totalExpectedEarnings: this.data.totalExpectedEarnings
        };
    },
    
    // 开始计时
    startTimer(config, callbacks = {}) {
        const { hourlyRate, calculatedWorkHours } = config;
        
        // 初始化定时器相关变量
        this.data.timerStartTime = new Date().getTime();
        this.data.currentTime = this.data.timerStartTime;
        this.data.elapsedTime = 0;
        this.data.isRunning = true;
        
        // 计算工作状态和初始进度
        this.calculateWorkStatus(config);
        
        // 创建定时器，默认每200ms更新一次
        this.data.timerInterval = setInterval(() => {
            this.updateTimer(config, callbacks);
        }, 200);
        
        // 初始化视觉效果
        EffectsManager.initParticles();
        EffectsManager.applyStartAnimations();
        
        return {
            isRunning: this.data.isRunning,
            initialState: {
                workStatus: this.data.workStatus,
                initialWorkProgress: this.data.initialWorkProgress,
                initialWorkedSeconds: this.data.initialWorkedSeconds,
                currentEarnings: this.data.currentEarnings,
                totalExpectedEarnings: this.data.totalExpectedEarnings,
                elapsedTime: this.data.elapsedTime
            }
        };
    },
    
    // 停止计时
    stopTimer() {
        clearInterval(this.data.timerInterval);
        this.data.isRunning = false;
        
        // 应用结束动画
        EffectsManager.applyStopAnimations();
    },
    
    // 更新计时器
    updateTimer(config, callbacks = {}) {
        const { perSecondRate, onUpdate } = config;
        
        // 获取当前时间
        const now = new Date().getTime();
        // 更新系统时间
        this.data.systemTime = new Date();
        // 计算这次更新与上次更新之间的时间差（秒）
        const deltaSeconds = (now - this.data.currentTime) / 1000;
        // 更新当前时间
        this.data.currentTime = now;
        // 累加总经过时间 - 仅在工作中状态下增加
        if (this.data.workStatus === 'working') {
            this.data.elapsedTime += Math.floor(deltaSeconds);
        }
        
        // 如果初始状态是正在工作，继续计算收入增长
        if (this.data.workStatus === 'working') {
            // 只计算这次更新产生的收入增量
            const incrementalEarnings = perSecondRate * deltaSeconds;
            this.data.currentEarnings += incrementalEarnings;
        }
        
        // 检查是否达到新的整元里程碑
        const currentWholeYuan = Math.floor(this.data.currentEarnings);
        if (currentWholeYuan > this.data.lastCoinMilestone) {
            // 每增加一元就撒一次金币
            this.data.lastCoinMilestone = currentWholeYuan;
            
            // 整10元和整100元时撒更多金币
            if (currentWholeYuan % 100 === 0) {
                // 整百元大庆祝
                EffectsManager.celebrateWithConfetti('large');
                EffectsManager.dropCoins(50);
            } else if (currentWholeYuan % 10 === 0) {
                // 整十元中等庆祝
                EffectsManager.celebrateWithConfetti('medium');
                EffectsManager.dropCoins(30);
            } else {
                // 普通整元小庆祝
                EffectsManager.celebrateWithConfetti('small');
                EffectsManager.dropCoins(20);
            }
        }
        
        // 添加流畅的数字更新
        EffectsManager.animateNumberUpdate(this.data.countUp, this.data.currentEarnings);
        
        // 特殊情况：如果工作状态是"已下班"，进度条保持在100%
        if (this.data.workStatus === 'after_work') {
            const progressBar = document.querySelector('.progress-bar');
            const progressText = document.querySelector('.progress-text');
            
            if (progressBar) {
                progressBar.style.width = '100%';
            }
            
            if (progressText) {
                progressText.textContent = '100%';
            }
        }
        
        // 如果有回调，执行回调
        if (onUpdate && typeof onUpdate === 'function') {
            onUpdate({
                elapsedTime: this.data.elapsedTime,
                currentEarnings: this.data.currentEarnings,
                systemTime: this.data.systemTime,
                workStatus: this.data.workStatus,
                initialWorkedSeconds: this.data.initialWorkedSeconds,
                totalExpectedEarnings: this.data.totalExpectedEarnings
            });
        }
    },
    
    // 格式化时间显示（转换秒到 时:分:秒）
    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        
        return [
            h.toString().padStart(2, '0'),
            m.toString().padStart(2, '0'),
            s.toString().padStart(2, '0')
        ].join(':');
    },
    
    // 获取当前计时器状态
    getTimerState() {
        return {
            isRunning: this.data.isRunning,
            elapsedTime: this.data.elapsedTime,
            currentEarnings: this.data.currentEarnings,
            workStatus: this.data.workStatus,
            initialWorkProgress: this.data.initialWorkProgress,
            initialWorkedSeconds: this.data.initialWorkedSeconds,
            totalExpectedEarnings: this.data.totalExpectedEarnings,
            progressPercentage: this.getProgressPercentage(),
            systemTime: this.data.systemTime
        };
    },
    
    // 计算进度百分比
    getProgressPercentage(calculatedWorkHours) {
        if (!calculatedWorkHours || calculatedWorkHours <= 0) return 0;
        
        const totalSeconds = calculatedWorkHours * 3600;
        const percentage = (this.data.elapsedTime / totalSeconds) * 100;
        // 加上初始进度
        return Math.min(100, Math.max(0, (this.data.initialWorkProgress + parseFloat(percentage)).toFixed(1)));
    }
}; 