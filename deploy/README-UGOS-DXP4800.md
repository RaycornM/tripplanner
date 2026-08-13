# 绿联 DXP4800 部署旅行规划 TripPlanner

## 📁 正确的目录结构（严格按照这个）

在绿联的任意共享文件夹下（推荐 `Docker` 共享目录，UGOS Pro 默认有）建如下结构：

```
Docker/
└── tripplanner/                    ← 本项目根目录
    ├── docker-compose.yml           ← 本仓库 deploy/docker-compose.yml
    ├── nginx/
    │   └── nginx.conf               ← 本仓库 deploy/nginx/nginx.conf
    ├── www/                         ← 网站静态文件（只读挂载）
    │   ├── index.html               ← 本仓库根目录的 index.html
    │   ├── styles.css               ← 本仓库根目录的 styles.css
    │   └── js/
    │       ├── data.js
    │       ├── templates.js
    │       └── app.js
    └── logs/                        ← nginx 日志（容器启动后自动生成）
```

---

## 🖥️ 方式一：绿联 Docker 管理器图形化（推荐，零命令）

绿联 UGOS Pro 的 Docker 管理在「Docker 管理器」→「项目」里做 Compose 导入，最省事。

### 第 1 步：上传文件（30秒）
1. 打开绿联 UGOS Pro 网页端 → 「文件管理」
2. 进入共享文件夹 `Docker`（没有就右键"新建共享文件夹"，名字随意，比如 `docker-data`）
3. 在里面**新建文件夹** `tripplanner`
4. 按上面目录结构，把 `docker-compose.yml`、`nginx/nginx.conf`、`www/` 下的 4 个文件/目录**全部拖进去上传**
   - 最简单：你本地电脑把 `/workspace` 里的 `index.html`、`styles.css`、`js/` 复制到一个叫 `www` 的文件夹，然后一起拖

### 第 2 步：Docker 管理器导入 Compose（1分钟）
1. 侧边栏打开「Docker 管理器」→ 确认状态是"已启动"，Docker 引擎正常
2. 点顶部「项目」→「+ 新建项目」
3. 填写：
   - **项目名称**：`tripplanner`（随意，识别用）
   - **路径**：点"浏览" → 选刚才建的 `Docker/tripplanner/` 目录（里面得有 `docker-compose.yml`）
   - **配置方式**：选 **"使用 docker-compose.yml 文件"**
   - 文件会自动读取你目录里的 `docker-compose.yml`，如果没读到就点"导入文件"手动选
4. 点 **"确定 / 部署"**，等待拉镜像+启动（`nginx:alpine` 大约 10MB，第一次1分钟）
5. 看到项目状态「运行中」→ 容器列表里 `tripplanner` 显示绿色 ✓

### 第 3 步：访问确认
浏览器打开：`http://绿联的局域网IP:8888/`

绿联的 IP 可以在「控制面板 → 网络」里看到，或者路由器后台看。通常是 `192.168.x.x:8888`。

✅ 打开就有「我的旅行」页面 + 样式正常 → 成功。

❌ 打不开：看下面"常见问题排查"。

---

## 💻 方式二：SSH 命令行（绿联开启 SSH 后更快）

如果你给 DXP4800 开了 SSH（「控制面板 → 网络服务 → SSH」），直接复制粘贴：

```bash
# 1. SSH 登录绿联（默认端口 22，用户名是你建的管理员账号，不是 root）
ssh 你的管理员名@192.168.1.100   # 替换成绿联IP

# 2. 进入共享盘 Docker 目录（UGOS Pro 默认共享盘挂在 /mnt/nas/下，具体看你的）
cd /mnt/nas/Docker    # 或 /mnt/user/Docker、/volume1/Docker，不同 UGOS 版本略有差异

# 3. 建目录结构
mkdir -p tripplanner/{www,nginx,logs}

# 4. 上传文件（三选一）
#    A. 本地电脑用 sftp/scp 传：
#        scp -r workspace/index.html workspace/styles.css workspace/js user@192.168.1.100:/mnt/nas/Docker/tripplanner/www/
#        scp workspace/deploy/docker-compose.yml user@192.168.1.100:/mnt/nas/Docker/tripplanner/
#        scp workspace/deploy/nginx/nginx.conf user@192.168.1.100:/mnt/nas/Docker/tripplanner/nginx/
#
#    B. 你现在打开的 TRAE IDE 里右键导出下载到本地 → 用绿联文件管理器上传
#    C. 局域网 SMB 共享 \\绿联IP\Docker\tripplanner\ 直接复制粘贴

# 5. 启动（推荐 docker compose，UGOS Pro 新版本自带）
cd /mnt/nas/Docker/tripplanner
docker compose up -d

# 旧版本如果没有 compose 插件，用 docker run 单行：
# docker run -d \
#   --name tripplanner \
#   --restart unless-stopped \
#   -p 8888:80 \
#   -v $(pwd)/www:/usr/share/nginx/html:ro \
#   -v $(pwd)/nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
#   -v $(pwd)/logs:/var/log/nginx \
#   -e TZ=Asia/Shanghai \
#   --memory=128m --cpus=0.5 \
#   nginx:1.27-alpine

# 6. 验证
docker ps          # 看 tripplanner 是否 Up
curl -I http://127.0.0.1:8888/   # 应该返回 200 OK
```

---

## 🔧 端口、HTTPS、其他自定义

### 改端口
直接改 `docker-compose.yml` 里的 `ports:`，把 `8888` 换成你想要的（别和绿联自带服务冲突：80/443/5000/8080/9000 常用端口别用）。

改完执行：
```bash
cd Docker/tripplanner
docker compose up -d   # 自动重建容器
```

### 绑定域名 + HTTPS（推荐用绿联反向代理）
把 `trip.你的域名.com` 解析到绿联公网IP/DDNS后：
1. 「控制面板 → 网络服务 → 反向代理」新建
2. 协议 HTTPS / 端口 443 / 主机名 `trip.你的域名.com`
3. 目标 HTTP / `127.0.0.1` / 端口 `8888`
4. SSL 证书用 Let's Encrypt（绿联可以一键申请）

### 没有公网 IP？Cloudflare Tunnel 零配置穿透
如果没公网IP，不用买带宽不用开端口：
```yaml
# 在同一个 docker-compose.yml 里加这个 service
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: tripplanner-tunnel
    restart: unless-stopped
    command: tunnel --no-autoupdate run --token 这里粘贴Cloudflare给你的Token
    depends_on:
      - tripplanner
    networks:
      - tripplanner-net
```
Cloudflare Zero Trust 里新建 Tunnel 时，Public Hostname 指向 `http://tripplanner:80`，手机就能走 HTTPS 访问。

---

## 🆘 常见问题排查

| 问题 | 排查命令（SSH）/ 操作 | 解决方式 |
|---|---|---|
| 页面打不开，显示"拒绝连接" | `docker ps -a` 看容器在不在 | 没起来的话 `docker logs tripplanner` 看报错 |
| 端口被占用 | `netstat -tulpn \| grep 8888` | 改 compose 里的端口号，比如 `8899:80` |
| 打开是 403 Forbidden | `docker exec tripplanner ls /usr/share/nginx/html/` 看文件有没有 | 检查 `www/` 挂载路径对不对、绿联文件权限 |
| 404 Not Found | 同上命令看 index.html 存不存在 | `www/` 里必须直接有 index.html，不能多一层子目录 |
| 样式全乱了（裸 HTML） | F12 控制台看 CSS/JS 404 | `www/js/` 三个 js 文件别漏传 |
| 地图空白 | F12 控制台 Network 看 tile.openstreetmap.org 能通吗 | 绿联能上外网就行；内网纯离线要换本地瓦片服务 |
| 手机浏览器数据和电脑不同步 | — | 正常，数据各存各的浏览器；要同步就点右上角「导出 / 导入」JSON |

---

## 💾 数据备份（非常重要！）

因为所有行程数据存在浏览器 localStorage，建议：

1. **定期导出 JSON**：app 右上角「导出」→ 下载 `tripplanner_backup_xxx.json` → 丢到绿联的某个共享文件夹
2. **站点文件备份**：整个 `Docker/tripplanner/` 目录加到绿联的「备份计划」里，异盘备份
3. **绿联快照**：如果用的 Btrfs 卷，给 Docker 共享文件夹开定时快照，误操作能秒回滚

---

## 📦 资源占用（给你安心）

```
CONTAINER        CPU %    MEM USAGE      SIZE
tripplanner      ~0%      6-12 MiB       10.2 MB (镜像)
```

DXP4800 是 N100，这个容器几乎不占资源，8GB 内存的话占比 < 0.2%，放心跑。
