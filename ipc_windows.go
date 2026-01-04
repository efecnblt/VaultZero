// +build windows

package main

import (
	"encoding/json"
	"strings"
	"syscall"
	"unsafe"
)

var (
	kernel32           = syscall.NewLazyDLL("kernel32.dll")
	createNamedPipe    = kernel32.NewProc("CreateNamedPipeW")
	connectNamedPipe   = kernel32.NewProc("ConnectNamedPipe")
	disconnectNamedPipe = kernel32.NewProc("DisconnectNamedPipe")
)

const (
	PIPE_ACCESS_DUPLEX       = 0x00000003
	PIPE_TYPE_MESSAGE        = 0x00000004
	PIPE_READMODE_MESSAGE    = 0x00000002
	PIPE_WAIT                = 0x00000000
	PIPE_UNLIMITED_INSTANCES = 255
	INVALID_HANDLE_VALUE     = ^uintptr(0)
)

// IPCServer handles inter-process communication via named pipes
type IPCServer struct {
	app     *App
	pipe    syscall.Handle
	running bool
}

// NewIPCServer creates a new IPC server
func NewIPCServer(app *App) *IPCServer {
	return &IPCServer{
		app: app,
	}
}

// Start starts the IPC server (Windows named pipe)
func (s *IPCServer) Start() error {
	s.running = true

	// Accept connections in background
	go s.acceptConnections()

	return nil
}

// Stop stops the IPC server
func (s *IPCServer) Stop() error {
	s.running = false
	// Individual pipe instances are closed by handleConnectionWithPipe
	return nil
}

// acceptConnections accepts and handles incoming connections
func (s *IPCServer) acceptConnections() {
	pipeName, _ := syscall.UTF16PtrFromString(`\\.\pipe\vaultzero`)

	for s.running {
		// Create a new pipe instance for this connection
		pipe, _, err := createNamedPipe.Call(
			uintptr(unsafe.Pointer(pipeName)),
			PIPE_ACCESS_DUPLEX,
			PIPE_TYPE_MESSAGE|PIPE_READMODE_MESSAGE|PIPE_WAIT,
			PIPE_UNLIMITED_INSTANCES,
			4096, // output buffer size
			4096, // input buffer size
			0,    // default timeout
			0,    // default security
		)

		if pipe == INVALID_HANDLE_VALUE {
			println("Failed to create pipe:", err)
			break
		}

		// Wait for client connection
		connectNamedPipe.Call(pipe, 0)

		// Handle the connection in a goroutine so we can accept more clients
		go s.handleConnectionWithPipe(syscall.Handle(pipe))
	}
}

// handleConnectionWithPipe handles a single connection on a specific pipe
func (s *IPCServer) handleConnectionWithPipe(pipe syscall.Handle) {
	// Make sure to close the pipe when done
	defer func() {
		disconnectNamedPipe.Call(uintptr(pipe))
		syscall.CloseHandle(pipe)
	}()

	buffer := make([]byte, 4096)

	// Read a single request
	var bytesRead uint32
	err := syscall.ReadFile(pipe, buffer, &bytesRead, nil)
	if err != nil || bytesRead == 0 {
		return
	}

	// Process the request
	line := string(buffer[:bytesRead])
	line = strings.TrimSpace(line)

	var request IPCRequest
	if err := json.Unmarshal([]byte(line), &request); err != nil {
		s.sendErrorToPipe(pipe, "Invalid request format")
		return
	}

	// Handle request and send response
	response := s.handleRequest(&request)
	s.sendResponseToPipe(pipe, response)
}

// handleRequest processes an IPC request
func (s *IPCServer) handleRequest(request *IPCRequest) *IPCResponse {
	switch request.Action {
	case "search":
		return s.handleSearch(request.URL)

	case "save":
		return s.handleSave(request.Data)

	case "getCreditCards":
		return s.handleGetCreditCards()

	default:
		return &IPCResponse{
			Success: false,
			Error:   "Unknown action: " + request.Action,
		}
	}
}

// handleSearch searches for credentials matching a URL
func (s *IPCServer) handleSearch(url string) *IPCResponse {
	if !s.app.isUnlocked {
		return &IPCResponse{
			Success: false,
			Error:   "Vault is locked",
		}
	}

	// Extract domain from URL for matching
	domain := extractDomain(url)

	var matching []Credential
	for _, cred := range s.app.vault.Credentials {
		credDomain := extractDomain(cred.URL)
		if strings.Contains(strings.ToLower(credDomain), strings.ToLower(domain)) ||
			strings.Contains(strings.ToLower(cred.ServiceName), strings.ToLower(domain)) {
			matching = append(matching, cred)
		}
	}

	return &IPCResponse{
		Success:     true,
		Credentials: matching,
	}
}

// handleSave saves a new credential
func (s *IPCServer) handleSave(data map[string]interface{}) *IPCResponse {
	if !s.app.isUnlocked {
		return &IPCResponse{
			Success: false,
			Error:   "Vault is locked",
		}
	}

	serviceName, _ := data["serviceName"].(string)
	url, _ := data["url"].(string)
	username, _ := data["username"].(string)
	password, _ := data["password"].(string)
	category, _ := data["category"].(string)

	if category == "" {
		category = "Other"
	}

	err := s.app.AddCredential(serviceName, url, username, password, category)
	if err != nil {
		return &IPCResponse{
			Success: false,
			Error:   err.Error(),
		}
	}

	return &IPCResponse{
		Success: true,
	}
}

// handleGetCreditCards returns all credit cards
func (s *IPCServer) handleGetCreditCards() *IPCResponse {
	if !s.app.isUnlocked {
		return &IPCResponse{
			Success: false,
			Error:   "Vault is locked",
		}
	}

	return &IPCResponse{
		Success:     true,
		CreditCards: s.app.vault.CreditCards,
	}
}

// sendResponseToPipe sends an IPC response to a specific pipe
func (s *IPCServer) sendResponseToPipe(pipe syscall.Handle, response *IPCResponse) {
	responseBytes, _ := json.Marshal(response)
	responseBytes = append(responseBytes, '\n')

	var bytesWritten uint32
	syscall.WriteFile(pipe, responseBytes, &bytesWritten, nil)
}

// sendErrorToPipe sends an error response to a specific pipe
func (s *IPCServer) sendErrorToPipe(pipe syscall.Handle, errMsg string) {
	response := &IPCResponse{
		Success: false,
		Error:   errMsg,
	}
	s.sendResponseToPipe(pipe, response)
}

// IPCRequest represents a request from the native host
type IPCRequest struct {
	Action string                 `json:"action"`
	URL    string                 `json:"url,omitempty"`
	Data   map[string]interface{} `json:"data,omitempty"`
}

// IPCResponse represents a response to the native host
type IPCResponse struct {
	Success     bool         `json:"success"`
	Credentials []Credential `json:"credentials,omitempty"`
	CreditCards []CreditCard `json:"creditCards,omitempty"`
	Error       string       `json:"error,omitempty"`
}

// extractDomain extracts the domain from a URL
func extractDomain(url string) string {
	// Remove protocol
	url = strings.TrimPrefix(url, "https://")
	url = strings.TrimPrefix(url, "http://")
	url = strings.TrimPrefix(url, "www.")

	// Extract domain (before first /)
	parts := strings.Split(url, "/")
	if len(parts) > 0 {
		domain := parts[0]
		// Remove port if present
		domain = strings.Split(domain, ":")[0]
		return domain
	}

	return url
}
