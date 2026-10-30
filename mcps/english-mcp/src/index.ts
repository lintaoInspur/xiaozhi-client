/**
 * English MCP Server —— 离线少儿英语启蒙单词卡
 *
 * 当孩子学英语、认单词时，xiaozhi.me 的 Qwen 调用本服务的 `english_card` 工具，
 * 按主题取若干单词卡（英文 + 音标 + 中文 + emoji），直接念给孩子听并带读。
 * 完全离线、按主题分类、内容适龄。
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { WORDS, THEMES, type Word } from "./data.js";

const logger = {
  info: (m: string) => console.error(`[english-mcp] INFO  ${m}`),
  error: (m: string) => console.error(`[english-mcp] ERROR ${m}`),
};

function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function formatCard(w: Word): string {
  return `${w.emoji} ${w.en} ${w.phonetic} —— ${w.zh}`;
}

function pickN<T>(arr: T[], n: number): T[] {
  const copy = arr.slice();
  const out: T[] = [];
  while (out.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

const server = new McpServer({
  name: "@xiaozhi-client/english-mcp",
  version: "1.0.0",
});

server.tool(
  "english_card",
  "少儿英语启蒙单词卡。当孩子想学英语、认单词，或指定主题（颜色/动物/数字/水果/身体/食物）时调用。" +
    "返回若干单词卡（emoji + 英文 + 音标 + 中文），念给孩子听并鼓励跟读。不指定主题则随机选一个。",
  {
    theme: z
      .enum(["颜色", "动物", "数字", "水果", "身体", "食物"])
      .optional()
      .describe("单词主题；不填随机一个主题"),
    count: z
      .number()
      .int()
      .min(1)
      .max(8)
      .default(4)
      .describe("返回单词数量（1-8，默认 4）"),
  },
  async ({ theme, count }) => {
    try {
      const t = theme ?? THEMES[Math.floor(Math.random() * THEMES.length)];
      const list = WORDS[t] ?? [];
      if (!list.length) {
        return {
          content: [
            { type: "text", text: `暂时没有“${t}”主题的单词，可选主题：${THEMES.join("、")}。` },
          ],
        };
      }
      const cards = pickN(list, Math.min(count, list.length));
      logger.info(`取单词卡: theme=${t} count=${cards.length}`);
      const body = cards.map(formatCard).join("\n");
      return {
        content: [
          {
            type: "text",
            text:
              `【英语单词·${t}】\n${body}\n\n` +
              `可以让孩子跟着念一遍，或者你说“考考我”，我来出题～`,
          },
        ],
      };
    } catch (error) {
      const msg = getErrorMessage(error);
      logger.error(`取单词卡失败: ${msg}`);
      return { content: [{ type: "text", text: `取单词卡失败: ${msg}` }], isError: true };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info(`English MCP 已启动（主题: ${THEMES.length}）`);
}

main().catch((error) => {
  logger.error(`启动失败: ${getErrorMessage(error)}`);
  process.exit(1);
});

export default server;
