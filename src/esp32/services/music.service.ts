/**
 * 音乐中继服务（路径 B 核心）
 *
 * 职责：把 music-service 产出的 Opus 二进制帧，按小智 BinaryProtocol2 协议
 * 中继到已连接的 ESP32 设备，实现"盒子解码 Opus → 设备只播放"的低设备负载方案。
 *
 * 协议要点（来源：music_service.py / 固件 application.cc:668）：
 * - 播放前发送 {"type":"music","state":"start","name":...} 让固件进入 Speaking 并解码下行 Opus
 * - 每帧 Opus 由 music-service 用 wrap_opus() 包成 BinaryProtocol2（16 字节头 + payload）
 * - 播放结束/中断发送 {"type":"music","state":"stop"}（固件 StopMusic）
 *
 * 设备侧复用其已有的语音 Opus 解码通道，几乎不新增内存，适合 2MB PSRAM 等受限板。
 */

import type { IDeviceConnection, ILogger } from "../interfaces.js";
import { noopLogger } from "../interfaces.js";

export interface MusicServiceOptions {
  /** music-service 基础地址，默认 http://music-service:8800（同 docker 网络） */
  baseUrl?: string;
  /** 按 deviceId 取设备连接（由 ESP32DeviceManager 注入） */
  getConnection?: (deviceId: string) => IDeviceConnection | undefined;
  logger?: ILogger;
}

interface ActivePlayback {
  abort: () => void;
}

export class MusicService {
  private readonly baseUrl: string;
  private getConnection?: MusicServiceOptions["getConnection"];
  private readonly logger: ILogger;
  private readonly active = new Map<string, ActivePlayback>();

  constructor(options: MusicServiceOptions = {}) {
    this.baseUrl = options.baseUrl ?? "http://music-service:8800";
    this.getConnection = options.getConnection;
    this.logger = options.logger ?? noopLogger;
  }

  /** 注入设备连接获取函数（通常由 WebServer 在构造时传入） */
  setGetConnection(
    fn: NonNullable<MusicServiceOptions["getConnection"]>
  ): void {
    this.getConnection = fn;
  }

  /** 开始播放：拉取 music-service 的 Opus 帧流并中继到设备 */
  async play(deviceId: string, url: string, name = ""): Promise<void> {
    const connection = this.getConnection?.(deviceId);
    if (!connection) {
      this.logger.error(`[Music] 无设备连接: ${deviceId}`);
      return;
    }
    // 先停掉同设备已有播放，避免叠加
    this.stop(deviceId);

    const controller = new AbortController();
    this.active.set(deviceId, { abort: () => controller.abort() });

    // 1) 通知固件进入音乐状态（application.cc:668）
    await connection.send({
      type: "music",
      state: "start",
      name,
      session_id: connection.getSessionId(),
    });

    // 2) 拉取 BP2 帧流（每帧 = 16 字节头 + Opus 包）
    const streamUrl = `${this.baseUrl}/opus_stream?url=${encodeURIComponent(url)}`;
    let res: Response;
    try {
      res = await fetch(streamUrl, { signal: controller.signal });
    } catch (err) {
      this.logger.error(`[Music] 拉流失败: ${streamUrl}`, err);
      await this.end(connection);
      return;
    }
    if (!res.ok || !res.body) {
      this.logger.error(`[Music] opus_stream 异常: ${res.status}`);
      await this.end(connection);
      return;
    }

    // 3) 从字节流切出 BP2 帧，逐帧下发，按 60ms 实时节奏
    const reader = res.body.getReader();
    let buf = new Uint8Array(0);
    let ts = 0;
    const HDR = 16; // BinaryProtocol2 头长度
    const push = (c: Uint8Array) => {
      const n = new Uint8Array(buf.length + c.length);
      n.set(buf);
      n.set(c, buf.length);
      buf = n;
    };
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) push(value);
        while (buf.length >= HDR) {
          // payload_size 位于字节 12–15（大端 uint32）
          const payloadSize =
            ((buf[12] << 24) | (buf[13] << 16) | (buf[14] << 8) | buf[15]) >>>
            0;
          const total = HDR + payloadSize;
          if (buf.length < total) break; // 帧未收全，等下一 chunk
          const payload = buf.subarray(HDR, total);
          buf = buf.subarray(total);
          await connection.sendBinaryProtocol2(payload, ts);
          ts += 60;
          await new Promise((r) => setTimeout(r, 60));
        }
      }
    } catch (err) {
      this.logger.warn(`[Music] 流结束/中断: ${deviceId}`, err);
    } finally {
      this.active.delete(deviceId);
      await this.end(connection);
    }
  }

  /** 停止播放（中断拉流并通知固件） */
  stop(deviceId: string): void {
    this.active.get(deviceId)?.abort();
    this.active.delete(deviceId);
    const connection = this.getConnection?.(deviceId);
    connection?.send({ type: "music", state: "stop" }).catch(() => {});
  }

  private async end(connection: IDeviceConnection): Promise<void> {
    try {
      await connection.send({ type: "music", state: "stop" });
    } catch {
      /* 忽略：设备可能已断开 */
    }
  }
}
