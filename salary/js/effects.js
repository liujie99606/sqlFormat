// 视觉效果相关功能

// 粒子和金币效果
const EffectsManager = {
    particlesInitialized: false,
    
    // 初始化粒子效果
    initParticles() {
        if (this.particlesInitialized) return;
        
        const particlesContainer = document.getElementById('particles-container');
        if (!particlesContainer) return;
        
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            this.createParticle(particlesContainer);
        }
        
        this.particlesInitialized = true;
    },
    
    // 创建单个粒子
    createParticle(container) {
        if (!container) return;
        
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
        if (typeof confetti !== 'function') return;
        
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
        if (!coinsContainer) return;
        
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
    },
    
    // 添加流畅的数字更新动画
    animateNumberUpdate(element, value, duration = 0.2) {
        if (!element) return;
        
        gsap.to(element, {
            value: value,
            duration: duration,
            onUpdate: () => {
                // 数字更新在Vue的响应式系统之外处理，以获得更流畅的效果
                const earningElement = document.querySelector('.earning-value');
                if (earningElement) {
                    earningElement.textContent = "¥" + element.value.toFixed(2);
                }
            }
        });
    },
    
    // 应用页面动画效果
    applyPageAnimations() {
        const panel = document.querySelector(".glass-panel");
        if (!panel) return;
        
        // 初始加载动画
        gsap.from(panel, {
            opacity: 0,
            y: 30,
            duration: 1,
            ease: "power3.out"
        });
    },
    
    // 应用开始计时动画
    applyStartAnimations() {
        const earningElement = document.querySelector(".earning-value");
        const displayElement = document.querySelector(".salary-display");
        
        // 数字动画
        if (earningElement) {
            gsap.from(earningElement, {
                textContent: 0,
                duration: 1,
                ease: "power1.out",
                snap: { textContent: 0.01 },
                onUpdate: function () {
                    if (this.targets()[0]) {
                        this.targets()[0].innerHTML = "¥" + parseFloat(this.targets()[0].textContent || "0").toFixed(2);
                    }
                }
            });
        }
        
        // 显示动画
        if (displayElement) {
            gsap.from(displayElement, {
                opacity: 0, 
                y: 20, 
                duration: 0.8, 
                ease: "power2.out"
            });
        }
    },
    
    // 应用停止计时动画
    applyStopAnimations() {
        const formElement = document.querySelector(".setup-form");
        if (!formElement) return;
        
        gsap.from(formElement, {
            opacity: 0, 
            y: 20, 
            duration: 0.8, 
            ease: "power2.out"
        });
    }
}; 