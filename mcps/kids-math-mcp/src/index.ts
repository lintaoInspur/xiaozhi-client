/**
 * Kids Math MCP Server —— 少儿数学启蒙小老师
 *
 * 按孩子年龄分级出算术题，并批改：
 *   - 3-5 岁：10 以内加减
 *   - 6-7 岁：20 以内加减
 *   - 8-10 岁：100 以内加减，偶尔表内乘法
 * 同一进程内保存已出的题目（按 quiz_id），等待孩子回答后批改。完全离线。
 *
 * 说明：本服务专注“出题+批改”，与仓库自带的 calculator-mcp（通用计算）互不冲突，
 * 可同时启用；若只想保留启蒙能力，可只启用本服务。
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const logger = {
  info: (m: string) => console.error(`[kids-math-mcp] INFO  ${m}`),
  error: (m: string) => console.error(`[kids-math-mcp] ERROR ${m}`),
};

function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

interface Quiz {
  text: string; // 口语化题目
  answer: number;
}

const quizzes = new Map<number, Quiz>();
let nextId = 1;

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generate(age?: number): Quiz {
  const a = age ?? 6;
  let text: string;
  let answer: number;

  if (a <= 5) {
    // 10 以内加减
    const x = randInt(0, 10);
    const y = randInt(0, 10);
    if (Math.random() < 0.5) {
      answer = x + y;
      text = `请听题：${x} 加 ${y} 等于多少？`;
    } else {
      const big = Math.max(x, y);
      const small = Math.min(x, y);
      answer = big - small;
      text = `请听题：${big} 减 ${small} 等于多少？`;
    }
  } else if (a <= 7) {
    // 20 以内加减
    const x = randInt(0, 20);
    const y = randInt(0, 20);
    if (Math.random() < 0.5) {
      answer = x + y;
      text = `请听题：${x} 加 ${y} 等于多少？`;
    } else {
      const big = Math.max(x, y);
      const small = Math.min(x, y);
      answer = big - small;
      text = `请听题：${big} 减 ${small} 等于多少？`;
    }
  } else {
    // 8-10 岁：100 以内加减，偶尔表内乘法
    const r = Math.random();
    if (r < 0.2) {
      const x = randInt(2, 9);
      const y = randInt(2, 9);
      answer = x * y;
      text = `请听题：${x} 乘 ${y} 等于多少？`;
    } else {
      const x = randInt(0, 100);
      const y = randInt(0, 100);
      if (Math.random() < 0.5) {
        answer = x + y;
        text = `请听题：${x} 加 ${y} 等于多少？`;
      } else {
        const big = Math.max(x, y);
        const small = Math.min(x, y);
        answer = big - small;
        text = `请听题：${big} 减 ${small} 等于多少？`;
      }
    }
  }
  return { text, answer };
}

const PRAISE = ["太棒啦，答对啦！", "真聪明，完全正确！", "厉害呀，算得又快又准！", "答对啦，你真是个小数学家！"];
const CHEER = ["没关系，再试一次就好～", "差一点点，加油！", "没关系，错一次就学会啦！"];

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

const server = new McpServer({
  name: "@xiaozhi-client/kids-math-mcp",
  version: "1.0.0",
});

server.tool(
  "math_quiz",
  "少儿数学启蒙出题。想让孩子练习算术时调用，按年龄出一道适龄加减（大童含乘法）题，返回 quiz_id 与口语化题目。" +
    "把题目念给孩子，等回答后用 check_math 批改。",
  {
    age: z.number().int().min(1).max(12).optional().describe("孩子年龄（岁），决定题目难度；不填默认 20 以内"),
  },
  async ({ age }) => {
    try {
      const q = generate(age);
      const id = nextId++;
      quizzes.set(id, q);
      logger.info(`出题 #${id} age=${age ?? "-"}`);
      return {
        content: [
          { type: "text", text: `${q.text}（quiz_id=${id}，孩子回答后请用 check_math 批改）` },
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
  "check_math",
  "批改孩子的算术回答。需要 math_quiz 返回的 quiz_id 和孩子的数字回答。",
  {
    quiz_id: z.number().int().describe("math_quiz 返回的题目编号"),
    answer: z.number().describe("孩子回答的数字"),
  },
  async ({ quiz_id, answer }) => {
    try {
      const q = quizzes.get(quiz_id);
      if (!q) {
        return {
          content: [{ type: "text", text: "这道题已经过期啦，请先调用 math_quiz 重新出一道吧。" }],
        };
      }
      if (answer === q.answer) {
        quizzes.delete(quiz_id);
        return { content: [{ type: "text", text: `${pick(PRAISE)} 要继续下一题吗？说“再来一道”就行～` }] };
      }
      return {
        content: [
          {
            type: "text",
            text: `${pick(CHEER)} 正确答案是 ${q.answer} 哦。要不要再挑战一道？`,
          },
        ],
      };
    } catch (error) {
      const msg = getErrorMessage(error);
      logger.error(`批改失败: ${msg}`);
      return { content: [{ type: "text", text: `批改失败: ${msg}` }], isError: true };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Kids Math MCP 已启动");
}

main().catch((error) => {
  logger.error(`启动失败: ${getErrorMessage(error)}`);
  process.exit(1);
});

export default server;
