# Set up the optional Canvas side: the server, then the routing skill that uses it.
# Usage:
#   .\scripts\setup-canvas.ps1
#   .\scripts\setup-canvas.ps1 -SkipInstall    # dependencies already installed

param(
    [switch]$SkipInstall,
    [string]$Target = (Join-Path $env:USERPROFILE ".claude\skills")
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$server = Join-Path $root "canvas"
$skill  = Join-Path $root "canvas\canvas-copilot"

if (-not (Test-Path $server)) { throw "canvas folder not found at $server" }

Push-Location $server
try {
    if (-not $SkipInstall) {
        Write-Host "Installing dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    }

    Write-Host ""
    Write-Host "Opening a browser for the PolyU login. Sign in with your NetID."
    node scripts/login.mjs
    if ($LASTEXITCODE -ne 0) { throw "login failed" }

    Write-Host ""
    Write-Host "Checking the connection..."
    node server.mjs --check
    if ($LASTEXITCODE -ne 0) { throw "connection check failed. See docs/CANVAS.md" }
}
finally {
    Pop-Location
}

# The routing skill goes in only now, because it does nothing without the server.
if (Test-Path $skill) {
    if (-not (Test-Path $Target)) { New-Item -ItemType Directory -Force -Path $Target | Out-Null }
    $dest = Join-Path $Target "canvas-copilot"
    if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
    Copy-Item $skill $dest -Recurse
    Write-Host ""
    Write-Host "Installed the canvas-copilot skill to $Target"
    Write-Host "Restart your assistant to pick it up."
}

Write-Host ""
Write-Host "Canvas side ready."
