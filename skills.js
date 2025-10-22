// 技能系统实现
export function initSkillsSystem(scene, player) {
    // 技能按键映射 (Q:技能1, W:技能2)
    const skillKeys = {
        skill1: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
        skill2: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    };
    
    // 初始化技能冷却计时器
    player.setData('skillCooldowns', {
        skill1: 0,
        skill2: 0
    });
    
    // 创建技能指示器UI
    createSkillIndicators(scene, player);
    
    // 监听技能按键
    skillKeys.skill1.on('down', () => {
        castSkill(scene, player, 'skill_1');
    });
    
    skillKeys.skill2.on('down', () => {
        castSkill(scene, player, 'skill_2');
    });
    
    // 更新技能冷却
    scene.events.on('update', () => {
        updateSkillCooldowns(player, scene.time.deltaTime / 1000); // 转换为秒
        updateSkillIndicators(scene, player);
    });
}

// 创建技能指示器
function createSkillIndicators(scene, player) {
    const uiWidth = scene.cameras.main.width;
    const uiHeight = scene.cameras.main.height;
    
    // 创建技能容器
    const skillContainer = scene.add.container(uiWidth - 220, uiHeight - 100);
    
    // 技能1 (Q)
    const skill1Indicator = createSkillIcon(scene, 0, 0, 'Q', '#ff9900');
    // 技能2 (W)
    const skill2Indicator = createSkillIcon(scene, 100, 0, 'W', '#33ccff');
    
    skillContainer.add([skill1Indicator.icon, skill1Indicator.text, skill1Indicator.cooldownText]);
    skillContainer.add([skill2Indicator.icon, skill2Indicator.text, skill2Indicator.cooldownText]);
    
    // 存储引用
    scene.skillIndicators = {
        skill1: skill1Indicator,
        skill2: skill2Indicator
    };
}

// 创建单个技能图标
function createSkillIcon(scene, x, y, keyText, color) {
    // 技能背景
    const icon = scene.add.graphics();
    icon.fillStyle(0x333333, 0.8);
    icon.fillRoundedRect(x, y, 80, 80, 10);
    icon.lineStyle(2, color, 1);
    icon.strokeRoundedRect(x, y, 80, 80, 10);
    
    // 按键文本
    const text = scene.add.text(x + 10, y + 10, keyText, {
        fontSize: '16px',
        fill: '#ffffff',
        fontWeight: 'bold'
    });
    
    // 冷却文本
    const cooldownText = scene.add.text(x + 40, y + 40, '', {
        fontSize: '20px',
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'center'
    });
    cooldownText.setOrigin(0.5);
    
    return { icon, text, cooldownText };
}

// 释放技能
function castSkill(scene, player, skillName) {
    const currentTime = scene.time.now / 1000; // 当前时间（秒）
    const cooldowns = player.getData('skillCooldowns');
    const skillConfig = player.getData('config').skills[skillName];
    
    // 检查冷却
    if (cooldowns[skillName] > currentTime) {
        const remaining = (cooldowns[skillName] - currentTime).toFixed(1);
        showFloatingText(scene, player.x, player.y - 40, `技能冷却中: ${remaining}s`, '#ff9900');
        return;
    }
    
    // 根据技能类型执行不同效果
    switch(skillName) {
        case 'skill_1':
            executeSkill1(scene, player, skillConfig);
            break;
        case 'skill_2':
            executeSkill2(scene, player, skillConfig);
            break;
    }
    
    // 设置冷却
    cooldowns[skillName] = currentTime + skillConfig.cooldown;
}

// 执行技能1
function executeSkill1(scene, player, skillConfig) {
    const heroType = player.texture.key;
    
    // 根据英雄类型执行不同技能
    if (heroType === 'steel_wall') {
        // 钢铁壁垒 - 盾牌猛击
        shieldBash(scene, player, skillConfig);
    } else if (heroType === 'shadow_blade') {
        // 影刃 - 暗影突袭
        shadowStrike(scene, player, skillConfig);
    }
    
    showFloatingText(scene, player.x, player.y - 20, skillConfig.name, '#ffcc00');
}

// 执行技能2
function executeSkill2(scene, player, skillConfig) {
    const heroType = player.texture.key;
    
    if (heroType === 'steel_wall') {
        // 钢铁壁垒 - 钢铁意志
        ironWill(scene, player, skillConfig);
    } else if (heroType === 'shadow_blade') {
        // 影刃 - 潜行
        stealth(scene, player, skillConfig);
    }
    
    showFloatingText(scene, player.x, player.y - 20, skillConfig.name, '#33ccff');
}

// 钢铁壁垒 - 盾牌猛击
function shieldBash(scene, player, skillConfig) {
    // 获取鼠标方向
    const mouseX = scene.input.mousePointer.worldX;
    const mouseY = scene.input.mousePointer.worldY;
    const angle = Phaser.Math.Angle.Between(player.x, player.y, mouseX, mouseY);
    
    // 计算冲锋距离
    const distance = skillConfig.range;
    const targetX = player.x + Math.cos(angle) * distance;
    const targetY = player.y + Math.sin(angle) * distance;
    
    // 创建技能特效
    const effect = scene.add.graphics();
    effect.lineStyle(8, 0xcccccc, 1);
    effect.beginPath();
    effect.moveTo(player.x, player.y);
    effect.lineTo(targetX, targetY);
    effect.strokePath();
    
    // 短暂显示后销毁
    scene.time.delayedCall(300, () => {
        effect.destroy();
    });
    
    // 执行冲锋
    player.setVelocity(
        Math.cos(angle) * 1200, 
        Math.sin(angle) * 1200
    );
    
    // 检测路径上的敌人
    const enemies = scene.enemies || [];
    enemies.forEach(enemy => {
        const enemyDistance = Phaser.Math.Distance.Between(
            player.x, player.y, enemy.x, enemy.y
        );
        
        // 如果敌人在技能路径上
        if (enemyDistance < distance * 0.8) {
            const enemyAngle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
            const angleDiff = Math.abs(Phaser.Math.Angle.ShortestBetween(angle, enemyAngle));
            
            if (angleDiff < 0.3) { // 在30度范围内
                // 造成伤害
                enemy.setData('health', Math.max(0, enemy.getData('health') - skillConfig.damage));
                showFloatingText(scene, enemy.x, enemy.y, `-${skillConfig.damage}`, '#ff3333');
                
                // 眩晕效果
                stunEnemy(scene, enemy, skillConfig.stun_duration);
                
                // 敌人受击反馈
                enemy.setVelocity(
                    Math.cos(enemyAngle) * -500, 
                    Math.sin(enemyAngle) * -500
                );
            }
        }
    });
}

// 影刃 - 暗影突袭
function shadowStrike(scene, player, skillConfig) {
    // 获取鼠标方向
    const mouseX = scene.input.mousePointer.worldX;
    const mouseY = scene.input.mousePointer.worldY;
    const angle = Phaser.Math.Angle.Between(player.x, player.y, mouseX, mouseY);
    
    // 计算突袭位置
    const distance = skillConfig.range;
    const targetX = player.x + Math.cos(angle) * distance;
    const targetY = player.y + Math.sin(angle) * distance;
    
    // 创建残影效果
    createAfterimageEffect(scene, player, 3);
    
    // 瞬移到目标位置
    player.setPosition(targetX, targetY);
    
    // 检测周围敌人
    const enemies = scene.enemies || [];
    enemies.forEach(enemy => {
        const enemyDistance = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
        
        if (enemyDistance < 150) {
            // 造成伤害
            enemy.setData('health', Math.max(0, enemy.getData('health') - skillConfig.damage));
            showFloatingText(scene, enemy.x, enemy.y, `-${skillConfig.damage}`, '#ff3333');
            
            // 标记敌人
            markEnemy(scene, enemy, skillConfig.mark_duration);
        }
    });
}

// 钢铁壁垒 - 钢铁意志
function ironWill(scene, player, skillConfig) {
    // 保存原始属性
    const originalDefense = player.getData('damageReduction') || 0;
    
    // 创建防御效果
    const defenseEffect = scene.add.graphics();
    const effectSize = player.width * 1.5;
    
    // 脉动动画
    const pulseTween = scene.tweens.add({
        targets: { size: effectSize },
        size: effectSize * 1.2,
        duration: 500,
        yoyo: true,
        repeat: -1,
        onUpdate: (tween) => {
            const currentSize = tween.targets[0].size;
            defenseEffect.clear();
            defenseEffect.fillStyle(0x66ccff, 0.3);
            defenseEffect.beginPath();
            defenseEffect.arc(player.x, player.y, currentSize, 0, Math.PI * 2);
            defenseEffect.fillPath();
        }
    });
    
    // 应用伤害减免
    player.setData('damageReduction', skillConfig.damage_reduction);
    
    // 嘲讽周围敌人
   嘲讽周围敌人(scene, player, skillConfig.taunt_radius);
    
    // 持续时间结束后恢复
    scene.time.delayedCall(skillConfig.duration * 1000, () => {
        player.setData('damageReduction', originalDefense);
        pulseTween.stop();
        defenseEffect.destroy();
    });
}

// 影刃 - 潜行
function stealth(scene, player, skillConfig) {
    // 保存原始属性
    const originalAlpha = player.alpha;
    const originalSpeed = player.getData('config').base_attributes.movement_speed;
    const speedBoost = 0.3; // 30%速度提升
    
    // 应用潜行效果
    player.alpha = 0.4;
    player.setData('stealthed', true);
    player.getData('config').base_attributes.movement_speed = originalSpeed * (1 + speedBoost);
    player.setMaxVelocity(originalSpeed * (1 + speedBoost));
    
    // 创建潜行粒子效果
    const particles = scene.add.particles('stealth_particle');
    const emitter = particles.createEmitter({
        x: player.x,
        y: player.y,
        speed: { min: -50, max: 50 },
        lifespan: 300,
        alpha: { start: 0.5, end: 0 },
        scale: { start: 0.5, end: 0 },
        blendMode: 'ADD'
    });
    
    // 跟随玩家
    emitter.startFollow(player);
    
    // 持续时间结束后恢复
    scene.time.delayedCall(skillConfig.duration * 1000, () => {
        player.alpha = originalAlpha;
        player.setData('stealthed', false);
        player.getData('config').base_attributes.movement_speed = originalSpeed;
        player.setMaxVelocity(originalSpeed);
        particles.destroy();
    });
}

// 更新技能冷却
function updateSkillCooldowns(player, deltaTime) {
    const cooldowns = player.getData('skillCooldowns');
    const currentTime = player.scene.time.now / 1000;
    
    // 更新所有技能冷却
    Object.keys(cooldowns).forEach(key => {
        if (cooldowns[key] > 0 && cooldowns[key] < currentTime) {
            cooldowns[key] = 0;
        }
    });
}

// 更新技能指示器
function updateSkillIndicators(scene, player) {
    if (!scene.skillIndicators) return;
    
    const cooldowns = player.getData('skillCooldowns');
    const currentTime = scene.time.now / 1000;
    
    // 更新技能1
    if (cooldowns.skill1 > currentTime) {
        const remaining = cooldowns.skill1 - currentTime;
        scene.skillIndicators.skill1.cooldownText.text = remaining.toFixed(1);
    } else {
        scene.skillIndicators.skill1.cooldownText.text = '';
    }
    
    // 更新技能2
    if (cooldowns.skill2 > currentTime) {
        const remaining = cooldowns.skill2 - currentTime;
        scene.skillIndicators.skill2.cooldownText.text = remaining.toFixed(1);
    } else {
        scene.skillIndicators.skill2.cooldownText.text = '';
    }
}

// 创建残影效果
function createAfterimageEffect(scene, target, count) {
    const delayBetweenImages = 50;
    
    for (let i = 0; i < count; i++) {
        scene.time.delayedCall(i * delayBetweenImages, () => {
            const afterimage = scene.add.sprite(target.x, target.y, target.texture.key);
            afterimage.setFrame(target.frame.name);
            afterimage.setAlpha(0.5 - (i / count) * 0.4);
            afterimage.setTint(0x9999ff);
            
            scene.tweens.add({
                targets: afterimage,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    afterimage.destroy();
                }
            });
        });
    }
}

// 眩晕敌人
function stunEnemy(scene, enemy, duration) {
    if (enemy.getData('stunned')) return;
    
    // 保存原始状态
    const originalVelocity = {
        x: enemy.body.velocity.x,
        y: enemy.body.velocity.y
    };
    
    // 停止移动
    enemy.setVelocity(0, 0);
    enemy.setData('stunned', true);
    
    // 创建眩晕效果
    const effect = scene.add.graphics();
    const effectTween = scene.tweens.add({
        targets: { size: enemy.width * 1.2 },
        size: enemy.width * 1.5,
        duration: 300,
        yoyo: true,
        repeat: -1,
        onUpdate: (tween) => {
            const currentSize = tween.targets[0].size;
            effect.clear();
            effect.lineStyle(3, 0xffff00, 1);
            effect.beginPath();
            effect.arc(enemy.x, enemy.y, currentSize, 0, Math.PI * 2);
            effect.strokePath();
        }
    });
    
    // 持续时间结束后恢复
    scene.time.delayedCall(duration * 1000, () => {
        enemy.setData('stunned', false);
        effectTween.stop();
        effect.destroy();
    });
}

// 标记敌人
function markEnemy(scene, enemy, duration) {
    // 创建标记效果
    const mark = scene.add.graphics();
    const markSize = enemy.width * 1.5;
    
    // 绘制标记
    mark.clear();
    mark.lineStyle(2, 0xff0000, 1);
    mark.beginPath();
    mark.arc(enemy.x, enemy.y, markSize, 0, Math.PI * 2);
    mark.moveTo(enemy.x, enemy.y - markSize);
    mark.lineTo(enemy.x, enemy.y + markSize);
    mark.moveTo(enemy.x - markSize, enemy.y);
    mark.lineTo(enemy.x + markSize, enemy.y);
    mark.strokePath();
    
    // 附加到敌人
    enemy.setData('marked', true);
    enemy.setData('markEffect', mark);
    
    // 持续时间结束后移除
    scene.time.delayedCall(duration * 1000, () => {
        enemy.setData('marked', false);
        if (enemy.getData('markEffect')) {
            enemy.getData('markEffect').destroy();
            enemy.setData('markEffect', null);
        }
    });
}

// 嘲讽周围敌人
function 嘲讽周围敌人(scene, player, radius) {
    const enemies = scene.enemies || [];
    
    enemies.forEach(enemy => {
        const distance = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
        
        if (distance < radius) {
            enemy.setData('taunted', true);
            enemy.setData('tauntTarget', player);
            
            // 3秒后解除嘲讽
            scene.time.delayedCall(3000, () => {
                if (enemy.getData('tauntTarget') === player) {
                    enemy.setData('taunted', false);
                    enemy.setData('tauntTarget', null);
                }
            });
        }
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