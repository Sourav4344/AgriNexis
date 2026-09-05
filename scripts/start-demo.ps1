# ==============================================================================
# AgriNexis SIH 2026 Hackathon Demo Startup Script (PowerShell)
# Problem Statement: 26132 (Government of Maharashtra)
# ==============================================================================

[CmdletBinding()]
param (
    [switch]$BuildFirst = $false,
    [switch]$NoBrowser = $false
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
Set-Location $RepoRoot

Write-Host "=================================================================" -ForegroundColor Green
Write-Host "       AgriNexis - Smart India Hackathon 2026 Judge Demo         " -ForegroundColor Yellow
Write-Host "           Problem Statement 26132 | Gov of Maharashtra          " -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Green
Write-Host ""

# 1. Verify Prerequisites
Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Cyan

$pythonExe = $null
if (Test-Path "$RepoRoot\.venv\Scripts\python.exe") {
    $pythonExe = "$RepoRoot\.venv\Scripts\python.exe"
    Write-Host "  [OK] Virtual environment found: $pythonExe" -ForegroundColor Green
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonExe = "python"
    Write-Host "  [WARN] Virtualenv not detected, using system python" -ForegroundColor Yellow
} else {
    Write-Error "Python not found. Please install Python 3.12+ to proceed."
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js not found. Please install Node.js 20+ to proceed."
} else {
    $nodeVer = node --version
    Write-Host "  [OK] Node.js found: $nodeVer" -ForegroundColor Green
}

if (-not (Test-Path "$RepoRoot\apps\buyer-web\node_modules")) {
    Write-Host "  Installing dependencies for Buyer Web..." -ForegroundColor Yellow
    npm --prefix "$RepoRoot\apps\buyer-web" ci
}

if (-not (Test-Path "$RepoRoot\apps\admin-web\node_modules")) {
    Write-Host "  Installing dependencies for Admin Web..." -ForegroundColor Yellow
    npm --prefix "$RepoRoot\apps\admin-web" ci
}

# 2. Configure Environment for Demo Mode
Write-Host ""
Write-Host "[2/5] Setting Demo Environment variables..." -ForegroundColor Cyan
$env:APP_ENV = "demo"
$env:DEMO_MODE = "true"
$env:LOG_LEVEL = "INFO"
$env:MARKET_DATA_PROVIDER = "demo"
$env:MARKET_DEMO_FALLBACK_ENABLED = "true"
$env:API_ALLOWED_ORIGINS = "http://localhost:3000,http://localhost:3001,http://localhost:3002"
$env:NEXT_PUBLIC_API_URL = "http://localhost:8000/api/v1"
$env:NEXT_PUBLIC_DEMO_MODE = "true"
$env:NEXT_PUBLIC_ADMIN_API_URL = "http://localhost:8000/api/v1"
$env:NEXT_PUBLIC_ADMIN_DEMO_MODE = "true"

# Construct multi-service PYTHONPATH
$services = @("services/api", "services/market-engine", "services/matching-engine", "services/prediction-engine", "services/logistics-engine", "services/quality-engine", "services/transactions")
$env:PYTHONPATH = ($services | ForEach-Object { Join-Path $RepoRoot $_ }) -join ";"

Write-Host "  [OK] DEMO_MODE: explicit true" -ForegroundColor Green
Write-Host "  [OK] PROVENANCE: SIH-2026-TOMATO-V1 canonical fixtures active" -ForegroundColor Green

# 3. Terminate Any Previous Demo Instances
$pidFile = Join-Path $RepoRoot ".demo-pids.json"
if (Test-Path $pidFile) {
    Write-Host "  Stopping prior demo processes..." -ForegroundColor Yellow
    & "$ScriptDir\stop-demo.ps1" | Out-Null
}

# 4. Launch Services in Background
Write-Host ""
Write-Host "[3/5] Starting application services..." -ForegroundColor Cyan

# Service A: FastAPI Core
$apiOutLog = Join-Path $RepoRoot "api-out.log"
$apiErrLog = Join-Path $RepoRoot "api-err.log"
$apiJob = Start-Process -FilePath $pythonExe `
    -ArgumentList "-m", "uvicorn", "app.main:create_app", "--factory", "--host", "127.0.0.1", "--port", "8000" `
    -WorkingDirectory "$RepoRoot\services\api" `
    -RedirectStandardOutput $apiOutLog `
    -RedirectStandardError $apiErrLog `
    -PassThru -WindowStyle Hidden
Write-Host "  [OK] FastAPI Core launched (PID: $($apiJob.Id), Port: 8000)" -ForegroundColor Green

# Service B: Buyer Web
$buyerOutLog = Join-Path $RepoRoot "buyer-out.log"
$buyerErrLog = Join-Path $RepoRoot "buyer-err.log"
$buyerCmd = if ($BuildFirst) { "start" } else { "dev" }
$buyerJob = Start-Process -FilePath "npm.cmd" `
    -ArgumentList "run", $buyerCmd `
    -WorkingDirectory "$RepoRoot\apps\buyer-web" `
    -RedirectStandardOutput $buyerOutLog `
    -RedirectStandardError $buyerErrLog `
    -PassThru -WindowStyle Hidden
Write-Host "  [OK] Buyer & FPO Dashboard launched (PID: $($buyerJob.Id), Port: 3001)" -ForegroundColor Green

# Service C: Admin Web
$adminOutLog = Join-Path $RepoRoot "admin-out.log"
$adminErrLog = Join-Path $RepoRoot "admin-err.log"
$adminCmd = if ($BuildFirst) { "start" } else { "dev" }
$adminJob = Start-Process -FilePath "npm.cmd" `
    -ArgumentList "run", $adminCmd `
    -WorkingDirectory "$RepoRoot\apps\admin-web" `
    -RedirectStandardOutput $adminOutLog `
    -RedirectStandardError $adminErrLog `
    -PassThru -WindowStyle Hidden
Write-Host "  [OK] Admin Dashboard launched (PID: $($adminJob.Id), Port: 3002)" -ForegroundColor Green

# Save PIDs
$pids = @{
    api = $apiJob.Id
    buyer = $buyerJob.Id
    admin = $adminJob.Id
    started_at = (Get-Date).ToString("o")
}
$pids | ConvertTo-Json | Set-Content -Path $pidFile

# 5. Wait for readiness
Write-Host ""
Write-Host "[4/5] Verifying service readiness..." -ForegroundColor Cyan
Start-Sleep -Seconds 4

& "$ScriptDir\check-demo.ps1"

Write-Host ""
Write-Host "[5/5] Demonstration Services Active" -ForegroundColor Green
Write-Host "  (See readiness probe above for database/auth dependency status)" -ForegroundColor Gray
Write-Host "-----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  - FastAPI API Docs:       http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "  - FastAPI Health Probe:   http://localhost:8000/health" -ForegroundColor Yellow
Write-Host "  - Buyer/FPO Dashboard:    http://localhost:3001" -ForegroundColor Yellow
Write-Host "  - Admin Operations:       http://localhost:3002" -ForegroundColor Yellow
Write-Host "-----------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "To stop demo services, run: .\scripts\stop-demo.ps1" -ForegroundColor Gray
