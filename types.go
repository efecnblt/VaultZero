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

// Vault represents the entire encrypted vault
type Vault struct {
	Credentials []Credential `json:"credentials"`
	Salt        []byte       `json:"salt"`
}

// MasterKey holds the derived encryption key
type MasterKey struct {
	Key []byte
}