# @xiaozhi-client/english-mcp

离线少儿英语启蒙单词卡 MCP 服务。按主题取单词卡（emoji + 英文 + 音标 + 中文），念给孩子听并带读。**完全离线、按主题分类、内容适龄**。

## 主题

颜色 / 动物 / 数字 / 水果 / 身体 / 食物

## 工具

- `english_card(theme?, count?)`：`theme` 选主题（不填随机），`count` 返回数量（1-8，默认 4）。

## 构建

```bash
pnpm install
pnpm --filter @xiaozhi-client/english-mcp build
```

## 接入 xiaozhi-client

```json
{
  "mcpServers": {
    "english": { "command": "node", "args": ["/绝对路径/xiaozhi-client/mcps/english-mcp/run.js"] }
  }
}
```

## 扩充词库

编辑 `src/data.ts` 的 `WORDS` 对象，按主题加单词（含 `en / zh / phonetic / emoji`）。
