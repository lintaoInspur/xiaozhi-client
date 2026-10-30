# @xiaozhi-client/riddle-mcp

离线少儿猜谜语 / 脑筋急转弯 MCP 服务。和孩子多轮互动：**出题 → 孩子答 → 判对错 → 给提示**。谜面/答案完全离线、内容适龄。

## 工具

- `get_riddle(category?)`：出一道题，`category` 可选 `riddle`(传统谜语) / `brain`(脑筋急转弯)，返回 `riddle_id`（不返回答案，避免剧透）。
- `check_answer(riddle_id, answer)`：用 `riddle_id` 和孩子回答判对错；答对给鼓励，答错给提示可再猜。

## 构建

```bash
pnpm install
pnpm --filter @xiaozhi-client/riddle-mcp build
```

## 接入 xiaozhi-client

```json
{
  "mcpServers": {
    "riddle": { "command": "node", "args": ["/绝对路径/xiaozhi-client/mcps/riddle-mcp/run.js"] }
  }
}
```

## 扩充题库

编辑 `src/data.ts` 的 `RIDDLES` 数组，每条含 `type / question / answer / hint`。
