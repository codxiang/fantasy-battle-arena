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
    const img = new Image();
    img.src = src;
    img.onload = () => {
        console.log("✅ 加载图片成功: " + src);
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
