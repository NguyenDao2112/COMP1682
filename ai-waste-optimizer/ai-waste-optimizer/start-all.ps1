<#
start-all.ps1

Starts backend and frontend in separate PowerShell windows.

Usage:
  From the project root run:
    .\start-all.ps1

This script assumes:
- a Python virtualenv is available at `./.venv` (created with `python -m venv .venv`)
- backend is started via `python -m uvicorn backend.main:app`
- frontend can be started with `npm run dev` inside the `frontend` folder
#>

param()

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

# Backend command: activate venv (if present) and run uvicorn
$backendCmd = "Set-Location '$scriptDir'; if (Test-Path '.venv\Scripts\Activate.ps1') { . .\.venv\Scripts\Activate.ps1 } ; python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"
Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoExit', '-Command', $backendCmd -WorkingDirectory $scriptDir

# Frontend command: change to frontend folder and run Vite (npm dev)
$frontendDir = Join-Path $scriptDir 'frontend'
$frontendCmd = "Set-Location '$frontendDir'; npm run dev"
Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoExit', '-Command', $frontendCmd -WorkingDirectory $frontendDir

Write-Host "Started backend and frontend in separate PowerShell windows."
