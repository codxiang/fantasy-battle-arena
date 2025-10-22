#!/bin/bash
# 游戏部署脚本 - 部署到GitHub Pages

# 检查是否安装git
if ! command -v git &> /dev/null; then
    echo "❌ 未安装git，请先安装git"
    exit 1
fi

# 检查是否已初始化仓库
if [ ! -d ".git" ]; then
    echo "🔧 初始化git仓库..."
    git init
    git add .
    git commit -m "Initial commit: 幻域争锋游戏原型"
fi

# 提示用户创建GitHub仓库
echo -e "\n📋 请先在GitHub创建一个新仓库（https://github.com/new）"
echo -e "仓库名称建议: fantasy-battle-arena\n"
read -p "请输入您的GitHub仓库地址 (例如: https://github.com/您的用户名/fantasy-battle-arena.git): " repo_url

# 添加远程仓库并推送
git remote add origin "$repo_url"
git branch -M main
git push -u origin main

echo -e "\n✅ 代码已成功推送到GitHub仓库！"
echo -e "🔗 接下来请在GitHub仓库设置中开启GitHub Pages:"
echo -e "1. 进入仓库 -> Settings -> Pages"
echo -e "2. 在Source选项中选择 main 分支和 / (root) 目录"
echo -e "3. 点击Save，等待1-2分钟后访问:"
echo -e "   https://您的用户名.github.io/fantasy-battle-arena/\n"
echo "🎉 部署完成！玩家可以通过上述链接访问游戏~"