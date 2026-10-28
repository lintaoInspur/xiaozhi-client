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
