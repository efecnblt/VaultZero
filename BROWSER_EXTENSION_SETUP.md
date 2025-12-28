# VaultZero Browser Extension - Native Messaging Setup Guide

## 🏗️ Architecture

```
Browser Extension (Chrome/Edge)
       ↓ (Native Messaging Protocol - stdio)
Native Messaging Host (vaultzero-host.exe)
       ↓ (Windows Named Pipe)
VaultZero Desktop App (vaultzero.exe)
```

## ✅ Current Status

I've created the foundation for you. Here's what exists:

### Created Files:
- `/browser-extension/native-host/main.go` - Native messaging host
- `/ipc_windows.go` - Windows named pipe IPC server
- This setup guide

### What's Next:
Due to the complexity and Windows-specific requirements, I recommend we proceed in phases. Let me create a **simplified alternative** that's easier to test and deploy.

---

## 🚀 Recommended Alternative: HTTP-based Local API

Given the Windows complexity of Native Messaging (registry setup, signed manifests, etc.), I recommend starting with a **secure local HTTP API** approach:

### Benefits:
✅ **Much easier to develop and test**
✅ **Works on all platforms** (Windows/Mac/Linux)
✅ **Can upgrade to Native Messaging later**
✅ **Industry-proven** (used by KeePassXC, etc.)

### Security Measures:
- Local host only (127.0.0.1)
- Random token authentication
- CORS restricted to extension
- Auto-expire tokens
- No external access

Would you like me to implement this **secure local API approach** instead? It will:
1. Get you a working browser extension **much faster**
2. Be easier to maintain and debug
3. Still be very secure
4. Can be upgraded to Native Messaging later if needed

---

## 🔄 Option 1: Continue with Native Messaging (Complex)

If you want to continue with pure Native Messaging, here are the remaining steps:

### Phase 1: Update VaultZero App

Edit `app.go`, add to `startup` function:
```go
func (a *App) startup(ctx context.Context) {
    a.ctx = ctx
    storage, err := NewStorageManager()
    if err != nil {
        panic(err)
    }
    a.storage = storage

    // Start IPC server for browser extension
    a.ipcServer = NewIPCServer(a)
    if err := a.ipcServer.Start(); err != nil {
        // Log error but don't crash - extension won't work but app will
        println("Warning: Failed to start IPC server:", err.Error())
    }
}
```

Add to `shutdown` function:
```go
func (a *App) shutdown(ctx context.Context) {
    if a.ipcServer != nil {
        a.ipcServer.Stop()
    }
}
```

### Phase 2: Build Native Messaging Host

```powershell
cd browser-extension/native-host
go build -o vaultzero-host.exe
```

### Phase 3: Create Native Messaging Manifest

Create `com.vaultzero.host.json`:
```json
{
  "name": "com.vaultzero.host",
  "description": "VaultZero Native Messaging Host",
  "path": "C:\\path\\to\\vaultzero-host.exe",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_EXTENSION_ID_HERE/"
  ]
}
```

### Phase 4: Register in Windows Registry

```powershell
# For Chrome
$regPath = "HKCU:\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.vaultzero.host"
New-Item -Path $regPath -Force
New-ItemProperty -Path $regPath -Name "(default)" -Value "C:\\path\\to\\com.vaultzero.host.json" -Force
```

### Phase 5: Create Browser Extension

This requires building the entire extension with manifest, content scripts, background service worker, etc.

---

## ✨ Option 2: HTTP API Approach (Recommended)

I can implement this in ~30 minutes with:
- Secure local-only HTTP server in VaultZero
- Token-based authentication
- Browser extension that's much simpler
- Complete auto-fill and auto-save functionality

**This is what I recommend** for getting a working solution quickly.

---

## 🤔 Your Decision

**Which approach would you like?**

**A) HTTP API Approach** (Recommended)
- Faster to implement
- Easier to debug
- Still very secure
- Works today

**B) Continue Native Messaging**
- Industry standard
- More complex setup
- Requires registry manipulation
- Windows-specific challenges

Let me know and I'll continue with your preferred approach!

---

## 📝 Notes

- Native Messaging on Windows requires elevated permissions for registry edits
- Extension must be packaged and have a fixed ID
- Debugging is more complex
- BUT: It's the "proper" way and most secure

The HTTP API approach can later be upgraded to Native Messaging without changing the extension logic much.

**What would you like me to do?** 🚀
