/*
 * 注意: 该文件已不再使用，已被拆分为模块化文件结构
 * 请查看 salary/js/ 目录下的文件:
 * - app.js - 主应用入口文件
 * - config.js - 配置文件
 * - effects.js - 视觉效果
 * - storage.js - 本地存储
 * - timer.js - 计时器功能
 */

// 以下是原始代码，保留作为参考
// 创建Vue应用
const app = Vue.createApp({
    data() {
        return {
            // 用户输入
            salaryType: 'hourly', // 默认为时薪，可选值: 'monthly', 'daily', 'hourly'
            salaryAmount: 0,      // 用户输入的薪资金额
            
            // 工作时间选择
            startTime: 8,    // 默认上班时间：8:00
            endTime: 16,     // 默认下班时间：16:00
            
            // 时间选项列表
            timeOptions: [],
            
            // 状态控制
            isRunning: false,
            timerStartTime: null,
            currentTime: null,
            elapsedTime: 0,
            
            // 当前系统时间
            systemTime: new Date(),
            
            // 计算值
            currentEarnings: 0,
            totalExpectedEarnings: 0,
            lastCoinMilestone: 0, // 最后一次撒金币的整元数
            
            // 动画数据
            countUp: {
                value: 0,
                duration: 200,
            },
            
            // 工作状态
            workStatus: '',  // 可能的值: 'before_work', 'working', 'after_work'
            initialWorkProgress: 0, // 开始计时时已经工作的进度（百分比）
            initialWorkedSeconds: 0, // 开始计时时已经工作的秒数
            
            // 定时器
            timerInterval: null,
            particlesInitialized: false
        };
    },
    
    computed: {
        // 薪资输入框ID
        salaryInputId() {
            return `${this.salaryType}SalaryInput`;
        },
        
        // 根据薪资类型显示不同的标签
        salaryLabel() {
            switch(this.salaryType) {
                case 'monthly': return '月薪 (元/月)';
                case 'daily': return '日薪 (元/天)';
                default: return '时薪 (元/小时)';
            }
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
            switch(this.salaryType) {
                case 'monthly':
                    // 月薪转时薪：月薪 / (21.75天 × 8小时/天)
                    return this.salaryAmount / (21.75 * 8);
                case 'daily':
                    // 日薪转时薪：日薪 / 8小时
                    return this.salaryAmount / 8;
                default:
                    // 本来就是时薪
                    return this.salaryAmount;
            }
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
        // 初始化时间选项
        initTimeOptions() {
            const options = [];
            
            // 生成0-24小时的选项，每半小时一个选项
            for (let hour = 0; hour < 24; hour++) {
                // 整点
                options.push({
                    value: hour,
                    label: `${hour.toString().padStart(2, '0')}:00`
                });
                
                // 半点
                options.push({
                    value: hour + 0.5,
                    label: `${hour.toString().padStart(2, '0')}:30`
                });
            }
            
            this.timeOptions = options;
        },
        
        // 获取当前小时和分钟，转换为小时数（包含小数部分）
        getCurrentTimeDecimal() {
            const now = new Date();
            const hour = now.getHours();
            const minute = now.getMinutes();
            return hour + (minute / 60);
        },
        
        // 计算当前工作状态和进度
        calculateWorkStatus() {
            const currentTimeDecimal = this.getCurrentTimeDecimal();
            
            // 处理跨天的情况
            const isWorkDayCrossing = this.endTime < this.startTime;
            const currentTimeAdjusted = currentTimeDecimal;
            
            // 判断工作状态
            if (isWorkDayCrossing) {
                // 工作时间跨天的情况（如22:00-6:00）
                if (currentTimeAdjusted >= this.startTime || currentTimeAdjusted < this.endTime) {
                    // 在工作时间内
                    this.workStatus = 'working';
                    
                    // 计算已工作时间比例
                    let workedHours;
                    if (currentTimeAdjusted >= this.startTime) {
                        workedHours = currentTimeAdjusted - this.startTime;
                    } else {
                        workedHours = (24 - this.startTime) + currentTimeAdjusted;
                    }
                    
                    // 计算初始进度
                    this.initialWorkProgress = (workedHours / this.calculatedWorkHours) * 100;
                    
                    // 计算已经赚取的金额
                    this.currentEarnings = this.hourlyRate * workedHours;
                    
                    // 记录已工作的秒数
                    this.initialWorkedSeconds = Math.floor(workedHours * 3600);
                } else {
                    // 不在工作时间
                    if (currentTimeAdjusted < this.startTime && currentTimeAdjusted >= this.endTime) {
                        this.workStatus = 'before_work';
                        this.initialWorkProgress = 0;
                        this.initialWorkedSeconds = 0;
                        this.currentEarnings = 0; // 还未上班，收入为0
                    } else {
                        this.workStatus = 'after_work';
                        this.initialWorkProgress = 100;
                        // 已结束工作，获得全部收入
                        this.currentEarnings = this.hourlyRate * this.calculatedWorkHours;
                        // 记录全部工作时间
                        this.initialWorkedSeconds = Math.floor(this.calculatedWorkHours * 3600);
                    }
                }
            } else {
                // 工作时间不跨天的常规情况（如9:00-17:00）
                if (currentTimeAdjusted >= this.startTime && currentTimeAdjusted < this.endTime) {
                    // 正在工作中
                    this.workStatus = 'working';
                    
                    // 计算已工作时间
                    const workedHours = currentTimeAdjusted - this.startTime;
                    
                    // 计算初始进度
                    this.initialWorkProgress = (workedHours / this.calculatedWorkHours) * 100;
                    
                    // 计算已经赚取的金额
                    this.currentEarnings = this.hourlyRate * workedHours;
                    
                    // 记录已工作的秒数
                    this.initialWorkedSeconds = Math.floor(workedHours * 3600);
                } else if (currentTimeAdjusted < this.startTime) {
                    // 还未上班
                    this.workStatus = 'before_work';
                    this.initialWorkProgress = 0;
                    this.initialWorkedSeconds = 0;
                    this.currentEarnings = 0; // 还未上班，收入为0
                } else {
                    // 已经下班
                    this.workStatus = 'after_work';
                    this.initialWorkProgress = 100;
                    // 已结束工作，获得全部收入
                    this.currentEarnings = this.hourlyRate * this.calculatedWorkHours;
                    // 记录全部工作时间
                    this.initialWorkedSeconds = Math.floor(this.calculatedWorkHours * 3600);
                }
            }
            
            // 更新初始收入值
            this.countUp.value = this.currentEarnings;
            
            // 记录当前整元里程碑，用于后续撒金币
            this.lastCoinMilestone = Math.floor(this.currentEarnings);
        },
        
        // 开始计时
        startTimer() {
            if (!this.canStart) return;
            
            // 保存用户配置到localStorage
            this.saveSettings();
            
            // 计算工作状态和初始进度
            this.calculateWorkStatus();
            
            // 计算总预期收入
            this.totalExpectedEarnings = this.hourlyRate * this.calculatedWorkHours;
            
            // 初始化定时器相关变量
            this.timerStartTime = new Date().getTime();
            this.currentTime = this.timerStartTime;
            this.elapsedTime = 0;
            this.isRunning = true;
            
            // 创建定时器，每50ms更新一次
            this.timerInterval = setInterval(() => {
                this.updateTimer();
            }, 200);
            
            // 初始化粒子效果
            this.initParticles();
            
            // 添加流畅的数字动画
            gsap.from(".earning-value", {
                textContent: 0,
                duration: 1,
                ease: "power1.out",
                snap: {textContent: 0.01},
                onUpdate: function () {
                    this.targets()[0].innerHTML = "¥" + parseFloat(this.targets()[0].textContent).toFixed(2);
                }
            });
            
            // 添加开始动画
            gsap.from(".salary-display", {opacity: 0, y: 20, duration: 0.8, ease: "power2.out"});
        },
        
        // 停止计时
        stopTimer() {
            clearInterval(this.timerInterval);
            this.isRunning = false;
            
            // 添加结束动画
            gsap.from(".setup-form", {opacity: 0, y: 20, duration: 0.8, ease: "power2.out"});
        },
        
        // 更新计时器
        updateTimer() {
            // 获取当前时间
            const now = new Date().getTime();
            // 更新系统时间
            this.systemTime = new Date();
            // 计算这次更新与上次更新之间的时间差（秒）
            const deltaSeconds = (now - this.currentTime) / 1000;
            // 更新当前时间
            this.currentTime = now;
            // 累加总经过时间
            this.elapsedTime += Math.floor(deltaSeconds);
            
            // 如果初始状态是正在工作，继续计算收入增长
            if (this.workStatus === 'working') {
                // 只计算这次更新产生的收入增量
                const incrementalEarnings = this.perSecondRate * deltaSeconds;
                this.currentEarnings += incrementalEarnings;
            }
            
            // 检查是否达到新的整元里程碑
            const currentWholeYuan = Math.floor(this.currentEarnings);
            if (currentWholeYuan > this.lastCoinMilestone) {
                // 每增加一元就撒一次金币
                this.lastCoinMilestone = currentWholeYuan;
                
                // 整10元和整100元时撒更多金币
                if (currentWholeYuan % 100 === 0) {
                    // 整百元大庆祝
                    this.celebrateWithConfetti('large');
                    this.dropCoins(50);
                } else if (currentWholeYuan % 10 === 0) {
                    // 整十元中等庆祝
                    this.celebrateWithConfetti('medium');
                    this.dropCoins(30);
                } else {
                    // 普通整元小庆祝
                    this.celebrateWithConfetti('small');
                    this.dropCoins(20);
                }
            }
            
            // 添加流畅的数字更新
            gsap.to(this.countUp, {
                value: this.currentEarnings,
                duration: 0.2,
                onUpdate: () => {
                    // 数字更新在Vue的响应式系统之外处理，以获得更流畅的效果
                    document.querySelector('.earning-value').textContent =
                        "¥" + this.countUp.value.toFixed(2);
                }
            });
            
            // 特殊情况：如果工作状态是"已下班"，进度条保持在100%
            if (this.workStatus === 'after_work') {
                document.querySelector('.progress-bar').style.width = '100%';
                document.querySelector('.progress-text').textContent = '100%';
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
        
        // 保存设置到localStorage
        saveSettings() {
            const settings = {
                salaryType: this.salaryType,
                salaryAmount: this.salaryAmount,
                startTime: this.startTime,
                endTime: this.endTime
            };
            
            localStorage.setItem('salaryCalculatorSettings', JSON.stringify(settings));
        },
        
        // 从localStorage加载设置
        loadSettings() {
            const savedSettings = localStorage.getItem('salaryCalculatorSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                this.salaryType = settings.salaryType || 'hourly';
                this.salaryAmount = settings.salaryAmount || 0;
                this.startTime = settings.startTime !== undefined ? settings.startTime : 8;
                this.endTime = settings.endTime !== undefined ? settings.endTime : 16;
            }
        },
        
        // 初始化粒子效果
        initParticles() {
            if (this.particlesInitialized) return;
            
            const particlesContainer = document.getElementById('particles-container');
            const particleCount = 50;
            
            for (let i = 0; i < particleCount; i++) {
                this.createParticle(particlesContainer);
            }
            
            this.particlesInitialized = true;
        },
        
        // 创建单个粒子
        createParticle(container) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // 随机位置和大小
            const size = Math.random() * 5 + 1;
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const opacity = Math.random() * 0.5 + 0.2;
            const duration = Math.random() * 20 + 10;
            const delay = Math.random() * 5;
            
            // 应用基础样式
            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background-color: rgba(255, 255, 255, ${opacity});
                border-radius: 50%;
                left: ${posX}%;
                top: ${posY}%;
                pointer-events: none;
                box-shadow: 0 0 ${size * 2}px rgba(255, 255, 255, 0.7);
            `;
            
            // 添加动画
            gsap.to(particle, {
                x: 'random(-100, 100)',
                y: 'random(-100, 100)',
                opacity: 'random(0.1, 0.5)',
                scale: 'random(0.5, 1.5)',
                duration: duration,
                delay: delay,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
            
            container.appendChild(particle);
        },
        
        // 庆祝金币效果（使用canvas-confetti库）
        celebrateWithConfetti(size = 'medium') {
            let options = {
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FFDF00', '#F0E68C', '#DAA520', '#FFA500']
            };
            
            switch (size) {
                case 'small':
                    options.particleCount = 30;
                    options.spread = 50;
                    break;
                case 'large':
                    options.particleCount = 200;
                    options.spread = 90;
                    options.startVelocity = 45;
                    break;
                case 'medium':
                default:
                    options.particleCount = 100;
                    options.spread = 70;
                    break;
            }
            
            confetti(options);
        },
        
        // 掉落金币效果
        dropCoins(numberOfCoins = 20) {
            const coinsContainer = document.getElementById('coins-container');
            
            for (let i = 0; i < numberOfCoins; i++) {
                setTimeout(() => {
                    const coin = document.createElement('div');
                    coin.classList.add('coin');
                    
                    // 随机位置
                    const posX = Math.random() * 100;
                    
                    // 设置初始位置在屏幕上方
                    coin.style.left = `${posX}%`;
                    coin.style.top = '-50px';
                    
                    // 添加到容器
                    coinsContainer.appendChild(coin);
                    
                    // 创建掉落和旋转动画
                    gsap.to(coin, {
                        y: window.innerHeight + 100,
                        rotation: Math.random() * 720 - 360,
                        duration: Math.random() * 2 + 2,
                        ease: "power1.in",
                        onComplete: () => {
                            coin.remove();
                        }
                    });
                }, i * 100); // 间隔掉落
            }
        }
    },
    
    mounted() {
        // 初始化时间选项
        this.initTimeOptions();
        
        // 页面加载时，从localStorage加载设置
        this.loadSettings();
        
        // 添加初始动画
        gsap.from(".glass-panel", {
            opacity: 0,
            y: 30,
            duration: 1,
            ease: "power3.out"
        });
        
        // 创建系统时间更新定时器，每秒更新一次
        setInterval(() => {
            this.systemTime = new Date();
        }, 1000);
    }
});

// 挂载Vue应用
app.mount('#app'); 