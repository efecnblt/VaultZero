// VaultZero Background Service Worker
// Handles native messaging communication with VaultZero desktop app

const NATIVE_HOST_NAME = 'com.vaultzero.host';
let nativePort = null;
let pendingRequests = new Map();
let requestId = 0;

// Initialize native messaging connection
function connectNative() {
  if (nativePort) {
    return;
  }

  try {
    nativePort = chrome.runtime.connectNative(NATIVE_HOST_NAME);

    nativePort.onMessage.addListener((message) => {
      console.log('[VaultZero] Received from native:', message);
      handleNativeMessage(message);
    });

    nativePort.onDisconnect.addListener(() => {
      console.log('[VaultZero] Native host disconnected');
      if (chrome.runtime.lastError) {
        console.error('[VaultZero] Error:', chrome.runtime.lastError.message);
      }
      nativePort = null;

      // Reject all pending requests
      pendingRequests.forEach((resolve) => {
        resolve({ success: false, error: 'VaultZero disconnected' });
      });
      pendingRequests.clear();
    });

    console.log('[VaultZero] Connected to native host');
  } catch (error) {
    console.error('[VaultZero] Failed to connect to native host:', error);
    nativePort = null;
  }
}

// Send message to native host
function sendToNative(message) {
  return new Promise((resolve) => {
    if (!nativePort) {
      connectNative();
    }

    if (!nativePort) {
      resolve({ success: false, error: 'VaultZero is not running' });
      return;
    }

    const id = ++requestId;
    message.id = id;

    pendingRequests.set(id, resolve);

    try {
      nativePort.postMessage(message);
    } catch (error) {
      pendingRequests.delete(id);
      resolve({ success: false, error: error.message });
    }

    // Timeout after 5 seconds
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        resolve({ success: false, error: 'Request timeout' });
      }
    }, 5000);
  });
}

// Handle response from native host
function handleNativeMessage(message) {
  const id = message.id;
  if (id && pendingRequests.has(id)) {
    const resolve = pendingRequests.get(id);
    pendingRequests.delete(id);
    resolve(message);
  }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[VaultZero] Message from content script:', request.action);

  if (request.action === 'getCredentials') {
    sendToNative({
      type: 'getCredentials',
      data: { url: request.url }
    }).then(sendResponse);
    return true; // Keep channel open for async response

  } else if (request.action === 'saveCredential') {
    sendToNative({
      type: 'saveCredential',
      data: request.data
    }).then(sendResponse);
    return true;

  } else if (request.action === 'ping') {
    sendToNative({
      type: 'ping'
    }).then(sendResponse);
    return true;
  }

  return false;
});

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('[VaultZero] Extension installed');
  connectNative();
});

// Test connection on startup
connectNative();
