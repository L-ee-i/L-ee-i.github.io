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
    Write-Host '加密字典已更新并通过本地检查。' -ForegroundColor Green

    $publish = Read-Host '是否立即发布到 GitHub？输入 Y 发布，直接回车仅保留在本地'
    if ($publish -match '^[Yy]$') {
        git add -- source/dictionary/knowledge.enc
        $pending = git diff --cached --name-only -- source/dictionary/knowledge.enc
        if ($pending) {
            $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
            git commit -m "Update encrypted dictionary $stamp"
            if ($LASTEXITCODE -ne 0) { throw 'Git 提交失败。' }
            git push origin main
            if ($LASTEXITCODE -ne 0) { throw 'GitHub 推送失败。' }
            Write-Host '已推送，GitHub Pages 正在自动部署。' -ForegroundColor Green
        } else {
            Write-Host '加密包没有变化，无需重复发布。'
        }
    }
} finally {
    $env:DICTIONARY_PASSWORD = $null
    $plainPassword = $null
    if ($passwordPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    }
    Pop-Location -ErrorAction SilentlyContinue
}
