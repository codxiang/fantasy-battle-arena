// 敌人AI系统
export function initEnemyAI(scene, player) {
    // 创建敌人组
    scene.enemies = [];
    
    // 初始生成敌人
    const initialEnemies = 5;
    for (let i = 0; i < initialEnemies; i++) {
        createEnemy(scene, player);
    }
    
    // 定期生成新敌人
    scene.time.addEvent({
        delay: 30000, // 每30秒
        callback: () => {
            if (scene.enemies.length < 8) { // 最多8个敌人
                createEnemy(scene, player);
            }
        },
        loop: true
    });
    
    // 更新AI
    scene.events.on('update', () => {
        updateEnemyAI(scene, player);
    });
}

// 创建敌人
function createEnemy(scene, player) {
    // 随机选择敌人英雄类型
    const enemyTypes = Object.keys(scene.gameConfig.heroes);
    const enemyType = enemyTypes[Phaser.Math.Between(0, enemyTypes.length - 1)];
    const enemyConfig = scene.gameConfig.heroes[enemyType];
    
    // 生成在玩家周围随机位置，但保持一定距离
    const spawnDistance = Phaser.Math.Between(800, 1200);
    const spawnAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const spawnX = player.x + Math.cos(spawnAngle) * spawnDistance;
    const spawnY = player.y + Math.sin(spawnAngle) * spawnDistance;
    
    // 确保生成在地图范围内
    const mapWidth = scene.map.widthInPixels;
    const mapHeight = scene.map.heightInPixels;
    const clampedX = Phaser.Math.Clamp(spawnX, 100, mapWidth - 100);
    const clampedY = Phaser.Math.Clamp(spawnY, 100, mapHeight - 100);
    
    // 创建敌人精灵
    const enemy = scene.physics.add.sprite(clampedX, clampedY, enemyType);
    
    // 设置敌人属性
    enemy.setData('type', 'enemy');
    enemy.setData('health', enemyConfig.base_attributes.health * 0.8); // 敌人生命值略低
    enemy.setData('maxHealth', enemyConfig.base_attributes.health * 0.8);
    enemy.setData('level', Phaser.Math.Between(1, player.getData('level') + 1));
    enemy.setData('kills', 0);
    enemy.setData('aggroRange', 400); // 仇恨范围
    enemy.setData('attackRange', enemyConfig.base_attributes.attack_range);
    enemy.setData('chaseRange', 800); // 追击范围
    enemy.setData('config', JSON.parse(JSON.stringify(enemyConfig))); // 深拷贝配置
    
    // 根据等级调整属性
    adjustEnemyLevelAttributes(enemy);
    
    // 设置物理属性
    enemy.setCollideWorldBounds(true);
    enemy.setDrag(100);
    enemy.setMaxVelocity(enemyConfig.base_attributes.movement_speed);
    
    // 添加碰撞
    scene.physics.add.collider(enemy, scene.map.collisionLayer);
    
    // 添加到敌人组
    scene.enemies.push(enemy);
    
    // 创建简易血条
    createEnemyHealthBar(scene, enemy);
    
    return enemy;
}

// 调整敌人等级属性
function adjustEnemyLevelAttributes(enemy) {
    const level = enemy.getData('level');
    const baseHealth = enemy.getData('config').base_attributes.health;
    const baseAttack = enemy.getData('config').base_attributes.attack_damage;
    
    // 每级提升10%属性
    const healthMultiplier = 1 + (level - 1) * 0.1;
    const attackMultiplier = 1 + (level - 1) * 0.12;
    
    enemy.setData('maxHealth', baseHealth * healthMultiplier);
    enemy.setData('health', baseHealth * healthMultiplier);
    enemy.getData('config').base_attributes.attack_damage = baseAttack * attackMultiplier;
}

// 创建敌人血条
function createEnemyHealthBar(scene, enemy) {
    // 创建血条容器
    const healthBarWidth = enemy.width * 1.2;
    const healthBarHeight = 8;
    const healthBarYOffset = -enemy.height / 2 - 15;
    
    // 背景条
    const healthBarBg = scene.add.graphics();
    healthBarBg.fillStyle(0x333333, 1);
    healthBarBg.fillRoundedRect(-healthBarWidth/2, healthBarYOffset, healthBarWidth, healthBarHeight, 4);
    
    // 前景条
    const healthBarFg = scene.add.graphics();
    
    // 添加到容器
    const healthBarContainer = scene.add.container(enemy.x, enemy.y);
    healthBarContainer.add([healthBarBg, healthBarFg]);
    
    // 保存引用
    enemy.setData('healthBar', {
        container: healthBarContainer,
        fg: healthBarFg,
        width: healthBarWidth,
        height: healthBarHeight,
        yOffset: healthBarYOffset
    });
    
    // 更新血条位置
    scene.events.on('update', () => {
        if (enemy.active && healthBarContainer) {
            healthBarContainer.setPosition(enemy.x, enemy.y);
            
            // 更新血条显示
            const healthPercent = enemy.getData('health') / enemy.getData('maxHealth');
            healthBarFg.clear();
            healthBarFg.fillStyle(getHealthColor(healthPercent), 1);
            healthBarFg.fillRoundedRect(
                -healthBarWidth/2, 
                healthBarYOffset, 
                healthBarWidth * healthPercent, 
                healthBarHeight, 
                4
            );
        } else if (healthBarContainer) {
            healthBarContainer.destroy();
        }
    });
}

// 根据生命值获取颜色
function getHealthColor(percent) {
    if (percent > 0.7) return 0x4CAF50; // 绿
    if (percent > 0.3) return 0xFFC107; // 黄
    return 0xF44336; // 红
}

// 更新敌人AI
function updateEnemyAI(scene, player) {
    const enemies = scene.enemies.filter(enemy => enemy.active);
    
    enemies.forEach(enemy => {
        // 检查敌人是否死亡
        if (enemy.getData('health') <= 0) {
            handleEnemyDeath(scene, enemy, player);
            return;
        }
        
        // 如果被嘲讽，优先攻击嘲讽者
        if (enemy.getData('taunted')) {
            const tauntTarget = enemy.getData('tauntTarget');
            if (tauntTarget && tauntTarget.active) {
                attackTarget(enemy, tauntTarget, scene);
                return;
            }
        }
        
        // 寻找最近的目标（玩家或其他敌人）
        const target = findNearestTarget(enemy, scene, player);
        
        if (target) {
            const distanceToTarget = Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
            
            // 如果在攻击范围内，进行攻击
            if (distanceToTarget < enemy.getData('attackRange')) {
                attackTarget(enemy, target, scene);
            } 
            // 如果在仇恨范围内，追击目标
            else if (distanceToTarget < enemy.getData('aggroRange')) {
                moveTowardsTarget(enemy, target);
            }
            // 如果在追击范围内，缓慢接近
            else if (distanceToTarget < enemy.getData('chaseRange')) {
                moveTowardsTarget(enemy, target, 0.5); // 50%速度
            }
            // 否则，随机漫游
            else {
                randomRoam(enemy);
            }
        } else {
            // 没有目标时随机漫游
            randomRoam(enemy);
        }
        
        // 随机使用技能
        randomUseSkills(enemy, scene);
    });
}

// 寻找最近目标
function findNearestTarget(enemy, scene, player) {
    // 可能的目标包括玩家和其他敌人（如果是不同类型）
    const potentialTargets = [player];
    
    // 添加其他敌人作为潜在目标（如果是不同英雄类型）
    scene.enemies.forEach(otherEnemy => {
        if (otherEnemy.active && otherEnemy !== enemy && 
            otherEnemy.texture.key !== enemy.texture.key) {
            potentialTargets.push(otherEnemy);
        }
    });
    
    // 找到最近的目标
    let nearestTarget = null;
    let nearestDistance = Infinity;
    
    potentialTargets.forEach(target => {
        if (target.active) {
            const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestTarget = target;
            }
        }
    });
    
    return nearestTarget;
}

// 移动向目标
function moveTowardsTarget(enemy, target, speedMultiplier = 1) {
    if (enemy.getData('stunned')) return;
    
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
    const speed = enemy.getData('config').base_attributes.movement_speed * speedMultiplier;
    
    enemy.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
    );
    
    // 更新动画
    if (enemy.body.velocity.length() > 50) {
        enemy.anims.play('move', true);
    } else {
        enemy.anims.play('idle', true);
    }
}

// 随机漫游
function randomRoam(enemy) {
    if (enemy.getData('stunned')) return;
    
    // 定期改变漫游方向
    if (!enemy.getData('roamDirection') || Phaser.Math.Between(0, 100) < 2) {
        // 随机方向
        const roamAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        enemy.setData('roamDirection', roamAngle);
    }
    
    // 随机速度
    const roamSpeed = Phaser.Math.FloatBetween(0.3, 0.7);
    const angle = enemy.getData('roamDirection');
    const speed = enemy.getData('config').base_attributes.movement_speed * roamSpeed;
    
    enemy.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
    );
    
    // 更新动画
    if (enemy.body.velocity.length() > 50) {
        enemy.anims.play('move', true);
    } else {
        enemy.anims.play('idle', true);
    }
}

// 攻击目标
function attackTarget(enemy, target, scene) {
    const currentTime = scene.time.now / 1000;
    const attackCooldown = enemy.getData('config').skills.normal_attack.cooldown;
    
    // 检查是否可以攻击
    if (!enemy.getData('lastAttackTime') || currentTime - enemy.getData('lastAttackTime') > attackCooldown) {
        enemy.setData('lastAttackTime', currentTime);
        
        // 面向目标
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
        enemy.setRotation(angle);
        
        // 播放攻击动画
        enemy.anims.play('attack', true);
        
        // 造成伤害
        const attackDamage = enemy.getData('config').base_attributes.attack_damage;
        const finalDamage = applyDamageReduction(target, attackDamage);
        
        target.setData('health', Math.max(0, target.getData('health') - finalDamage));
        
        // 显示伤害文字
        showFloatingText(scene, target.x, target.y - 30, `-${finalDamage}`, '#ff3333');
        
        // 击退效果
        const knockbackAngle = Phaser.Math.Angle.Between(target.x, target.y, enemy.x, enemy.y);
        target.setVelocity(
            Math.cos(knockbackAngle) * 200,
            Math.sin(knockbackAngle) * 200
        );
    }
}

// 应用伤害减免
function applyDamageReduction(target, damage) {
    const damageReduction = target.getData('damageReduction') || 0;
    return Math.round(damage * (1 - damageReduction));
}

// 随机使用技能
function randomUseSkills(enemy, scene) {
    if (enemy.getData('stunned')) return;
    
    const currentTime = scene.time.now / 1000;
    const cooldowns = enemy.getData('skillCooldowns') || { skill1: 0, skill2: 0 };
    
    // 寻找附近的目标
    const target = findNearestTarget(enemy, scene, scene.player);
    if (!target) return;
    
    const distanceToTarget = target ? Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y) : Infinity;
    
    // 技能1使用逻辑
    if (cooldowns.skill1 <= currentTime && Phaser.Math.Between(0, 100) < 15) { // 15%概率使用
        const skillConfig = enemy.getData('config').skills.skill_1;
        
        // 如果目标在技能范围内
        if (distanceToTarget < skillConfig.range * 1.2) {
            // 使用技能1
            useSkill(enemy, 'skill_1', scene, target);
            cooldowns.skill1 = currentTime + skillConfig.cooldown;
        }
    }
    
    // 技能2使用逻辑（防御/生存技能）
    if (cooldowns.skill2 <= currentTime && enemy.getData('health') < enemy.getData('maxHealth') * 0.4) {
        const skillConfig = enemy.getData('config').skills.skill_2;
        
        // 低生命值时使用防御技能
        if (Phaser.Math.Between(0, 100) < 30) { // 30%概率
            useSkill(enemy, 'skill_2', scene, target);
            cooldowns.skill2 = currentTime + skillConfig.cooldown;
        }
    }
    
    enemy.setData('skillCooldowns', cooldowns);
}

// 使用技能
function useSkill(enemy, skillName, scene, target) {
    const skillConfig = enemy.getData('config').skills[skillName];
    
    // 根据技能类型执行不同效果
    if (skillName === 'skill_1') {
        // 技能1 - 攻击型
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
        
        // 创建技能特效
        const effect = scene.add.graphics();
        
        if (enemy.texture.key === 'steel_wall') {
            // 钢铁壁垒技能1 - 盾牌猛击
            const skillRange = skillConfig.range;
            const targetX = enemy.x + Math.cos(angle) * skillRange;
            const targetY = enemy.y + Math.sin(angle) * skillRange;
            
            effect.lineStyle(8, 0xcccccc, 1);
            effect.beginPath();
            effect.moveTo(enemy.x, enemy.y);
            effect.lineTo(targetX, targetY);
            effect.strokePath();
            
            // 执行冲锋
            enemy.setVelocity(
                Math.cos(angle) * 1000, 
                Math.sin(angle) * 1000
            );
            
            // 眩晕并伤害路径上的敌人
            scene.time.delayedCall(200, () => {
                const enemies = scene.enemies.filter(e => e.active);
                enemies.push(scene.player);
                
                enemies.forEach(potentialTarget => {
                    if (potentialTarget !== enemy) {
                        const distance = Phaser.Math.Distance.Between(
                            enemy.x, enemy.y, potentialTarget.x, potentialTarget.y
                        );
                        
                        if (distance < 100) {
                            // 造成伤害
                            const finalDamage = applyDamageReduction(potentialTarget, skillConfig.damage);
                            potentialTarget.setData('health', Math.max(0, potentialTarget.getData('health') - finalDamage));
                            showFloatingText(scene, potentialTarget.x, potentialTarget.y, `-${finalDamage}`, '#ff3333');
                            
                            // 眩晕效果
                            stunEnemy(scene, potentialTarget, skillConfig.stun_duration);
                        }
                    }
                });
            });
        } else if (enemy.texture.key === 'shadow_blade') {
            // 影刃技能1 - 暗影突袭
            const skillRange = skillConfig.range;
            const targetX = enemy.x + Math.cos(angle) * skillRange;
            const targetY = enemy.y + Math.sin(angle) * skillRange;
            
            // 创建残影效果
            createAfterimageEffect(scene, enemy, 3);
            
            // 瞬移到目标位置
            enemy.setPosition(targetX, targetY);
            
            // 伤害周围敌人
            const enemies = scene.enemies.filter(e => e.active);
            enemies.push(scene.player);
            
            enemies.forEach(potentialTarget => {
                if (potentialTarget !== enemy) {
                    const distance = Phaser.Math.Distance.Between(
                        enemy.x, enemy.y, potentialTarget.x, potentialTarget.y
                    );
                    
                    if (distance < 150) {
                        // 造成伤害
                        const finalDamage = applyDamageReduction(potentialTarget, skillConfig.damage);
                        potentialTarget.setData('health', Math.max(0, potentialTarget.getData('health') - finalDamage));
                        showFloatingText(scene, potentialTarget.x, potentialTarget.y, `-${finalDamage}`, '#ff3333');
                        
                        // 标记敌人
                        markEnemy(scene, potentialTarget, skillConfig.mark_duration);
                    }
                }
            });
        }
        
        // 短暂显示后销毁特效
        scene.time.delayedCall(300, () => {
            effect.destroy();
        });
        
    } else if (skillName === 'skill_2') {
        // 技能2 - 防御/控制型
        if (enemy.texture.key === 'steel_wall') {
            // 钢铁壁垒技能2 - 钢铁意志
            const effectSize = enemy.width * 1.5;
            
            // 创建防御效果
            const effect = scene.add.graphics();
            effect.fillStyle(0x66ccff, 0.3);
            effect.beginPath();
            effect.arc(enemy.x, enemy.y, effectSize, 0, Math.PI * 2);
            effect.fillPath();
            
            // 应用伤害减免
            const originalDefense = enemy.getData('damageReduction') || 0;
            enemy.setData('damageReduction', skillConfig.damage_reduction);
            
            // 嘲讽周围敌人
            tauntNearbyEnemies(scene, enemy, skillConfig.taunt_radius);
            
            // 持续时间结束后恢复
            scene.time.delayedCall(skillConfig.duration * 1000, () => {
                enemy.setData('damageReduction', originalDefense);
                effect.destroy();
            });
            
        } else if (enemy.texture.key === 'shadow_blade') {
            // 影刃技能2 - 潜行
            // 应用潜行效果
            enemy.alpha = 0.4;
            enemy.setData('stealthed', true);
            
            // 提升移动速度
            const originalSpeed = enemy.getData('config').base_attributes.movement_speed;
            enemy.getData('config').base_attributes.movement_speed = originalSpeed * 1.3;
            enemy.setMaxVelocity(originalSpeed * 1.3);
            
            // 持续时间结束后恢复
            scene.time.delayedCall(skillConfig.duration * 1000, () => {
                enemy.alpha = 1;
                enemy.setData('stealthed', false);
                enemy.getData('config').base_attributes.movement_speed = originalSpeed;
                enemy.setMaxVelocity(originalSpeed);
            });
        }
    }
    
    // 显示技能名称
    showFloatingText(scene, enemy.x, enemy.y - 20, skillConfig.name, '#ffff00');
}

// 处理敌人死亡
function handleEnemyDeath(scene, enemy, player) {
    // 从敌人组移除
    const enemyIndex = scene.enemies.indexOf(enemy);
    if (enemyIndex > -1) {
        scene.enemies.splice(enemyIndex, 1);
    }
    
    // 如果是被玩家杀死的，给玩家增加击杀数和经验
    if (player) {
        player.setData('kills', (player.getData('kills') || 0) + 1);
        player.setData('experience', player.getData('experience') + enemy.getData('level') * 30);
        
        // 检查玩家是否升级
        checkPlayerLevelUp(player, scene);
    }
    
    // 创建死亡特效
    const deathEffect = scene.add.graphics();
    deathEffect.fillStyle(0xff0000, 0.5);
    deathEffect.beginPath();
    deathEffect.arc(enemy.x, enemy.y, enemy.width / 2, 0, Math.PI * 2);
    deathEffect.fillPath();
    
    // 生成经验球
    spawnExperienceOrb(scene, enemy);
    
    // 销毁敌人和特效
    scene.time.delayedCall(500, () => {
        deathEffect.destroy();
        enemy.destroy();
    });
}

// 生成经验球
function spawnExperienceOrb(scene, enemy) {
    const orbValue = enemy.getData('level') * 10;
    const orb = scene.add.sprite(enemy.x, enemy.y, 'exp_orb_medium');
    
    scene.physics.add.existing(orb);
    orb.setData('type', 'experience');
    orb.setData('value', orbValue);
    
    // 轻微向上浮动
    orb.setVelocity(0, -100);
    
    // 吸引效果
    scene.time.addEvent({
        delay: 300,
        callback: () => {
            if (orb.active) {
                const player = scene.player;
                const distance = Phaser.Math.Distance.Between(orb.x, orb.y, player.x, player.y);
                
                if (distance < 500) {
                    const angle = Phaser.Math.Angle.Between(orb.x, orb.y, player.x, player.y);
                    const force = (1 - distance / 500) * 500;
                    
                    orb.setVelocity(
                        Math.cos(angle) * force,
                        Math.sin(angle) * force
                    );
                }
            }
        },
        repeat: 10,
        interval: 50
    });
    
    // 自动销毁
    scene.time.delayedCall(5000, () => {
        if (orb.active) {
            orb.destroy();
        }
    });
}

// 检查玩家升级
function checkPlayerLevelUp(player, scene) {
    const currentLevel = player.getData('level');
    const currentExp = player.getData('experience');
    const expToNextLevel = player.getData('experienceToNextLevel');
    
    if (currentExp >= expToNextLevel) {
        // 升级
        const newLevel = currentLevel + 1;
        player.setData('level', newLevel);
        
        // 更新经验
        const remainingExp = currentExp - expToNextLevel;
        player.setData('experience', remainingExp);
        player.setData('experienceToNextLevel', Math.floor(expToNextLevel * 1.5));
        
        // 提升属性
        const healthIncrease = Math.floor(player.getData('maxHealth') * 0.15);
        player.setData('maxHealth', player.getData('maxHealth') + healthIncrease);
        player.setData('health', player.getData('maxHealth'));
        
        // 显示升级信息
        showFloatingText(scene, player.x, player.y - 50, `LEVEL UP! ${newLevel}`, '#ffff00');
        
        // 检查天赋是否可用
        checkTalentAvailability(scene);
    }
}

// 眩晕敌人
function stunEnemy(scene, enemy, duration) {
    if (enemy.getData('stunned')) return;
    
    // 保存原始状态
    enemy.setData('stunned', true);
    
    // 停止移动
    enemy.setVelocity(0, 0);
    
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

// 嘲讽周围敌人
function tauntNearbyEnemies(scene, source, radius) {
    const enemies = scene.enemies.filter(e => e.active);
    
    enemies.forEach(enemy => {
        const distance = Phaser.Math.Distance.Between(source.x, source.y, enemy.x, enemy.y);
        
        if (distance < radius) {
            enemy.setData('taunted', true);
            enemy.setData('tauntTarget', source);
            
            // 3秒后解除嘲讽
            scene.time.delayedCall(3000, () => {
                if (enemy.getData('tauntTarget') === source) {
                    enemy.setData('taunted', false);
                    enemy.setData('tauntTarget', null);
                }
            });
        }
    });
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
    
    // 持续时间结束后移除
    scene.time.delayedCall(duration * 1000, () => {
        enemy.setData('marked', false);
        mark.destroy();
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