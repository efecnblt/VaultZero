package main

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx          context.Context
	vault        *Vault
	masterKey    []byte
	storage      *StorageManager
	ipcServer    *IPCServer
	isUnlocked   bool
	passwordHash string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts
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
		println("Warning: Failed to start IPC server for browser extension:", err.Error())
	} else {
		println("IPC server started - browser extension ready")
	}
}

// domReady is called after front-end resources have been loaded
func (a *App) domReady(ctx context.Context) {
	// Add your action here
}

// beforeClose is called when the application is about to quit
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	return false
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	// Stop IPC server
	if a.ipcServer != nil {
		a.ipcServer.Stop()
		println("IPC server stopped")
	}
}

// CheckVaultExists checks if a vault file already exists
func (a *App) CheckVaultExists() bool {
	return a.storage.VaultExists()
}

// CreateVault initializes a new vault with a master password
func (a *App) CreateVault(masterPassword string) error {
	if a.storage.VaultExists() {
		return errors.New("vault already exists")
	}

	// Generate salt
	salt, err := GenerateSalt()
	if err != nil {
		return err
	}

	// Derive master key
	a.masterKey = DeriveKey(masterPassword, salt)
	a.passwordHash = HashPassword(masterPassword)

	// Create empty vault
	a.vault = &Vault{
		Credentials: []Credential{},
		Salt:        salt,
	}

	// Save vault
	if err := a.storage.SaveVault(a.vault, a.masterKey); err != nil {
		return err
	}

	a.isUnlocked = true
	return nil
}

// UnlockVault unlocks an existing vault with the master password
func (a *App) UnlockVault(masterPassword string) error {
	if !a.storage.VaultExists() {
		return errors.New("vault does not exist")
	}

	// Load the salt first (stored separately, unencrypted)
	salt, err := a.storage.LoadSalt()
	if err != nil {
		return errors.New("vault corrupted: salt not found")
	}

	// Derive the master key using the password and salt
	a.masterKey = DeriveKey(masterPassword, salt)

	// Now load and decrypt the vault with the derived key
	vault, err := a.storage.LoadVault(a.masterKey, salt)
	if err != nil {
		return err
	}

	a.vault = vault
	a.passwordHash = HashPassword(masterPassword)
	a.isUnlocked = true

	return nil
}

// IsUnlocked checks if the vault is currently unlocked
func (a *App) IsUnlocked() bool {
	return a.isUnlocked
}

// ChangeMasterPassword changes the master password and re-encrypts the vault
func (a *App) ChangeMasterPassword(currentPassword, newPassword string) error {
	if !a.isUnlocked {
		return errors.New("vault is locked")
	}

	// Verify current password
	if !VerifyPassword(currentPassword, a.passwordHash) {
		return errors.New("current password is incorrect")
	}

	// Validate new password
	if len(newPassword) < 8 {
		return errors.New("new password must be at least 8 characters")
	}

	// Generate new salt
	newSalt, err := GenerateSalt()
	if err != nil {
		return errors.New("failed to generate new salt")
	}

	// Derive new master key
	newMasterKey := DeriveKey(newPassword, newSalt)

	// Update vault salt
	a.vault.Salt = newSalt

	// Save vault with new key
	if err := a.storage.SaveVault(a.vault, newMasterKey); err != nil {
		return errors.New("failed to save vault with new password")
	}

	// Update in-memory references
	a.masterKey = newMasterKey
	a.passwordHash = HashPassword(newPassword)

	return nil
}

// GetAllCredentials returns all credentials from the vault
func (a *App) GetAllCredentials() ([]Credential, error) {
	if !a.isUnlocked {
		return nil, errors.New("vault is locked")
	}
	return a.vault.Credentials, nil
}

// AddCredential adds a new credential to the vault
func (a *App) AddCredential(serviceName, urlStr, username, password, category string) error {
	if !a.isUnlocked {
		return errors.New("vault is locked")
	}

	credential := Credential{
		ID:          uuid.New().String(),
		ServiceName: serviceName,
		URL:         urlStr,
		Username:    username,
		Password:    password,
		Category:    category,
		IconURL:     FetchFavicon(urlStr),
		CreatedAt:   time.Now(),
	}

	a.vault.Credentials = append(a.vault.Credentials, credential)

	// Save vault
	err := a.storage.SaveVault(a.vault, a.masterKey)
	if err != nil {
		return err
	}

	// Emit event to notify frontend
	runtime.EventsEmit(a.ctx, "credentials-updated")

	return nil
}

// UpdateCredential updates an existing credential
func (a *App) UpdateCredential(id, serviceName, urlStr, username, password, category string) error {
	if !a.isUnlocked {
		return errors.New("vault is locked")
	}

	for i, cred := range a.vault.Credentials {
		if cred.ID == id {
			a.vault.Credentials[i].ServiceName = serviceName
			a.vault.Credentials[i].URL = urlStr
			a.vault.Credentials[i].Username = username
			a.vault.Credentials[i].Password = password
			a.vault.Credentials[i].Category = category
			a.vault.Credentials[i].IconURL = FetchFavicon(urlStr)

			return a.storage.SaveVault(a.vault, a.masterKey)
		}
	}

	return errors.New("credential not found")
}

// DeleteCredential removes a credential from the vault
func (a *App) DeleteCredential(id string) error {
	if !a.isUnlocked {
		return errors.New("vault is locked")
	}

	for i, cred := range a.vault.Credentials {
		if cred.ID == id {
			a.vault.Credentials = append(a.vault.Credentials[:i], a.vault.Credentials[i+1:]...)
			return a.storage.SaveVault(a.vault, a.masterKey)
		}
	}

	return errors.New("credential not found")
}

// ToggleFavorite toggles the favorite status of a credential
func (a *App) ToggleFavorite(id string) error {
	if !a.isUnlocked {
		return errors.New("vault is locked")
	}

	for i, cred := range a.vault.Credentials {
		if cred.ID == id {
			a.vault.Credentials[i].IsFavorite = !a.vault.Credentials[i].IsFavorite
			if err := a.storage.SaveVault(a.vault, a.masterKey); err != nil {
				return err
			}
			runtime.EventsEmit(a.ctx, "credentials-updated")
			return nil
		}
	}

	return errors.New("credential not found")
}

// CopyPassword copies a password to clipboard with auto-clear
func (a *App) CopyPassword(id string) error {
	if !a.isUnlocked {
		return errors.New("vault is locked")
	}

	for _, cred := range a.vault.Credentials {
		if cred.ID == id {
			return ClipboardCopy(cred.Password)
		}
	}

	return errors.New("credential not found")
}

// CopyUsername copies a username to clipboard with auto-clear
func (a *App) CopyUsername(id string) error {
	if !a.isUnlocked {
		return errors.New("vault is locked")
	}

	for _, cred := range a.vault.Credentials {
		if cred.ID == id {
			return ClipboardCopy(cred.Username)
		}
	}

	return errors.New("credential not found")
}

// GeneratePasswordWithOptions generates a password with custom options
func (a *App) GeneratePasswordWithOptions(options PasswordGeneratorOptions) (string, error) {
	return GeneratePassword(options)
}

// GenerateQuickPassword generates a strong password with default settings
func (a *App) GenerateQuickPassword(length int) (string, error) {
	if length < 8 {
		length = 16
	}
	return GenerateStrongPassword(length)
}

// LockVault locks the vault and clears sensitive data from memory
func (a *App) LockVault() {
	a.isUnlocked = false
	a.masterKey = nil
	a.vault = nil
}

// DeleteVault permanently deletes the vault (use with caution!)
func (a *App) DeleteVault() error {
	// Lock first
	a.LockVault()

	// Delete vault files
	return a.storage.DeleteVault()
}

// ExportToCSV exports all credentials to a CSV file
func (a *App) ExportToCSV() (string, error) {
	if !a.isUnlocked {
		return "", errors.New("vault is locked")
	}

	// Let user choose where to save
	filePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: "vaultzero-export.csv",
		Title:           "Export Credentials to CSV",
		Filters: []runtime.FileFilter{
			{DisplayName: "CSV Files (*.csv)", Pattern: "*.csv"},
		},
	})

	if err != nil || filePath == "" {
		return "", errors.New("export cancelled")
	}

	// Export to CSV
	err = ExportCredentialsToCSV(a.vault.Credentials, filePath)
	if err != nil {
		return "", err
	}

	return filePath, nil
}

// ExportEncryptedBackup creates an encrypted backup of the entire vault
func (a *App) ExportEncryptedBackup() (string, error) {
	if !a.isUnlocked {
		return "", errors.New("vault is locked")
	}

	// Let user choose where to save
	filePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: "vaultzero-backup.vault",
		Title:           "Export Encrypted Backup",
		Filters: []runtime.FileFilter{
			{DisplayName: "Vault Backup (*.vault)", Pattern: "*.vault"},
		},
	})

	if err != nil || filePath == "" {
		return "", errors.New("export cancelled")
	}

	// Create encrypted backup
	err = a.storage.ExportEncryptedBackup(a.vault, a.masterKey, filePath)
	if err != nil {
		return "", err
	}

	return filePath, nil
}

// ImportEncryptedBackup imports credentials from an encrypted backup file
func (a *App) ImportEncryptedBackup() (*ImportResult, error) {
	if !a.isUnlocked {
		return nil, errors.New("vault is locked")
	}

	// Let user choose backup file
	filePath, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Import Encrypted Backup",
		Filters: []runtime.FileFilter{
			{DisplayName: "Vault Backup (*.vault)", Pattern: "*.vault"},
		},
	})

	if err != nil || filePath == "" {
		return nil, errors.New("import cancelled")
	}

	// Load and decrypt backup
	credentials, err := a.storage.ImportEncryptedBackup(filePath, a.masterKey)
	if err != nil {
		return nil, err
	}

	// Import credentials
	result := &ImportResult{
		TotalProcessed: len(credentials),
		Errors:         []string{},
	}

	for _, cred := range credentials {
		// Check if credential already exists (by URL + username)
		exists := false
		for _, existingCred := range a.vault.Credentials {
			if existingCred.URL == cred.URL && existingCred.Username == cred.Username {
				exists = true
				break
			}
		}

		if exists {
			result.Skipped++
			continue
		}

		// Add to vault
		a.vault.Credentials = append(a.vault.Credentials, cred)
		result.Imported++
	}

	// Save vault if any credentials were imported
	if result.Imported > 0 {
		if err := a.storage.SaveVault(a.vault, a.masterKey); err != nil {
			return nil, err
		}

		// Emit event to notify frontend
		runtime.EventsEmit(a.ctx, "credentials-updated")
	}

	return result, nil
}