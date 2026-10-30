# @xiaozhi-client/story-mcp

离线少儿故事/绘本机 MCP 服务。给 xiaozhi-client 的语音聊天加上一个**离线、适龄、安全**的故事库：孩子说“讲个故事”“讲个关于太空的故事”“睡前故事”，小智就从本地故事库挑一个直接念出来。**不依赖网络**，适合儿童陪伴设备。

## 工具

- `tell_story(theme?, age?, exclude?)`：按主题/角色、年龄挑选故事；`exclude` 传入刚讲过的标题可避免连续重复（实现“再来一个”）。

## 构建

```bash
pnpm install
pnpm --filter @xiaozhi-client/story-mcp build
```

## 接入 xiaozhi-client

```json
{
  "mcpServers": {
    "story": { "command": "node", "args": ["/绝对路径/xiaozhi-client/mcps/story-mcp/run.js"] }
  }
}
```

## 扩充故事

编辑 `src/data.ts` 的 `STORIES` 数组，每个故事含 `title / themes / age / text`。`text` 会被 TTS 直接念出，建议口语化、约 100-200 字，主题积极（勇敢、分享、好奇、晚安等）。
