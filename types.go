package main

import (
	"time"
)

// Credential represents a single password entry
type Credential struct {
	ID          string    `json:"id"`
	ServiceName string    `json:"serviceName"`
	URL         string    `json:"url"`
	Username    string    `json:"username"`
	Password    string    `json:"password"`
	Category    string    `json:"category"`
	IconURL     string    `json:"iconURL"`
	IsFavorite  bool      `json:"isFavorite"`
	CreatedAt   time.Time `json:"createdAt"`
}

// CreditCard represents a credit/debit card entry
type CreditCard struct {
	ID             string    `json:"id"`
	CardName       string    `json:"cardName"`       // Nickname for the card (e.g., "Personal Visa")
	CardholderName string    `json:"cardholderName"` // Name on card
	CardNumber     string    `json:"cardNumber"`     // Full card number (encrypted)
	ExpiryMonth    string    `json:"expiryMonth"`    // MM format
	ExpiryYear     string    `json:"expiryYear"`     // YYYY format
	CVV            string    `json:"cvv"`            // CVV/CVC code (encrypted)
	CardType       string    `json:"cardType"`       // visa, mastercard, amex, discover, etc.
	BillingZip     string    `json:"billingZip"`     // Optional billing zip code
	IsFavorite     bool      `json:"isFavorite"`
	CreatedAt      time.Time `json:"createdAt"`
}

// Vault represents the entire encrypted vault
type Vault struct {
	Credentials []Credential `json:"credentials"`
	CreditCards []CreditCard `json:"creditCards"`
	Salt        []byte       `json:"salt"`
}

// MasterKey holds the derived encryption key
type MasterKey struct {
	Key []byte
}