import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Shield } from 'lucide-react';
import * as App from '../wailsjs/go/main/App';

interface AuthProps {
  onAuthenticated: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthenticated }) => {
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCreatingVault, setIsCreatingVault] = useState(false);
  const [vaultExists, setVaultExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkVaultExists();
  }, []);

  const checkVaultExists = async () => {
    try {
      const exists = await App.CheckVaultExists();
      setVaultExists(exists);
      setIsCreatingVault(!exists);
    } catch (err) {
      console.error('Failed to check vault:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!masterPassword) {
        throw new Error('Master password is required');
      }

      if (isCreatingVault) {
        if (masterPassword.length < 8) {
          throw new Error('Master password must be at least 8 characters long');
        }
        if (masterPassword !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await App.CreateVault(masterPassword);
      } else {
        await App.UnlockVault(masterPassword);
      }

      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-6 shadow-xl shadow-primary-500/30">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-100 mb-2">VaultZero</h1>
          <p className="text-slate-400">Secure Password Manager</p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 p-8">
          <h2 className="text-2xl font-bold text-slate-100 mb-6">
            {isCreatingVault ? 'Create Your Vault' : 'Unlock Your Vault'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            {isCreatingVault && (
              <div className="bg-primary-500/10 border border-primary-500/50 rounded-lg p-4 text-primary-400 text-sm">
                <p className="font-medium mb-1">Important:</p>
                <p>
                  Your master password is the only way to access your vault. Make sure to
                  remember it - there is no recovery option.
                </p>
              </div>
            )}

            {/* Master Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Master Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="Enter your master password"
                  className="w-full pl-12 pr-12 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
              {isCreatingVault && (
                <p className="mt-2 text-xs text-slate-500">
                  Must be at least 8 characters long
                </p>
              )}
            </div>

            {/* Confirm Password (only when creating) */}
            {isCreatingVault && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Master Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your master password"
                    className="w-full pl-12 pr-12 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-primary-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : isCreatingVault ? 'Create Vault' : 'Unlock Vault'}
            </button>
          </form>

          {/* Toggle between create and unlock (if vault exists) */}
          {vaultExists && !isCreatingVault && (
            <div className="mt-6 text-center space-y-3">
              {/* Reset Vault Button - shown when there's an error */}
              {error && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                  <p className="text-sm text-yellow-400 mb-3">
                    Can't unlock your vault? This might be due to a corrupted vault file.
                  </p>
                  <button
                    onClick={async () => {
                      if (window.confirm('⚠️ WARNING: This will permanently delete your vault and all stored passwords. Are you absolutely sure?')) {
                        try {
                          await (window as any).go.main.App.DeleteVault();
                          setError('');
                          setVaultExists(false);
                          setIsCreatingVault(true);
                          alert('Vault deleted. You can now create a new vault.');
                        } catch (err) {
                          setError('Failed to delete vault');
                        }
                      }
                    }}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
                  >
                    Reset Vault (Delete All Data)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>All data is encrypted locally with AES-256-GCM</p>
          <p className="mt-1">Your passwords never leave your device</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
