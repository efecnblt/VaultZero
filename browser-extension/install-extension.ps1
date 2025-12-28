#Requires -RunAsAdministrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VaultZero Browser Extension Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$installPath = "$env:LOCALAPPDATA\VaultZero"
$nativeHostPath = "$installPath\vaultzero-host.exe"
$manifestPath = "$installPath\com.vaultzero.host.json"
$projectPath = "D:\Projects\passwordmanager"

# Step 1: Build native host
Write-Host "[1/5] Building native messaging host..." -ForegroundColor Yellow
Set-Location "$projectPath\browser-extension\native-host"

# Check if Go is installed
$goVersion = & go version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Go is not installed! Please install Go first." -ForegroundColor Red
    exit 1
}

# Build
& go build -o vaultzero-host.exe
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green

# Step 2: Install to AppData
Write-Host "[2/5] Installing native host..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $installPath | Out-Null
Copy-Item vaultzero-host.exe $nativeHostPath -Force
Write-Host "✅ Installed to: $nativeHostPath" -ForegroundColor Green

# Step 3: Load extension and get ID
Write-Host "[3/5] Extension Installation" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please follow these steps to load the extension:" -ForegroundColor Cyan
Write-Host "   1. Open Chrome/Edge browser" -ForegroundColor White
Write-Host "   2. Navigate to: chrome://extensions/" -ForegroundColor White
Write-Host "   3. Enable 'Developer mode' (toggle in top-right)" -ForegroundColor White
Write-Host "   4. Click 'Load unpacked'" -ForegroundColor White
Write-Host "   5. Select folder: $projectPath\browser-extension\chrome-extension" -ForegroundColor White
Write-Host "   6. Copy the Extension ID (looks like: abcdefghijklmnop...)" -ForegroundColor White
Write-Host ""
$extensionId = Read-Host "Paste Extension ID here"

if ([string]::IsNullOrWhiteSpace($extensionId)) {
    Write-Host "❌ Extension ID is required!" -ForegroundColor Red
    exit 1
}

# Validate extension ID format
if ($extensionId.Length -lt 32) {
    Write-Host "❌ Extension ID looks invalid (too short)" -ForegroundColor Red
    exit 1
}

# Step 4: Create manifest
Write-Host "[4/5] Creating native messaging manifest..." -ForegroundColor Yellow
$manifestContent = @"
{
  "name": "com.vaultzero.host",
  "description": "VaultZero Native Messaging Host",
  "path": "$($nativeHostPath.Replace('\', '\\'))",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$extensionId/"
  ]
}
"@

$manifestContent | Out-File -FilePath $manifestPath -Encoding UTF8 -NoNewline
Write-Host "✅ Manifest created: $manifestPath" -ForegroundColor Green

# Step 5: Register in registry
Write-Host "[5/5] Registering in Windows Registry..." -ForegroundColor Yellow

# Chrome
try {
    $chromeRegPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.vaultzero.host"
    New-Item -Path $chromeRegPath -Force | Out-Null
    Set-ItemProperty -Path $chromeRegPath -Name "(Default)" -Value $manifestPath
    Write-Host "✅ Chrome registry entry created" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Chrome registry entry failed (Chrome might not be installed)" -ForegroundColor Yellow
}

# Edge
try {
    $edgeRegPath = "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.vaultzero.host"
    New-Item -Path $edgeRegPath -Force | Out-Null
    Set-ItemProperty -Path $edgeRegPath -Name "(Default)" -Value $manifestPath
    Write-Host "✅ Edge registry entry created" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Edge registry entry failed (Edge might not be installed)" -ForegroundColor Yellow
}

# Brave (uses Chrome's registry path)
Write-Host "✅ Brave will use Chrome's registry entry" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Installation Summary:" -ForegroundColor Cyan
Write-Host "  Native Host: $nativeHostPath" -ForegroundColor White
Write-Host "  Manifest: $manifestPath" -ForegroundColor White
Write-Host "  Extension ID: $extensionId" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. ✅ Extension is loaded in your browser" -ForegroundColor Green
Write-Host "  2. Start VaultZero desktop app (if not running)" -ForegroundColor White
Write-Host "  3. Unlock your vault" -ForegroundColor White
Write-Host "  4. Click the VaultZero icon in browser toolbar" -ForegroundColor White
Write-Host "  5. It should show 'Connected to VaultZero'" -ForegroundColor White
Write-Host "  6. Visit a website with saved credentials to test auto-fill" -ForegroundColor White
Write-Host ""
Write-Host "Troubleshooting:" -ForegroundColor Cyan
Write-Host "  - If 'not connected', restart VaultZero desktop app" -ForegroundColor White
Write-Host "  - Check logs: $env:TEMP\vaultzero-native-host.log" -ForegroundColor White
Write-Host "  - Reload extension in chrome://extensions/" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Enjoy secure password management with VaultZero!" -ForegroundColor Green
Write-Host ""
