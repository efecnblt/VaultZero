package main

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"os"
	"time"

	"github.com/Microsoft/go-winio"
)

const (
	pipeName = `\\.\pipe\vaultzero`
)

// Message represents a native messaging message
type Message struct {
	Type string                 `json:"type"`
	ID   int                    `json:"id,omitempty"`
	Data map[string]interface{} `json:"data,omitempty"`
}

// Response represents a response to the browser
type Response struct {
	Type    string                 `json:"type"`
	ID      int                    `json:"id,omitempty"`
	Success bool                   `json:"success"`
	Data    map[string]interface{} `json:"data,omitempty"`
	Error   string                 `json:"error,omitempty"`
}

func main() {
	// Log to file for debugging (optional)
	logFile, _ := os.OpenFile(os.Getenv("TEMP")+`\vaultzero-native-host.log`, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if logFile != nil {
		defer logFile.Close()
		logMessage(logFile, "Native host started")
	}

	// Read messages from stdin and handle them
	for {
		msg, err := readMessage(os.Stdin)
		if err != nil {
			if err == io.EOF {
				break
			}
			sendError(fmt.Sprintf("Failed to read message: %v", err))
			continue
		}

		if logFile != nil {
			logMessage(logFile, fmt.Sprintf("Received: %s", msg.Type))
		}

		// Handle the message
		response := handleMessage(msg, logFile)

		// Send response
		if err := sendMessage(os.Stdout, response); err != nil {
			if logFile != nil {
				logMessage(logFile, fmt.Sprintf("Failed to send response: %v", err))
			}
		}
	}
}

// readMessage reads a native messaging format message from reader
func readMessage(reader io.Reader) (*Message, error) {
	// Read message length (4 bytes, little-endian)
	var length uint32
	if err := binary.Read(reader, binary.LittleEndian, &length); err != nil {
		return nil, err
	}

	// Read message content
	msgBytes := make([]byte, length)
	if _, err := io.ReadFull(reader, msgBytes); err != nil {
		return nil, err
	}

	// Parse JSON
	var msg Message
	if err := json.Unmarshal(msgBytes, &msg); err != nil {
		return nil, err
	}

	return &msg, nil
}

// sendMessage sends a native messaging format message to writer
func sendMessage(writer io.Writer, response *Response) error {
	// Marshal response to JSON
	msgBytes, err := json.Marshal(response)
	if err != nil {
		return err
	}

	// Write message length (4 bytes, little-endian)
	length := uint32(len(msgBytes))
	if err := binary.Write(writer, binary.LittleEndian, length); err != nil {
		return err
	}

	// Write message content
	if _, err := writer.Write(msgBytes); err != nil {
		return err
	}

	return nil
}

// handleMessage processes a message and returns a response
func handleMessage(msg *Message, logFile *os.File) *Response {
	switch msg.Type {
	case "ping":
		return &Response{
			Type:    "pong",
			ID:      msg.ID,
			Success: true,
			Data:    map[string]interface{}{"status": "alive"},
		}

	case "getCredentials":
		url, _ := msg.Data["url"].(string)
		credentials, err := getCredentialsFromVault(url, logFile)
		if err != nil {
			return &Response{
				Type:    "credentials",
				ID:      msg.ID,
				Success: false,
				Error:   err.Error(),
			}
		}
		return &Response{
			Type:    "credentials",
			ID:      msg.ID,
			Success: true,
			Data:    map[string]interface{}{"credentials": credentials},
		}

	case "saveCredential":
		err := saveCredentialToVault(msg.Data, logFile)
		if err != nil {
			return &Response{
				Type:    "saved",
				ID:      msg.ID,
				Success: false,
				Error:   err.Error(),
			}
		}
		return &Response{
			Type:    "saved",
			ID:      msg.ID,
			Success: true,
		}

	case "getCreditCards":
		cards, err := getCreditCardsFromVault(logFile)
		if err != nil {
			return &Response{
				Type:    "creditCards",
				ID:      msg.ID,
				Success: false,
				Error:   err.Error(),
			}
		}
		return &Response{
			Type:    "creditCards",
			ID:      msg.ID,
			Success: true,
			Data:    map[string]interface{}{"cards": cards},
		}

	default:
		return &Response{
			Type:    "error",
			ID:      msg.ID,
			Success: false,
			Error:   "Unknown message type: " + msg.Type,
		}
	}
}

// getCredentialsFromVault communicates with VaultZero via named pipe
func getCredentialsFromVault(url string, logFile *os.File) ([]interface{}, error) {
	conn, err := connectToPipe(logFile)
	if err != nil {
		return nil, fmt.Errorf("VaultZero is not running: %v", err)
	}
	defer conn.Close()

	// Send request
	request := map[string]interface{}{
		"action": "search",
		"url":    url,
	}
	requestBytes, _ := json.Marshal(request)

	if _, err := conn.Write(append(requestBytes, '\n')); err != nil {
		return nil, err
	}

	// Read response
	response := make([]byte, 65536)
	n, err := conn.Read(response)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(response[:n], &result); err != nil {
		return nil, err
	}

	if credentials, ok := result["credentials"].([]interface{}); ok {
		return credentials, nil
	}

	return []interface{}{}, nil
}

// saveCredentialToVault saves a credential via named pipe
func saveCredentialToVault(data map[string]interface{}, logFile *os.File) error {
	conn, err := connectToPipe(logFile)
	if err != nil {
		return fmt.Errorf("VaultZero is not running: %v", err)
	}
	defer conn.Close()

	// Send request
	request := map[string]interface{}{
		"action": "save",
		"data":   data,
	}
	requestBytes, _ := json.Marshal(request)

	if _, err := conn.Write(append(requestBytes, '\n')); err != nil {
		return err
	}

	// Read response
	response := make([]byte, 4096)
	n, err := conn.Read(response)
	if err != nil {
		return err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(response[:n], &result); err != nil {
		return err
	}

	if success, ok := result["success"].(bool); !ok || !success {
		if errMsg, ok := result["error"].(string); ok {
			return fmt.Errorf(errMsg)
		}
		return fmt.Errorf("failed to save credential")
	}

	return nil
}

// getCreditCardsFromVault gets all credit cards via named pipe
func getCreditCardsFromVault(logFile *os.File) ([]interface{}, error) {
	conn, err := connectToPipe(logFile)
	if err != nil {
		return nil, fmt.Errorf("VaultZero is not running: %v", err)
	}
	defer conn.Close()

	// Send request
	request := map[string]interface{}{
		"action": "getCreditCards",
	}
	requestBytes, _ := json.Marshal(request)

	if _, err := conn.Write(append(requestBytes, '\n')); err != nil {
		return nil, err
	}

	// Read response
	response := make([]byte, 65536)
	n, err := conn.Read(response)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(response[:n], &result); err != nil {
		return nil, err
	}

	if cards, ok := result["creditCards"].([]interface{}); ok {
		return cards, nil
	}

	return []interface{}{}, nil
}

// connectToPipe connects to the VaultZero named pipe (Windows)
func connectToPipe(logFile *os.File) (net.Conn, error) {
	// On Windows, use named pipe client
	timeout := 2 * time.Second
	deadline := time.Now().Add(timeout)

	for time.Now().Before(deadline) {
		// Try to connect to the named pipe
		conn, err := dialPipe(pipeName)
		if err == nil {
			return conn, nil
		}

		if logFile != nil {
			logMessage(logFile, fmt.Sprintf("Connection attempt failed: %v", err))
		}

		time.Sleep(100 * time.Millisecond)
	}

	return nil, fmt.Errorf("connection timeout - is VaultZero running and unlocked?")
}

// dialPipe connects to a Windows named pipe
func dialPipe(pipePath string) (net.Conn, error) {
	// Use winio package to connect to Windows named pipe
	timeout := 1 * time.Second
	return winio.DialPipe(pipePath, &timeout)
}

// sendError sends an error response
func sendError(errMsg string) {
	response := &Response{
		Type:    "error",
		Success: false,
		Error:   errMsg,
	}
	sendMessage(os.Stdout, response)
}

// logMessage writes a log message to file
func logMessage(logFile *os.File, msg string) {
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	logFile.WriteString(fmt.Sprintf("[%s] %s\n", timestamp, msg))
}
