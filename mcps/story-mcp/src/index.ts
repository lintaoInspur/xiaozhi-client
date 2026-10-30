/**
 * Story MCP Server —— 离线少儿故事/绘本机
 *
 * 当孩子想听故事时，xiaozhi.me 的 Qwen 会自动调用本服务的 `tell_story` 工具，
 * 按主题/角色/年龄从本地故事库挑选一个适龄小故事，直接念给孩子听。完全离线、内容安全。
 * 支持“再来一个”：把刚讲过的标题通过 exclude 传回，避免连续重复。
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { STORIES, type Story } from "./data.js";

const logger = {
  info: (m: string) => console.error(`[story-mcp] INFO  ${m}`),
  error: (m: string) => console.error(`[story-mcp] ERROR ${m}`),
};

function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function normalize(t: string): string {
  return t.toLowerCase().replace(/\s+/g, "");
}

/** 按主题/年龄筛选；exclude 里出现的标题会被跳过 */
function pickStory(opts: {
  theme?: string;
  age?: number;
  exclude?: string[];
}): Story | undefined {
  let pool = STORIES.slice();
  if (opts.exclude && opts.exclude.length) {
    const ex = new Set(opts.exclude.map(normalize));
    pool = pool.filter((s) => !ex.has(normalize(s.title)));
  }
  if (opts.theme) {
    const t = normalize(opts.theme);
    const matched = pool.filter((s) => s.themes.some((k) => normalize(k).includes(t) || t.includes(normalize(k))));
    if (matched.length) pool = matched;
  }
  if (typeof opts.age === "number") {
    const aged = pool.filter((s) => opts.age! >= s.age[0] && opts.age! <= s.age[1]);
    if (aged.length) pool = aged;
  }
  if (!pool.length) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}

const server = new McpServer({
  name: "@xiaozhi-client/story-mcp",
  version: "1.0.0",
});

server.tool(
  "tell_story",
  "少儿故事机。当孩子想听故事、睡前故事，或指定了主题/角色（如“讲个关于太空的故事”“小熊的故事”）时调用。" +
    "从本地离线故事库挑选一个适龄、安全的小故事，直接念给孩子听。想连续讲不同的故事时，" +
    "把刚讲过的标题放进 exclude 数组避免重复。",
  {
    theme: z
      .string()
      .optional()
      .describe("主题或角色关键词，如“太空”“小熊”“勇敢”“晚安”“分享”"),
    age: z.number().int().min(1).max(12).optional().describe("孩子年龄（岁），用于按适龄区间筛选"),
    exclude: z
      .array(z.string())
      .optional()
      .describe("不想重复的故事标题列表（如刚讲过的），返回时会避开它们"),
  },
  async ({ theme, age, exclude }) => {
    try {
      logger.info(`讲故事: theme=${theme ?? "-"} age=${age ?? "-"} exclude=${exclude?.length ?? 0}`);
      const story = pickStory({ theme, age, exclude });
      if (!story) {
        return {
          content: [
            {
              type: "text",
              text: "【故事库】暂时没有符合要求的故事呢。可以换个主题试试，或者让小智自己编一个温柔的小故事～",
            },
          ],
        };
      }
      return {
        content: [{ type: "text", text: `（${story.title}）\n${story.text}` }],
      };
    } catch (error) {
      const msg = getErrorMessage(error);
      logger.error(`讲故事失败: ${msg}`);
      return { content: [{ type: "text", text: `讲故事失败: ${msg}` }], isError: true };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info(`Story MCP 已启动（故事库: ${STORIES.length}）`);
}

main().catch((error) => {
  logger.error(`启动失败: ${getErrorMessage(error)}`);
  process.exit(1);
});

export default server;
