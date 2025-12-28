package main

import (
	"encoding/csv"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

// ImportedCredential represents a credential from an import file
type ImportedCredential struct {
	ServiceName string
	URL         string
	Username    string
	Password    string
	Notes       string
}

// ParseCSV parses a CSV string and returns imported credentials
func ParseCSV(csvContent string) ([]ImportedCredential, error) {
	reader := csv.NewReader(strings.NewReader(csvContent))
	reader.TrimLeadingSpace = true

	// Read all records
	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to parse CSV: %v", err)
	}

	if len(records) == 0 {
		return nil, errors.New("CSV file is empty")
	}

	// Detect CSV format from header
	header := records[0]
	format := detectCSVFormat(header)

	// Parse credentials based on format
	var credentials []ImportedCredential
	for i := 1; i < len(records); i++ {
		record := records[i]
		cred, err := parseRecord(record, format)
		if err != nil {
			// Skip invalid records but continue
			continue
		}
		if cred != nil {
			credentials = append(credentials, *cred)
		}
	}

	if len(credentials) == 0 {
		return nil, errors.New("no valid credentials found in CSV")
	}

	return credentials, nil
}

// CSVFormat represents different browser export formats
type CSVFormat int

const (
	FormatChrome CSVFormat = iota
	FormatFirefox
	FormatSafari
	FormatGeneric
)

// detectCSVFormat detects the browser format from CSV header
func detectCSVFormat(header []string) CSVFormat {
	headerStr := strings.ToLower(strings.Join(header, ","))

	// Chrome/Edge format: name,url,username,password
	if strings.Contains(headerStr, "name") && strings.Contains(headerStr, "url") &&
		strings.Contains(headerStr, "username") && strings.Contains(headerStr, "password") {
		return FormatChrome
	}

	// Firefox format: url,username,password,httpRealm,formActionOrigin,guid,timeCreated,timeLastUsed,timePasswordChanged
	if strings.Contains(headerStr, "httprealm") || strings.Contains(headerStr, "formactionorigin") {
		return FormatFirefox
	}

	// Safari format: Title,URL,Username,Password,Notes,OTPAuth
	if strings.Contains(headerStr, "title") && strings.Contains(headerStr, "notes") {
		return FormatSafari
	}

	return FormatGeneric
}

// parseRecord parses a single CSV record based on format
func parseRecord(record []string, format CSVFormat) (*ImportedCredential, error) {
	if len(record) < 3 {
		return nil, errors.New("invalid record")
	}

	var cred ImportedCredential

	switch format {
	case FormatChrome:
		// Chrome/Edge: name,url,username,password
		if len(record) >= 4 {
			cred.ServiceName = record[0]
			cred.URL = record[1]
			cred.Username = record[2]
			cred.Password = record[3]
		}

	case FormatFirefox:
		// Firefox: url,username,password,...
		if len(record) >= 3 {
			cred.URL = record[0]
			cred.Username = record[1]
			cred.Password = record[2]
			cred.ServiceName = extractServiceName(record[0])
		}

	case FormatSafari:
		// Safari: Title,URL,Username,Password,Notes
		if len(record) >= 4 {
			cred.ServiceName = record[0]
			cred.URL = record[1]
			cred.Username = record[2]
			cred.Password = record[3]
			if len(record) >= 5 {
				cred.Notes = record[4]
			}
		}

	case FormatGeneric:
		// Generic format - try to extract what we can
		// Assume: first column is name/url, second is username, third is password
		if len(record) >= 3 {
			cred.ServiceName = extractServiceName(record[0])
			cred.URL = record[0]
			cred.Username = record[1]
			cred.Password = record[2]
		}
	}

	// Validate required fields
	if cred.Username == "" || cred.Password == "" {
		return nil, errors.New("missing required fields")
	}

	// If service name is empty, try to extract from URL
	if cred.ServiceName == "" && cred.URL != "" {
		cred.ServiceName = extractServiceName(cred.URL)
	}

	return &cred, nil
}

// extractServiceName extracts a friendly service name from a URL
func extractServiceName(url string) string {
	if url == "" {
		return "Imported"
	}

	// Remove protocol
	url = strings.TrimPrefix(url, "https://")
	url = strings.TrimPrefix(url, "http://")
	url = strings.TrimPrefix(url, "www.")

	// Extract domain
	parts := strings.Split(url, "/")
	if len(parts) > 0 {
		domain := parts[0]
		// Remove port if present
		domain = strings.Split(domain, ":")[0]
		// Capitalize first letter
		if len(domain) > 0 {
			domain = strings.ToUpper(domain[:1]) + domain[1:]
		}
		return domain
	}

	return "Imported"
}

// categorizeByURL attempts to categorize a credential based on its URL
func categorizeByURL(url string) string {
	urlLower := strings.ToLower(url)

	// Social media
	if strings.Contains(urlLower, "facebook") || strings.Contains(urlLower, "twitter") ||
		strings.Contains(urlLower, "instagram") || strings.Contains(urlLower, "linkedin") ||
		strings.Contains(urlLower, "reddit") || strings.Contains(urlLower, "tiktok") {
		return "Social"
	}

	// Finance
	if strings.Contains(urlLower, "bank") || strings.Contains(urlLower, "paypal") ||
		strings.Contains(urlLower, "stripe") || strings.Contains(urlLower, "venmo") ||
		strings.Contains(urlLower, "invest") || strings.Contains(urlLower, "crypto") {
		return "Finance"
	}

	// Work-related
	if strings.Contains(urlLower, "github") || strings.Contains(urlLower, "gitlab") ||
		strings.Contains(urlLower, "slack") || strings.Contains(urlLower, "jira") ||
		strings.Contains(urlLower, "confluence") || strings.Contains(urlLower, "office") ||
		strings.Contains(urlLower, "google.com/drive") || strings.Contains(urlLower, "dropbox") {
		return "Work"
	}

	return "Other"
}

// ImportResult contains the result of an import operation
type ImportResult struct {
	TotalProcessed int      `json:"totalProcessed"`
	Imported       int      `json:"imported"`
	Skipped        int      `json:"skipped"`
	Errors         []string `json:"errors"`
}

// ImportFromCSV imports credentials from a CSV string into the vault
func (a *App) ImportFromCSV(csvContent string) (*ImportResult, error) {
	if !a.isUnlocked {
		return nil, errors.New("vault is locked")
	}

	// Parse CSV
	importedCreds, err := ParseCSV(csvContent)
	if err != nil {
		return nil, err
	}

	result := &ImportResult{
		TotalProcessed: len(importedCreds),
		Errors:         []string{},
	}

	// Import each credential
	for _, importedCred := range importedCreds {
		// Check if credential already exists (by URL + username)
		exists := false
		for _, existingCred := range a.vault.Credentials {
			if existingCred.URL == importedCred.URL && existingCred.Username == importedCred.Username {
				exists = true
				break
			}
		}

		if exists {
			result.Skipped++
			result.Errors = append(result.Errors, fmt.Sprintf("Skipped duplicate: %s (%s)", importedCred.ServiceName, importedCred.Username))
			continue
		}

		// Create new credential
		credential := Credential{
			ID:          uuid.New().String(),
			ServiceName: importedCred.ServiceName,
			URL:         importedCred.URL,
			Username:    importedCred.Username,
			Password:    importedCred.Password,
			Category:    categorizeByURL(importedCred.URL),
			IconURL:     FetchFavicon(importedCred.URL),
			CreatedAt:   time.Now(),
		}

		a.vault.Credentials = append(a.vault.Credentials, credential)
		result.Imported++
	}

	// Save vault
	if result.Imported > 0 {
		if err := a.storage.SaveVault(a.vault, a.masterKey); err != nil {
			return nil, fmt.Errorf("failed to save vault: %v", err)
		}
	}

	return result, nil
}
