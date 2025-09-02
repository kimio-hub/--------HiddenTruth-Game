# 未来游戏研究所 - HiddenTruth - Game

一个纯前端静态网站项目，包含首页、登录、游戏主页面、成就、数据、团队与个人主页、项目介绍等页面与资源。

## 项目结构

- 根级资源
  - `favicon.ico`：网站图标
  - `main.css`：全局样式（如果有引用）
  - `游戏文案0.0.1.docx`：项目文档
- 页面
  - `index/index.html`：项目首页（现有）
  - `intro/intro.html`：项目介绍
  - `login/login.html`：登录页面
  - `game/game.html`：游戏主页面
  - `achievement/achievement.html`：成就页面
  - `data/data.html`：数据/图表页面
  - `team/team.html`：团队总览
  - `team/dzj/index.html`、`team/hyq/index.html`、`team/wfy/index.html`、`team/zhr/index.html`、`team/zjh/index.html`：团队成员页
  - `team/hyq/gallery.html`：成员相册
- 资源
  - `assets/image/*.jpg`：图片资源
  - `sound/`：音频资源

## 快速预览

本项目是静态网页，直接用浏览器打开任意 HTML 即可。建议通过 VS Code Live Server 或静态服务器以避免资源路径问题。

### 本地预览（建议）

- 安装 VS Code 插件 "Live Server"，在 `index/index.html` 上右键选择 "Open with Live Server"。
- 或使用任意静态服务器（如 `http-server`）。

## 顶层导航页（可选）

本仓库新增一个根级 `index.html` 作为导航，方便从仓库根目录直接进入各页面。如果不需要，可删除。

## 站点地图

- `sitemap.json`：列出主要页面路径，供脚本或部署时使用。

## 约定

- 所有相对路径保持目录结构不变，避免在直接双击打开 HTML 时出现 404。
- 页面之间请使用相对路径跳转，例如从根导航进入 `index/index.html` 等。

## 维护建议

- 新增页面后请同步更新 `sitemap.json` 与本 README 的“页面”部分。
- 静态资源统一放在 `assets/` 或各模块子目录下，避免在根级散落图片/音频。
