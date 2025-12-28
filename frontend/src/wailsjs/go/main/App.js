// Wails Runtime Stub
// This file will be replaced by auto-generated bindings during wails dev/build

export function CheckVaultExists() {
  return window.go.main.App.CheckVaultExists();
}

export function CreateVault(masterPassword) {
  return window.go.main.App.CreateVault(masterPassword);
}

export function UnlockVault(masterPassword) {
  return window.go.main.App.UnlockVault(masterPassword);
}

export function IsUnlocked() {
  return window.go.main.App.IsUnlocked();
}

export function GetAllCredentials() {
  return window.go.main.App.GetAllCredentials();
}

export function AddCredential(serviceName, url, username, password, category) {
  return window.go.main.App.AddCredential(serviceName, url, username, password, category);
}

export function UpdateCredential(id, serviceName, url, username, password, category) {
  return window.go.main.App.UpdateCredential(id, serviceName, url, username, password, category);
}

export function DeleteCredential(id) {
  return window.go.main.App.DeleteCredential(id);
}

export function CopyPassword(id) {
  return window.go.main.App.CopyPassword(id);
}

export function CopyUsername(id) {
  return window.go.main.App.CopyUsername(id);
}

export function LockVault() {
  return window.go.main.App.LockVault();
}

export function GeneratePasswordWithOptions(options) {
  return window.go.main.App.GeneratePasswordWithOptions(options);
}

export function GenerateQuickPassword(length) {
  return window.go.main.App.GenerateQuickPassword(length);
}

export function ImportFromCSV(csvContent) {
  return window.go.main.App.ImportFromCSV(csvContent);
}

export function DeleteVault() {
  return window.go.main.App.DeleteVault();
}
