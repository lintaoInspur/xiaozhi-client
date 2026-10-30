<div align="center">
  <br />
  <br />
  <img src="logo.svg" alt="Xiaozhi Client" width="400" height="100" />
  <br />
  <br />
  <br />
</div>

<div align="center">
<a href="https://www.npmjs.com/package/xiaozhi-client" target="_blank"><img src="https://img.shields.io/npm/v/xiaozhi-client" alt="npm version" /></a>
<a href="https://codecov.io/gh/shenjingnan/xiaozhi-client" target="_blank"><img src="https://codecov.io/gh/shenjingnan/xiaozhi-client/branch/main/graph/badge.svg" alt="codecov" /></a>
<a href="https://github.com/shenjingnan/xiaozhi-client/actions" target="_blank"><img src="https://github.com/shenjingnan/xiaozhi-client/workflows/Release/badge.svg" alt="ci" /></a>
<a href="https://hub.docker.com/r/shenjingnan/xiaozhi-client" target="_blank"><img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker: Ready" /></a>
<a href="https://opensource.org/licenses/MIT" target="_blank"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT" /></a>
<a href="https://img.shields.io/badge/AI%20Code-90%25%2B-84cc16" target="_blank"><img src="https://img.shields.io/badge/AI%20Code-90%25%2B-84cc16" alt="AI Code: 80%" /></a>
<br />
<a href="http://xiaozhi.me" target="_blank"><img src="https://img.shields.io/badge/小智AI-Supported-84cc16?style=flat" alt="Xiaozhi AI: Supported" /></a>
<a href="https://www.modelscope.cn/mcp" target="_blank"><img src="https://img.shields.io/badge/ModelScope-Supported-84cc16?style=flat" alt="ModelScope: Supported" /></a>
<a href="https://www.coze.cn/" target="_blank"><img src="https://img.shields.io/badge/Coze-Supported-84cc16?style=flat" alt="Coze: Supported" /></a>
<a href="https://dify.ai/" target="_blank"><img src="https://img.shields.io/badge/Dify-Supported-84cc16?style=flat" alt="Dify: Supported" /></a>
<a href="https://img.shields.io/badge/MCP%20Client-Supported-84cc16?style=flat" target="_blank"><img src="https://img.shields.io/badge/MCP%20Client-Supported-84cc16?style=flat" alt="MCP Client: Supported" /></a>
</div>

## 功能特色

- 支持 小智(xiaozhi.me) 官方服务器接入点
- 支持 作为普通 MCP Server 集成到 Cursor/Cherry Studio 等客户端
- 支持 配置多个小智接入点，实现多个小智设备共享一个 MCP 配置
- 支持 通过标准方式聚合多个 MCP Server
- 支持 动态控制 MCP Server 工具的可见性，避免由于无用工具过多导致的小智服务端异常
- 支持 本地化部署的开源服务端集成，你可以使用和小智官方服务端一样的 RPC 通信或直接使用标准 MCP 集成方式
- 支持 Web 网页可视化配置(允许自定义 IP 和端口，你能将 xiaozhi-client 部署在设备 A，然后在设备 B 通过网页控制 xiaozhi-client)
- 支持 集成 ModelScope 的远程 MCP 服务
- 支持 通过模板创建 xiaozhi-client 项目 (xiaozhi create \<my-app\> --template \<template-name\>)
- 支持 后台运行(xiaozhi start -d)

![Web UI 配置界面](https://raw.githubusercontent.com/shenjingnan/xiaozhi-client/main/docs/public/images/web-ui-preview.png)

![效果图](https://raw.githubusercontent.com/shenjingnan/xiaozhi-client/main/docs/public/images/preview.png)

## 快速上手

你可以阅读文档 [xiaozhi-client.shenjingnan.com](https://xiaozhi-client.shenjingnan.com) 快速上手！

### 本地安装

> 前置条件：请先完成 Node.js >=22（推荐 24）与 pnpm 的安装

```bash
# 安装
pnpm install -g xiaozhi-client

# 创建应用
xiaozhi create my-app

# 进入应用目录
cd my-app

# 安装依赖
pnpm install

# 小智AI配置MCP接入点的 [使用说明](https://ccnphfhqs21z.feishu.cn/wiki/HiPEwZ37XiitnwktX13cEM5KnSb)
xiaozhi config set mcpEndpoint "<从小智服务端获取到的接入点地址>"

# 启动服务
xiaozhi start

# 浏览器打开 http://localhost:9999 如果你使用的是NAS部署请使用 http://<部署设备的IP地址>:9999
```

### 使用 Docker 运行

我们提供了预配置的 Docker 镜像，可以快速启动 xiaozhi-client 环境。

#### 前置要求

- 已安装 Docker
- 已获取小智接入点地址（参见[小智 AI 配置 MCP 接入点的使用说明](https://ccnphfhqs21z.feishu.cn/wiki/HiPEwZ37XiitnwktX13cEM5KnSb)）

#### 快速启动

##### 方式一：使用启动脚本（推荐）

```bash
curl -fsSL https://raw.githubusercontent.com/shenjingnan/xiaozhi-client/main/docker/scripts/start.sh | bash
```

> 无法访问 `Github` 可以使用 `Gitee` 替代

```bash
curl -fsSL https://gitee.com/shenjingnan/xiaozhi-client/raw/main/docker/scripts/start.sh | bash
```

##### 方式二：使用 Docker Compose

获取 docker-compose.yml 文件：

```bash
curl -O https://raw.githubusercontent.com/shenjingnan/xiaozhi-client/main/docker/docker-compose.yml
```

> 无法访问 `Github` 可以使用 `Gitee` 替代

```bash
curl -O https://gitee.com/shenjingnan/xiaozhi-client/raw/main/docker/docker-compose.yml
```

```bash
# 使用 Docker Compose 启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 少儿离线内容 MCP 包（内置）

针对 3-10 岁儿童陪伴设备（如太空人故事机），仓库内置了一套**完全离线、适龄、安全**的少儿内容 MCP 包。断网也能用，内容经过筛选，绝不胡说，非常适合给孩子用。

> 目录都在 `mcps/` 下，每个包自带 `README.md` 与 `src/data.ts`（内容中心，直接往里加素材即可，无需改逻辑）。

| 包 | 工具 | 能做什么 |
|---|---|---|
| [`kids-encyclopedia-mcp`](mcps/kids-encyclopedia-mcp) | `kids_encyclopedia` | 离线“十万个为什么”，关键词匹配返回口语化答案 |
| [`story-mcp`](mcps/story-mcp) | `tell_story` | 按主题/角色/年龄讲适龄小故事，传 `exclude` 实现“再来一个” |
| [`riddle-mcp`](mcps/riddle-mcp) | `get_riddle` + `check_answer` | 猜谜语/脑筋急转弯：出题→孩子答→判对错→给提示（多轮） |
| [`poems-mcp`](mcps/poems-mcp) | `get_poem` | 古诗/儿歌/绕口令，按类型与年龄分级检索 |
| [`kids-math-mcp`](mcps/kids-math-mcp) | `math_quiz` + `check_math` | 按年龄分级出加减（大童含乘法）题并批改 |
| [`english-mcp`](mcps/english-mcp) | `english_card` | 主题单词卡（颜色/动物/数字/水果/身体/食物），含音标 |

### 构建

需要在能联网的机器上安装依赖并构建（SDK 需联网获取）：

```bash
pnpm install
pnpm --filter @xiaozhi-client/{kids-encyclopedia,story,riddle,poems,kids-math,english}-mcp build
```

### 接入 xiaozhi-client

把构建好的 6 个包加进 `xiaozhi.config.json` 的 `mcpServers`（路径换成你的绝对路径）：

```json
{
  "mcpServers": {
    "kids-encyclopedia": { "command": "node", "args": ["/绝对路径/xiaozhi-client/mcps/kids-encyclopedia-mcp/run.js"] },
    "story":             { "command": "node", "args": ["/绝对路径/xiaozhi-client/mcps/story-mcp/run.js"] },
    "riddle":            { "command": "node", "args": ["/绝对路径/xiaozhi-client/mcps/riddle-mcp/run.js"] },
    "poems":             { "command": "node", "args": ["/绝对路径/xiaozhi-client/mcps/poems-mcp/run.js"] },
    "kids-math":         { "command": "node", "args": ["/绝对路径/xiaozhi-client/mcps/kids-math-mcp/run.js"] },
    "english":           { "command": "node", "args": ["/绝对路径/xiaozhi-client/mcps/english-mcp/run.js"] }
  }
}
```

也可在 Web 配置界面（http://localhost:9999）的「添加 MCP 服务」里逐个添加。

### 搭配儿童角色提示词

再给小智配一个“儿童百科小老师”人设，让它优先调用上述工具、用孩子能听懂的话交流：

- 用 xiaozhi.me 云端（固件默认）：小智控制台 → 角色设定/系统提示词。
- 本地跑 LLM：写进 `xiaozhi.config.json` 的 `llm.prompt`（见 `src/types/config/app.ts`）。

示例提示词（直接复制）：

> 你是一个亲切、耐心、充满好奇心的儿童百科小老师，陪伴 3-10 岁的孩子探索世界。
> 当孩子问“为什么…”“怎么…”“是什么…”时，优先调用 `kids_encyclopedia` 工具，从离线知识库找适龄、安全的答案直接念出来。
> 工具没有收录时，用简短、生动、孩子能听懂的话解释，多用比喻和“呀/呢/哦”的语气，别用长难句和专业术语。
> 回答控制在 2-4 句，鼓励孩子继续提问（比如“你还想知道什么呀？”），绝不编造危险或不适合儿童的内容。

## 贡献者

![Contributors](https://contrib.rocks/image?repo=shenjingnan/xiaozhi-client&max=100&columns=10)
