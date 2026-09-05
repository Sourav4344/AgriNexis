#!/usr/bin/env bash
# ==============================================================================
# AgriNexis SIH 2026 Hackathon Demo Startup Script (Bash)
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

echo "================================================================="
echo "       AgriNexis — Smart India Hackathon 2026 Judge Demo         "
echo "           Problem Statement 26132 | Gov of Maharashtra          "
echo "================================================================="

# Detect Python
if [ -f "$REPO_ROOT/.venv/bin/python" ]; then
    PYTHON_EXE="$REPO_ROOT/.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
    PYTHON_EXE="python3"
else
    echo "Python not found. Please install Python 3.12+."
    exit 1
fi

# Environment
export APP_ENV="demo"
export DEMO_MODE="true"
export LOG_LEVEL="INFO"
export MARKET_DATA_PROVIDER="demo"
export MARKET_DEMO_FALLBACK_ENABLED="true"
export API_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,http://localhost:3002"
export NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
export NEXT_PUBLIC_DEMO_MODE="true"
export NEXT_PUBLIC_ADMIN_API_URL="http://localhost:8000/api/v1"
export NEXT_PUBLIC_ADMIN_DEMO_MODE="true"

SERVICES="services/api:services/market-engine:services/matching-engine:services/prediction-engine:services/logistics-engine:services/quality-engine:services/transactions"
export PYTHONPATH="$REPO_ROOT/services/api:$REPO_ROOT/services/market-engine:$REPO_ROOT/services/matching-engine:$REPO_ROOT/services/prediction-engine:$REPO_ROOT/services/logistics-engine:$REPO_ROOT/services/quality-engine:$REPO_ROOT/services/transactions:$PYTHONPATH"

# Stop existing
if [ -f "$REPO_ROOT/scripts/stop-demo.sh" ]; then
    bash "$REPO_ROOT/scripts/stop-demo.sh" >/dev/null 2>&1 || true
fi

echo "Starting FastAPI Core on port 8000..."
cd "$REPO_ROOT/services/api"
"$PYTHON_EXE" -m uvicorn app.main:create_app --factory --host 127.0.0.1 --port 8000 > "$REPO_ROOT/api.log" 2>&1 &
API_PID=$!

echo "Starting Buyer Web Dashboard on port 3001..."
cd "$REPO_ROOT/apps/buyer-web"
npm run dev > "$REPO_ROOT/buyer-web.log" 2>&1 &
BUYER_PID=$!

echo "Starting Admin Dashboard on port 3002..."
cd "$REPO_ROOT/apps/admin-web"
npm run dev > "$REPO_ROOT/admin-web.log" 2>&1 &
ADMIN_PID=$!

echo "{\"api\":$API_PID,\"buyer\":$BUYER_PID,\"admin\":$ADMIN_PID}" > "$REPO_ROOT/.demo-pids.json"

echo "Waiting for service availability..."
sleep 4

bash "$REPO_ROOT/scripts/check-demo.sh"

echo "AgriNexis Demo is running!"
echo "  - API Docs:    http://localhost:8000/docs"
echo "  - Buyer Web:   http://localhost:3001"
echo "  - Admin Web:   http://localhost:3002"
