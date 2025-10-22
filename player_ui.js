// 玩家UI系统
export function initPlayerUI(scene, player) {
    // 创建UI容器
    const uiContainer = scene.add.container(0, 0);
    uiContainer.setScrollFactor(0); // 不随相机滚动
    scene.add.existing(uiContainer);
    
    // 创建血条
    const healthBar = createHealthBar(scene, player);
    uiContainer.add(healthBar.container);
    
    // 创建经验条
    const expBar = createExperienceBar(scene, player);
    uiContainer.add(expBar.container);
    
    // 创建等级显示
    const levelDisplay = createLevelDisplay(scene, player);
    uiContainer.add(levelDisplay);
    
    // 创建技能提示
    const skillTips = createSkillTips(scene);
    uiContainer.add(skillTips);
    
    // 创建天赋提示
    const talentTip = createTalentTip(scene);
    uiContainer.add(talentTip);
    
    // 更新UI
    scene.events.on('update', () => {
        updateHealthBar(scene, player, healthBar);
        updateExperienceBar(scene, player, expBar);
        updateLevelDisplay(scene, player, levelDisplay);
    });
    
    // 保存UI引用
    scene.playerUI = {
        container: uiContainer,
        healthBar: healthBar,
        expBar: expBar,
        levelDisplay: levelDisplay
    };
}

// 创建血条
function createHealthBar(scene, player) {
    const barWidth = 200;
    const barHeight = 20;
    const x = 20;
    const y = scene.cameras.main.height - 40;
    
    // 创建容器
    const container = scene.add.container(x, y);
    
    // 背景条
    const background = scene.add.graphics();
    background.fillStyle(0x333333, 1);
    background.fillRoundedRect(0, 0, barWidth, barHeight, 5);
    
    // 前景条
    const foreground = scene.add.graphics();
    
    // 生命值文本
    const text = scene.add.text(barWidth / 2, barHeight / 2, '100%', {
        fontSize: '14px',
        fill: '#ffffff',
        align: 'center'
    });
    text.setOrigin(0.5);
    
    // 添加到容器
    container.add([background, foreground, text]);
    
    return {
        container: container,
        foreground: foreground,
        text: text,
        width: barWidth,
        height: barHeight
    };
}

// 更新血条
function updateHealthBar(scene, player, healthBar) {
    const currentHealth = player.getData('health') || 0;
    const maxHealth = player.getData('maxHealth') || 1;
    const healthPercent = Math.max(0, currentHealth / maxHealth);
    
    // 更新前景条
    healthBar.foreground.clear();
    healthBar.foreground.fillStyle(getHealthColor(healthPercent), 1);
    healthBar.foreground.fillRoundedRect(0, 0, healthBar.width * healthPercent, healthBar.height, 5);
    
    // 更新文本
    healthBar.text.setText(`${Math.round(currentHealth)}/${Math.round(maxHealth)}`);
}

// 创建经验条
function createExperienceBar(scene, player) {
    const barWidth = 200;
    const barHeight = 10;
    const x = 20;
    const y = scene.cameras.main.height - 25;
    
    // 创建容器
    const container = scene.add.container(x, y);
    
    // 背景条
    const background = scene.add.graphics();
    background.fillStyle(0x333333, 0.7);
    background.fillRoundedRect(0, 0, barWidth, barHeight, 3);
    
    // 前景条
    const foreground = scene.add.graphics();
    
    // 添加到容器
    container.add([background, foreground]);
    
    return {
        container: container,
        foreground: foreground,
        width: barWidth,
        height: barHeight
    };
}

// 更新经验条
function updateExperienceBar(scene, player, expBar) {
    const currentExp = player.getData('experience') || 0;
    const expToNextLevel = player.getData('experienceToNextLevel') || 1;
    const expPercent = Math.min(1, currentExp / expToNextLevel);
    
    // 更新前景条
    expBar.foreground.clear();
    expBar.foreground.fillStyle(0x6666ff, 1);
    expBar.foreground.fillRoundedRect(0, 0, expBar.width * expPercent, expBar.height, 3);
}

// 创建等级显示
function createLevelDisplay(scene, player) {
    const level = player.getData('level') || 1;
    const x = 240;
    const y = scene.cameras.main.height - 40;
    
    // 创建背景
    const background = scene.add.graphics();
    background.fillStyle(0x333333, 1);
    background.fillRoundedRect(0, 0, 40, 40, 5);
    
    // 创建文本
    const text = scene.add.text(20, 20, `LV${level}`, {
        fontSize: '16px',
        fill: '#ffffff',
        fontWeight: 'bold',
        align: 'center'
    });
    text.setOrigin(0.5);
    
    // 创建容器
    const container = scene.add.container(x, y);
    container.add([background, text]);
    
    return {
        container: container,
        text: text
    };
}

// 更新等级显示
function updateLevelDisplay(scene, player, levelDisplay) {
    const level = player.getData('level') || 1;
    levelDisplay.text.setText(`LV${level}`);
}

// 创建技能提示
function createSkillTips(scene) {
    const tips = [
        { key: 'Q', text: '技能1' },
        { key: 'W', text: '技能2' },
        { key: 'T', text: '打开天赋面板' }
    ];
    
    const container = scene.add.container(
        scene.cameras.main.width - 200, 
        scene.cameras.main.height - 120
    );
    
    tips.forEach((tip, index) => {
        const text = scene.add.text(
            0, 
            index * 25, 
            `[${tip.key}] ${tip.text}`, 
            {
                fontSize: '14px',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        container.add(text);
    });
    
    return container;
}

// 创建天赋提示
function createTalentTip(scene) {
    const x = scene.cameras.main.width / 2;
    const y = scene.cameras.main.height - 20;
    
    const text = scene.add.text(
        x, 
        y, 
        '按 [T] 打开天赋面板', 
        {
            fontSize: '14px',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        }
    );
    text.setOrigin(0.5);
    
    // 闪烁动画
    scene.tweens.add({
        targets: text,
        alpha: 0.5,
        duration: 1000,
        yoyo: true,
        repeat: -1
    });
    
    return text;
}

// 更新健康条颜色
function getHealthColor(percent) {
    if (percent > 0.7) return 0x4CAF50; // 绿
    if (percent > 0.3) return 0xFFC107; // 黄
    return 0xF44336; // 红
}