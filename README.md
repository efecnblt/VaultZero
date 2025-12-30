# VaultZero - Secure Local Password Manager

![VaultZero](https://img.shields.io/badge/VaultZero-v1.0.0-blue.svg)
![Go](https://img.shields.io/badge/Go-1.21-00ADD8.svg)
![React](https://img.shields.io/badge/React-18.2-61DAFB.svg)
![Wails](https://img.shields.io/badge/Wails-v2.8-DF0000.svg)

A modern, local-first desktop password manager built with Wails (Go + React + TypeScript). VaultZero prioritizes extreme simplicity, visual clarity, and robust security.

## Features

- **Extreme Security**: AES-256-GCM encryption with Argon2 key derivation
- **100% Local**: Your passwords never leave your device
- **Beautiful UI**: Modern dark mode interface with visual emphasis on service logos
- **Smart Favicon Fetching**: Automatically fetches high-quality logos for each service
- **Auto-Clear Clipboard**: Copied passwords automatically clear after 30 seconds
- **Category Organization**: Organize credentials by Social, Work, Finance, or Other
- **Real-time Search**: Instant filtering across all credentials
- **Grid & List Views**: Switch between visual layouts

## Architecture

### Backend (Go)
- **types.go** - Data structures (Credential, Vault)
- **crypto.go** - AES-256-GCM encryption/decryption with Argon2
- **storage.go** - Encrypted vault persistence
- **helpers.go** - Favicon fetching and clipboard management
- **app.go** - Main application logic and CRUD operations
- **main.go** - Wails entry point

### Frontend (React + TypeScript + Tailwind CSS)
- **Auth.tsx** - Login and vault creation screen
- **Dashboard.tsx** - Main interface with sidebar and search
- **CredentialCard.tsx** - Visual credential display with icons
- **AddModal.tsx** - Add/edit credential modal

## Installation

### Prerequisites

1. **Install Go** (1.21 or higher)
   ```bash
   # Download from https://go.dev/dl/
   ```

2. **Install Node.js** (18 or higher)
   ```bash
   # Download from https://nodejs.org/
   ```

3. **Install Wails CLI**
   ```bash
   go install github.com/wailsapp/wails/v2/cmd/wails@latest
   ```

### Setup

1. **Clone or navigate to the project**
   ```bash
   cd D:\Projects\passwordmanager
   ```

2. **Install Go dependencies**
   ```bash
   go mod download
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

## Development

### Run in Development Mode

```bash
wails dev
```

This will:
- Start the Go backend with hot reload
- Start the React frontend with Vite dev server
- Open the application window

### Build for Production

```bash
wails build
```

The compiled application will be in the `build/bin` directory.

### Build for Windows
```bash
wails build -platform windows/amd64
```

### Build for macOS
```bash
wails build -platform darwin/universal
```

### Build for Linux
```bash
wails build -platform linux/amd64
```

## Project Structure

```
passwordmanager/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.tsx           # Authentication screen
│   │   │   ├── Dashboard.tsx      # Main dashboard
│   │   │   ├── CredentialCard.tsx # Credential display
│   │   │   └── AddModal.tsx       # Add/edit modal
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript types
│   │   ├── wailsjs/               # Auto-generated Wails bindings
│   │   ├── App.tsx                # Root component
│   │   ├── main.tsx               # Entry point
│   │   └── index.css              # Tailwind CSS
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── index.html
├── app.go                         # App logic
├── crypto.go                      # Encryption
├── storage.go                     # File persistence
├── helpers.go                     # Utilities
├── types.go                       # Data structures
├── main.go                        # Entry point
├── go.mod
└── wails.json
```

## Security Features

### Encryption
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: Argon2id with 64MB memory, 4 threads
- **Salt**: 32-byte random salt per vault
- **Nonce**: Unique per encryption operation

### Storage
- Vault stored at: `~/.vaultzero/vault.dat`
- All data encrypted before writing to disk
- No plain text credentials ever stored

### Clipboard Security
- Passwords auto-clear from clipboard after 30 seconds
- Context-aware clipboard management
- No password history

## Usage

### First Time Setup

1. Launch VaultZero
2. Click "Create Vault"
3. Enter a strong master password (minimum 8 characters)
4. Confirm the password
5. Click "Create Vault"

**Important**: Your master password is the only way to access your vault. There is no recovery option. Store it safely!

### Adding a Credential

1. Click the "+ Add New" button
2. Fill in:
   - Service Name (required) - e.g., "Netflix"
   - Website URL (optional) - e.g., "https://netflix.com"
   - Category - Social, Work, Finance, or Other
   - Username/Email (required)
   - Password (required)
3. Click "Add"

The app will automatically fetch the service's favicon for visual identification.

### Using Credentials

- **Copy Username**: Click the copy icon next to username
- **Copy Password**: Click the copy icon next to password
- **View Password**: Click the eye icon to toggle visibility
- **Edit**: Hover over a card and click the edit icon
- **Delete**: Hover over a card and click the delete icon

### Organizing

- Use the **sidebar** to filter by category
- Use the **search bar** to find credentials by name, username, or URL
- Toggle between **grid** and **list** views using the view buttons

### Locking the Vault

Click "Lock Vault" in the sidebar to lock and clear all data from memory.

## Technology Stack

- **Backend**: Go 1.21
- **Frontend**: React 18.2 + TypeScript
- **Framework**: Wails v2.8
- **Styling**: Tailwind CSS 3.3
- **Icons**: Lucide React
- **Build Tool**: Vite 5.0
- **Encryption**: golang.org/x/crypto (Argon2, AES-GCM)
- **Clipboard**: github.com/atotto/clipboard

## Development Tips

### Auto-generating Wails Bindings

When you modify Go methods that are exposed to the frontend:

```bash
wails generate module
```

This regenerates the TypeScript bindings in `frontend/src/wailsjs/`.

### Hot Reload

In development mode (`wails dev`), both Go and React support hot reload:
- Go changes: Automatically rebuild and restart
- React changes: Instant HMR (Hot Module Replacement)

### Debugging

1. **Go Backend**: Add `println()` statements or use Delve debugger
2. **React Frontend**: Use browser DevTools (F12 in dev mode)

## Troubleshooting

### "wails: command not found"

Make sure Wails is installed and in your PATH:
```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

### Frontend dependencies fail to install

Try clearing the npm cache:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Build fails on Windows

Ensure you have:
- Windows 10/11 (64-bit)
- WebView2 runtime installed
- Visual Studio Build Tools (for C++ compilation)

### Vault file location

- **Windows**: `C:\Users\<username>\.vaultzero\vault.dat`
- **macOS**: `/Users/<username>/.vaultzero/vault.dat`
- **Linux**: `/home/<username>/.vaultzero/vault.dat`

## Contributing

This is a personal project, but suggestions and bug reports are welcome via issues.

## License

MIT License - Feel free to use and modify for personal or commercial use.

## Security Notice

VaultZero is designed for local password storage only. While we use industry-standard encryption (AES-256-GCM with Argon2), no software is 100% secure. Use at your own risk.

**Important Reminders:**
- Your master password is NOT recoverable
- Always keep backups of your vault file
- Keep your master password secure and unique
- Never share your master password


---

**Built with** by a developer who values privacy and simplicity.

