#!/bin/zsh
set -eu
cd -- "$(dirname -- "$0")"
ARENA_DEMO_NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
if [[ ! -x "$ARENA_DEMO_NODE" ]]; then
  if command -v node >/dev/null 2>&1; then
    ARENA_DEMO_NODE="$(command -v node)"
  else
    echo 'Для запуска нужен Node.js 22 или новее.'
    read -r '?Нажмите Enter, чтобы закрыть окно.'
    exit 1
  fi
fi
if ! "$ARENA_DEMO_NODE" -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 22 ? 0 : 1)'; then
  echo 'Обновите Node.js до версии 22 или новее.'
  exit 1
fi
exec "$ARENA_DEMO_NODE" scripts/demo.mjs
