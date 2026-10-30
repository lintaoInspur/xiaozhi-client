/**
 * Kids Encyclopedia MCP Server —— 离线少儿科普问答（“十万个为什么”）
 *
 * 当孩子提出“为什么…”“怎么…”类自然/科学/生活常识问题时，xiaozhi.me 的 Qwen 会自动
 * 调用本服务的 `kids_encyclopedia` 工具，在本地的少儿科普知识库中查找适龄、安全、准确的
 * 答案，并直接念给孩子听。知识库完全离线、内容经过筛选，适合儿童陪伴设备。
 *
 * 知识库内容见 ./knowledge.ts，扩充只需往 ENCYCLOPEDIA 数组加条目。
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ENCYCLOPEDIA, type EncyclopediaEntry } from "./knowledge.js";

const logger = {
  info: (m: string) => console.error(`[kids-encyclopedia-mcp] INFO  ${m}`),
  error: (m: string) => console.error(`[kids-encyclopedia-mcp] ERROR ${m}`),
};

function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** 归一化：去标点、去空白、转小写，便于关键词匹配 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[?？!！。.，,、；;：:""''（）()\[\]【】\s]/g, "");
}

/**
 * 计算一条知识库条目与问题的匹配得分。
 *  - 问题完整包含某个关键词，或关键词包含问题核心，均计 1 分（关键词越长权重越高）。
 *  - 问题与标准问法高度相似额外加分。
 */
function scoreEntry(entry: EncyclopediaEntry, q: string): number {
  let score = 0;
  const question = normalize(entry.question);
  const normQ = normalize(q);

  for (const kw of entry.keywords) {
    const k = normalize(kw);
    if (!k) continue;
    if (normQ.includes(k) || k.includes(normQ)) {
      // 关键词越长，命中越可信
      score += 1 + k.length * 0.1;
    }
  }
  // 标准问法被问题包含，强信号
  if (normQ.includes(question) || question.includes(normQ)) {
    score += 3;
  }
  return score;
}

interface MatchResult {
  found: boolean;
  entry?: EncyclopediaEntry;
  score: number;
}

function matchQuestion(question: string): MatchResult {
  let best: EncyclopediaEntry | undefined;
  let bestScore = 0;
  for (const entry of ENCYCLOPEDIA) {
    const s = scoreEntry(entry, question);
    if (s > bestScore) {
      bestScore = s;
      best = entry;
    }
  }
  // 阈值：至少命中一个有意义的关联才认为“找到”
  return { found: best !== undefined && bestScore >= 1, entry: best, score: bestScore };
}

const NOT_FOUND_HINT =
  "【本地少儿百科未收录】这个问题暂时不在我的离线知识库里。" +
  "建议：可以调用 web_search 工具联网查找，或者你用自己的知识，用孩子能听懂的话解释一下。";

const server = new McpServer({
  name: "@xiaozhi-client/kids-encyclopedia-mcp",
  version: "1.0.0",
});

server.tool(
  "kids_encyclopedia",
  "少儿科普问答（十万个为什么）。当孩子提出“为什么…”“怎么…”类自然、科学、生活常识问题时，" +
    "先用本工具在本地少儿科普知识库中查找适龄、安全、准确的答案并直接念给孩子听。" +
    "知识库离线可用、内容经过筛选，特别适合儿童陪伴设备。若本地库没有匹配内容，工具会明确说明，" +
    "此时可改用联网搜索或用自己的知识回答。",
  {
    question: z.string().describe("孩子提出的完整问题，例如“为什么天空是蓝色的”"),
  },
  async ({ question }) => {
    try {
      logger.info(`查询: "${question}"`);
      const result = matchQuestion(question);
      if (result.found && result.entry) {
        return {
          content: [{ type: "text", text: result.entry.answer }],
        };
      }
      logger.info(`未命中本地知识库（score=${result.score}）`);
      return {
        content: [{ type: "text", text: NOT_FOUND_HINT }],
      };
    } catch (error) {
      const msg = getErrorMessage(error);
      logger.error(`查询失败: ${msg}`);
      return {
        content: [{ type: "text", text: `查询失败: ${msg}` }],
        isError: true,
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info(`Kids Encyclopedia MCP 已启动（知识库条目: ${ENCYCLOPEDIA.length}）`);
}

main().catch((error) => {
  logger.error(`启动失败: ${getErrorMessage(error)}`);
  process.exit(1);
});

export default server;
