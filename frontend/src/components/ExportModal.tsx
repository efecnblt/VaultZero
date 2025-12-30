import { useState } from 'react';
import { X, Download, Shield, AlertTriangle } from 'lucide-react';
import * as App from '../wailsjs/go/main/App';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [exportType, setExportType] = useState<'csv' | 'encrypted'>('encrypted');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setError('');
    setSuccess('');

    try {
      let filePath: string;

      if (exportType === 'csv') {
        filePath = await App.ExportToCSV();
      } else {
        filePath = await App.ExportEncryptedBackup();
      }

      if (filePath) {
        setSuccess(`Successfully exported to: ${filePath}`);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Download className="w-5 h-5 text-primary-500" />
            Export Credentials
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Export Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Choose Export Format
            </label>

            {/* Encrypted Backup Option */}
            <button
              onClick={() => setExportType('encrypted')}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                exportType === 'encrypted'
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <Shield className={`w-5 h-5 mt-0.5 ${exportType === 'encrypted' ? 'text-primary-500' : 'text-slate-400'}`} />
                <div className="flex-1">
                  <div className="font-medium text-slate-100 mb-1">
                    Encrypted Backup (Recommended)
                  </div>
                  <div className="text-sm text-slate-400">
                    Creates an encrypted .vault file. Your credentials remain secure and can only be opened with your master password.
                  </div>
                </div>
              </div>
            </button>

            {/* CSV Option */}
            <button
              onClick={() => setExportType('csv')}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                exportType === 'csv'
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <Download className={`w-5 h-5 mt-0.5 ${exportType === 'csv' ? 'text-primary-500' : 'text-slate-400'}`} />
                <div className="flex-1">
                  <div className="font-medium text-slate-100 mb-1">
                    CSV File (Plain Text)
                  </div>
                  <div className="text-sm text-slate-400">
                    Exports as plain text CSV. Compatible with other password managers, but passwords are NOT encrypted.
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Warning for CSV */}
          {exportType === 'csv' && (
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div className="text-sm text-amber-200">
                <strong>Security Warning:</strong> CSV exports contain your passwords in plain text. Store the file securely and delete it when no longer needed.
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              {success}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
