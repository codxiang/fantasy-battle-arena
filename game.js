// 游戏主逻辑文件 (自动重建 by AiPy)
const RESOURCE_PATHS = {
    images: 'assets/images/',
    heroes: 'assets/images/heroes/',
    particles: 'assets/images/particles/',
    resources: 'assets/images/resources/',
    tiles: 'assets/images/tiles/'
};

// 游戏状态
let gameState = {
    loadedResources: 0,
    totalResources: 0,
    isLoaded: false
};

// 资源加载完成回调
function onResourcesLoaded() {
    gameState.isLoaded = true;
    console.log("✅ 所有资源加载完成！");
    // 在这里添加进入游戏主界面的逻辑
    document.getElementById("loading-screen").style.display = "none";
    startGame();
}

// 开始游戏
 {
    console.log("[STARTGAME] 开始执行startGame()...");
    
    // 1. 检查画布
    gameState.canvas = document.getElementById("gameCanvas");
    if (!gameState.canvas) {
        console.error("[STARTGAME] ❌ 找不到canvas元素！ID是否为'gameCanvas'？");
        alert("游戏错误：找不到画布元素，请刷新页面重试");
// 修复非法return语句：        return;
    }
    console.log("[STARTGAME] ✅ 找到canvas元素：", gameState.canvas);
    
    // 2. 获取绘图上下文
    gameState.ctx = gameState.canvas.getContext("2d");
    if (!gameState.ctx) {
        console.error("[STARTGAME] ❌ 无法获取2D绘图上下文！");
        alert("游戏错误：无法初始化绘图功能");
// 修复非法return：return;
    }
    console.log("[STARTGAME] ✅ 获取绘图上下文成功");
    
    // 3. 强制设置画布背景和文字样式（确保可见）
    gameState.ctx.fillStyle = "#1a73e8"; // 蓝色背景（高对比度）
    gameState.ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
    
    gameState.ctx.fillStyle = "#ffffff"; // 白色文字（确保可见）
    gameState.ctx.font = "bold 36px Arial, sans-serif"; // 大号粗体字体
    gameState.ctx.textAlign = "center";
    gameState.ctx.textBaseline = "middle";
    
    // 4. 绘制启动成功文字
    gameState.ctx.fillText("游戏启动成功！", gameState.canvas.width/2, gameState.canvas.height/2 - 40);
    gameState.ctx.font = "24px Arial";
    gameState.ctx.fillText("画布尺寸: " + gameState.canvas.width + "×" + gameState.canvas.height, gameState.canvas.width/2, gameState.canvas.height/2);
    gameState.ctx.fillText("点击画布继续...", gameState.canvas.width/2, gameState.canvas.height/2 + 40);
    console.log("[STARTGAME] ✅ 已绘制启动文字");
    
    // 5. 标记游戏状态
    gameState.isRunning = true;
    gameState.isLoaded = true;
    console.log("[STARTGAME] 🎉 游戏启动流程完成");
    
    // 6. 添加画布点击事件（确保交互正常）
    gameState.canvas.addEventListener("click", () => {
        gameState.ctx.fillStyle = "#1a73e8";
        gameState.ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
        gameState.ctx.fillText("开始游戏逻辑...", gameState.canvas.width/2, gameState.canvas.height/2);
        console.log("[STARTGAME] 画布被点击，开始游戏逻辑");
    });
}

// 强制调用startGame()的多重保障
console.log("[INIT] 尝试启动游戏...");
window.addEventListener("load", () => {
    console.log("[INIT] 页面加载完成，1秒后调用startGame()");
    setTimeout(startGame, 1000); // 延迟1秒确保资源加载
});

// 直接调用一次（防止事件监听失败）
if (document.readyState === "complete") {
    console.log("[INIT] 页面已就绪，立即调用startGame()");
    startGame();
} else {
    console.log("[INIT] 页面未就绪，等待load事件");
}


// 初始化游戏
function initGame() {
    console.log("🔧 初始化游戏...");
    // 先加载资源管理器
    loadScript("resources.js", () => {
        console.log("📦 资源管理器加载完成");
        // 开始加载所有资源
        loadAllResources();
    });
}

// 动态加载脚本
function loadScript(src, callback) {
    const script = document.createElement("script");
    script.src = src;
    script.onload = callback;
    script.onerror = () => console.error("❌ 加载脚本失败: " + src);
    document.head.appendChild(script);
}

// 页面加载完成后初始化游戏
window.addEventListener("load", initGame);


// Phaser引擎初始化（自动添加 by AiPy）
const gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'gameCanvas', // 绑定到绿框画布
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    backgroundColor: '#1a1a1a'
};

// 启动游戏
const game = new Phaser.Game(gameConfig);
console.log("[PHASER] 游戏引擎初始化完成！");

// 基础场景函数（确保游戏能启动）
function preload() {
    console.log("[PHASER] 预加载资源...");
    // 加载一个测试图片（确保资源路径正确）
    this.load.image('test', 'assets/images/tiles/grass_tile.png');
}

function create() {
    console.log("[PHASER] ✨ 开始创建游戏场景...");
    
    // 1. 设置背景和标题
    this.cameras.main.setBackgroundColor('#1a237e'); // 深蓝色背景（区分引擎默认色）
    
    // 2. 创建游戏标题和说明文字
    this.add.text(400, 150, "幻想战斗竞技场", { 
        font: "40px Arial", 
        fill: "#ffffff", 
        stroke: "#ffd700", 
        strokeThickness: 3 
    }).setOrigin(0.5);
    
    this.add.text(400, 220, "按 ←→↑↓ 键移动角色", { 
        font: "20px Arial", 
        fill: "#cccccc" 
    }).setOrigin(0.5);
    
    // 3. 创建玩家角色（红色方块，可移动）
    gameState.player = this.add.rectangle(400, 350, 50, 50, 0xff3300).setOrigin(0.5);
    
    // 4. 添加键盘控制
    gameState.cursors = this.input.keyboard.createCursorKeys();
    
    // 5. 标记游戏为运行中
    gameState.isRunning = true;
    console.log("[GAME] 🎮 游戏状态已启动！玩家角色创建完成");
}

function update() {
    if (!gameState.isRunning || !gameState.player) return;
    
    // 键盘控制逻辑（←→↑↓ 移动玩家）
    if (gameState.cursors.left.isDown) {
        gameState.player.x -= 5;
    } else if (gameState.cursors.right.isDown) {
        gameState.player.x += 5;
    }
    
    if (gameState.cursors.up.isDown) {
        gameState.player.y -= 5;
    } else if (gameState.cursors.down.isDown) {
        gameState.player.y += 5;
    }
    
    // 边界限制（防止玩家移出画布）
    gameState.player.x = Phaser.Math.Clamp(gameState.player.x, 25, 775);
    gameState.player.y = Phaser.Math.Clamp(gameState.player.y, 25, 575);
    
    // 控制台实时显示玩家位置
    console.log(`[GAME] 玩家位置: (${gameState.player.x.toFixed(0)}, ${gameState.player.y.toFixed(0)})`);
}
