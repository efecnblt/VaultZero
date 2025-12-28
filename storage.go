package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
)

const (
	vaultFileName = "vault.dat"
	saltFileName  = "vault.salt"
)

// StorageManager handles vault file operations
type StorageManager struct {
	vaultPath string
	saltPath  string
}

// NewStorageManager creates a new storage manager
func NewStorageManager() (*StorageManager, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	vaultDir := filepath.Join(homeDir, ".vaultzero")
	if err := os.MkdirAll(vaultDir, 0700); err != nil {
		return nil, err
	}

	return &StorageManager{
		vaultPath: filepath.Join(vaultDir, vaultFileName),
		saltPath:  filepath.Join(vaultDir, saltFileName),
	}, nil
}

// SaveSalt saves the salt to disk (unencrypted)
func (sm *StorageManager) SaveSalt(salt []byte) error {
	encoded := base64.StdEncoding.EncodeToString(salt)
	return os.WriteFile(sm.saltPath, []byte(encoded), 0600)
}

// LoadSalt loads the salt from disk
func (sm *StorageManager) LoadSalt() ([]byte, error) {
	if _, err := os.Stat(sm.saltPath); os.IsNotExist(err) {
		return nil, errors.New("salt file does not exist")
	}

	encoded, err := os.ReadFile(sm.saltPath)
	if err != nil {
		return nil, err
	}

	salt, err := base64.StdEncoding.DecodeString(string(encoded))
	if err != nil {
		return nil, err
	}

	return salt, nil
}

// SaveVault encrypts and saves the vault to disk
func (sm *StorageManager) SaveVault(vault *Vault, masterKey []byte) error {
	// Save salt separately first
	if err := sm.SaveSalt(vault.Salt); err != nil {
		return err
	}

	// Serialize vault to JSON (including credentials only, not salt)
	data, err := json.Marshal(vault.Credentials)
	if err != nil {
		return err
	}

	// Encrypt the JSON data
	encrypted, err := Encrypt(data, masterKey)
	if err != nil {
		return err
	}

	// Write to file
	return os.WriteFile(sm.vaultPath, []byte(encrypted), 0600)
}

// LoadVault loads and decrypts the vault from disk
func (sm *StorageManager) LoadVault(masterKey []byte, salt []byte) (*Vault, error) {
	// Check if vault exists
	if _, err := os.Stat(sm.vaultPath); os.IsNotExist(err) {
		return nil, errors.New("vault does not exist")
	}

	// Read encrypted data
	encrypted, err := os.ReadFile(sm.vaultPath)
	if err != nil {
		return nil, err
	}

	// Decrypt
	decrypted, err := Decrypt(string(encrypted), masterKey)
	if err != nil {
		return nil, errors.New("invalid master password or corrupted vault")
	}

	// Deserialize
	var credentials []Credential
	if err := json.Unmarshal(decrypted, &credentials); err != nil {
		return nil, err
	}

	return &Vault{
		Credentials: credentials,
		Salt:        salt,
	}, nil
}

// VaultExists checks if a vault file exists
func (sm *StorageManager) VaultExists() bool {
	_, err := os.Stat(sm.vaultPath)
	return !os.IsNotExist(err)
}

// GetVaultPath returns the full path to the vault file
func (sm *StorageManager) GetVaultPath() string {
	return sm.vaultPath
}

// DeleteVault removes the vault and salt files
func (sm *StorageManager) DeleteVault() error {
	// Remove vault file
	if err := os.Remove(sm.vaultPath); err != nil && !os.IsNotExist(err) {
		return err
	}

	// Remove salt file
	if err := os.Remove(sm.saltPath); err != nil && !os.IsNotExist(err) {
		return err
	}

	return nil
}