// VaultZero Content Script
// Detects login forms and provides auto-fill functionality

(function() {
  'use strict';

  const VAULTZERO_ICON = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTIgMkM5LjI0IDIgNyAzLjM1IDcgNVY3SDVDMy45IDcgMyA3LjkgMyA5VjIwQzMgMjEuMSAzLjkgMjIgNSAyMkgxOUMyMC4xIDIyIDIxIDIxLjEgMjEgMjBWOUMyMSA3LjkgMjAuMSA3IDE5IDdIMTdWNUMxNyAzLjM1IDE0Ljc2IDIgMTIgMlpNMTIgNEMxMy42NSA0IDE1IDQuNjcgMTUgNVY3SDlWNUM5IDQuNjcgMTAuMzUgNCAxMiA0Wk0xMiAxMEMxMy4xIDEwIDE0IDEwLjkgMTQgMTJDMTQgMTIuNzQgMTMuNiAxMy4zNyAxMyAxMy43MlYxNkMxMyAxNi41NSAxMi41NSAxNyAxMiAxN0MxMS40NSAxNyAxMSAxNi41NSAxMSAxNlYxMy43MkMxMC40IDEzLjM3IDEwIDEyLjc0IDEwIDEyQzEwIDEwLjkgMTAuOSAxMCAxMiAxMFoiIGZpbGw9IiMwZWE1ZTkiLz4KPC9zdmc+';

  let detectedFields = {
    username: null,
    password: null,
    form: null
  };

  let isVaultZeroReady = false;
  let currentUrl = window.location.hostname;

  // Initialize
  init();

  function init() {
    // Check if VaultZero is available
    checkVaultZeroConnection();

    // Detect forms on page load
    detectLoginForms();

    // Watch for dynamically added forms (SPAs)
    observeFormChanges();

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener(handleMessage);
  }

  // Check connection to VaultZero
  function checkVaultZeroConnection() {
    chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
      if (response && response.success) {
        isVaultZeroReady = true;
      } else {
        isVaultZeroReady = false;
      }
    });
  }

  // Detect login forms on the page
  function detectLoginForms() {
    const passwordFields = document.querySelectorAll('input[type="password"]');

    passwordFields.forEach((passwordField) => {
      const form = passwordField.closest('form');
      const usernameField = findUsernameField(passwordField, form);

      if (usernameField) {
        detectedFields.username = usernameField;
        detectedFields.password = passwordField;
        detectedFields.form = form;

        // Add VaultZero icon to password field
        addVaultZeroIcon(passwordField);

        // Add click/focus listeners to show credentials dropdown
        addAutoFillListeners(usernameField, passwordField);

        // Listen for form submission to capture credentials
        if (form) {
          form.addEventListener('submit', handleFormSubmit);
        }

        // Also listen for submit button clicks (for AJAX forms)
        addSubmitButtonListener(passwordField, form);
      }
    });
  }

  // Add listener to submit buttons for AJAX forms
  function addSubmitButtonListener(passwordField, form) {
    const container = form || document;

    // Find submit buttons
    const submitButtons = container.querySelectorAll(
      'button[type="submit"], input[type="submit"], button, [role="button"]'
    );

    submitButtons.forEach((button) => {
      if (button.dataset.vaultzeroSubmitListener) {
        return;
      }
      button.dataset.vaultzeroSubmitListener = 'true';

      button.addEventListener('click', (e) => {
        // Small delay to let form fields update
        setTimeout(() => {
          const username = detectedFields.username?.value;
          const password = detectedFields.password?.value;

          if (username && password) {
            console.log('[VaultZero] Login detected, checking if need to save...');
            checkAndOfferToSave(username, password);
          }
        }, 100);
      }, true);
    });
  }

  // Add listeners to show credentials when clicking on fields
  function addAutoFillListeners(usernameField, passwordField) {
    // Avoid duplicate listeners
    if (usernameField.dataset.vaultzeroListener || passwordField.dataset.vaultzeroListener) {
      return;
    }

    usernameField.dataset.vaultzeroListener = 'true';
    passwordField.dataset.vaultzeroListener = 'true';

    // Show credentials when clicking on username field
    usernameField.addEventListener('focus', () => {
      showCredentialSelectorOnField(usernameField);
    });

    usernameField.addEventListener('click', () => {
      showCredentialSelectorOnField(usernameField);
    });

    // Show credentials when clicking on password field
    passwordField.addEventListener('focus', () => {
      showCredentialSelectorOnField(passwordField);
    });

    passwordField.addEventListener('click', () => {
      showCredentialSelectorOnField(passwordField);
    });

    // Monitor for filled credentials (alternative to button click)
    let lastUsername = '';
    let lastPassword = '';

    const checkForFilledCredentials = () => {
      const username = usernameField.value;
      const password = passwordField.value;

      // If both fields have values and they changed
      if (username && password && (username !== lastUsername || password !== lastPassword)) {
        lastUsername = username;
        lastPassword = password;

        // Wait a bit to see if login happens
        setTimeout(() => {
          // Check if fields still have values (user didn't clear them)
          if (usernameField.value && passwordField.value) {
            console.log('[VaultZero] Login detected, checking if need to save...');
            checkAndOfferToSave(usernameField.value, passwordField.value);
          }
        }, 2000);
      }
    };

    passwordField.addEventListener('blur', checkForFilledCredentials);
  }

  // Show credential selector positioned under the field
  function showCredentialSelectorOnField(field) {
    if (!isVaultZeroReady) {
      return;
    }

    chrome.runtime.sendMessage({
      action: 'getCredentials',
      url: currentUrl
    }, (response) => {
      if (response && response.success && response.data && response.data.credentials) {
        const credentials = response.data.credentials;

        if (credentials.length > 0) {
          showCredentialMenu(credentials, field);
        }
      }
    });
  }

  // Find the username/email field (or any identifier field like TC Kimlik No)
  function findUsernameField(passwordField, form) {
    const container = form || document;

    // Common username field selectors (prioritized)
    const selectors = [
      'input[type="email"]',
      'input[type="text"][name*="user"]',
      'input[type="text"][name*="email"]',
      'input[type="text"][id*="user"]',
      'input[type="text"][id*="email"]',
      'input[type="text"][autocomplete="username"]',
      'input[type="text"][autocomplete="email"]',
      'input[type="tel"]',  // Phone numbers
      'input[type="number"]',  // ID numbers (TC Kimlik No, etc.)
      'input[type="text"][name*="kimlik"]',  // Turkish ID
      'input[type="text"][id*="kimlik"]',
      'input[type="text"][name*="identity"]',
      'input[type="text"][id*="identity"]'
    ];

    for (const selector of selectors) {
      const field = container.querySelector(selector);
      if (field && isBeforeInDOM(field, passwordField)) {
        return field;
      }
    }

    // Fallback: find ANY visible text/number/tel input before password field
    const allInputs = Array.from(container.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"]'));
    return allInputs.find(input => {
      // Check if it's visible and comes before password field
      const isVisible = input.offsetParent !== null;
      const isBefore = isBeforeInDOM(input, passwordField);
      return isVisible && isBefore;
    });
  }

  // Check if element A comes before element B in DOM
  function isBeforeInDOM(a, b) {
    return !!(b.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_PRECEDING);
  }

  // Add VaultZero icon to password field
  function addVaultZeroIcon(passwordField) {
    // Avoid duplicates
    if (passwordField.dataset.vaultzeroIcon) {
      return;
    }
    passwordField.dataset.vaultzeroIcon = 'true';

    // Create icon button
    const icon = document.createElement('div');
    icon.className = 'vaultzero-icon';
    icon.innerHTML = `<img src="${VAULTZERO_ICON}" alt="VaultZero" />`;
    icon.title = 'Auto-fill with VaultZero';

    // Position icon
    positionIcon(icon, passwordField);

    // Click handler
    icon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showCredentialSelector(passwordField);
    });

    // Reposition on resize
    window.addEventListener('resize', () => positionIcon(icon, passwordField));
  }

  // Position icon relative to password field
  function positionIcon(icon, field) {
    const rect = field.getBoundingClientRect();
    icon.style.position = 'absolute';
    icon.style.top = `${rect.top + window.scrollY + (rect.height - 24) / 2}px`;
    icon.style.left = `${rect.left + window.scrollX + rect.width - 30}px`;
    icon.style.width = '24px';
    icon.style.height = '24px';
    icon.style.cursor = 'pointer';
    icon.style.zIndex = '10000';

    if (!icon.parentElement) {
      document.body.appendChild(icon);
    }
  }

  // Show credential selector
  function showCredentialSelector(passwordField) {
    chrome.runtime.sendMessage({
      action: 'getCredentials',
      url: currentUrl
    }, (response) => {
      if (response && response.success && response.data && response.data.credentials) {
        const credentials = response.data.credentials;

        if (credentials.length === 0) {
          showNotification('No credentials found for this site');
        } else if (credentials.length === 1) {
          fillCredentials(credentials[0]);
        } else {
          showCredentialMenu(credentials, passwordField);
        }
      } else {
        showNotification('VaultZero is locked or not running');
      }
    });
  }

  // Show menu to select from multiple credentials
  function showCredentialMenu(credentials, field) {
    // Remove existing menu
    const existing = document.querySelector('.vaultzero-menu');
    if (existing) {
      existing.remove();
    }

    // Create menu
    const menu = document.createElement('div');
    menu.className = 'vaultzero-menu';

    credentials.forEach((cred) => {
      const item = document.createElement('div');
      item.className = 'vaultzero-menu-item';

      const content = document.createElement('div');
      content.innerHTML = `
        <div class="vaultzero-menu-item-name">${escapeHtml(cred.serviceName || cred.url)}</div>
        <div class="vaultzero-menu-item-username">${escapeHtml(cred.username)}</div>
      `;
      item.appendChild(content);

      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fillCredentials(cred);
        menu.remove();
      });
      menu.appendChild(item);
    });

    // Position menu below the field
    const rect = field.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.top = `${rect.bottom + window.scrollY + 2}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;
    menu.style.minWidth = `${rect.width}px`;

    document.body.appendChild(menu);

    // Close on click outside or escape key
    setTimeout(() => {
      const closeMenu = (e) => {
        if (!menu.contains(e.target) && e.target !== field) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
          document.removeEventListener('keydown', handleEscape);
        }
      };

      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          menu.remove();
          document.removeEventListener('click', closeMenu);
          document.removeEventListener('keydown', handleEscape);
        }
      };

      document.addEventListener('click', closeMenu);
      document.addEventListener('keydown', handleEscape);
    }, 100);
  }

  // Fill credentials into form
  function fillCredentials(credential) {
    if (detectedFields.username) {
      detectedFields.username.value = credential.username;
      detectedFields.username.dispatchEvent(new Event('input', { bubbles: true }));
      detectedFields.username.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (detectedFields.password) {
      detectedFields.password.value = credential.password;
      detectedFields.password.dispatchEvent(new Event('input', { bubbles: true }));
      detectedFields.password.dispatchEvent(new Event('change', { bubbles: true }));
    }

    showNotification('Auto-filled from VaultZero');
  }

  // Handle form submission (to offer saving)
  function handleFormSubmit(e) {
    const username = detectedFields.username?.value;
    const password = detectedFields.password?.value;

    if (username && password) {
      checkAndOfferToSave(username, password);
    }
  }

  // Track if we already offered to save (prevent duplicates)
  let saveOffered = false;

  // Check if credential exists, if not offer to save
  function checkAndOfferToSave(username, password) {
    // Prevent duplicate prompts
    if (saveOffered) {
      console.log('[VaultZero] Already offered to save, skipping');
      return;
    }

    console.log('[VaultZero] Checking if credential exists...');

    chrome.runtime.sendMessage({
      action: 'getCredentials',
      url: currentUrl
    }, (response) => {
      console.log('[VaultZero] Check response:', response);

      if (response && response.success && response.data && response.data.credentials) {
        const credentials = response.data.credentials;

        // Check if this username already exists
        const alreadyExists = credentials.some(cred =>
          cred.username.toLowerCase() === username.toLowerCase()
        );

        if (alreadyExists) {
          console.log('[VaultZero] Credential already exists, not saving');
          return; // Already saved
        }

        // Mark as offered to prevent duplicates
        saveOffered = true;

        // New credential - prompt to save
        console.log('[VaultZero] Offering to save new credential');
        setTimeout(() => {
          offerToSave(username, password);
        }, 1500);
      } else {
        // Mark as offered to prevent duplicates
        saveOffered = true;

        // No existing credentials, offer to save
        console.log('[VaultZero] No existing credentials, offering to save');
        setTimeout(() => {
          offerToSave(username, password);
        }, 1500);
      }
    });
  }

  // Offer to save credentials
  function offerToSave(username, password) {
    console.log('[VaultZero] Showing save prompt');

    const notification = document.createElement('div');
    notification.className = 'vaultzero-save-prompt';
    notification.innerHTML = `
      <div class="vaultzero-save-content">
        <strong>Save to VaultZero?</strong>
        <div class="vaultzero-save-details">${escapeHtml(username)} on ${escapeHtml(currentUrl)}</div>
        <div class="vaultzero-save-buttons">
          <button class="vaultzero-btn-save">Save</button>
          <button class="vaultzero-btn-cancel">Not now</button>
        </div>
      </div>
    `;

    notification.querySelector('.vaultzero-btn-save').addEventListener('click', () => {
      saveCredential(username, password);
      notification.remove();
      // Reset flag in case they want to save another credential later
      saveOffered = false;
    });

    notification.querySelector('.vaultzero-btn-cancel').addEventListener('click', () => {
      notification.remove();
      // Reset flag so it can ask again on next login attempt
      setTimeout(() => {
        saveOffered = false;
        console.log('[VaultZero] Reset save flag - will ask again next time');
      }, 5000); // Wait 5 seconds before allowing another prompt
    });

    document.body.appendChild(notification);

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
        setTimeout(() => {
          saveOffered = false;
        }, 5000);
      }
    }, 10000);
  }

  // Save credential to VaultZero
  function saveCredential(username, password) {
    chrome.runtime.sendMessage({
      action: 'saveCredential',
      data: {
        serviceName: currentUrl,
        url: window.location.href,
        username: username,
        password: password,
        category: 'Other'
      }
    }, (response) => {
      if (response && response.success) {
        showNotification('Saved to VaultZero!');
      } else {
        showNotification('Failed to save - is VaultZero unlocked?');
      }
    });
  }

  // Show notification
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'vaultzero-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
  }

  // Observe DOM changes for SPA
  function observeFormChanges() {
    const observer = new MutationObserver(() => {
      detectLoginForms();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Handle messages from popup/background
  function handleMessage(request, sender, sendResponse) {
    if (request.action === 'fillCredential') {
      fillCredentials(request.credential);
      sendResponse({ success: true });
    }
    return false;
  }

  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

})();
