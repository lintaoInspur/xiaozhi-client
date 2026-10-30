/**
 * Riddle MCP Server —— 离线少儿猜谜语 / 脑筋急转弯
 *
 * 多轮互动流程（同一 MCP 进程内保持状态）：
 *   1. 调用 get_riddle 出题，返回 riddle_id 与谜面（不返回答案，避免剧透）。
 *   2. 孩子口头回答，Qwen 调用 check_answer(riddle_id, 孩子的回答) 判对错。
 *   3. 答对给鼓励；答错给提示，可让孩子再猜一次。
 * 全部离线、内容适龄。
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { RIDDLES, type Riddle, type RiddleType } from "./data.js";

const logger = {
  info: (m: string) => console.error(`[riddle-mcp] INFO  ${m}`),
  error: (m: string) => console.error(`[riddle-mcp] ERROR ${m}`),
};

function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function normalize(t: string): string {
  return t.toLowerCase().replace(/[?？!！。.，,、；;：:""''（）()\[\]【】\s]/g, "");
}

interface ActiveRiddle {
  question: string;
  answer: string;
  hint: string;
  type: RiddleType;
}

// 内存中保存已出的谜面，等待孩子回答（单设备顺序交互足够）
const active = new Map<number, ActiveRiddle>();
let nextId = 1;

function pickRiddle(category?: RiddleType): Riddle {
  const pool = category ? RIDDLES.filter((r) => r.type === category) : RIDDLES;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** 宽松判题：双向包含即算对，兼容口语/同义表达 */
function isCorrect(childAnswer: string, correct: string): boolean {
  const a = normalize(childAnswer);
  const b = normalize(correct);
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

const server = new McpServer({
  name: "@xiaozhi-client/riddle-mcp",
  version: "1.0.0",
});

server.tool(
  "get_riddle",
  "少儿猜谜语/脑筋急转弯。想和孩子玩互动猜谜时调用，出一道题并给出 riddle_id。" +
    "把谜面念给孩子听，不要念答案。等孩子回答后，用 check_answer 判断。",
  {
    category: z
      .enum(["riddle", "brain"])
      .optional()
      .describe("riddle=传统谜语，brain=脑筋急转弯；不填随机出一道"),
  },
  async ({ category }) => {
    try {
      const r = pickRiddle(category);
      const id = nextId++;
      active.set(id, { question: r.question, answer: r.answer, hint: r.hint, type: r.type });
      logger.info(`出题 #${id} (${r.type})`);
      const kind = r.type === "riddle" ? "谜语" : "脑筋急转弯";
      return {
        content: [
          {
            type: "text",
            text:
              `【${kind}】${r.question}\n` +
              `（请让孩子猜，然后把孩子的回答用 check_answer 工具、riddle_id=${id} 交给我判断。不要直接告诉孩子答案。）`,
          },
        ],
      };
    } catch (error) {
      const msg = getErrorMessage(error);
      logger.error(`出题失败: ${msg}`);
      return { content: [{ type: "text", text: `出题失败: ${msg}` }], isError: true };
    }
  },
);

server.tool(
  "check_answer",
  "判断孩子对某道谜语/脑筋急转弯的回答是否正确。需要 get_riddle 返回的 riddle_id 和孩子的原话回答。",
  {
    riddle_id: z.number().int().describe("get_riddle 返回的谜题编号"),
    answer: z.string().describe("孩子口头回答的原话，如“是西瓜”"),
  },
  async ({ riddle_id, answer }) => {
    try {
      const r = active.get(riddle_id);
      if (!r) {
        return {
          content: [
            { type: "text", text: "这道谜题已经过期啦，请先调用 get_riddle 重新出一道题吧。" },
          ],
        };
      }
      if (isCorrect(answer, r.answer)) {
        active.delete(riddle_id);
        return {
          content: [
            {
              type: "text",
              text: `答对啦！真聪明！答案就是“${r.answer}”。要再来一道吗？可以说“再来一个”～`,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text:
              `还差一点点哦～小提示：${r.hint}\n` +
              `让孩子再想想，或者你说“告诉我答案”，我就公布正确答案。`,
          },
        ],
      };
    } catch (error) {
      const msg = getErrorMessage(error);
      logger.error(`判题失败: ${msg}`);
      return { content: [{ type: "text", text: `判题失败: ${msg}` }], isError: true };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info(`Riddle MCP 已启动（题库: ${RIDDLES.length}）`);
}

main().catch((error) => {
  logger.error(`启动失败: ${getErrorMessage(error)}`);
  process.exit(1);
});

export default server;
