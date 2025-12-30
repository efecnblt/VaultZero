 package main

  import (
        "crypto/aes"
        "crypto/cipher"
        "crypto/rand"
        "crypto/sha256"
        "encoding/base64"
        "errors"
        "io"

        "golang.org/x/crypto/argon2"
  )

  const (
        saltSize = 32
        keySize  = 32
  )

  // DeriveKey uses Argon2 to derive a strong encryption key from the master password
  func DeriveKey(password string, salt []byte) []byte {
        return argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, keySize)
  }

  // GenerateSalt creates a random salt for key derivation
  func GenerateSalt() ([]byte, error) {
        salt := make([]byte, saltSize)
        if _, err := rand.Read(salt); err != nil {
                return nil, err
        }
        return salt, nil
  }

  // Encrypt encrypts plaintext using AES-256-GCM
  func Encrypt(plaintext []byte, key []byte) (string, error) {
        block, err := aes.NewCipher(key)
        if err != nil {
                return "", err
        }

        gcm, err := cipher.NewGCM(block)
        if err != nil {
                return "", err
        }

        nonce := make([]byte, gcm.NonceSize())
        if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
                return "", err
        }

        ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
        return base64.StdEncoding.EncodeToString(ciphertext), nil
  }

  // Decrypt decrypts ciphertext using AES-256-GCM
  func Decrypt(ciphertext string, key []byte) ([]byte, error) {
        data, err := base64.StdEncoding.DecodeString(ciphertext)
        if err != nil {
                return nil, err
        }

        block, err := aes.NewCipher(key)
        if err != nil {
                return nil, err
        }

        gcm, err := cipher.NewGCM(block)
        if err != nil {
                return nil, err
        }

        nonceSize := gcm.NonceSize()
        if len(data) < nonceSize {
                return nil, errors.New("ciphertext too short")
        }

        nonce, cipherData := data[:nonceSize], data[nonceSize:]
        plaintext, err := gcm.Open(nil, nonce, cipherData, nil)
        if err != nil {
                return nil, err
        }

        return plaintext, nil
  }

  // HashPassword creates a SHA-256 hash (for master password verification)
  func HashPassword(password string) string {
        hash := sha256.Sum256([]byte(password))
        return base64.StdEncoding.EncodeToString(hash[:])
  }

  // VerifyPassword verifies a password against a stored hash
  func VerifyPassword(password, hash string) bool {
        return HashPassword(password) == hash
  }