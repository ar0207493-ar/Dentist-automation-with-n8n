#!/bin/sh
set -eu
export SERVER_TYPE=http
export SERVER_PORT="${PORT:-10000}"
export SERVER_URL="${RENDER_EXTERNAL_URL:?Render public URL is required}"
node /evolution/dentora/prepare-db.cjs
npm run db:deploy
npm run db:generate
exec node dist/main
