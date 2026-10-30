# 内网 OTA 检查服务器（极简版）

让 XiaoZhi ESP32 固件在**纯内网**完成 OTA 升级，无需公网、无需改 xiaozhi-client 或固件代码。
零依赖，仅用 Python3 标准库，和同目录的 `music_service.py` 同栈。

## 它做什么

1. 在 `OTA_PATH`（`/xiaozhi/ota/`）响应设备激活/检测请求，返回 JSON：
   - `websocket.url` —— 告诉设备连哪个 xiaozhi-client（音频服务）
   - `firmware.{version,url}` —— 新固件版本与下载地址；版本比设备新（或 `force=1`）时设备自动下载烧写重启
2. 在 `BIN_PATH`（`/xiaozhi.bin`）托管 `FIRMWARE_FILE` 指定的固件镜像。

## 快速使用

```bash
# 1) 把构建产物里的应用镜像放好（注意是 build/xiaozhi.bin，不是 merged-binary.bin）
cp /path/to/build/xiaozhi.bin ./xiaozhi.bin

# 2) 启动服务
FIRMWARE_VERSION=2.5.8 \
FIRMWARE_FILE=./xiaozhi.bin \
WEBSOCKET_URL=ws://192.168.1.10:3000/ws \
OTA_PORT=8080 \
python3 ota-server.py
```

## 让设备指向它

把设备的 `ota_url` 设为 `http://<本机内网IP>:8080/xiaozhi/ota/`，重启设备即触发检测与升级：

- **编译期**：`idf.py menuconfig` → `Xiaozhi Assistant` → `Default OTA URL`，或 `sdkconfig` 里设 `CONFIG_OTA_URL`；
- **运行期**：写 NVS 命名空间 `wifi` 的 `ota_url`（不改代码重烧也行）。

> 设备默认 `ota_url` 是官方 `https://api.tenclass.net/xiaozhi/ota/`，替换成你的内网地址即脱离公网。

## 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `OTA_PORT` | `8080` | 监听端口 |
| `FIRMWARE_VERSION` | `0.0.0` | 下发的固件版本号，**需高于设备当前版本才升级** |
| `FIRMWARE_FILE` | `./xiaozhi.bin` | 要托管的固件镜像路径 |
| `WEBSOCKET_URL` | 空 | **必须显式设置**为你的 xiaozhi-client，如 `ws://192.168.1.10:3000/ws` |
| `OTA_FORCE` | `0` | 设为 `1` 可强制升级（忽略版本比较） |
| `BIN_PATH` | `/xiaozhi.bin` | 固件下载 URL 路径 |
| `OTA_PATH` | `/xiaozhi/ota/` | 设备 POST 的 OTA 接口路径 |

## 开机自启（systemd）

参考 `ota-server.service`，改好路径/参数后：

```bash
sudo cp ota-server.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ota-server
```

## 重要提醒

- OTA 用的是**应用镜像** `build/xiaozhi.bin`（仅应用分区）。`releases/*.zip` 里的
  `merged-binary.bin` 是给 `esptool` 初次烧录 bootloader+分区表+app 的一体包，**不能直接喂 OTA**，
  否则 `esp_ota_end` 校验失败。
- 每个板子的 `name`（OTA 上报身份）保持唯一、走独立升级通道，避免 OTA 把自定义固件覆盖成官方同型号固件。
