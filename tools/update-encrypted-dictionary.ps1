$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host 'Lee Security Dictionary - 加密更新' -ForegroundColor Magenta
Write-Host '口令仅在本次进程内使用，不会保存到文件或仓库。'
$securePassword = Read-Host '请输入至少 16 个字符的字典口令' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    if ($plainPassword.Length -lt 16) {
        throw '口令长度不足 16 个字符。'
    }

    Push-Location $projectRoot
    $env:DICTIONARY_PASSWORD = $plainPassword
    npm run knowledge:check
    if ($LASTEXITCODE -ne 0) { throw '知识库安全检查失败。' }
    npm run knowledge:sync
    if ($LASTEXITCODE -ne 0) { throw '知识库加密失败。' }
    npm run rebuild
    if ($LASTEXITCODE -ne 0) { throw 'Hexo 构建失败。' }
    npm run verify:output
    if ($LASTEXITCODE -ne 0) { throw '生成结果检查失败。' }
    Write-Host ''
    Write-Host '加密字典已更新并通过本地检查。需要发布时提交并推送博客仓库。' -ForegroundColor Green
} finally {
    $env:DICTIONARY_PASSWORD = $null
    $plainPassword = $null
    if ($passwordPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    }
    Pop-Location -ErrorAction SilentlyContinue
}
