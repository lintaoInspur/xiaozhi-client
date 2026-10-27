/**
 * 音乐控制处理器
 *
 * 暴露 HTTP 接口，把"播放 / 停止"请求转给 MusicService，
 * 再由 MusicService 把 Opus 帧中继到设备。属于路径 B 的桥接薄层。
 */

import type { ESP32DeviceManager } from "@/esp32";
import type { Context } from "hono";
import type { MusicService } from "../../esp32/services/music.service.js";
import type { AppContext } from "../types/hono.context.js";
import { BaseHandler } from "./base.handler.js";

export class MusicHandler extends BaseHandler {
  constructor(
    private readonly manager: ESP32DeviceManager,
    private readonly music: MusicService
  ) {
    super();
  }

  /** 单设备场景：取第一个已连接设备 */
  private firstDeviceId(): string | undefined {
    return this.manager.getConnectedDeviceIds()[0];
  }

  /**
   * 播放音乐
   * POST /api/music/play
   * 请求体：{ url: string, name?: string, deviceId?: string }
   */
  async play(c: Context<AppContext>): Promise<Response> {
    const body = await this.parseJsonBody<{
      url?: string;
      name?: string;
      deviceId?: string;
    }>(c, "请求体格式错误").catch(
      () =>
        ({}) as {
          url?: string;
          name?: string;
          deviceId?: string;
        }
    );
    const url = body?.url;
    const name = body?.name ?? "";
    if (!url) {
      return c.fail("MISSING_URL", "缺少 url 字段", undefined, 400);
    }
    const deviceId = body?.deviceId ?? this.firstDeviceId();
    if (!deviceId) {
      return c.fail("NO_DEVICE", "无已连接设备", undefined, 503);
    }
    await this.music.play(deviceId, url, name);
    return c.json({ status: "playing", url, deviceId });
  }

  /**
   * 停止播放
   * POST /api/music/stop
   * 请求体：{ deviceId?: string }
   */
  async stop(c: Context<AppContext>): Promise<Response> {
    const body = await this.parseJsonBody<{ deviceId?: string }>(
      c,
      "请求体格式错误"
    ).catch(() => ({}) as { deviceId?: string });
    const deviceId = body?.deviceId ?? this.firstDeviceId();
    if (deviceId) {
      this.music.stop(deviceId);
    }
    return c.json({ status: "stopped", deviceId });
  }
}
