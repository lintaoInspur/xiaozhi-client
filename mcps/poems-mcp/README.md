# @xiaozhi-client/poems-mcp

离线少儿古诗 / 儿歌 / 绕口令 MCP 服务。孩子要背诗、唱儿歌、练绕口令时，从本地经典内容库挑一条适龄内容直接念出。**完全离线、内容安全**。

## 工具

- `get_poem(type?, keyword?, age?)`：`type` 可选 `古诗`/`儿歌`/`绕口令`；`keyword` 按标题或内容检索（如“月亮”“春天”）；`age` 按适龄筛选。

## 构建

```bash
pnpm install
pnpm --filter @xiaozhi-client/poems-mcp build
```

## 接入 xiaozhi-client

```json
{
  "mcpServers": {
    "poems": { "command": "node", "args": ["/绝对路径/xiaozhi-client/mcps/poems-mcp/run.js"] }
  }
}
```

## 扩充内容

编辑 `src/data.ts` 的 `POEMS` 数组，每条含 `type / title / author? / content / age`。
