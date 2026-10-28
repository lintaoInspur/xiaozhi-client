/**
 * MCP Search Server —— 免费联网搜索
 *
 * 支持的后端（通过环境变量 SEARCH_BACKEND 切换，默认 duckduckgo）：
 *   - duckduckgo：默认，免 API key，直接爬 html.duckduckgo.com（无需任何配置）
 *   - searxng   ：自托管 SearXNG 实例，需设置 SEARXNG_URL
 *   - tavily    ：Tavily 搜索，需设置 TAVILY_API_KEY（有免费额度）
 *   - brave     ：Brave 搜索，需设置 BRAVE_API_KEY（有免费额度）
 *
 * 仅在 xiaozhi-client 的 mcpServers 中配置本服务后，
 * 语音聊天时 xiaozhi.me 的 Qwen 即可自动调用 web_search 工具联网搜索。
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const DEFAULT_BACKEND = (process.env.SEARCH_BACKEND || "duckduckgo")
  .toLowerCase()
  .trim();

const logger = {
  info: (m: string) => console.error(`[search-mcp] INFO  ${m}`),
  error: (m: string) => console.error(`[search-mcp] ERROR ${m}`),
};

function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchText(url: string, headers: Record<string, string> = {}): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; xiaozhi-search-mcp/1.0)", ...headers },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new Error(`请求失败: HTTP ${res.status} (${url})`);
  }
  return res.text();
}

/** DuckDuckGo HTML（免 key） */
async function searchDuckDuckGo(query: string, limit: number): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const html = await fetchText(url);

  const decodeDdgUrl = (href: string): string => {
    const normalized = href.startsWith("//") ? `https:${href}` : href;
    try {
      const u = new URL(normalized, "https://duckduckgo.com");
      const uddg = u.searchParams.get("uddg");
      return uddg ? decodeURIComponent(uddg) : u.href;
    } catch {
      return href;
    }
  };

  const titleRe = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  const snippetRe = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  const titles: { title: string; url: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = titleRe.exec(html)) !== null) {
    titles.push({ title: stripHtml(m[2]), url: decodeDdgUrl(m[1]) });
  }
  const snippets: string[] = [];
  while ((m = snippetRe.exec(html)) !== null) {
    snippets.push(stripHtml(m[1]));
  }

  return titles.slice(0, limit).map((t, i) => ({
    title: t.title,
    url: t.url,
    snippet: snippets[i] ?? "",
  }));
}

/** 自托管 SearXNG（JSON 输出） */
async function searchSearXNG(query: string, limit: number): Promise<SearchResult[]> {
  const base = (process.env.SEARXNG_URL || "").replace(/\/$/, "");
  if (!base) throw new Error("使用 searxng 后端需设置环境变量 SEARXNG_URL");
  const url = `${base}/search?q=${encodeURIComponent(query)}&format=json`;
  const text = await fetchText(url);
  const data = JSON.parse(text) as { results?: { title?: string; url?: string; content?: string }[] };
  return (data.results || []).slice(0, limit).map((r) => ({
    title: r.title || "",
    url: r.url || "",
    snippet: r.content || "",
  }));
}

/** Tavily（需 TAVILY_API_KEY） */
async function searchTavily(query: string, limit: number): Promise<SearchResult[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error("使用 tavily 后端需设置环境变量 TAVILY_API_KEY");
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: key, query, max_results: limit, search_depth: "basic" }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Tavily 请求失败: HTTP ${res.status}`);
  const data = (await res.json()) as { results?: { title?: string; url?: string; content?: string }[] };
  return (data.results || []).map((r) => ({
    title: r.title || "",
    url: r.url || "",
    snippet: r.content || "",
  }));
}

/** Brave（需 BRAVE_API_KEY） */
async function searchBrave(query: string, limit: number): Promise<SearchResult[]> {
  const key = process.env.BRAVE_API_KEY;
  if (!key) throw new Error("使用 brave 后端需设置环境变量 BRAVE_API_KEY");
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
    query,
  )}&count=${limit}`;
  const text = await fetchText(url, { Accept: "application/json", "X-Subscription-Token": key });
  const data = JSON.parse(text) as {
    web?: { results?: { title?: string; url?: string; description?: string }[] };
  };
  return (data.web?.results || []).map((r) => ({
    title: r.title || "",
    url: r.url || "",
    snippet: r.description || "",
  }));
}

async function doSearch(
  query: string,
  limit: number,
  backendOverride?: string,
): Promise<SearchResult[]> {
  const backend = (backendOverride || DEFAULT_BACKEND).toLowerCase();
  switch (backend) {
    case "duckduckgo":
    case "ddg":
      return searchDuckDuckGo(query, limit);
    case "searxng":
    case "searx":
      return searchSearXNG(query, limit);
    case "tavily":
      return searchTavily(query, limit);
    case "brave":
      return searchBrave(query, limit);
    default:
      throw new Error(
        `不支持的搜索后端: ${backend}（可选: duckduckgo / searxng / tavily / brave）`,
      );
  }
}

function formatResults(results: SearchResult[]): string {
  if (results.length === 0) return "未找到相关搜索结果。";
  return results
    .map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`)
    .join("\n\n");
}

const server = new McpServer({
  name: "@xiaozhi-client/search-mcp",
  version: "1.0.0",
});

server.tool(
  "web_search",
  "联网搜索网页，返回与查询相关的标题、链接和摘要。当用户需要最新信息、事实核查或实时资讯时使用。",
  {
    query: z.string().describe("搜索关键词或问题"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .default(5)
      .describe("返回结果数量（1-20，默认 5）"),
    backend: z
      .string()
      .optional()
      .describe("临时覆盖默认搜索后端（duckduckgo/searxng/tavily/brave）"),
  },
  async ({ query, limit, backend }) => {
    try {
      logger.info(`搜索: "${query}" (backend=${backend || DEFAULT_BACKEND})`);
      const results = await doSearch(query, limit, backend);
      return {
        content: [{ type: "text", text: formatResults(results) }],
      };
    } catch (error) {
      const msg = getErrorMessage(error);
      logger.error(`搜索失败: ${msg}`);
      return {
        content: [{ type: "text", text: `搜索失败: ${msg}` }],
        isError: true,
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info(`Search MCP 已启动（默认后端: ${DEFAULT_BACKEND}）`);
}

main().catch((error) => {
  logger.error(`启动失败: ${getErrorMessage(error)}`);
  process.exit(1);
});

export default server;
