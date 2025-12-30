package main

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"os"
	"time"
)

// ExportCredentialsToCSV exports credentials to a CSV file (Chrome format)
func ExportCredentialsToCSV(credentials []Credential, filePath string) error {
	// Create file
	file, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("failed to create file: %v", err)
	}
	defer file.Close()

	// Create CSV writer
	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Write header (Chrome format: name,url,username,password)
	header := []string{"name", "url", "username", "password"}
	if err := writer.Write(header); err != nil {
		return fmt.Errorf("failed to write header: %v", err)
	}

	// Write credentials
	for _, cred := range credentials {
		record := []string{
			cred.ServiceName,
			cred.URL,
			cred.Username,
			cred.Password,
		}
		if err := writer.Write(record); err != nil {
			return fmt.Errorf("failed to write credential: %v", err)
		}
	}

	return nil
}

// ExportEncryptedBackup creates a timestamped encrypted backup of the vault
func (sm *StorageManager) ExportEncryptedBackup(vault *Vault, masterKey []byte, filePath string) error {
	// Serialize vault credentials to JSON (same as SaveVault)
	data, err := json.Marshal(vault.Credentials)
	if err != nil {
		return fmt.Errorf("failed to marshal vault: %v", err)
	}

	// Encrypt vault
	encryptedVault, err := Encrypt(data, masterKey)
	if err != nil {
		return fmt.Errorf("failed to encrypt vault: %v", err)
	}

	// Write to file
	if err := os.WriteFile(filePath, []byte(encryptedVault), 0600); err != nil {
		return fmt.Errorf("failed to write backup: %v", err)
	}

	return nil
}

// ExportResult contains information about the export operation
type ExportResult struct {
	FilePath        string    `json:"filePath"`
	CredentialCount int       `json:"credentialCount"`
	ExportedAt      time.Time `json:"exportedAt"`
	Format          string    `json:"format"` // "csv" or "encrypted"
}
