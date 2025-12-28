# VaultZero Browser Extension - Installation Guide

## 📋 Prerequisites

1. **VaultZero Desktop App** must be installed and running
2. **Windows 10/11** (64-bit)
3. **Chrome, Edge, or Brave** browser

---

## 🔧 Installation Steps

### Step 1: Build the Native Messaging Host

1. Open PowerShell in the `browser-extension/native-host` directory:
   ```powershell
   cd D:\Projects\passwordmanager\browser-extension\native-host
   ```

2. Download dependencies:
   ```powershell
   go mod download
   ```

3. Build the executable:
   ```powershell
   go build -o vaultzero-host.exe
   ```

4. Copy it to a permanent location:
   ```powershell
   $installPath = "$env:LOCALAPPDATA\VaultZero"
   New-Item -ItemType Directory -Force -Path $installPath
   Copy-Item vaultzero-host.exe "$installPath\vaultzero-host.exe"
   ```

### Step 2: Install the Chrome Extension (Developer Mode)

1. Open Chrome and navigate to:
   ```
   chrome://extensions/
   ```

2. Enable **"Developer mode"** (toggle in top-right)

3. Click **"Load unpacked"**

4. Select the folder:
   ```
   D:\Projects\passwordmanager\browser-extension\chrome-extension
   ```

5. **IMPORTANT**: Copy the Extension ID that appears (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

### Step 3: Create Native Messaging Manifest

1. Create the manifest file:
   ```powershell
   $manifestPath = "$env:LOCALAPPDATA\VaultZero\com.vaultzero.host.json"

   @"
{
  "name": "com.vaultzero.host",
  "description": "VaultZero Native Messaging Host",
  "path": "$env:LOCALAPPDATA\\VaultZero\\vaultzero-host.exe",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_EXTENSION_ID_HERE/"
  ]
}
"@ | Out-File -FilePath $manifestPath -Encoding UTF8
   ```

2. **Replace `YOUR_EXTENSION_ID_HERE`** with your actual extension ID from Step 2

### Step 4: Register in Windows Registry

Run this PowerShell script **AS ADMINISTRATOR**:

```powershell
# For Chrome
$chromeRegPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.vaultzero.host"
$manifestPath = "$env:LOCALAPPDATA\VaultZero\com.vaultzero.host.json"

New-Item -Path $chromeRegPath -Force | Out-Null
Set-ItemProperty -Path $chromeRegPath -Name "(Default)" -Value $manifestPath

Write-Host "✅ Chrome registry entry created"

# For Edge (if using Edge)
$edgeRegPath = "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.vaultzero.host"
New-Item -Path $edgeRegPath -Force | Out-Null
Set-ItemProperty -Path $edgeRegPath -Name "(Default)" -Value $manifestPath

Write-Host "✅ Edge registry entry created"

# Verify
if (Test-Path $chromeRegPath) {
    Write-Host "✅ Installation verified!"
} else {
    Write-Host "❌ Installation failed!"
}
```

---

## 🧪 Testing

### Test 1: Check Connection

1. Open VaultZero desktop app
2. Unlock your vault
3. Open Chrome
4. Click the VaultZero extension icon
5. It should show "Connected to VaultZero"

### Test 2: Auto-Fill

1. Go to a website you have saved (e.g., github.com)
2. Look for the VaultZero icon in the password field
3. Click it to auto-fill

### Test 3: Auto-Save

1. Log into a new website
2. After login, you should see a "Save to VaultZero?" prompt
3. Click "Save"

---

## 🐛 Troubleshooting

### Extension shows "VaultZero not running"

**Causes:**
1. VaultZero desktop app is not running
2. Vault is locked
3. Native messaging host not properly registered

**Solutions:**
```powershell
# Check if native host exists
Test-Path "$env:LOCALAPPDATA\VaultZero\vaultzero-host.exe"

# Check if registry entry exists
Test-Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.vaultzero.host"

# View registry value
Get-ItemProperty "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.vaultzero.host"

# Check extension logs
# Open chrome://extensions/ → VaultZero → "Inspect views: service worker"
```

### Native host debugging

Check the log file:
```powershell
notepad "$env:TEMP\vaultzero-native-host.log"
```

### Extension ID changed

If you reload the extension, the ID changes! You must:
1. Update the manifest JSON file with new ID
2. No need to re-register registry (path stays same)

---

## 📦 Automated Installation Script

Save this as `install-extension.ps1` and run as Administrator:

```powershell
#Requires -RunAsAdministrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VaultZero Browser Extension Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$installPath = "$env:LOCALAPPDATA\VaultZero"
$nativeHostPath = "$installPath\vaultzero-host.exe"
$manifestPath = "$installPath\com.vaultzero.host.json"

# Step 1: Build native host
Write-Host "[1/4] Building native messaging host..." -ForegroundColor Yellow
cd "D:\Projects\passwordmanager\browser-extension\native-host"
go build -o vaultzero-host.exe
if (-not $?) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green

# Step 2: Install to AppData
Write-Host "[2/4] Installing native host..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $installPath | Out-Null
Copy-Item vaultzero-host.exe $nativeHostPath -Force
Write-Host "✅ Installed to: $nativeHostPath" -ForegroundColor Green

# Step 3: Get Extension ID
Write-Host "[3/4] Please load the extension in Chrome and enter the Extension ID:" -ForegroundColor Yellow
Write-Host "   1. Open chrome://extensions/" -ForegroundColor Gray
Write-Host "   2. Enable Developer Mode" -ForegroundColor Gray
Write-Host "   3. Click 'Load unpacked'" -ForegroundColor Gray
Write-Host "   4. Select: D:\Projects\passwordmanager\browser-extension\chrome-extension" -ForegroundColor Gray
Write-Host ""
$extensionId = Read-Host "Extension ID"

if ([string]::IsNullOrWhiteSpace($extensionId)) {
    Write-Host "❌ Extension ID is required!" -ForegroundColor Red
    exit 1
}

# Step 4: Create manifest
Write-Host "[4/4] Creating native messaging manifest..." -ForegroundColor Yellow
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
Write-Host "✅ Manifest created" -ForegroundColor Green

# Step 5: Register in registry
Write-Host "[5/5] Registering in Windows Registry..." -ForegroundColor Yellow

# Chrome
$chromeRegPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.vaultzero.host"
New-Item -Path $chromeRegPath -Force | Out-Null
Set-ItemProperty -Path $chromeRegPath -Name "(Default)" -Value $manifestPath
Write-Host "✅ Chrome registry entry created" -ForegroundColor Green

# Edge
$edgeRegPath = "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.vaultzero.host"
New-Item -Path $edgeRegPath -Force | Out-Null
Set-ItemProperty -Path $edgeRegPath -Name "(Default)" -Value $manifestPath
Write-Host "✅ Edge registry entry created" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start VaultZero desktop app" -ForegroundColor White
Write-Host "2. Unlock your vault" -ForegroundColor White
Write-Host "3. Reload the extension in Chrome" -ForegroundColor White
Write-Host "4. Test by visiting a website with saved credentials" -ForegroundColor White
Write-Host ""
```

---

## 🔄 Updating the Extension

When you make changes to the extension:

1. **Code changes**: Just reload the extension in `chrome://extensions/`
2. **New features**: Reload and test
3. **Manifest changes**: May need to reload

No need to redo registry setup unless paths change!

---

## 🗑️ Uninstallation

```powershell
# Remove native host
Remove-Item "$env:LOCALAPPDATA\VaultZero" -Recurse -Force

# Remove registry entries
Remove-Item "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.vaultzero.host" -Force
Remove-Item "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.vaultzero.host" -Force

# Remove extension from Chrome
# Go to chrome://extensions/ and click "Remove"
```

---

## 📝 Notes

- Extension ID changes every time you "Load unpacked" unless you package it
- For production, you'd publish to Chrome Web Store (permanent ID)
- The native host must be in a permanent location (don't build and run from project folder)
- Registry entries are per-user (HKCU), no admin rights needed for normal use

---

## ✨ You're Done!

The extension is now installed and ready to use. Enjoy secure auto-fill with VaultZero! 🎉
