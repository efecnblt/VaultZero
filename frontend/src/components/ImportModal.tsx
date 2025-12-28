import { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';
import * as App from '../wailsjs/go/main/App';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
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

  const handleImport = async () => {
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

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError('');
    onClose();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
              Import from Chrome, Firefox, Edge, Safari, or any CSV export
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
          {/* Instructions */}
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
          {!result && (
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
                <button
                  onClick={handleImport}
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
                      Import Passwords
                    </>
                  )}
                </button>
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
