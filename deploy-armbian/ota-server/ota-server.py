#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
极简内网 OTA 检查服务器（XiaoZhi ESP32 固件）

原理
----
ESP32 固件在激活/开机时会向编译期或运行期配置的 `ota_url` 发一个 POST（带设备信息），
期望得到一段 JSON，其中：
  - websocket.url : 告诉设备去哪个地址连音频服务（你的 xiaozhi-client）
  - firmware      : { version, url } 新固件版本与下载地址；
                    当 version 比设备当前版本更新（或 force=1）时，设备会自动下载、烧写、重启

本服务同时：
  1. 在 OTA_PATH（默认 /xiaozhi/ota/）响应上述 JSON；
  2. 在 BIN_PATH（默认 /xiaozhi.bin）托管 FIRMWARE_FILE 指定的固件镜像。

依赖：仅 Python3 标准库，无需 pip 安装。

用法
----
  FIRMWARE_VERSION=2.5.8 \
  FIRMWARE_FILE=./xiaozhi.bin \
  WEBSOCKET_URL=ws://192.168.1.10:3000/ws \
  OTA_PORT=8080 \
  python3 ota-server.py

然后把设备的 ota_url 指到本服务：
  http://192.168.1.10:8080/xiaozhi/ota/
（改编译期 CONFIG_OTA_URL，或写 NVS 的 wifi.ota_url），重启设备即触发检测与升级。

注意
----
- FIRMWARE_VERSION 必须高于设备当前版本才会升级；想强推同版本请用 OTA_FORCE=1。
- WEBSOCKET_URL 必须显式设置并指向你的 xiaozhi-client（端口通常是 3000），不要依赖自动推导，
  因为 OTA 服务端口（8080）和音频 WebSocket 端口（3000）不同。
- 固件镜像请用构建产物里的「应用镜像」build/xiaozhi.bin（仅应用分区），
  不是 releases 里的 merged-binary.bin（那是给 esptool 初次烧录的一体包，不能直接 OTA）。
"""

import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

# ----------------------------- 配置（可经环境变量覆盖） -----------------------------
PORT = int(os.environ.get("OTA_PORT", "8080"))
FIRMWARE_VERSION = os.environ.get("FIRMWARE_VERSION", "0.0.0")
FIRMWARE_FILE = os.environ.get("FIRMWARE_FILE", "./xiaozhi.bin")
WEBSOCKET_URL = os.environ.get("WEBSOCKET_URL", "")
FORCE = int(os.environ.get("OTA_FORCE", "0"))
BIN_PATH = os.environ.get("BIN_PATH", "/xiaozhi.bin")          # 固件下载 URL 路径
OTA_PATH = os.environ.get("OTA_PATH", "/xiaozhi/ota/")         # 设备 POST 的 OTA 路径


def build_payload(host_header):
    ws_url = WEBSOCKET_URL
    if not ws_url:
        # 兜底：用 Host 推导，但端口多半不对，仅作降级，生产请显式设置 WEBSOCKET_URL
        h = host_header or f"localhost:{PORT}"
        ws_url = f"ws://{h}/ws"
        sys.stderr.write(
            "[ota] 警告：未设置 WEBSOCKET_URL，已用 Host 推导（端口可能不对），请显式配置。\n"
        )

    payload = {
        "websocket": {"url": ws_url, "version": 2},
        "server_time": {
            "timestamp": int(time.time() * 1000),
            # 分钟、东时区为正（与中国时区一致）
            "timezone_offset": -time.timezone // 60,
        },
    }

    bin_exists = os.path.isfile(FIRMWARE_FILE)
    if bin_exists and FIRMWARE_VERSION != "0.0.0":
        bin_url = f"http://{host_header}{BIN_PATH}" if host_header else ""
        payload["firmware"] = {
            "version": FIRMWARE_VERSION,
            "url": bin_url,
            "force": FORCE,
        }
    else:
        # 没有固件文件或未设版本 -> 不推送升级，只下发 websocket 配置
        payload["firmware"] = {"version": "", "url": "", "force": 0}
        if not bin_exists:
            sys.stderr.write(f"[ota] 未找到固件文件 {FIRMWARE_FILE}，暂不推送升级。\n")

    return payload


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, obj, code=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _serve_bin(self):
        if not os.path.isfile(FIRMWARE_FILE):
            self.send_error(404, "firmware not found")
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/octet-stream")
        self.send_header("Content-Length", str(os.path.getsize(FIRMWARE_FILE)))
        self.end_headers()
        with open(FIRMWARE_FILE, "rb") as f:
            while True:
                chunk = f.read(64 * 1024)
                if not chunk:
                    break
                self.wfile.write(chunk)

    def _is_ota_path(self):
        return urlparse(self.path).path.rstrip("/") in (
            OTA_PATH.rstrip("/"),
            "",  # 根路径也响应，兼容设备直接 POST 到 http://host:port/
        )

    def do_GET(self):
        p = urlparse(self.path)
        if p.path.rstrip("/") == BIN_PATH.rstrip("/"):
            self._serve_bin()
        elif self._is_ota_path():
            self._send_json(build_payload(self.headers.get("Host")))
        else:
            self._send_json({"error": "not found"}, 404)

    def do_POST(self):
        p = urlparse(self.path)
        # 消费请求体（设备会 POST 一段系统信息 JSON，这里不需要解析）
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length:
            self.rfile.read(length)
        if self._is_ota_path():
            self._send_json(build_payload(self.headers.get("Host")))
        else:
            self._send_json({"error": "not found"}, 404)

    def log_message(self, fmt, *args):
        sys.stderr.write("[ota] " + (fmt % args) + "\n")


if __name__ == "__main__":
    print(f"内网 OTA 检查服务器已启动 :{PORT}")
    print(f"  OTA 接口  : http://0.0.0.0:{PORT}{OTA_PATH}  (设备 ota_url 指向这里)")
    print(f"  固件下载  : {FIRMWARE_FILE}  ->  http://0.0.0.0:{PORT}{BIN_PATH}")
    print(f"  固件版本  : {FIRMWARE_VERSION}  (force={FORCE})")
    print(f"  音频地址  : {WEBSOCKET_URL or '(未设置，请用 WEBSOCKET_URL 显式指定 xiaozhi-client)'}")
    try:
        ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
    except KeyboardInterrupt:
        print("\n已停止。")
