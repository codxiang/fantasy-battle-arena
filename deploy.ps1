<# 幻域争锋：天赋觉醒 - Windows部署脚本 #>

# 检查Git是否安装
try {
    Get-Command git -ErrorAction Stop | Out-Null
}
catch {
    Write-Host "`n❌ 未找到Git，请先安装Git并重启电脑" -ForegroundColor Red
    Write-Host "   下载地址：https://git-scm.com/download/win`n"
    exit 1
}

# 检查是否已初始化Git仓库
if (-not (Test-Path .git)) {
    Write-Host "🔧 初始化Git仓库..." -ForegroundColor Cyan
    git init
    git add .
    git commit -m "Initial commit: 幻域争锋游戏原型" | Out-Null
}

# 提示用户创建GitHub仓库
Write-Host "`n📋 请先在GitHub创建一个新仓库（https://github.com/new）" -ForegroundColor Yellow
Write-Host "   仓库名称建议: fantasy-battle-arena"
$repoUrl = Read-Host "`n请输入您的GitHub仓库地址 (例如: https://github.com/您的用户名/fantasy-battle-arena.git)"

# 添加远程仓库并推送代码
git remote add origin $repoUrl 2>$null
git branch -M main
git push -u origin main

# 部署指引
Write-Host "`n✅ 代码已成功推送到GitHub仓库！" -ForegroundColor Green
Write-Host "`n🔗 请按以下步骤开启GitHub Pages（1-2分钟完成）：" -ForegroundColor Cyan
Write-Host " 1. 打开仓库页面 → 点击 Settings → 左侧导航栏找到 Pages"
Write-Host " 2. 在 Source 选项中选择 main 分支和 / (root) 目录"
Write-Host " 3. 点击 Save，等待1-2分钟后访问游戏："
Write-Host "    https://您的用户名.github.io/fantasy-battle-arena/`n" -ForegroundColor Green
Write-Host "🎉 部署完成！玩家可以通过上述链接直接在浏览器中游玩~" -ForegroundColor Cyan