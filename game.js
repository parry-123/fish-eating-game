class Fish {
    constructor(x, y, size, color, speed, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.speed = speed;
        this.isPlayer = isPlayer;
        this.direction = Math.random() * Math.PI * 2;
        if (isPlayer) {
            this.direction = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.direction);
        
        // 鱼身
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.quadraticCurveTo(
            this.size/2, -this.size/2,
            this.size, 0
        );
        ctx.quadraticCurveTo(
            this.size/2, this.size/2,
            -this.size, 0
        );
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // 鱼尾
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(-this.size*1.5, -this.size/2);
        ctx.lineTo(-this.size*1.5, this.size/2);
        ctx.closePath();
        ctx.fill();
        
        // 鱼眼
        if (this.isPlayer) {
            ctx.beginPath();
            ctx.arc(this.size/2, -this.size/4, this.size/6, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.size/2, -this.size/4, this.size/10, 0, Math.PI * 2);
            ctx.fillStyle = 'black';
            ctx.fill();
        }
        
        ctx.restore();
    }

    move(canvas) {
        if (!this.isPlayer) {
            this.x += Math.cos(this.direction) * this.speed;
            this.y += Math.sin(this.direction) * this.speed;
            
            // 边界检查
            if (this.x < -this.size) this.x = canvas.width + this.size;
            if (this.x > canvas.width + this.size) this.x = -this.size;
            if (this.y < -this.size) this.y = canvas.height + this.size;
            if (this.y > canvas.height + this.size) this.y = -this.size;
        }
    }

    collidesWith(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.size + other.size);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
        
        // 设置画布大小
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 初始化玩家
        this.player = new Fish(
            this.canvas.width / 2,
            this.canvas.height / 2,
            20,
            '#FF6B6B',
            5,
            true
        );
        
        this.fishes = [];
        this.keys = {};
        this.touchPos = null;
        
        // 事件监听
        this.setupEventListeners();
        
        // 按钮
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.setupButtons();
    }

    resizeCanvas() {
        const container = document.querySelector('.game-container');
        const maxWidth = Math.min(800, window.innerWidth - 40);
        this.canvas.width = maxWidth;
        this.canvas.height = maxWidth * 0.75;
    }

    setupEventListeners() {
        // 键盘控制
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
        
        // 触摸控制
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.touchPos = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.touchPos = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        });
        
        this.canvas.addEventListener('touchend', () => {
            this.touchPos = null;
        });
    }

    setupButtons() {
        this.startBtn.addEventListener('click', () => {
            this.start();
            this.startBtn.style.display = 'none';
            this.pauseBtn.style.display = 'block';
        });
        
        this.pauseBtn.addEventListener('click', () => {
            this.paused = !this.paused;
            this.pauseBtn.textContent = this.paused ? '继续' : '暂停';
        });
        
        this.restartBtn.addEventListener('click', () => {
            document.getElementById('gameOver').classList.add('hidden');
            this.reset();
            this.start();
        });
    }

    reset() {
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
        this.fishes = [];
        this.player = new Fish(
            this.canvas.width / 2,
            this.canvas.height / 2,
            20,
            '#FF6B6B',
            5,
            true
        );
        document.getElementById('score').textContent = '0';
        document.getElementById('size').textContent = '1';
        this.pauseBtn.textContent = '暂停';
    }

    start() {
        if (!this.gameLoop) {
            this.gameLoop = setInterval(() => this.update(), 1000 / 60);
        }
    }

    spawnFish() {
        if (Math.random() < 0.02) {
            const size = Math.random() * 30 + 10;
            const speed = Math.max(2, 7 - size / 10);
            
            // 从画布边缘随机位置生成
            let x, y;
            if (Math.random() < 0.5) {
                x = Math.random() < 0.5 ? -size : this.canvas.width + size;
                y = Math.random() * this.canvas.height;
            } else {
                x = Math.random() * this.canvas.width;
                y = Math.random() < 0.5 ? -size : this.canvas.height + size;
            }
            
            const colors = ['#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.fishes.push(new Fish(x, y, size, color, speed));
        }
    }

    handleInput() {
        const speed = this.player.speed;
        let dx = 0;
        let dy = 0;
        
        // 键盘控制
        if (this.keys['ArrowLeft'] || this.keys['a']) dx -= speed;
        if (this.keys['ArrowRight'] || this.keys['d']) dx += speed;
        if (this.keys['ArrowUp'] || this.keys['w']) dy -= speed;
        if (this.keys['ArrowDown'] || this.keys['s']) dy += speed;
        
        // 触摸控制
        if (this.touchPos) {
            const targetX = this.touchPos.x;
            const targetY = this.touchPos.y;
            const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
            dx = Math.cos(angle) * speed;
            dy = Math.sin(angle) * speed;
        }
        
        // 更新玩家位置
        if (dx !== 0 || dy !== 0) {
            this.player.direction = Math.atan2(dy, dx);
            this.player.x = Math.max(this.player.size, Math.min(this.canvas.width - this.player.size, this.player.x + dx));
            this.player.y = Math.max(this.player.size, Math.min(this.canvas.height - this.player.size, this.player.y + dy));
        }
    }

    checkCollisions() {
        for (let i = this.fishes.length - 1; i >= 0; i--) {
            const fish = this.fishes[i];
            if (this.player.collidesWith(fish)) {
                if (this.player.size > fish.size) {
                    // 吃掉小鱼
                    this.score += Math.floor(fish.size);
                    this.player.size += 0.5;
                    this.fishes.splice(i, 1);
                    document.getElementById('score').textContent = this.score;
                    document.getElementById('size').textContent = Math.floor(this.player.size / 10);
                } else {
                    // 游戏结束
                    this.gameOver = true;
                    document.getElementById('gameOver').classList.remove('hidden');
                    document.getElementById('finalScore').textContent = this.score;
                    clearInterval(this.gameLoop);
                    this.gameLoop = null;
                    return;
                }
            }
        }
    }

    update() {
        if (this.gameOver || this.paused) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 生成新鱼
        this.spawnFish();
        
        // 处理输入
        this.handleInput();
        
        // 更新和绘制所有鱼
        this.fishes.forEach(fish => {
            fish.move(this.canvas);
            fish.draw(this.ctx);
        });
        
        // 绘制玩家
        this.player.draw(this.ctx);
        
        // 碰撞检测
        this.checkCollisions();
        
        // 清理出界的鱼
        this.fishes = this.fishes.filter(fish => 
            fish.x > -fish.size * 2 && 
            fish.x < this.canvas.width + fish.size * 2 &&
            fish.y > -fish.size * 2 && 
            fish.y < this.canvas.height + fish.size * 2
        );
    }
}

// 初始化游戏
window.onload = () => {
    const game = new Game();
};