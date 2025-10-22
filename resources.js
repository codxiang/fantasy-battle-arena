const RESOURCE_PATHS = {
    images: 'assets/images/',
    heroes: 'assets/images/heroes/',
    particles: 'assets/images/particles/',
    resources: 'assets/images/resources/',
    tiles: 'assets/images/tiles/'
};

// 资源管理文件 (自动重建 by AiPy)
// 确保依赖的路径变量已定义
if (typeof RESOURCE_PATHS === "undefined") {
    console.error("❌ RESOURCE_PATHS 未定义！请检查 game.js");
}

// 资源清单（根据您的实际图片文件调整）
const RESOURCE_MANIFEST = {
    images: [
        // 英雄图片
        RESOURCE_PATHS.heroes + "shadow_blade.png",
        RESOURCE_PATHS.heroes + "steel_wall.png",
        // 粒子特效
        RESOURCE_PATHS.particles + "stealth.png",
        RESOURCE_PATHS.particles + "stealth_particle.png",
        // 资源图片
        RESOURCE_PATHS.resources + "exp_orb_large.png",
        RESOURCE_PATHS.resources + "exp_orb_medium.png",
        RESOURCE_PATHS.resources + "exp_orb_small.png",
        // 地图瓦片
        RESOURCE_PATHS.tiles + "bush_tile.png",
        RESOURCE_PATHS.tiles + "grass_tile.png",
        RESOURCE_PATHS.tiles + "rock_tile.png"
    ]
};

// 加载所有资源
// 资源加载跟踪日志（自动注入 by AiPy）
console.log("[TRACE] 🚀 开始资源加载流程...");
console.log("[TRACE] 📝 资源总数：" + RESOURCE_MANIFEST.images.length);
let loadStartTime = Date.now();

function loadAllResources() {
    const allResources = [].concat(...Object.values(RESOURCE_MANIFEST));
    gameState.totalResources = allResources.length;
    gameState.loadedResources = 0;
    
    console.log(`📥 开始加载 ${gameState.totalResources} 个资源...`);
    
    if (gameState.totalResources === 0) {
        onResourcesLoaded();
        return;
    }
    
    allResources.forEach(resource => {
        if (resource.endsWith(".png") || resource.endsWith(".jpg")) {
            loadImageResource(resource);
        } else {
            console.warn("⚠️ 不支持的资源类型: " + resource);
            gameState.loadedResources++;
            checkResourcesLoaded();
        }
    });
}

// 加载图片资源
function loadImageResource(src) {
    console.log("[TRACE] 🔄 加载中：" + src);
    gameState.loadedResources++;
    console.log("[TRACE] ⏳ 进度：" + gameState.loadedResources + "/" + gameState.totalResources);
 {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        console.log("[TRACE] ✅ 加载成功：" + src + " (" + gameState.loadedResources + "/" + gameState.totalResources + ")");
        gameState.loadedResources++;
        updateLoadingProgress();
        checkResourcesLoaded();
    };
    img.onerror = () => {
        console.error("❌ 加载图片失败: " + src);
        gameState.loadedResources++; // 即使失败也继续计数，避免卡住
        updateLoadingProgress();
        checkResourcesLoaded();
    };
}

// 检查所有资源是否加载完成
function checkResourcesLoaded() {
    console.log("[TRACE] 🔍 检查加载完成：" + gameState.loadedResources + "/" + gameState.totalResources);
    if (gameState.loadedResources >= gameState.totalResources) {
        console.log("[TRACE] 🎉 所有资源加载完成！耗时：" + (Date.now() - loadStartTime) + "ms");
        console.log("[TRACE] 📌 尝试隐藏加载界面...");
 {
    if (gameState.loadedResources >= gameState.totalResources) {
        console.log("📦 所有资源加载完成！");
        onResourcesLoaded();
    }
}

// 更新加载进度
function updateLoadingProgress() {
    const progress = (gameState.loadedResources / gameState.totalResources) * 100;
    console.log(`⏳ 加载进度: ${progress.toFixed(1)}%`);
    // 更新UI进度条（如果有）
    const progressBar = document.getElementById("loading-progress");
    if (progressBar) {
        progressBar.style.width = progress + "%";
        progressBar.textContent = `${progress.toFixed(0)}%`;
    }
}



// 强制隐藏加载界面（自动添加 by AiPy）
function forceHideLoadingScreen() {
    const loadScreen = document.getElementById('loading-screen') || document.querySelector('.loading') || document.querySelector('#loader');
    if (loadScreen) {
        loadScreen.style.display = 'none';
        console.log("[TRACE] ⚡️ 强制隐藏加载界面（ID: " + loadScreen.id + "）");
    } else {
        console.log("[TRACE] ⚠️ 未找到加载界面元素，可能已隐藏或ID不匹配");
    }
}

// 加载完成后强制调用
if (typeof onResourcesLoaded === 'function') {
    const originalOnLoaded = onResourcesLoaded;
    onResourcesLoaded = function() {
        originalOnLoaded(); // 调用原始完成函数
        forceHideLoadingScreen(); // 强制隐藏加载界面
    };
} else {
    console.log("[TRACE] ⚠️ 未找到onResourcesLoaded()，3秒后尝试强制隐藏...");
    setTimeout(forceHideLoadingScreen, 3000); // 3秒超时保底
}
