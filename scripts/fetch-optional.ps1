# Fetch one optional component at its pinned commit.
# Usage:
#   .\scripts\fetch-optional.ps1 -Component claude-video
#   .\scripts\fetch-optional.ps1 -Component claude-video -Target <skills dir>

param(
    [Parameter(Mandatory = $true)][string]$Component,
    [string]$Target = (Join-Path $PSScriptRoot "..\optional")
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $root "manifest.json"
if (-not (Test-Path $manifestPath)) { throw "manifest.json not found" }

$manifest = Get-Content $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
$entry = $manifest.components | Where-Object { $_.id -eq $Component }

if (-not $entry) {
    $available = ($manifest.components | Where-Object { $_.profile -eq "optional" } | ForEach-Object { $_.id }) -join ", "
    throw "unknown component '$Component'. Available: $available"
}
if ($entry.profile -ne "optional") {
    throw "'$Component' is part of the core profile and is already in the repo."
}

$repo   = $entry.source.repo
$commit = $entry.source.commit
if (-not $commit) { throw "'$Component' has no pinned commit in manifest.json" }

$dest = Join-Path $Target $Component
if (-not (Test-Path $Target)) { New-Item -ItemType Directory -Force -Path $Target | Out-Null }

if (Test-Path $dest) {
    Write-Host "already present: $dest"
} else {
    git clone --filter=blob:none --no-checkout "https://github.com/$repo.git" $dest
    Push-Location $dest
    git checkout $commit
    Pop-Location
    Write-Host ("fetched {0} @ {1}" -f $repo, $commit.Substring(0, 7))
}

Write-Host ""
Write-Host ("licence: {0}" -f $entry.source.license)
Write-Host "Read docs/PROFILES.md before enabling it. Removing the directory is the only reliable way to disable it."
