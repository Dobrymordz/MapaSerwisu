#!/bin/bash

LOG="/tmp/mapaserwisu-backend.log"
PIDFILE="/tmp/mapaserwisu-backend.pid"

if [ -f "$PIDFILE" ]; then
    PID=$(cat "$PIDFILE" 2>/dev/null || true)
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        exit 0
    fi
fi

cd /workspaces/MapaSerwisu/backend || exit 1

nohup npm start > "$LOG" 2>&1 &
echo $! > "$PIDFILE"
