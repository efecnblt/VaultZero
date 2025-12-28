package main

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"net/url"
	"strings"
	"time"

	"github.com/atotto/clipboard"
)

// FetchFavicon returns a high-quality favicon URL for a given website URL
func FetchFavicon(rawURL string) string {
	if rawURL == "" {
		return ""
	}

	// Parse the URL
	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return ""
	}

	// Extract domain
	domain := parsedURL.Hostname()
	if domain == "" {
		return ""
	}

	// Use Google's favicon service (high quality, reliable)
	// Alternative: DuckDuckGo's favicon service
	return fmt.Sprintf("https://www.google.com/s2/favicons?domain=%s&sz=128", domain)
}

// ClipboardCopy copies text to clipboard and auto-clears after 30 seconds
func ClipboardCopy(text string) error {
	if err := clipboard.WriteAll(text); err != nil {
		return err
	}

	// Auto-clear after 30 seconds
	go func() {
		time.Sleep(30 * time.Second)
		clipboard.WriteAll("")
	}()

	return nil
}

// ClipboardCopyWithContext allows cancellation of auto-clear
func ClipboardCopyWithContext(ctx context.Context, text string, duration time.Duration) error {
	if err := clipboard.WriteAll(text); err != nil {
		return err
	}

	go func() {
		select {
		case <-time.After(duration):
			clipboard.WriteAll("")
		case <-ctx.Done():
			return
		}
	}()

	return nil
}

// PasswordGeneratorOptions holds configuration for password generation
type PasswordGeneratorOptions struct {
	Length            int  `json:"length"`
	IncludeUppercase  bool `json:"includeUppercase"`
	IncludeLowercase  bool `json:"includeLowercase"`
	IncludeNumbers    bool `json:"includeNumbers"`
	IncludeSymbols    bool `json:"includeSymbols"`
	ExcludeAmbiguous  bool `json:"excludeAmbiguous"`
}

// GeneratePassword generates a cryptographically secure random password
func GeneratePassword(options PasswordGeneratorOptions) (string, error) {
	// Character sets
	const (
		uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
		lowercase = "abcdefghijklmnopqrstuvwxyz"
		numbers   = "0123456789"
		symbols   = "!@#$%^&*()_+-=[]{}|;:,.<>?"
		ambiguous = "il1Lo0O"
	)

	// Build character pool
	var charPool strings.Builder

	if options.IncludeUppercase {
		charPool.WriteString(uppercase)
	}
	if options.IncludeLowercase {
		charPool.WriteString(lowercase)
	}
	if options.IncludeNumbers {
		charPool.WriteString(numbers)
	}
	if options.IncludeSymbols {
		charPool.WriteString(symbols)
	}

	pool := charPool.String()

	// Remove ambiguous characters if requested
	if options.ExcludeAmbiguous {
		for _, char := range ambiguous {
			pool = strings.ReplaceAll(pool, string(char), "")
		}
	}

	// Validate we have characters to work with
	if len(pool) == 0 {
		return "", fmt.Errorf("no character types selected")
	}

	// Ensure minimum length
	if options.Length < 8 {
		options.Length = 8
	}
	if options.Length > 128 {
		options.Length = 128
	}

	// Generate password
	password := make([]byte, options.Length)
	poolSize := big.NewInt(int64(len(pool)))

	for i := 0; i < options.Length; i++ {
		randomIndex, err := rand.Int(rand.Reader, poolSize)
		if err != nil {
			return "", err
		}
		password[i] = pool[randomIndex.Int64()]
	}

	return string(password), nil
}

// GenerateStrongPassword generates a strong password with sensible defaults
func GenerateStrongPassword(length int) (string, error) {
	if length < 12 {
		length = 16 // Strong default
	}

	return GeneratePassword(PasswordGeneratorOptions{
		Length:            length,
		IncludeUppercase:  true,
		IncludeLowercase:  true,
		IncludeNumbers:    true,
		IncludeSymbols:    true,
		ExcludeAmbiguous:  true,
	})
}