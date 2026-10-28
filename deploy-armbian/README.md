# 小智全栈一键部署（Armbian / arm64）—— 语音对话 + 联网搜索 + 本地音乐

在一个 Armbian（aarch64）开发板上，用 Docker 跑起三件套，实现：

| 能力 | 由谁提供 |
|---|---|
| 语音对话 | `xiaozhi-client` 桥接 → xiaozhi.me / Qwen（平台免费额度） |
| 联网搜索 | `search-mcp`（node）→ 自托管 `SearXNG`（免费、可控、零 key） |
| 本地音乐 | `music-service`（python + ffmpeg→Opus）→ `xiaozhi-client` 注入设备同一 WS，设备端零改动（路径 B） |

> 适用板子：黑豹 X2 / 树莓派等 arm64 板。2MB PSRAM 板优先用路径 B（设备只解 Opus，几乎不增内存）。

---

## 〇、架构与数据流

```
[ 你 / 设备 ] --WS--> [ xiaozhi-client :3000 ] --WS--> [ xiaozhi.me / Qwen ]
                       |  Web UI :9999
                       |-- mcp: search(node)        --> http://searxng:8080
                       |-- mcp: xiaozhi-music(py)   --> POST /api/music
                       |                                  --> 拉 http://music-service:8800/opus_stream
                       \-- 把 Opus 帧注入设备同一条 WS（sendBinaryProtocol2）

[ music-service :8800 ]   本地 ./music 曲库 → ffmpeg→PCM16k→Opus
[ searxng :8080 ]         搜索引擎聚合（baidu/sogou/bing…）
```

三服务都在 Docker 网络 `xiaozhi` 内，**用容器名互访**。`localhost` 在容器内指向容器自己，所以 client 配置里一律写 `http://searxng:8080`、`http://music-service:8800`、`http://xiaozhi-client:3000`，**不要写 localhost**。

---

## 一、准备工作（仅一次）

1. 开发板刷好 Armbian，能联网（离线见下面“离线物料”）。
2. 装 Docker + Compose（arm64）：
   ```sh
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER   # 退出重登生效
   docker compose version
   ```
3. 把本目录 `deploy-armbian/` 拷到开发板（离线时连同两个镜像 tar 一起）。

### 离线物料（无外网 / 内网隔离）
在能联网的 x86_64 机器上预先取出 arm64 镜像，拷到开发板 `deploy-armbian/` 同级或内部，`setup.sh` 会自动 `docker load`：
- `xiaozhi-client-arm64.tar`（你们 fork 的离线镜像，已含 search-mcp + 音乐注入 + python3）
- `searxng-arm64.tar`（SearXNG arm64 镜像）

---

## 二、一键部署（推荐）

```sh
cd deploy-armbian
chmod +x setup.sh
./setup.sh
```

脚本依次：建网络 → 导入/拉取 client 与 searxng 镜像（离线 tar 优先，否则联网拉 arm64）→ 本地构建 music-service → 生成 `xiaozhi.config.json` 与 SearXNG 密钥 → `docker compose up -d`。

---

## 三、部署后必做（按前后顺序）

1. **填 AI 密钥（对话前提）**：浏览器开 `http://<板IP>:9999`，设置里填 LLM（Qwen / DashScope Key）、ASR/TTS（火山引擎等）。
   也可直接改 `data/xiaozhi-client/xiaozhi.config.json` 后 `docker restart xiaozhi-client`。
2. **放曲库**：把歌曲放进 `./music`（中文名更易语音匹配）。
3. **设备指向桥接**：把设备固件/配网的 WebSocket URL 改成 `ws://<板IP>:3000/`，重启设备，Web UI 看到“已连接”。
4. **（可选）SearXNG 引擎筛选**：在板上
   ```sh
   curl -s "http://localhost:8080/search?q=test&format=json" \
     | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log("results:",JSON.parse(s).results.length)}catch(e){console.log("异常:",s.slice(0,200))}})'
   ```
   若为 0，逐个引擎探测并把不通的加进 `searxng/settings.yml` 的 `disabled_engines`，`docker restart searxng`。中文优先保留 `baidu + sogou`。

> 智能体提示词建议加一句：“想播放音乐时调用 `xiaozhi-music__play_song`（传歌曲名），停止调用 `xiaozhi-music__stop_music`；禁止使用 search_music。”

---

## 四、验证闭环

- **对话**：唤醒说话，走 Qwen 正常回复。
- **搜索**：语音/文字问“今天有什么科技新闻”，Qwen 应调用 `web_search` 返回摘要（client 日志可见 `搜索: "..."`）。
- **音乐**：说“播放青花瓷”→ 设备出声；说“停止”→ 停。
  也可直接验证后端：
  ```sh
  curl -X POST http://<板IP>:3000/api/music/play -d '{"url":"/music/青花瓷.mp3","name":"青花瓷"}'
  ```

---

## 五、目录结构

```
deploy-armbian/
├── docker-compose.yml          # 三件套合一编排
├── setup.sh                    # 一键部署脚本
├── xiaozhi.config.example.json # mcpServers(search+music) 模板
├── .gitignore                  # 忽略 music/ data/ settings.yml / *.tar
├── searxng/settings.yml.example# SearXNG 配置模板（已去密钥）
├── music-service/              # 转码后端（Dockerfile + music_service.py + mcp 脚本）
├── music/                      # 你的曲库（放歌曲，不入库）
└── data/xiaozhi-client/        # client 配置/日志（xiaozhi.config.json 在此）
```

---

## 六、相关文档

- 搜索后端细节 / 引擎筛选 / Armbian 部署：见仓库 `mcps/search-mcp/SOP.md`
- 音乐路径 B 原理、设备资源权衡与排错：见 `xiaozhi-esp32` 仓库 `music-service/SETUP-pathB-opus.md`
- 仅 client 的 Armbian 部署：见仓库 `docs/deploy-armbian.md`
