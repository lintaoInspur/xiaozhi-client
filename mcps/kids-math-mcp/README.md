# @xiaozhi-client/kids-math-mcp

少儿数学启蒙小老师 MCP 服务。按年龄分级出算术题并批改，**离线可用**。

## 难度分级

- 3-5 岁：10 以内加减
- 6-7 岁：20 以内加减
- 8-10 岁：100 以内加减，偶尔表内乘法

## 工具

- `math_quiz(age?)`：出一道适龄题，返回 `quiz_id` 与口语化题目。
- `check_math(quiz_id, answer)`：批改孩子回答；答对鼓励，答错给正确答案并鼓励再试。

## 构建

```bash
pnpm install
pnpm --filter @xiaozhi-client/kids-math-mcp build
```

## 接入 xiaozhi-client

```json
{
  "mcpServers": {
    "kids-math": { "command": "node", "args": ["/绝对路径/xiaozhi-client/mcps/kids-math-mcp/run.js"] }
  }
}
```

> 与仓库自带的 `calculator-mcp`（通用计算）互不冲突，可同时启用；若只想要启蒙能力，可仅启用本服务。
