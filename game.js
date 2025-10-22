            // 更新锁定状态
            if (isUnlocked && !isSelected) {
                const icon = nodeDiv.querySelector('div:first-child');
                icon.style.borderColor = '#4CAF50';
                nodeDiv.style.cursor = 'pointer';
                
                // 添加点击事件
                if (!nodeDiv.onclick) {
                    nodeDiv.addEventListener('click', () => {
                        selectTalent(talentId, player, scene);
                    });
                }
            }
        });
    }
    
    // 获取分支颜色
    function getBranchColor(branchKey) {
        const colors = {
            'offense': '#ff4444', // 红色-输出
            'defense': '#44dd44', // 绿色-生存
            'control': '#4488ff', // 蓝色-控制
            'agility': '#ffff44', // 黄色-敏捷
            'stealth': '#aa66cc'  // 紫色-潜行
        };
        
        return colors[branchKey] || '#ffffff';
    }
    
    // 初始化安全区
    function initSafeZone(scene) {
        // 创建安全区视觉效果
        scene.safeZoneGraphics = scene.add.graphics();
        updateSafeZoneVisual(scene);
    }
    
    // 更新安全区视觉效果
    function updateSafeZoneVisual(scene) {
        const graphics = scene.safeZoneGraphics;
        const centerX = scene.map.centerX;
        const centerY = scene.map.centerY;
        const radius = scene.safeZone.radius;
        
        graphics.clear();
        
        // 绘制危险区域（红色半透明圆环）
        graphics.fillStyle(0xff0000, 0.3);
        graphics.beginPath();
        graphics.arc(centerX, centerY, scene.map.widthInPixels / 2, 0, Math.PI * 2);
        graphics.fillPath();
        
        // 绘制安全区域（绿色半透明圆）
        graphics.fillStyle(0x00ff00, 0.2);
        graphics.beginPath();
        graphics.arc(centerX, centerY, radius, 0, Math.PI * 2);
        graphics.fillPath();
        
        // 绘制安全区边界
        graphics.lineStyle(3, 0x00ff00, 1);
        graphics.beginPath();
        graphics.arc(centerX, centerY, radius, 0, Math.PI * 2);
        graphics.strokePath();
    }
    
    // 处理安全区缩圈
    function handleSafeZoneShrinking(scene, delta) {
        if (scene.gameTime >= scene.safeZone.nextShrinkTime && !scene.safeZone.shrinking) {
            // 开始缩圈
            scene.safeZone.shrinking = true;
            const shrinkDuration = gameConfig.game_settings.shrink_duration * 1000; // 缩圈持续时间（毫秒）
            const targetRadius = Math.max(
                gameConfig.game_settings.final_safe_zone_radius,
                scene.safeZone.radius * 0.7 // 每次缩小30%
            );
            
            showFloatingText(
                scene, 
                scene.map.centerX, 
                scene.map.centerY, 
                "安全区正在缩小！", 
                '#ff3333'
            );
            
            // 创建缩圈动画
            scene.tweens.add({
                targets: scene.safeZone,
                radius: targetRadius,
                duration: shrinkDuration,
                onUpdate: () => {
                    updateSafeZoneVisual(scene);
                },
                onComplete: () => {
                    scene.safeZone.shrinking = false;
                    // 设置下一次缩圈时间
                    scene.safeZone.nextShrinkTime = scene.gameTime + gameConfig.game_settings.shrink_interval * 1000;
                    
                    // 如果安全区很小，增加伤害
                    if (scene.safeZone.radius <= gameConfig.game_settings.final_safe_zone_radius * 1.5) {
                        gameConfig.game_settings.circle_damage_per_second *= 1.5;
                    }
                }
            });
        }
    }
    
    // 检查玩家是否在安全区外
    function checkPlayerInSafeZone(scene) {
        const player = scene.player;
        if (!player) return;
        
        const distanceFromCenter = Phaser.Math.Distance.Between(
            player.x, player.y, scene.map.centerX, scene.map.centerY
        );
        
        // 如果玩家在安全区外，造成持续伤害
        if (distanceFromCenter > scene.safeZone.radius) {
            const damagePerSecond = gameConfig.game_settings.circle_damage_per_second;
            const damageThisFrame = damagePerSecond * (delta / 1000);
            
            const newHealth = Math.max(0, player.getData('health') - damageThisFrame);
            player.setData('health', newHealth);
            
            // 显示伤害效果
            if (Math.random() > 0.7) { // 随机显示伤害文字，避免刷屏
                showFloatingText(scene, player.x, player.y - 30, `-${damageThisFrame.toFixed(1)}`, '#ff0000');
            }
            
            // 玩家死亡检查
            if (newHealth <= 0) {
                gameOver(scene, false); // 失败
            }
        }
    }
    
    // 检查游戏结束条件
    function checkGameEndConditions(scene) {
        const player = scene.player;
        if (!player) return;
        
        // 检查玩家是否死亡
        if (player.getData('health') <= 0) {
            gameOver(scene, false);
            return;
        }
        
        // 检查是否有其他玩家存活
        const enemiesAlive = (scene.enemies || []).some(enemy => enemy.active && enemy.getData('health') > 0);
        
        // 如果没有敌人存活，玩家胜利
        if (!enemiesAlive) {
            gameOver(scene, true);
        }
        
        // 检查游戏时长
        const matchDuration = gameConfig.game_settings.match_duration * 1000; // 转换为毫秒
        if (scene.gameTime >= matchDuration) {
            // 时间到，根据剩余生命值判断胜负
            const playerHealth = player.getData('health');
            const maxEnemyHealth = Math.max(
                ...((scene.enemies || []).map(enemy => enemy.getData('health')))
            );
            
            gameOver(scene, playerHealth > maxEnemyHealth);
        }
    }
    
    // 游戏结束
    function gameOver(scene, isVictory) {
        // 停止所有定时器
        scene.time.removeAllEvents();
        
        // 创建结算界面
        const gameOverPanel = scene.add.dom(scene.map.centerX, scene.map.centerY)
            .createFromHTML(`
                <div id="game-over-panel" style="width: 500px; height: 400px; background-color: rgba(26, 26, 46, 0.95); border-radius: 10px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <h2 style="color: ${isVictory ? '#4CAF50' : '#ff3333'}; font-size: 36px; margin: 0 0 20px 0;">${isVictory ? '胜利！' : '失败！'}</h2>
                    <div style="color: white; font-size: 18px; margin-bottom: 10px;">等级: ${scene.player.getData('level')}</div>
                    <div style="color: white; font-size: 18px; margin-bottom: 10px;">击杀: ${scene.player.getData('kills')}</div>
                    <div style="color: white; font-size: 18px; margin-bottom: 30px;">存活时间: ${Math.floor(scene.gameTime / 60000)}分${Math.floor((scene.gameTime % 60000) / 1000)}秒</div>
                    <button id="restart-button" style="padding: 10px 30px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">再来一局</button>
                </div>
            `);
        
        gameOverPanel.setOrigin(0.5);
        scene.add.existing(gameOverPanel);
        
        // 暂停游戏
        scene.scene.pause();
        
        // 再来一局按钮事件
        document.getElementById('restart-button').addEventListener('click', () => {
            window.location.reload(); // 重新加载页面
        });
    }
    
    // 显示浮动文字
    function showFloatingText(scene, x, y, text, color) {
        const floatingText = scene.add.text(x, y, text, {
            fontSize: '16px',
            fill: color,
            stroke: '#000',
            strokeThickness: 2
        });
        
        floatingText.setOrigin(0.5);
        
        // 添加上升并淡出动画
        scene.tweens.add({
            targets: floatingText,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                floatingText.destroy();
            }
        });
    }
    
    // 显示游戏提示
    function showGameTips(scene) {
        const tips = [
            "使用方向键移动",
            "Q/W释放技能",
            "T打开天赋面板",
            "靠近经验球获取经验",
            "安全区外会持续受伤"
        ];
        
        const tipContainer = scene.add.container(20, 20);
        
        const tipBg = scene.add.graphics();
        tipBg.fillStyle(0x1a1a2e, 0.8);
        tipBg.fillRoundedRect(0, 0, 250, 120, 10);
        tipContainer.add(tipBg);
        
        tips.forEach((tip, index) => {
            const text = scene.add.text(10, 10 + index * 25, `• ${tip}`, {
                fontSize: '14px',
                fill: '#ffffff'
            });
            tipContainer.add(text);
        });
        
        // 10秒后自动隐藏
        scene.time.delayedCall(10000, () => {
            tipContainer.destroy();
        });
    }
}