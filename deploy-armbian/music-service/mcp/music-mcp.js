#!/usr/bin/env node
/**
 * xiaozhi-music MCP（stdio）：把“播放/停止/曲库”意图转成 music-service 的 HTTP 调用。
 * 运行在 xiaozhi-client 容器内，无需第三方依赖（原生 JSON-RPC 最小实现）。
 *
 * 环境变量：
 *   MUSIC_SERVICE_URL   曲库转码服务，默认 http://music-service:8800
 */
const readline = require("node:readline");

const MUSIC = (process.env.MUSIC_SERVICE_URL || "http://music-service:8800").replace(/\/+$/, "");

async function requestJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let body = text;
  try {
    body = JSON.parse(text);
  } catch {
    // 非 JSON 原样返回
  }
  return { status: res.status, body };
}

async function listSongs() {
  const { status, body } = await requestJson(`${MUSIC}/list`);
  if (status !== 200 || !body || !Array.isArray(body.files)) {
    throw new Error(`曲库读取失败 status=${status}`);
  }
  return body.files;
}

/** 把用户说的歌名解析成 /music/<相对路径> */
async function resolveSong(songName, artistName) {
  const raw = String(songName || "").trim();
  const artist = String(artistName || "").trim().toLowerCase();
  if (!raw && !artist) return null;
  if (raw.startsWith("/music/")) return raw;

  const files = await listSongs();
  const q = raw.toLowerCase();
  const base = (f) => f.split("/").pop().toLowerCase();
  const stripExt = (s) => s.replace(/\.[^./]+$/, "");

  // 1) 完整相对路径 / 文件名精确匹配
  const exact = files.find((f) => f.toLowerCase() === q || base(f) === q);
  if (exact) return `/music/${exact}`;

  // 2) 文件名包含歌名（可选再限定歌手）
  const hits = files.filter((f) => {
    const name = base(f);
    const okName = q ? name.includes(q) || stripExt(name).includes(stripExt(q)) : false;
    const okArtist = artist ? name.includes(artist) : true;
    return okName && okArtist;
  });
  if (hits.length > 0) return `/music/${hits[0]}`;
  return null;
}

async function handleCall(name, args) {
  if (name === "play_song") {
    const songName = args.song_name || args.song || args.name || "";
    const artistName = args.artist_name || args.artist || "";
    const url = await resolveSong(songName, artistName);
    if (!url) {
      return {
        isError: true,
        content: [{ type: "text", text: `未在本地曲库找到：${songName || artistName}` }],
      };
    }
    // playback is streamed by music-service itself to the device's music channel
    const { status, body } = await requestJson(`${MUSIC}/play`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, name: songName || artistName || url }),
    });
    if (status !== 200) {
      return {
        isError: true,
        content: [{ type: "text", text: `播放失败：${JSON.stringify(body)}` }],
      };
    }
    return { content: [{ type: "text", text: `开始播放：${url}` }] };
  }

  if (name === "stop_music") {
    await requestJson(`${MUSIC}/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    return { content: [{ type: "text", text: "已停止播放" }] };
  }

  if (name === "list_songs") {
    const files = await listSongs();
    return { content: [{ type: "text", text: files.join("\n") }] };
  }

  return { isError: true, content: [{ type: "text", text: `未知工具：${name}` }] };
}

const TOOLS = [
  {
    name: "play_song",
    description: "播放本地曲库中的歌曲。用户说“播放某首歌”时调用，song_name 传歌名（可只给部分关键字）。",
    inputSchema: {
      type: "object",
      properties: {
        song_name: { type: "string", description: "歌曲名或其中的关键字" },
        artist_name: { type: "string", description: "歌手名，可选" },
      },
      required: ["song_name"],
    },
  },
  {
    name: "stop_music",
    description: "停止当前播放的音乐。",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_songs",
    description: "列出本地曲库全部歌曲（含子目录相对路径）。",
    inputSchema: { type: "object", properties: {} },
  },
];

function reply(msg) {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });
rl.on("line", async (line) => {
  const text = line.trim();
  if (!text) return;
  let msg;
  try {
    msg = JSON.parse(text);
  } catch {
    return;
  }
  const id = msg.id;
  const method = msg.method;
  if (method === undefined) return; // 客户端通知（initialized 等），无需响应

  try {
    if (method === "initialize") {
      reply({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "xiaozhi-music", version: "1.0.0" },
        },
      });
      return;
    }
    if (method === "ping") {
      reply({ jsonrpc: "2.0", id, result: {} });
      return;
    }
    if (method === "tools/list") {
      reply({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
      return;
    }
    if (method === "tools/call") {
      const params = msg.params || {};
      const result = await handleCall(params.name, params.arguments || {});
      reply({ jsonrpc: "2.0", id, result });
      return;
    }
    reply({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  } catch (err) {
    reply({
      jsonrpc: "2.0",
      id,
      result: {
        isError: true,
        content: [{ type: "text", text: `工具执行失败：${err.message}` }],
      },
    });
  }
});
