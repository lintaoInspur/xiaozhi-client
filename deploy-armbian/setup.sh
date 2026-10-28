#!/usr/bin/env bash
# 一键部署：xiaozhi-client + music-service + searxng（Armbian / arm64）
# 用法： cd deploy-armbian && ./setup.sh
set -euo pipefail
cd "$(dirname "$0")"

echo "==================== 一键部署（Armbian）===================="
echo "组件：xiaozhi-client(语音+搜索+音乐) + music-service(本地音乐) + searxng(联网搜索)"
echo

mkdir -p music data/xiaozhi-client searxng

# 共享网络（容器内用容器名互访，localhost 会指向自己）
docker network create xiaozhi >/dev/null 2>&1 || true

find_tar() { local f; for f in "$@"; do [ -f "$f" ] && { echo "$f"; return 0; }; done; return 1; }

# ---- 1. client 镜像 ----
CLIENT_TAR=$(find_tar ./xiaozhi-client-arm64.tar ./xiaozhi-client-arm64-new.tar \
                      ../xiaozhi-client-arm64-new.tar ../xiaozhi-client-arm64.tar 2>/dev/null || true)
if docker image inspect xiaozhi-client:arm64 >/dev/null 2>&1; then
  echo "[client] 镜像已存在，跳过"
elif [ -n "$CLIENT_TAR" ]; then
  echo "[client] 从 $CLIENT_TAR 导入 ..."; docker load -i "$CLIENT_TAR"
else
  echo "[client] 未找到离线 tar，尝试联网从源码构建（需仓库根目录 docker/ 存在）..."
  if [ -f ../docker/Dockerfile.source ]; then
    docker build -f ../docker/Dockerfile.source -t xiaozhi-client:arm64 \
      --build-arg BASE_IMAGE=docker.m.daocloud.io/library/node:22 \
      --build-arg NPM_REGISTRY=https://registry.npmmirror.com/ ..
  else
    echo "[client] 错误：既无 tar 也无源码，无法获取 client 镜像。" >&2; exit 1
  fi
fi

# ---- 2. searxng 镜像 ----
SEARXNG_TAR=$(find_tar ./searxng-arm64.tar ../searxng-arm64.tar 2>/dev/null || true)
if docker image inspect docker.m.daocloud.io/searxng/searxng:latest >/dev/null 2>&1; then
  echo "[searxng] 镜像已存在，跳过"
elif [ -n "$SEARXNG_TAR" ]; then
  echo "[searxng] 从 $SEARXNG_TAR 导入 ..."; docker load -i "$SEARXNG_TAR"
else
  echo "[searxng] 联网拉取 arm64 镜像 ..."; docker pull --platform linux/arm64 docker.m.daocloud.io/searxng/searxng:latest
fi

# ---- 3. music-service 镜像（本地构建，arm64 原生，体积小、快）----
echo "[music-service] 本地构建（python + ffmpeg + opus）..."
docker build -t xiaozhi-music-service ./music-service

# ---- 4. 生成配置 ----
if [ ! -f data/xiaozhi-client/xiaozhi.config.json ]; then
  echo "[config] 生成 xiaozhi.config.json（随后在 Web UI 填 LLM/ASR/TTS Key）"
  cp xiaozhi.config.example.json data/xiaozhi-client/xiaozhi.config.json
fi
if [ ! -f searxng/settings.yml ]; then
  echo "[searxng] 生成 settings.yml 并写入随机 secret_key"
  cp searxng/settings.yml.example searxng/settings.yml
  sed -i "s/__GENERATE_WITH_openssl_rand_hex_16__/$(openssl rand -hex 16)/" searxng/settings.yml
fi

# ---- 5. 启动 ----
echo "== 启动三件套 =="
docker compose up -d

echo
echo "==================== 完成 ===================="
echo "下一步（按顺序）："
echo "  1) 浏览器开 http://<本机IP>:9999 ，填 Qwen/ASR/TTS 密钥"
echo "  2) 把歌曲放进 ./music（中文名更易语音匹配）"
echo "  3) 设备 WebSocket 改为 ws://<本机IP>:3000/ ，重启设备，Web UI 看“已连接”"
echo "  4) 验证：语音问“今天有什么新闻”(搜索)；说“播放青花瓷”(音乐)"
echo "  5) 若搜索结果为空：在板上 curl http://localhost:8080/search?q=test&format=json 看 results；为 0 则按 SOP 把不通引擎加进 searxng/settings.yml 的 disabled_engines 后 docker restart searxng"
