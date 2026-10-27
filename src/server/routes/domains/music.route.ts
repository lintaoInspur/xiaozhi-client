/**
 * 音乐路由模块
 * 暴露音乐控制 API 路由（POST /api/music/play、/api/music/stop）
 */

import type { Context } from "hono";
import type { HandlerDependencies } from "../../routes/types.js";

const createMusicHandler = (
  method: (
    handler: NonNullable<HandlerDependencies["musicHandler"]>,
    c: Context
  ) => Promise<Response>
) => {
  return async (c: Context) => {
    const dependencies = c.get("dependencies") as HandlerDependencies;
    const handler = dependencies.musicHandler;
    if (!handler) {
      return c.json({ error: "Music service not available" }, 503);
    }
    return method(handler, c);
  };
};

export const musicRoutes = [
  {
    method: "POST",
    path: "/api/music/play",
    handler: createMusicHandler((handler, c) => handler.play(c)),
  },
  {
    method: "POST",
    path: "/api/music/stop",
    handler: createMusicHandler((handler, c) => handler.stop(c)),
  },
];
