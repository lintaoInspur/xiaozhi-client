# 在 Armbian 上部署 xiaozhi-client（Docker 从源码构建）

本指南面向 **armbian（ARM64，如 Orange Pi / NanoPi / RK3399 等）** 用户，目标是在开发板上跑起你自己 fork 里的 `xiaozhi-client`（包含音乐桥接等本地改动）。

> ⚠️ 重要前提：官方 `docker/Dockerfile` 是通过 `npm install -g xiaozhi-client@<版本>` 从 **npm 拉「已发布」的包**来构建镜像的，它**不会包含你 fork 里的本地改动**（比如音乐桥接功能）。
> 因此要用你自己的代码，必须**从源码构建**——本仓库已提供 `docker/Dockerfile.source` 与 `docker/docker-compose.source.yml` 来做这件事。

---

## 方式一：Docker 从源码构建（推荐）

### 1. 在 armbian 上安装 Docker

```bash
# 用官方一键脚本（armbian 一般为 aarch64，脚本会自动装 arm64 版本）
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# 注销重登，或执行下面这条让当前会话生效
newgrp docker
docker --version   # 确认能跑
```

### 2. 拉取你的 fork 源码

```bash
git clone https://github.com/lintaoInspur/xiaozhi-client.git
cd xiaozhi-client
```

### 3. 构建并启动（一条命令搞定，armbian 是 arm64，原生构建无需模拟）

```bash
docker compose -f docker/docker-compose.source.yml up -d --build
```

- `--build`：因为 `Dockerfile.source` 会在容器内执行 `pnpm install && pnpm build`，所以**这一步就是「编译」**，会把你 fork 的代码编进镜像。
- 首次构建会下载依赖并编译，可能需要几分钟（取决于开发板性能）。
- 构建完成后容器自动以 `node dist/cli/index.js start` 启动，开机自启（`restart: unless-stopped`）。

> 等价地，也可以分步：
> ```bash
> docker build -f docker/Dockerfile.source -t xiaozhi-client:source .
> docker run -d --name xiaozhi-client -p 9999:9999 -p 3000:3000 \
>   -e NODE_ENV=production -e XIAOZHI_WORKSPACE=/workspaces \
>   -e XIAOZHI_CONTAINER=true -e XIAOZHI_CONFIG_DIR=/workspaces \
>   -v ~/xiaozhi-client:/workspaces --restart unless-stopped \
>   xiaozhi-client:source
> ```

### 4. 访问 Web UI

打开浏览器：

```
http://<armbian 的 IP>:9999
```

若 `9999` 被占用或不通，备用端口 `3000` 也可用。

### 5. 查看状态 / 日志

```bash
docker ps                                  # 看容器是否在跑
docker logs -f xiaozhi-client              # 实时日志
docker compose -f docker/docker-compose.source.yml ps
```

### 6. 更新到最新代码

```bash
cd xiaozhi-client
git pull
docker compose -f docker/docker-compose.source.yml up -d --build   # 重新编译并重启
```

配置和日志都在宿主机 `~/xiaozhi-client` 里，更新镜像不会丢。

---

## 方式二：不用 Docker，直接在 armbian 上跑 Node（更简单，可选）

如果你不想用 Docker，也可以直接在 armbian 上编译运行（同样是 arm64 原生）：

```bash
# 1) 安装 Node 22 与 pnpm
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs
sudo npm i -g pnpm

# 2) 拉代码并编译
git clone https://github.com/lintaoInspur/xiaozhi-client.git
cd xiaozhi-client
pnpm install
pnpm run build

# 3) 启动
node dist/cli/index.js start
# 或全局链接后使用 xiaozhi 命令：pnpm link --global && xiaozhi start
```

访问 `http://<IP>:9999` 同上。

---

## 音乐桥接（路径 B）配合说明

如果你的目标是用「音乐桥接」让 ESP32 设备播放，还需要：

1. **xiaozhi-esp32 侧的 `music-service` 在跑**（`music_service.py` 的 `/opus_stream` 端点），且 `xiaozhi-client` 能访问到它。
   - 它可以和 `xiaozhi-client` **同机**（armbian）运行，也可以跑在另一台机器。
2. 在 `xiaozhi-client` 的 Web UI / 配置里把 `music-service` 的地址指过去。
3. 设备端固件需支持 `{"type":"music","state":"start/stop"}` 控制消息（已有 `self.music.stop`；播放见 `main/application.cc`）。

---

## 常见问题

- **构建时报 `@discordjs/opus` 相关错误？** 该模块是原生模块，arm64 有预编译包，正常情况下 `pnpm install` 会自动下载；若失败多半是网络问题，可换国内镜像或手动安装。
- **想用自己的 Docker Hub 镜像？** 在 `docker-compose.source.yml` 里把 `image` 改成 `你的用户名/xiaozhi-client:source`，`docker compose build` 后 `docker push` 即可。注意这需要你自己的 Docker Hub 账号和 token（本项目 fork 的 `docker-publish.yml` 工作流依赖 `DOCKER_USERNAME` / `DOCKER_TOKEN` 两个 secret，且它用的是官方 `Dockerfile` 而非源码构建）。
- **官方发布镜像（`shenjingnan/xiaozhi-client:latest`）能用吗？** 能用，但它是 npm 发布包，**不含你的 fork 改动**；若你只需要原版 xiaozhi-client，可直接 `docker pull shenjingnan/xiaozhi-client:latest` 或用仓库根目录的 `docker-compose.yml`。
