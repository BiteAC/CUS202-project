# 把 Canvas Personal Access Token 安全地写入本地文件（%USERPROFILE%\.canvas-polyu\token）
#
# 用法：
#   .\setup-token.ps1                  # 交互式输入（推荐，输入不回显）
#   .\setup-token.ps1 -Token '1234~…'  # 直接传参（会留在命令历史里，注意）
#   .\setup-token.ps1 -SkipCheck       # 只写文件，不联网校验

[CmdletBinding()]
param(
    [string]$Token,
    [string]$TokenFile = (Join-Path $env:USERPROFILE '.canvas-polyu\token'),
    [switch]$SkipCheck
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

function Read-Token {
    Write-Host '请在浏览器打开 https://canvas.polyu.edu.hk/profile/settings' -ForegroundColor Cyan
    Write-Host '点页面底部的 “+ New Access Token” → Purpose 填 mcp-read-only → Generate Token' -ForegroundColor Cyan
    Write-Host '（如果找不到这个按钮，说明学校关闭了自助令牌，请告诉助手改用会话 cookie 方案）' -ForegroundColor Yellow
    Write-Host ''
    $secure = Read-Host -AsSecureString '粘贴 token（输入不回显，粘贴后回车）'
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

if (-not $Token) { $Token = Read-Token }

# 清理粘贴带进来的空白/引号/换行
$Token = ($Token -replace '[\s"' + "'" + ']', '').Trim()

if ($Token.Length -lt 10) {
    throw "token 太短（$($Token.Length) 字符），看起来不对。Canvas token 形如 1234~AbCdEf…（数字~长串）。"
}
if ($Token -notmatch '^\d+~') {
    Write-Warning 'token 不以「数字~」开头，Canvas 通常是这样，但仍会照写。'
}

$dir = Split-Path -Parent $TokenFile
New-Item -ItemType Directory -Force -Path $dir | Out-Null
Set-Content -Path $TokenFile -Value $Token -NoNewline -Encoding ascii

# 收紧权限：去掉继承，只给当前用户读写
try {
    icacls $TokenFile /inheritance:r /grant:r "$($env:USERNAME):(R,W)" | Out-Null
} catch {
    Write-Warning "设置文件权限失败（不影响使用）：$($_.Exception.Message)"
}

Write-Host "`n✓ token 已保存到 $TokenFile（$($Token.Length) 字符）" -ForegroundColor Green

if (-not $SkipCheck) {
    Write-Host '正在联网校验…' -ForegroundColor Cyan
    Push-Location $here
    try {
        node server.mjs --check
        $exit = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
    if ($exit -ne 0) {
        Write-Host "`n校验未通过：token 可能无效/过期，或学校关闭了 API 访问。" -ForegroundColor Red
        exit $exit
    }
}
