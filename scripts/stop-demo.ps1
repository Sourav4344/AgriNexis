# ==============================================================================
# AgriNexis SIH 2026 Hackathon Demo Shutdown Script (PowerShell)
# ==============================================================================

$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$pidFile = Join-Path $RepoRoot ".demo-pids.json"

Write-Host "Stopping AgriNexis Demo services..." -ForegroundColor Cyan

if (Test-Path $pidFile) {
    try {
        $raw = Get-Content $pidFile -Raw
        $pids = $raw | ConvertFrom-Json
        if ($pids.api) {
            Write-Host "  Stopping API (PID: $($pids.api))..." -ForegroundColor Gray
            Stop-Process -Id $pids.api -Force -ErrorAction SilentlyContinue
        }
        if ($pids.buyer) {
            Write-Host "  Stopping Buyer Web (PID: $($pids.buyer))..." -ForegroundColor Gray
            Stop-Process -Id $pids.buyer -Force -ErrorAction SilentlyContinue
        }
        if ($pids.admin) {
            Write-Host "  Stopping Admin Web (PID: $($pids.admin))..." -ForegroundColor Gray
            Stop-Process -Id $pids.admin -Force -ErrorAction SilentlyContinue
        }
    } catch {
        Write-Warning "Could not read PID file: $_"
    }
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

# Fallback check on standard ports 8000, 3001, 3002
$ports = @(8000, 3001, 3002)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            if ($conn.OwningProcess -and $conn.OwningProcess -ne 0) {
                Write-Host "  Releasing port $port (Killing PID: $($conn.OwningProcess))..." -ForegroundColor Yellow
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Write-Host "[OK] All AgriNexis demo services stopped." -ForegroundColor Green
