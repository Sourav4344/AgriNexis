#!/usr/bin/env bash
# ==============================================================================
# AgriNexis SIH 2026 Hackathon Demo Shutdown Script (Bash)
# ==============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Stopping AgriNexis Demo services..."

PID_FILE="$REPO_ROOT/.demo-pids.json"
if [ -f "$PID_FILE" ]; then
    API_PID=$(grep -o '"api":[0-9]*' "$PID_FILE" | cut -d: -f2 || true)
    BUYER_PID=$(grep -o '"buyer":[0-9]*' "$PID_FILE" | cut -d: -f2 || true)
    ADMIN_PID=$(grep -o '"admin":[0-9]*' "$PID_FILE" | cut -d: -f2 || true)

    [ -n "$API_PID" ] && kill -9 "$API_PID" 2>/dev/null || true
    [ -n "$BUYER_PID" ] && kill -9 "$BUYER_PID" 2>/dev/null || true
    [ -n "$ADMIN_PID" ] && kill -9 "$ADMIN_PID" 2>/dev/null || true

    rm -f "$PID_FILE"
fi

# Fallback release for ports
for PORT in 8000 3001 3002; do
    PID=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -n "$PID" ]; then
        kill -9 $PID 2>/dev/null || true
    fi
done

echo "✓ All AgriNexis demo services stopped."
