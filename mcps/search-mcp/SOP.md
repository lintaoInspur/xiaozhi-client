# 免费联网搜索 MCP —— 部署 SOP

## 0. 目标与架构

用**完全免费、自托管**的方式替换付费的「联网搜索」MCP：

- **聊天**：xiaozhi-client 直接连接你在 xiaozhi.me 注册设备拿到的接入点（Qwen，平台免费额度）。
- **搜索**：本仓库新增的 `search-mcp` 暴露 `web_search` 工具。
- **关键点**：xiaozhi-client 在语音/文字聊天时，会把自己本地 `mcpServers` 里的工具（即 `search-mcp`）**主动喂给 xiaozhi.me 的 Qwen**。所以只要把 search-mcp 配进 `mcpServers`，问时效性问题时 Qwen 会自动调用 `web_search`，对话体验上就多了联网搜索，零成本。

```
[ 你 ] --语音/文字--> [ xiaozhi-client ] --websocket--> [ xiaozhi.me / Qwen ]
        [ xiaozhi-client ] --本地 stdio MCP--> [ search-mcp ] --HTTP--> [ SearXNG / DuckDuckGo ]
```

---

## 1. 构建 search-mcp

```bash
cd xiaozhi-client
pnpm install
pnpm --filter @xiaozhi-client/search-mcp build
```

> 需要 Node 22（本仓库 Docker 镜像即 node:22）。构建产物在 `mcps/search-mcp/dist/`。

---

## 2. 自托管 SearXNG（国内网络强烈推荐）

SearXNG 是免费的搜索引擎聚合器，本身不爬数据，而是去抓 Google/Bing/Baidu 等上游。
它在**国内网络**下比直接裸连 DuckDuckGo/Google 更可控（可只留能通的引擎）。

### 2.1 准备配置

复制模板并生成密钥（模板见 `mcps/search-mcp/searxng/settings.yml.example`）：

```bash
mkdir -p ~/searxng
cp mcps/search-mcp/searxng/settings.yml.example ~/searxng/settings.yml
# 把 settings.yml 里的 secret_key 改成随机值：
sed -i "s/__GENERATE_WITH_openssl_rand_hex_16__/$(openssl rand -hex 16)/" ~/searxng/settings.yml
```

### 2.2 拉取镜像

Docker Hub 直连不通时，用 daocloud 代理（已验证可用）：

```bash
docker pull docker.m.daocloud.io/searxng/searxng:latest
```

### 2.3 启动容器

```bash
docker run -d --name searxng --restart unless-stopped \
  -p 8080:8080 \
  -v ~/searxng/settings.yml:/etc/searxng/settings.yml:ro \
  docker.m.daocloud.io/searxng/searxng:latest
```

### 2.4 验证

```bash
curl -s "http://localhost:8080/search?q=%E4%BB%8A%E6%99%BA&format=json" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);console.log("results:",(j.results||[]).length);(j.results||[]).slice(0,5).forEach((r,i)=>console.log(i+1,r.title))}catch(e){console.log("返回异常:",s.slice(0,200))}})'
```

### 2.5 引擎筛选（重要）

实测本机对各大搜索引擎的可达性：

| 引擎 | 状态 | 引擎 | 状态 |
| --- | --- | --- | --- |
| baidu | ✅ | duckduckgo / google / wikipedia | ❌ 不通 |
| sogou | ✅ | mojeek / startpage / brave / qwant | ❌ 不通 |
| bing | ✅ | | |
| yandex | ✅ | | |
| ecosia | ✅ | | |

因此 `settings.yml` 用 `disabled_engines` 把 Google / DuckDuckGo / Wikipedia 等**本机不通的默认引擎全部禁用**，只保留 `baidu / sogou / bing / yandex / ecosia`，避免每次搜索卡在超时。
若其中某个（如 bing/yandex/ecosia）实际返回空，把它也加进 `disabled_engines`，只留 `baidu + sogou`（对中文最稳）。

---

## 3. 接入 xiaozhi-client

在 `xiaozhi.config.json`（或 Web 界面「添加 MCP 服务」）的 `mcpServers` 中加入：

```json
{
  "mcpServers": {
    "search": {
      "command": "node",
      "args": ["/绝对路径/xiaozhi-client/mcps/search-mcp/run.js"],
      "env": {
        "SEARCH_BACKEND": "searxng",
        "SEARXNG_URL": "http://localhost:8080"
      }
    }
  }
}
```

- 若 search-mcp 与 xiaozhi-client **不在同一台机器**，把 `localhost` 换成 SearXNG 所在机器的 IP。
- 若不想自托管 SearXNG，可改用 DuckDuckGo 免 key 后端：
  `"env": { "SEARCH_BACKEND": "duckduckgo" }`（无需 `SEARXNG_URL`）。
- 其他可选后端：`tavily`（设 `TAVILY_API_KEY`）、`brave`（设 `BRAVE_API_KEY`），均有免费额度。

---

## 4. 端到端验证

1. 启动 xiaozhi-client，确认日志出现：`MCP 服务 search 已连接，工具数: 1`。
2. 语音或文字问时效性问题，例如「今天有什么科技新闻」「某股票现在多少钱」。
3. 观察 Qwen 是否调用 `web_search` 并返回搜索摘要（可在 xiaozhi-client 日志里看到 `搜索: "..."`）。

---

## 5. 后端切换速查

| 后端 | 环境变量 | 是否需要 key | 说明 |
| --- | --- | --- | --- |
| `duckduckgo` | `SEARCH_BACKEND=duckduckgo` | 否 | 默认，免配置；国内可能不通 |
| `searxng` | `SEARCH_BACKEND=searxng` + `SEARXNG_URL` | 否（自托管） | 国内推荐，完全免费可控 |
| `tavily` | `SEARCH_BACKEND=tavily` + `TAVILY_API_KEY` | 是 | 有免费额度 |
| `brave` | `SEARCH_BACKEND=brave` + `BRAVE_API_KEY` | 是 | 有免费额度 |

工具签名：`web_search(query: string, limit?: number=5, backend?: string)`

---

## 6. 在 Armbian（arm64）上部署 client

**架构提醒**：镜像是架构相关的——x86_64 只能用 amd64 镜像，Armbian（aarch64）必须用 **arm64** 镜像，**不能把 amd64 镜像直接丢上去**（指令集不匹配，原生跑不了）。

最推荐：在 **Armbian 本机**从源码构建（arm64 原生、无需模拟，且自动包含本 fork 全部改动，含 search-mcp）：

```bash
git clone https://github.com/lintaoInspur/xiaozhi-client.git && cd xiaozhi-client
docker compose -f docker/docker-compose.source.yml up -d --build
```

完整说明见仓库 `docs/deploy-armbian.md`。构建完容器以 `node dist/cli/index.js start` 启动，Web UI 在 `http://<开发板IP>:9999`。

Armbian 场景注意点：
- 源码构建已含 search-mcp，**无需额外挂载** `mcps/search-mcp`。
- 若 SearXNG 也跑在同一块开发板上（建议同机，延迟低），`SEARXNG_URL` 用 `http://localhost:8080`；若在别的机器，用其局域网 IP，不可用 `localhost`。
- 配置与日志在宿主机 `~/xiaozhi-client`（compose 挂载的 workspace）；更新代码后 `git pull && docker compose -f docker/docker-compose.source.yml up -d --build` 重新编译即可。

## 7. 在 x86_64 上交叉构建 arm64 镜像 + 离线部署到 Armbian

### 7.1 在 x86_64 上产出 arm64 镜像（含 search-mcp）

若想在**这台 x86_64 机器**上提前产出供 Armbian 使用的 arm64 镜像（便于离线拷贝），用 `docker build --platform linux/arm64`（依赖本机已注册的 `qemu-aarch64` 模拟）：

```bash
cd xiaozhi-client
docker build --platform linux/arm64 -f docker/Dockerfile.source -t xiaozhi-client:arm64 \
  --build-arg BASE_IMAGE=docker.m.daocloud.io/library/node:22 \
  --build-arg NPM_REGISTRY=https://registry.npmmirror.com/ .
# 导出成 tar，方便拷到 Armbian（产物约 2.7G）：
docker save -o xiaozhi-client-arm64-new.tar xiaozhi-client:arm64
```

> 构建期走 QEMU 模拟，比在 Armbian 本机原生构建慢。若开发板就在手边且能联网，优先用第 6 步的本机源码构建，无需传输 2.7G 的 tar。

### 7.2 离线把 tar 部署到 Armbian（无外网 / 内网隔离场景）

这个 tar 是 **arm64 镜像**，只能在 Armbian（aarch64）上原生跑，不能在 x86_64 上原生跑（x86_64 上只能靠 QEMU 模拟，不推荐当日常用）。

1. 把 tar 从构建机传到开发板：
   ```bash
   scp /path/to/xiaozhi-client-arm64-new.tar <用户>@<开发板IP>:/tmp/
   ```
2. 在 Armbian 上导入镜像（导入后本地出现 `xiaozhi-client:arm64`，arm64 原生，直接跑，无需模拟）：
   ```bash
   docker load -i /tmp/xiaozhi-client-arm64-new.tar
   ```
3. 在 Armbian 上启动容器（Web UI 在 `:9999`，备用 `:3000`）：
   ```bash
   docker run -d --name xiaozhi-client -p 9999:9999 -p 3000:3000 \
     -e NODE_ENV=production -e XIAOZHI_WORKSPACE=/workspaces \
     -e XIAOZHI_CONTAINER=true -e XIAOZHI_CONFIG_DIR=/workspaces \
     -v ~/xiaozhi-workspace:/workspaces --restart unless-stopped \
     xiaozhi-client:arm64
   ```
4. 浏览器开 `http://<开发板IP>:9999` 即可使用；配置与日志在宿主机 `~/xiaozhi-workspace`。

注意：
- 该镜像**已包含 search-mcp**（从当前源码编的），无需再挂载 `mcps/search-mcp` 目录；按 §4 把 `search` 加进 `mcpServers`，并准备好搜索后端（§2/§3）。
- 若 SearXNG 也在同一开发板上（建议同机，延迟低），`SEARXNG_URL` 用 `http://localhost:8080`；在别的机器用其局域网 IP，不可用 `localhost`。
- tar 是二进制大文件，**不要提交进 git**，只用于传输。
