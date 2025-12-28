// VaultZero Popup Script

document.addEventListener('DOMContentLoaded', () => {
  init();
});

async function init() {
  const status = document.getElementById('status');
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const empty = document.getElementById('empty');
  const credentialsList = document.getElementById('credentials');

  // Get current tab URL
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];
  const url = new URL(currentTab.url).hostname;

  // Check connection to VaultZero
  chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
    if (response && response.success) {
      status.textContent = 'Connected to VaultZero';
    } else {
      status.textContent = 'VaultZero not running';
      loading.style.display = 'none';
      error.style.display = 'block';
      error.textContent = 'VaultZero is not running or vault is locked';
    }
  });

  // Get credentials for current site
  chrome.runtime.sendMessage({
    action: 'getCredentials',
    url: url
  }, (response) => {
    loading.style.display = 'none';

    if (!response || !response.success) {
      error.style.display = 'block';
      error.textContent = response?.error || 'Failed to get credentials';
      return;
    }

    const credentials = response.data?.credentials || [];

    if (credentials.length === 0) {
      empty.style.display = 'block';
    } else {
      credentialsList.style.display = 'block';
      renderCredentials(credentials, currentTab.id);
    }
  });
}

function renderCredentials(credentials, tabId) {
  const credentialsList = document.getElementById('credentials');
  credentialsList.innerHTML = '';

  credentials.forEach((cred) => {
    const item = document.createElement('div');
    item.className = 'credential-item';

    item.innerHTML = `
      <div class="credential-name">${escapeHtml(cred.serviceName || cred.url)}</div>
      <div class="credential-username">${escapeHtml(cred.username)}</div>
    `;

    item.addEventListener('click', () => {
      fillCredential(cred, tabId);
    });

    credentialsList.appendChild(item);
  });
}

function fillCredential(credential, tabId) {
  chrome.tabs.sendMessage(tabId, {
    action: 'fillCredential',
    credential: credential
  }, () => {
    window.close();
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
