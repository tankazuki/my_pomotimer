# Start backend (uvicorn) and frontend (next dev) together in the background.
# Usage: powershell -File scripts\dev-start.ps1
# Stop with: powershell -File scripts\dev-stop.ps1
#
# Liveness is checked by whether the port is actually listening, not by a
# remembered PID -- npm hands the "npm run dev" process off to a detached
# child node process, so a PID captured at launch time quickly goes stale.

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$devDir = Join-Path $root ".dev"
New-Item -ItemType Directory -Force -Path $devDir | Out-Null

function Test-PortListening($port) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    return [bool]$conn
}

function Start-Tracked($name, $workingDir, $command, $port, $pidFile, $logFile, $url) {
    if (Test-PortListening $port) {
        Write-Host "$name is already running (something is listening on port $port) -> $url"
        return
    }

    $startArgs = @{
        FilePath              = "cmd.exe"
        ArgumentList          = @("/c", $command)
        WorkingDirectory       = $workingDir
        RedirectStandardOutput = $logFile
        RedirectStandardError  = "$logFile.err"
        WindowStyle            = "Hidden"
        PassThru               = $true
    }
    $proc = Start-Process @startArgs
    Set-Content -Path $pidFile -Value $proc.Id -Encoding ascii

    $waited = 0
    while (-not (Test-PortListening $port) -and $waited -lt 20) {
        Start-Sleep -Seconds 1
        $waited++
    }

    if (Test-PortListening $port) {
        Write-Host "$name started -> $url"
    }
    else {
        Write-Host "$name did not come up within ${waited}s, check the log: $logFile"
    }
}

$backendArgs = @{
    Name       = "backend"
    WorkingDir = (Join-Path $root "backend")
    Command    = "uv run uvicorn app.main:app --reload"
    Port       = 8000
    PidFile    = (Join-Path $devDir "backend.pid")
    LogFile    = (Join-Path $devDir "backend.log")
    Url        = "http://127.0.0.1:8000/docs"
}
Start-Tracked @backendArgs

$frontendArgs = @{
    Name       = "frontend"
    WorkingDir = (Join-Path $root "frontend")
    Command    = "npm run dev"
    Port       = 3000
    PidFile    = (Join-Path $devDir "frontend.pid")
    LogFile    = (Join-Path $devDir "frontend.log")
    Url        = "http://localhost:3000"
}
Start-Tracked @frontendArgs
