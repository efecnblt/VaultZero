# VaultZero - Local-First Password Manager

## Project Overview

VaultZero is a secure, local-first password manager built with modern technologies. It features a desktop application for managing credentials and a browser extension for seamless auto-fill functionality, all while maintaining military-grade encryption and zero network exposure.

---

## Technologies Used

### Backend
- **Go 1.21** - High-performance backend for encryption and data management
- **Wails v2.8** - Modern desktop application framework combining Go backend with web frontend
- **AES-256-GCM** - Military-grade symmetric encryption
- **Argon2id** - Memory-hard key derivation function (64MB memory, 4 threads)
- **Windows Named Pipes** - Secure IPC for browser extension communication

### Frontend (Desktop App)
- **React 18.2** - Modern UI library with hooks
- **TypeScript 5.3** - Type-safe development
- **Vite 5.0** - Fast build tool with hot module replacement
- **Tailwind CSS 3.3** - Utility-first CSS framework for rapid UI development
- **Lucide React** - Beautiful, consistent icon library

### Browser Extension
- **Chrome Extension Manifest V3** - Latest extension standard
- **Native Messaging API** - Secure browser-to-desktop communication
- **Service Workers** - Background processing for extension
- **Content Scripts** - DOM manipulation for auto-fill functionality
- **go-winio** - Windows named pipe support for Go

### Security & Cryptography
- **crypto/rand** - Cryptographically secure random number generation
- **golang.org/x/crypto/argon2** - Password hashing
- **Base64 encoding** - Safe data serialization
- **JSON encryption** - Structured encrypted data storage

---

## Development Process

### Architecture Design
1. **Desktop Application (Wails)**
   - Go backend handles all cryptographic operations and data persistence
   - React frontend provides intuitive, responsive UI
   - Clear separation between business logic and presentation layer

2. **Browser Extension**
   - Native Messaging bridge connects browser to desktop app
   - Content scripts detect login forms and provide auto-fill
   - Service worker manages extension lifecycle and messaging

3. **IPC Communication**
   - Windows named pipes for secure inter-process communication
   - JSON-based message protocol between components
   - No network exposure - all communication is localhost-only

### Key Features Implemented

**Desktop Application:**
- Encrypted vault storage with master password
- CRUD operations for credentials
- Password generator with customizable options
- CSV import from major browsers (Chrome, Firefox, Edge, Safari)
- Category-based organization
- Search and filter functionality
- Real-time auto-refresh when credentials are added

**Browser Extension:**
- Smart form detection (username, email, phone, ID numbers)
- Click-to-fill dropdown on login fields
- Auto-save new credentials after successful login
- Duplicate detection to prevent redundant saves
- Native-looking UI with dark mode support
- Support for Chrome, Edge, and Brave browsers

---

## Security Implementation

### Encryption & Key Derivation
- **Master Password Protection**: All vault data encrypted with user's master password
- **Argon2id Key Derivation**:
  - Memory: 64MB
  - Iterations: 1
  - Parallelism: 4 threads
  - Output: 32-byte key
- **AES-256-GCM Encryption**:
  - 256-bit key size
  - Galois/Counter Mode for authenticated encryption
  - 12-byte random nonce per encryption
  - Prevents tampering and ensures confidentiality

### Data Storage
- **Separate Salt Storage**: Salt stored separately from vault to prevent circular dependency
- **Local-Only Storage**: All data stored in `~/.vaultzero/` (no cloud sync)
- **File Permissions**: Vault files restricted to user access only (0600)
- **Encrypted at Rest**: Credentials never stored in plaintext

### Browser Extension Security
- **Named Pipe IPC**: No network ports opened, localhost-only communication
- **Origin Validation**: Extension ID whitelisted in native messaging manifest
- **No Remote Code**: All code bundled with extension (no CDN dependencies)
- **Minimal Permissions**: Only requests necessary browser permissions
- **Sandboxed Execution**: Browser's security model isolates extension

### Best Practices
- **Zero-Trust Architecture**: Always verify vault is unlocked before operations
- **Clipboard Security**: Auto-clear clipboard after 30 seconds
- **Input Validation**: Sanitize all user inputs to prevent injection attacks
- **Error Handling**: Secure error messages without leaking sensitive data
- **Session Management**: Lock vault when application closes

---

## Technical Challenges Solved

1. **Windows Named Pipe Implementation**
   - Implemented low-level syscalls to Windows kernel32.dll
   - Created connection pooling for concurrent browser requests
   - Handled proper cleanup and disconnection

2. **Form Detection Intelligence**
   - Built flexible selectors to detect various input types (email, text, number, tel)
   - Added support for international fields (TC Kimlik No for Turkey)
   - Implemented DOM mutation observers for SPA compatibility

3. **Duplicate Prevention**
   - Prevented duplicate save prompts with state management
   - Added cooldown periods and smart reset logic
   - Checked existing credentials before prompting

4. **Real-time Synchronization**
   - Implemented event emission from Go backend
   - Used Wails runtime events to notify React frontend
   - Achieved instant UI updates when browser saves credentials

---

## For CV - Project Description

**VaultZero - Secure Local-First Password Manager**

- Developed a cross-platform desktop password manager using **Wails (Go + React + TypeScript)** with **AES-256-GCM encryption** and **Argon2** key derivation, featuring password generation, CSV import, and category management
- Built a **Chrome extension** with **Native Messaging API** for seamless auto-fill and auto-save functionality, using **Windows named pipes** for secure IPC without network exposure
- Implemented military-grade security architecture with local-only storage, encrypted vault persistence, and real-time synchronization between desktop app and browser extension

---

## For CV - Technical Skills Section

### Programming Languages
- **Go** - Backend development, cryptography, IPC systems, Windows syscalls
- **TypeScript/JavaScript** - Frontend development, browser extensions, React applications

### Frameworks & Libraries
- **Wails** - Desktop application development with Go and React
- **React** - Modern frontend development with hooks and component architecture
- **Tailwind CSS** - Utility-first CSS for rapid UI development

### Security & Cryptography
- **AES-256-GCM** - Symmetric encryption implementation
- **Argon2** - Password hashing and key derivation
- **Cryptographic Best Practices** - Salt generation, nonce handling, secure random generation

### Browser Technologies
- **Chrome Extensions (Manifest V3)** - Service workers, content scripts, native messaging
- **Native Messaging API** - Browser-to-desktop communication
- **DOM Manipulation** - Dynamic form detection and auto-fill

### System Programming
- **Windows Named Pipes** - Inter-process communication using syscalls
- **File I/O** - Secure file handling with proper permissions
- **Process Management** - Concurrent connection handling

### Development Tools
- **Vite** - Modern build tool with HMR
- **Git** - Version control
- **PowerShell** - Automation scripting for Windows
- **WSL** - Cross-platform development environment

### Software Architecture
- **Desktop Application Architecture** - Separation of concerns between backend/frontend
- **IPC Design** - Message-based communication protocols
- **Security-First Design** - Zero-trust architecture, local-first data storage
- **Event-Driven Programming** - Real-time UI updates and state management

---

## Project Statistics

- **Lines of Code**: ~7,000+ lines
- **Files Created**: 30+ files
- **Technologies**: 15+ technologies and frameworks
- **Development Time**: Full-featured application built from scratch
- **Platforms Supported**: Windows (Desktop App + Extension for Chrome/Edge/Brave)

---

## Future Enhancements (Optional)

- [ ] Cross-platform support (macOS, Linux)
- [ ] Biometric authentication (Windows Hello, fingerprint)
- [ ] Password strength analyzer and breach detection
- [ ] Secure notes and file attachments
- [ ] Two-factor authentication (TOTP) support
- [ ] Export encrypted backups
- [ ] Firefox extension support
- [ ] Auto-lock after inactivity

---

## License

Personal project developed for portfolio demonstration.

---

## Contact

Developed by: [Your Name]
GitHub: [Your GitHub Profile]
LinkedIn: [Your LinkedIn Profile]
Email: [Your Email]
