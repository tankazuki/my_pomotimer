# Stop whatever is listening on the backend/frontend dev ports.
# Usage: powershell -File scripts\dev-stop.ps1

$ErrorActionPreference = "SilentlyContinue"

$root = Split-Path -Parent $PSScriptRoot
$devDir = Join-Path $root ".dev"

function Stop-Port($name, $port, $pidFile) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $conn) {
        Write-Host "$name is not running (nothing listening on port $port)"
    }
    else {
        $ownerId = $conn.OwningProcess
        # /T also stops the process tree (uvicorn's reload worker, next dev's turbopack workers, etc).
        taskkill /PID $ownerId /T /F 2>$null | Out-Null
        Start-Sleep -Milliseconds 500
        $stillUp = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($stillUp) {
            Write-Host "${name}: could not stop the process on port $port (PID $ownerId). It may belong to a different session/sandbox; close it manually."
        }
        else {
            Write-Host "$name stopped (was PID $ownerId on port $port)"
        }
    }

    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

Stop-Port -Name "backend" -Port 8000 -PidFile (Join-Path $devDir "backend.pid")
Stop-Port -Name "frontend" -Port 3000 -PidFile (Join-Path $devDir "frontend.pid")
