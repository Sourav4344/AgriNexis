#!/usr/bin/env bash
# ==============================================================================
# AgriNexis Demo Health & Readiness Check (Bash)
# ==============================================================================
set -e

echo "================ AgriNexis Health & Readiness ================"

SERVICES_ALIVE=0
DEPENDENCIES_READY=0

check_liveness() {
    local NAME=$1
    local URL=$2

    printf "  Checking %s (%s)... " "$NAME" "$URL"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || echo "000")

    if [ "$STATUS" = "200" ] || [ "$STATUS" = "307" ] || [ "$STATUS" = "308" ]; then
        echo "[ALIVE] (HTTP $STATUS)"
        return 0
    else
        echo "[OFFLINE] (HTTP $STATUS)"
        return 1
    fi
}

check_readiness() {
    local URL=$1
    printf "  Checking Dependency Readiness (%s)... " "$URL"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || echo "000")

    if [ "$STATUS" = "200" ]; then
        echo "[READY] (HTTP 200: Database & Auth online)"
        DEPENDENCIES_READY=1
    elif [ "$STATUS" = "503" ]; then
        echo "[DEGRADED] (HTTP 503: Database/Auth dependencies not ready)"
        echo "    Note: Expected for offline demo when local PostgreSQL/Supabase is not running."
        DEPENDENCIES_READY=0
    else
        echo "[ERROR] (HTTP $STATUS)"
        DEPENDENCIES_READY=0
    fi
}

echo "1. Process Liveness:"
check_liveness "FastAPI Core" "http://localhost:8000/health" || SERVICES_ALIVE=1
check_liveness "Buyer Dashboard" "http://localhost:3001" || SERVICES_ALIVE=1
check_liveness "Admin Dashboard" "http://localhost:3002" || SERVICES_ALIVE=1

echo ""
echo "2. Dependency Readiness:"
check_readiness "http://localhost:8000/ready"

echo "=============================================================="

if [ "$SERVICES_ALIVE" -ne 0 ]; then
    echo "[ERROR] One or more application processes are offline."
    echo "        Start services using: ./scripts/start-demo.sh"
    exit 1
elif [ "$DEPENDENCIES_READY" -eq 1 ]; then
    echo "[SUCCESS] All application services and backing dependencies are fully operational."
    exit 0
else
    echo "[WARN] Application processes are ALIVE, but dependencies (database/auth) are NOT READY (HTTP 503)."
    echo "       Demo is running in offline degraded mode using deterministic fixtures."
    exit 0
fi
