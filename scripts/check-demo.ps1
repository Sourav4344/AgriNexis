# ==============================================================================
# AgriNexis Demo Health & Readiness Check (PowerShell)
# ==============================================================================

[CmdletBinding()]
param (
    [int]$TimeoutSeconds = 5
)

$servicesAlive = $true
$dependenciesReady = $false

function Test-ProcessLiveness {
    param (
        [string]$Name,
        [string]$Url,
        [int[]]$AcceptableStatuses = @(200)
    )

    Write-Host "  Checking $Name ($Url)... " -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec $TimeoutSeconds -UseBasicParsing -ErrorAction Stop
        $code = [int]$response.StatusCode
        if ($AcceptableStatuses -contains $code) {
            Write-Host "[ALIVE] (HTTP $code)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "[UNEXPECTED] (HTTP $code)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
            if ($AcceptableStatuses -contains $code) {
                Write-Host "[ALIVE] (HTTP $code)" -ForegroundColor Green
                return $true
            }
            Write-Host "[UNEXPECTED] (HTTP $code)" -ForegroundColor Yellow
            return $false
        }
        Write-Host "[OFFLINE] (Unreachable)" -ForegroundColor Red
        return $false
    }
}

function Test-DependencyReadiness {
    param (
        [string]$Url
    )

    Write-Host "  Checking Dependency Readiness ($Url)... " -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec $TimeoutSeconds -UseBasicParsing -ErrorAction Stop
        $code = [int]$response.StatusCode
        if ($code -eq 200) {
            Write-Host "[READY] (HTTP 200: Database & Auth online)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "[DEGRADED] (HTTP $code)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
            if ($code -eq 503) {
                Write-Host "[DEGRADED] (HTTP 503: Database/Auth dependencies not ready)" -ForegroundColor Yellow
                Write-Host "    Note: Expected for offline demo when local PostgreSQL/Supabase is not running." -ForegroundColor Gray
                return $false
            }
            Write-Host "[ERROR] (HTTP $code)" -ForegroundColor Red
            return $false
        }
        Write-Host "[OFFLINE] (Unreachable)" -ForegroundColor Red
        return $false
    }
}

Write-Host "================ AgriNexis Health & Readiness ================" -ForegroundColor Cyan

# 1. Process Liveness Probes
Write-Host "1. Process Liveness:" -ForegroundColor White
if (-not (Test-ProcessLiveness -Name "FastAPI Core" -Url "http://localhost:8000/health" -AcceptableStatuses @(200))) {
    $servicesAlive = $false
}
if (-not (Test-ProcessLiveness -Name "Buyer Dashboard" -Url "http://localhost:3001" -AcceptableStatuses @(200, 307, 308))) {
    $servicesAlive = $false
}
if (-not (Test-ProcessLiveness -Name "Admin Dashboard" -Url "http://localhost:3002" -AcceptableStatuses @(200, 307, 308))) {
    $servicesAlive = $false
}

Write-Host ""
# 2. Dependency Readiness Probe
Write-Host "2. Dependency Readiness:" -ForegroundColor White
$dependenciesReady = Test-DependencyReadiness -Url "http://localhost:8000/ready"

Write-Host "==============================================================" -ForegroundColor Cyan

if (-not $servicesAlive) {
    Write-Host "[ERROR] One or more application processes are offline." -ForegroundColor Red
    Write-Host "        Start services using: .\scripts\start-demo.ps1" -ForegroundColor Yellow
    exit 1
} elseif ($dependenciesReady) {
    Write-Host "[SUCCESS] All application services and backing dependencies are fully operational." -ForegroundColor Green
    exit 0
} else {
    Write-Host "[WARN] Application processes are ALIVE, but dependencies (database/auth) are NOT READY (HTTP 503)." -ForegroundColor Yellow
    Write-Host "       Demo is running in offline degraded mode using deterministic fixtures." -ForegroundColor Yellow
    exit 0
}
