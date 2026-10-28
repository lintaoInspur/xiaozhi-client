# @xiaozhi-client/search-mcp

免费的联网搜索 MCP 服务，给 xiaozhi-client 的语音聊天加上联网搜索能力。
语音聊天时，xiaozhi.me 的 Qwen 会自动调用本服务的 `web_search` 工具。

## 支持的搜索后端

| 后端 | 环境变量 | 说明 |
| --- | --- | --- |
| `duckduckgo`（默认） | — | 免 API key，直接爬 html.duckduckgo.com，零配置 |
| `searxng` | `SEARXNG_URL` | 自托管 SearXNG 实例（推荐国内用户，完全免费可控） |
| `tavily` | `TAVILY_API_KEY` | Tavily 搜索，有免费额度 |
| `brave` | `BRAVE_API_KEY` | Brave 搜索，有免费额度 |

切换后端：`SEARCH_BACKEND=searxng`（或 tavily / brave / duckduckgo）。

## 构建

```bash
pnpm install
pnpm --filter @xiaozhi-client/search-mcp build
```

## 接入 xiaozhi-client

在 `xiaozhi.config.json`（或 Web 界面的「添加 MCP 服务」）的 `mcpServers` 中加入：

```json
{
  "mcpServers": {
    "search": {
      "command": "node",
      "args": ["/绝对路径/xiaozhi-client/mcps/search-mcp/run.js"],
      "env": {
        "SEARCH_BACKEND": "duckduckgo"
      }
    }
  }
}
```

> 如果用 HTTP（streamable）方式暴露，可另起一个 HTTP transport；stdio 方式最简单，上例即可。

## 国内网络建议

若 `duckduckgo` 在你的网络下无法访问，推荐：
1. 自托管一个 SearXNG（如 `http://你的内网IP:8080`），设 `SEARXNG_URL` 与 `SEARCH_BACKEND=searxng`；
2. 或申请 Tavily / Brave 的免费 API key。

## 工具

- `web_search(query, limit=5, backend?)`：联网搜索，返回标题/链接/摘要。

## 详细部署 SOP

完整的端到端部署步骤（构建、自托管 SearXNG、接入 xiaozhi-client、引擎筛选、验证）见 [SOP.md](./SOP.md)。

## SearXNG 配置模板

自托管 SearXNG 的参考配置（含本机引擎可达性筛选）见 [searxng/settings.yml.example](./searxng/settings.yml.example)。
