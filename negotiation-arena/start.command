#!/bin/zsh
set -eu
cd -- "$(dirname -- "$0")"
ARENA_BUNDLED_NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
if [[ -x "$ARENA_BUNDLED_NODE" ]]; then
  ARENA_NODE="$ARENA_BUNDLED_NODE"
elif command -v node >/dev/null 2>&1; then
  ARENA_NODE="$(command -v node)"
else
  echo 'Для запуска нужен Node.js 22 или новее: https://nodejs.org/'
  read -r '?Нажмите Enter, чтобы закрыть окно.'
  exit 1
fi
if ! "$ARENA_NODE" -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 22 ? 0 : 1)'; then
  echo 'Обновите Node.js до версии 22 или новее.'
  exit 1
fi
if [[ -f .env ]]; then
  exec "$ARENA_NODE" --env-file=.env server.mjs
else
  exec "$ARENA_NODE" server.mjs
fi
