/**
 * Poems MCP Server —— 离线少儿古诗 / 儿歌 / 绕口令
 *
 * 当孩子要背诗、唱儿歌、练绕口令，或指定了类型/主题时，xiaozhi.me 的 Qwen 调用本服务的
 * `get_poem` 工具，从本地内容库挑一条适龄内容，直接念出来。完全离线、内容经典安全。
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { POEMS, type Poem, type PoemType } from "./data.js";

const logger = {
  info: (m: string) => console.error(`[poems-mcp] INFO  ${m}`),
  error: (m: string) => console.error(`[poems-mcp] ERROR ${m}`),
};

function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function normalize(t: string): string {
  return t.toLowerCase().replace(/\s+/g, "");
}

function pickPoem(opts: { type?: PoemType; keyword?: string; age?: number }): Poem | undefined {
  let pool = POEMS.slice();
  if (opts.type) pool = pool.filter((p) => p.type === opts.type);
  if (typeof opts.age === "number") {
    const aged = pool.filter((p) => opts.age! >= p.age);
    if (aged.length) pool = aged;
  }
  if (opts.keyword) {
    const k = normalize(opts.keyword);
    const matched = pool.filter(
      (p) => normalize(p.title).includes(k) || normalize(p.content).includes(k),
    );
    if (matched.length) pool = matched;
  }
  if (!pool.length) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}

const server = new McpServer({
  name: "@xiaozhi-client/poems-mcp",
  version: "1.0.0",
});

server.tool(
  "get_poem",
  "少儿诗词/儿歌/绕口令。当孩子要背古诗、唱儿歌、练绕口令，或指定类型与主题时调用。" +
    "从本地离线内容库挑一条适龄内容直接念出。type 可选：古诗/儿歌/绕口令；keyword 可按标题或内容关键词（如“月亮”“春天”）检索。",
  {
    type: z.enum(["古诗", "儿歌", "绕口令"]).optional().describe("内容类型；不填则随机一种"),
    keyword: z.string().optional().describe("主题关键词，如“月亮”“春天”“动物”"),
    age: z.number().int().min(1).max(12).optional().describe("孩子年龄（岁），用于按适龄筛选"),
  },
  async ({ type, keyword, age }) => {
    try {
      logger.info(`取内容: type=${type ?? "-"} keyword=${keyword ?? "-"} age=${age ?? "-"}`);
      const poem = pickPoem({ type, keyword, age });
      if (!poem) {
        return {
          content: [
            {
              type: "text",
              text: "【内容库】暂时没有符合要求的诗词儿歌呢。可以换个类型或关键词试试～",
            },
          ],
        };
      }
      const head = poem.author ? `《${poem.title}》${poem.author}` : `《${poem.title}》`;
      return { content: [{ type: "text", text: `${head}\n${poem.content}` }] };
    } catch (error) {
      const msg = getErrorMessage(error);
      logger.error(`取内容失败: ${msg}`);
      return { content: [{ type: "text", text: `取内容失败: ${msg}` }], isError: true };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info(`Poems MCP 已启动（内容: ${POEMS.length}）`);
}

main().catch((error) => {
  logger.error(`启动失败: ${getErrorMessage(error)}`);
  process.exit(1);
});

export default server;
