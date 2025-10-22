// 小地图系统
export function initMinimap(scene, player) {
    const mapWidth = scene.map.widthInPixels;
    const mapHeight = scene.map.heightInPixels;
    const minimapSize = 200;
    const minimapScale = minimapSize / Math.max(mapWidth, mapHeight);
    
    // 创建小地图容器
    const container = scene.add.container(
        scene.cameras.main.width - minimapSize - 20, 
        20
    );
    container.setScrollFactor(0); // 不随相机滚动
    scene.add.existing(container);
    
    // 创建小地图背景
    const background = scene.add.graphics();
    background.fillStyle(0x1a1a2e, 0.8);
    background.fillRoundedRect(0, 0, minimapSize, minimapSize, 10);
    container.add(background);
    
    // 创建小地图内容层
    const content = scene.add.graphics();
    container.add(content);
    
    // 创建玩家指示器
    const playerIndicator = scene.add.graphics();
    playerIndicator.fillStyle(0x00ff00, 1);
    playerIndicator.fillCircle(0, 0, 5);
    container.add(playerIndicator);
    
    // 创建安全区指示器
    const safeZoneIndicator = scene.add.graphics();
    container.add(safeZoneIndicator);
    
    // 创建敌人指示器组
    const enemyIndicators = scene.add.container(0, 0);
    container.add(enemyIndicators);
    
    // 创建资源指示器组
    const resourceIndicators = scene.add.container(0, 0);
    container.add(resourceIndicators);
    
    // 更新小地图
    scene.events.on('update', () => {
        updateMinimap(
            scene, player, content, playerIndicator, 
            enemyIndicators, resourceIndicators, safeZoneIndicator, 
            minimapScale, minimapSize
        );
    });
    
    // 创建图例
    const legend = createMinimapLegend(scene);
    container.add(legend);
    
    // 保存小地图引用
    scene.minimap = {
        container: container,
        content: content,
        playerIndicator: playerIndicator,
        enemyIndicators: enemyIndicators,
        resourceIndicators: resourceIndicators,
        safeZoneIndicator: safeZoneIndicator,
        scale: minimapScale,
        size: minimapSize
    };
}

// 更新小地图
function updateMinimap(
    scene, player, content, playerIndicator, 
    enemyIndicators, resourceIndicators, safeZoneIndicator, 
    scale, size
) {
    const mapWidth = scene.map.widthInPixels;
    const mapHeight = scene.map.heightInPixels;
    
    // 清除之前的内容
    content.clear();
    
    // 绘制地形
    drawMinimapTerrain(scene, content, scale);
    
    // 更新玩家指示器
    const playerX = (player.x / mapWidth) * size;
    const playerY = (player.y / mapHeight) * size;
    playerIndicator.setPosition(playerX, playerY);
    
    // 更新敌人指示器
    updateEnemyIndicators(scene, enemyIndicators, scale, size);
    
    // 更新资源指示器
    updateResourceIndicators(scene, resourceIndicators, scale, size);
    
    // 更新安全区指示器
    updateSafeZoneIndicator(scene, safeZoneIndicator, scale, size);
}

// 绘制小地图地形
function drawMinimapTerrain(scene, content, scale) {
    // 绘制高地区域
    if (scene.map.highAreas) {
        scene.map.highAreas.forEach(area => {
            content.fillStyle(0x999999, 0.5);
            content.beginPath();
            content.arc(
                area.x * scale, 
                area.y * scale, 
                area.radius * scale, 
                0, Math.PI * 2
            );
            content.fillPath();
        });
    }
    
    // 绘制草丛区域
    if (scene.map.grassAreas) {
        scene.map.grassAreas.forEach(area => {
            content.fillStyle(0x006400, 0.3);
            content.beginPath();
            content.arc(
                area.x * scale, 
                area.y * scale, 
                area.radius * scale, 
                0, Math.PI * 2
            );
            content.fillPath();
        });
    }
    
    // 绘制中心资源区
    content.fillStyle(0xffaa00, 0.2);
    content.beginPath();
    content.arc(
        scene.map.centerX * scale, 
        scene.map.centerY * scale, 
        300 * scale, 
        0, Math.PI * 2
    );
    content.fillPath();
}

// 更新敌人指示器
function updateEnemyIndicators(scene, container, scale, size) {
    // 清除现有指示器
    container.removeAll(true);
    
    // 添加新指示器
    const enemies = scene.enemies || [];
    enemies.forEach(enemy => {
        if (enemy.active) {
            const indicator = scene.add.graphics();
            indicator.fillStyle(0xff0000, 1);
            indicator.fillCircle(
                (enemy.x / scene.map.widthInPixels) * size, 
                (enemy.y / scene.map.heightInPixels) * size, 
                4
            );
            container.add(indicator);
        }
    });
}

// 更新资源指示器
function updateResourceIndicators(scene, container, scale, size) {
    // 清除现有指示器
    container.removeAll(true);
    
    // 如果没有资源系统，直接返回
    if (!scene.resources) return;
    
    // 添加经验球指示器
    scene.resources.experienceOrbs.forEach(orb => {
        if (orb.active) {
            const indicator = scene.add.graphics();
            indicator.fillStyle(0xffff00, 0.8);
            indicator.fillCircle(
                (orb.x / scene.map.widthInPixels) * size, 
                (orb.y / scene.map.heightInPixels) * size, 
                3
            );
            container.add(indicator);
        }
    });
    
    // 添加神符指示器
    scene.resources.runes.forEach(rune => {
        if (rune.active) {
            const runeType = rune.getData('runeType');
            const indicator = scene.add.graphics();
            
            // 根据神符类型设置颜色
            switch(runeType) {
                case 'attack': indicator.fillStyle(0xff3333, 1); break;
                case 'speed': indicator.fillStyle(0x33ff33, 1); break;
                case 'defense': indicator.fillStyle(0x3366ff, 1); break;
                default: indicator.fillStyle(0xffffff, 1);
            }
            
            indicator.fillCircle(
                (rune.x / scene.map.widthInPixels) * size, 
                (rune.y / scene.map.heightInPixels) * size, 
                4
            );
            container.add(indicator);
        }
    });
}

// 更新安全区指示器
function updateSafeZoneIndicator(scene, indicator, scale, size) {
    indicator.clear();
    
    // 获取安全区数据
    const safeZone = scene.safeZone || { radius: scene.gameConfig.game_settings.initial_safe_zone_radius };
    
    // 绘制安全区
    indicator.lineStyle(2, 0x00ff00, 0.8);
    indicator.beginPath();
    indicator.arc(
        scene.map.centerX * scale, 
        scene.map.centerY * scale, 
        safeZone.radius * scale, 
        0, Math.PI * 2
    );
    indicator.strokePath();
    
    // 如果正在缩圈，绘制下一个安全区
    if (safeZone.shrinking) {
        indicator.lineStyle(1, 0xff0000, 0.5);
        indicator.beginPath();
        indicator.arc(
            scene.map.centerX * scale, 
            scene.map.centerY * scale, 
            safeZone.radius * scale * 0.7, // 假设下一个安全区是当前70%
            0, Math.PI * 2
        );
        indicator.strokePath();
    }
}

// 创建小地图图例
function createMinimapLegend(scene) {
    const container = scene.add.container(10, 10);
    
    // 图例项
    const legendItems = [
        { color: 0x00ff00, text: '玩家' },
        { color: 0xff0000, text: '敌人' },
        { color: 0xffff00, text: '经验' },
        { color: 0xff3333, text: '攻击神符' },
        { color: 0x33ff33, text: '速度神符' },
        { color: 0x3366ff, text: '防御神符' }
    ];
    
    // 创建图例项
    legendItems.forEach((item, index) => {
        const graphics = scene.add.graphics();
        graphics.fillStyle(item.color, 1);
        graphics.fillCircle(0, index * 15, 3);
        
        const text = scene.add.text(10, index * 15 - 7, item.text, {
            fontSize: '10px',
            fill: '#ffffff'
        });
        
        container.add([graphics, text]);
    });
    
    return container;
}