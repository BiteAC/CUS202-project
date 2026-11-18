# Copy academic skills from third-party/academic into an agent's skill directory.
# Usage:
#   .\scripts\install-academic.ps1                       # all eight
#   .\scripts\install-academic.ps1 -Only peer-review     # one
#   .\scripts\install-academic.ps1 -Target <path>

param(
    [string[]]$Only,
    [string]$Target = (Join-Path $env:USERPROFILE ".claude\skills")
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$src  = Join-Path $root "third-party\academic"

if (-not (Test-Path $src)) { throw "third-party/academic not found at $src" }
if (-not (Test-Path $Target)) { New-Item -ItemType Directory -Force -Path $Target | Out-Null }

$available = Get-ChildItem $src -Directory | Select-Object -ExpandProperty Name

if ($Only) {
    foreach ($n in $Only) {
        if ($n -notin $available) {
            throw "unknown skill '$n'. Available: $($available -join ', ')"
        }
    }
    $pick = $Only
} else {
    $pick = $available
}

foreach ($n in $pick) {
    $dest = Join-Path $Target $n
    if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
    Copy-Item (Join-Path $src $n) $dest -Recurse
    Write-Host ("installed  {0}" -f $n)
}

Write-Host ""
Write-Host ("Installed {0} skill(s) to {1}" -f $pick.Count, $Target)
Write-Host "Remove one with:  Remove-Item `"$Target\<name>`" -Recurse -Force"
Write-Host "These are not part of the default install. See docs/ACADEMIC.md."
