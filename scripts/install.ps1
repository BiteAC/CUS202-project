# Install the four default skills into an agent's skill directory.
# Usage:
#   .\scripts\install.ps1                       # default: %USERPROFILE%\.claude\skills
#   .\scripts\install.ps1 -Target <path>

param(
    [string]$Target = (Join-Path $env:USERPROFILE ".claude\skills")
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$src  = Join-Path $root "skills"

if (-not (Test-Path $src)) { throw "skills not found at $src" }
if (-not (Test-Path $Target)) { New-Item -ItemType Directory -Force -Path $Target | Out-Null }

$installed = @()
Get-ChildItem $src -Directory | ForEach-Object {
    $dest = Join-Path $Target $_.Name
    if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
    Copy-Item $_.FullName $dest -Recurse
    $installed += $_.Name
    Write-Host ("installed  {0}" -f $_.Name)
}

Write-Host ""
Write-Host ("Installed {0} skills to {1}" -f $installed.Count, $Target)
Write-Host "Restart your assistant. Skill folders are scanned at startup."
Write-Host ""
Write-Host "Optional next steps:"
Write-Host "  Canvas server:   .\scripts\setup-canvas.ps1"
Write-Host "  Academic skills: .\scripts\install-academic.ps1 -Only peer-review"
Write-Host "  Other skills:    .\scripts\fetch-optional.ps1 -Component claude-video"
