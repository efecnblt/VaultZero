import { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Download, Shield } from 'lucide-react';
import * as App from '../wailsjs/go/main/App';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportType = 'csv' | 'backup';

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [importType, setImportType] = useState<ImportType>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError('');
        setResult(null);
      } else {
        setError('Please select a CSV file');
        setFile(null);
      }
    }
  };

  const handleImportCSV = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setImporting(true);
    setError('');

    try {
      // Read file content
      const content = await file.text();

      // Call backend import function
      const importResult = await App.ImportFromCSV(content);

      setResult(importResult);

      // If successful, refresh the credential list
      if (importResult.imported > 0) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import passwords');
    } finally {
      setImporting(false);
    }
  };

  const handleImportBackup = async () => {
    setImporting(true);
    setError('');

    try {
      // Backend opens its own file dialog
      const importResult = await App.ImportEncryptedBackup();

      setResult(importResult);

      // If successful, refresh the credential list
      if (importResult.imported > 0) {
        onSuccess();
      }
    } catch (err: any) {
      if (err.message && err.message !== 'import cancelled') {
        setError(err.message || 'Failed to import backup');
      }
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError('');
    setImportType('csv');
    onClose();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (importType === 'csv') {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
          setFile(droppedFile);
          setError('');
          setResult(null);
        } else {
          setError('Please drop a CSV file');
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Import Passwords</h2>
            <p className="text-sm text-slate-400 mt-1">
              Import from browser CSV or encrypted backup
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Import Type Selection */}
          {!result && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Choose Import Type
              </label>

              {/* CSV Import Option */}
              <button
                onClick={() => {
                  setImportType('csv');
                  setFile(null);
                  setError('');
                }}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  importType === 'csv'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <FileText className={`w-5 h-5 mt-0.5 ${importType === 'csv' ? 'text-primary-500' : 'text-slate-400'}`} />
                  <div className="flex-1">
                    <div className="font-medium text-slate-100 mb-1">
                      CSV from Browser
                    </div>
                    <div className="text-sm text-slate-400">
                      Import passwords exported from Chrome, Firefox, Edge, or Safari (plain text CSV)
                    </div>
                  </div>
                </div>
              </button>

              {/* Encrypted Backup Option */}
              <button
                onClick={() => {
                  setImportType('backup');
                  setFile(null);
                  setError('');
                }}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  importType === 'backup'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Shield className={`w-5 h-5 mt-0.5 ${importType === 'backup' ? 'text-primary-500' : 'text-slate-400'}`} />
                  <div className="flex-1">
                    <div className="font-medium text-slate-100 mb-1">
                      Encrypted Backup (Recommended)
                    </div>
                    <div className="text-sm text-slate-400">
                      Import from a VaultZero encrypted backup (.vault file) - fully secure
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* CSV Import Instructions */}
          {importType === 'csv' && !result && (
            <>
              <div className="bg-primary-500/10 border border-primary-500/50 rounded-lg p-4">
                <h3 className="font-semibold text-primary-400 mb-2 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  How to Export Passwords from Your Browser
                </h3>
                <div className="text-sm text-slate-300 space-y-2">
                  <div>
                    <strong className="text-primary-300">Chrome/Edge:</strong> Settings → Passwords → ⋮ (menu) → Export passwords
                  </div>
                  <div>
                    <strong className="text-primary-300">Firefox:</strong> about:logins → ⋮ (menu) → Export Logins
                  </div>
                  <div>
                    <strong className="text-primary-300">Safari:</strong> File → Export Passwords
                  </div>
                </div>
              </div>

              {/* File Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  file
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-900/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {file ? (
                  <div className="space-y-3">
                    <FileText className="w-16 h-16 text-primary-400 mx-auto" />
                    <div>
                      <p className="text-slate-200 font-medium">{file.name}</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      Choose different file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-16 h-16 text-slate-500 mx-auto" />
                    <div>
                      <p className="text-slate-300 font-medium mb-1">
                        Drop your CSV file here
                      </p>
                      <p className="text-sm text-slate-500">or</p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors"
                    >
                      Browse Files
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Encrypted Backup Info */}
          {importType === 'backup' && !result && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
              <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Import Encrypted Backup
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                Click the button below to select your .vault backup file. Your credentials will be decrypted using your current master password.
              </p>
              <button
                onClick={handleImportBackup}
                disabled={importing}
                className="px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Select Backup File
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-red-400 text-sm">{error}</div>
            </div>
          )}

          {/* Import Result */}
          {result && (
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <div>
                  <h3 className="text-lg font-semibold text-green-400">
                    Import Complete!
                  </h3>
                  <p className="text-sm text-slate-300 mt-1">
                    {result.imported} password{result.imported !== 1 ? 's' : ''} imported successfully
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-green-500/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-100">{result.totalProcessed}</div>
                  <div className="text-xs text-slate-400 mt-1">Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{result.imported}</div>
                  <div className="text-xs text-slate-400 mt-1">Imported</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{result.skipped}</div>
                  <div className="text-xs text-slate-400 mt-1">Skipped</div>
                </div>
              </div>

              {/* Errors/Warnings */}
              {result.errors && result.errors.length > 0 && (
                <div className="pt-4 border-t border-green-500/30">
                  <h4 className="text-sm font-semibold text-slate-300 mb-2">
                    Skipped Items ({result.errors.length}):
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {result.errors.map((err: string, idx: number) => (
                      <div key={idx} className="text-xs text-slate-400 pl-2">
                        • {err}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {!result ? (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                {importType === 'csv' && (
                  <button
                    onClick={handleImportCSV}
                    disabled={!file || importing}
                    className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Import CSV
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleClose}
                className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
