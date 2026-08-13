# 🧳 TripPlanner · 旅行规划

一个开箱即用的旅行规划 Web App —— 纯前端、零依赖、数据本地存储，可一键部署到任意静态托管或 NAS。

## ✨ 功能特性

- 📅 **按天规划行程**：自定义出行日期，自动生成每日行程卡片
- 🚄 **交通信息管理**：手动录入航班 / 高铁 / 大巴 / 自驾信息
- 🏨 **酒店住宿记录**：每天独立记录酒店、入住退房时间
- 📍 **游玩地点 + 地图标记**：基于 Leaflet + OpenStreetMap，无需 API Key
- 🗺️ **路线规划**：游玩地点支持拖拽排序，自动计算路线距离与通行时间
- 💰 **花费统计**：人均花费、总预估花费、按类别实际花费饼图
- ⚖️ **分摊结算**：按人头均摊 / 自定义按参与人分摊，自动生成转账建议
- ✅ **出行清单**：分类管理、进度跟踪、一键载入常用清单
- 📜 **旅行时间线**：按时间顺序回顾整段旅程
- 📋 **行程模板库**：内置北京 / 杭州 / 厦门 / 成都 / 云南 5 套模板可直接套用
- 💾 **数据导入导出**：JSON 备份，支持跨设备迁移

## 🚀 快速开始

### 本地预览
```bash
# 方式 1：Python
python3 -m http.server 8000

# 方式 2：Node
npx serve .

# 然后浏览器打开 http://localhost:8000
```

### 直接打开
下载代码后**双击 `index.html`** 也能用（地图/图表等 CDN 资源需联网）。

## 📦 部署

纯静态站点，可部署到任意平台：

| 平台 | 难度 | 说明 |
|---|---|---|
| Cloudflare Pages / Vercel / Netlify | ⭐ | 拖拽上传即可 |
| GitHub Pages | ⭐ | Push 代码后开启 Pages |
| NAS（群晖 / 绿联 / 威联通） | ⭐⭐ | Docker 部署，详见 [deploy/README-UGOS-DXP4800.md](deploy/README-UGOS-DXP4800.md) |
| 云服务器 + Nginx | ⭐⭐⭐ | 标准 Nginx 静态托管 |

绿联 DXP4800 一键 Docker 部署配置已包含在 [deploy/](deploy/) 目录。

## 📁 项目结构

```
.
├── index.html              # 入口页面
├── styles.css              # 全部样式
├── js/
│   ├── data.js             # 数据模型 + localStorage 持久化
│   ├── templates.js        # 内置行程模板库
│   └── app.js              # 主应用逻辑（路由/视图/交互）
└── deploy/                 # 部署相关
    ├── docker-compose.yml
    ├── nginx/nginx.conf
    └── README-UGOS-DXP4800.md
```

## 🔒 数据说明

所有行程数据存储在**浏览器 localStorage** 中，不上传任何服务器。
- 不同浏览器 / 设备之间数据独立
- 建议定期使用右上角「导出」按钮备份 JSON
- 清理浏览器缓存会清空数据

## 🛠️ 技术栈

- 原生 HTML / CSS / JavaScript（无框架、无构建步骤）
- [Leaflet](https://leafletjs.com/) + OpenStreetMap（地图）
- [Chart.js](https://www.chartjs.org/)（图表）
- [SortableJS](https://sortablejs.github.io/Sortable/)（拖拽排序）

## 📄 License

MIT
