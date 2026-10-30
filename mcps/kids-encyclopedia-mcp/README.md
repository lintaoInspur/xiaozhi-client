# @xiaozhi-client/kids-encyclopedia-mcp

离线少儿科普问答 MCP 服务（“十万个为什么”）。给 xiaozhi-client 的语音聊天加上一个**离线、适龄、安全**的科普知识库：孩子问“为什么天空是蓝色的”，小智会从本地知识库查到答案直接念出来，**不依赖网络、内容经过筛选**，非常适合儿童陪伴设备（如太空人故事机）。

语音聊天时，xiaozhi.me 的 Qwen 会自动调用本服务的 `kids_encyclopedia` 工具。

## 特性

- **完全离线**：知识库内置，不联网也能答，断网环境（车内、郊游）同样可用。
- **适龄安全**：答案用孩子能听懂的口语写成，内容经过筛选，避免不适内容。
- **易扩充**：往 `src/knowledge.ts` 的 `ENCYCLOPEDIA` 数组加条目即可，无需改逻辑。
- **优雅降级**：本地库没有的问题，会提示改用 `web_search` 或让 AI 自己回答。

## 工具

- `kids_encyclopedia(question)`：传入孩子的完整问题，返回匹配到的口语化答案；未命中则返回友好提示。

## 构建

```bash
pnpm install
pnpm --filter @xiaozhi-client/kids-encyclopedia-mcp build
```

## 接入 xiaozhi-client

在 `xiaozhi.config.json`（或 Web 界面的「添加 MCP 服务」）的 `mcpServers` 中加入：

```json
{
  "mcpServers": {
    "kids-encyclopedia": {
      "command": "node",
      "args": ["/绝对路径/xiaozhi-client/mcps/kids-encyclopedia-mcp/run.js"]
    }
  }
}
```

> 建议同时接入 `@xiaozhi-client/search-mcp`（联网搜索）作为补充：本地库答不了的，可让 AI 联网查。

## 扩充知识库

编辑 `src/knowledge.ts`，往 `ENCYCLOPEDIA` 数组追加条目：

```ts
{
  question: "为什么泡泡是圆的？",
  keywords: ["泡泡", "肥皂泡", "圆", "吹泡泡"],
  category: "物理",
  answer: "泡泡是一层薄薄的水膜，它想把自己撑得最省力气，圆球形状最省力气，所以泡泡总是圆滚滚的。",
}
```

- `keywords` 尽量多写同义词/口语说法，命中率更高；关键词越长权重越高。
- `answer` 会被 TTS 直接念出，建议用短句、口语、带点语气词，控制在 60-120 字。

## 搭配儿童角色提示词

本服务负责“答得准”，再给小智配置一个儿童百科老师的角色提示词（见项目文档/控制台“角色设定”），能让它用更温柔、好奇的语气和孩子交流，并优先调用本工具。
