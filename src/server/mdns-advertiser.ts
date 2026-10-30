/**
 * mDNS (DNS-SD) 广播模块
 *
 * 在局域网内广播 `_xiaozhi._tcp.local` 服务，使小智设备（ESP32 固件）能够
 * 自动发现本服务端，无需在设备配网页手动填写 IP。
 *
 * 设备侧通过 `mdns_query("_xiaozhi", "_tcp")` 发现本服务，并从 TXT 中读取
 * websocket 路径（默认 `/ws`），从而拼出 `ws://<本机IP>:<port>/ws`。
 *
 * 注意：mDNS 依赖局域网组播，容器部署时必须使用 `--network host`，
 * 否则设备无法收到广播。
 */
import bonjour from "bonjour-hap";

let bonjourInstance: ReturnType<typeof bonjour> | null = null;

export interface XiaozhiMdnsOptions {
  /** 服务端口（即 WebServer 监听端口，websocket 与 OTA 共用） */
  port: number;
  /** websocket 路径，默认 /ws */
  path?: string;
  /** 服务显示名 */
  name?: string;
}

/**
 * 开始广播小智服务端。重复调用安全（先停止旧实例）。
 */
export function startXiaozhiMdnsAdvertiser(options: XiaozhiMdnsOptions): void {
  stopXiaozhiMdnsAdvertiser();

  const path = options.path ?? "/ws";
  const name = options.name ?? "Xiaozhi Server";

  try {
    bonjourInstance = bonjour();
    const service = bonjourInstance.publish({
      name,
      type: "xiaozhi",
      protocol: "tcp",
      port: options.port,
      txt: { path },
    });

    service.on("error", (err: Error) => {
      console.warn(`[MDNS] advertise error: ${err.message}`);
    });

    console.log(
      `[MDNS] advertising _xiaozhi._tcp.local on port ${options.port} (path=${path})`
    );
  } catch (err) {
    console.warn(`[MDNS] failed to start advertiser: ${String(err)}`);
  }
}

/**
 * 停止广播并释放资源。
 */
export function stopXiaozhiMdnsAdvertiser(): void {
  if (bonjourInstance) {
    const instance = bonjourInstance;
    bonjourInstance = null;
    try {
      instance.unpublishAll(() => {
        instance.destroy();
      });
    } catch (err) {
      console.warn(`[MDNS] failed to stop advertiser: ${String(err)}`);
    }
  }
}
