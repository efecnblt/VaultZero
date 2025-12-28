import { useState } from 'react';
import { RefreshCw, Copy, Check, Settings, Zap } from 'lucide-react';

interface PasswordGeneratorProps {
  onPasswordGenerated: (password: string) => void;
}

const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ onPasswordGenerated }) => {
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generatePassword = async () => {
    setGenerating(true);
    try {
      // Call the Go backend to generate password
      const password = await (window as any).go.main.App.GeneratePasswordWithOptions({
        length,
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        excludeAmbiguous,
      });
      setGeneratedPassword(password);
    } catch (error) {
      console.error('Failed to generate password:', error);
    } finally {
      setGenerating(false);
    }
  };

  const generateQuickPassword = async () => {
    setGenerating(true);
    try {
      const password = await (window as any).go.main.App.GenerateQuickPassword(16);
      setGeneratedPassword(password);
    } catch (error) {
      console.error('Failed to generate password:', error);
    } finally {
      setGenerating(false);
    }
  };

  const usePassword = () => {
    if (generatedPassword) {
      onPasswordGenerated(generatedPassword);
    }
  };

  const copyToClipboard = async () => {
    if (generatedPassword) {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: 'None', color: 'bg-gray-500' };

    let strength = 0;
    if (pwd.length >= 12) strength++;
    if (pwd.length >= 16) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 4) return { strength, label: 'Medium', color: 'bg-yellow-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getPasswordStrength(generatedPassword);

  return (
    <div className="space-y-4">
      {/* Quick Generate Button */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={generateQuickPassword}
          disabled={generating}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          Quick Generate (Strong)
        </button>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
          title="Advanced options"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="bg-slate-900/50 rounded-lg p-4 space-y-4 border border-slate-700">
          {/* Length Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Password Length
              </label>
              <span className="text-sm text-primary-400 font-mono">{length}</span>
            </div>
            <input
              type="range"
              min="8"
              max="64"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>8</span>
              <span>64</span>
            </div>
          </div>

          {/* Character Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Include:</label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeUppercase}
                onChange={(e) => setIncludeUppercase(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-primary-600 focus:ring-primary-500 focus:ring-2"
              />
              <span className="text-sm text-slate-300">Uppercase (A-Z)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeLowercase}
                onChange={(e) => setIncludeLowercase(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-primary-600 focus:ring-primary-500 focus:ring-2"
              />
              <span className="text-sm text-slate-300">Lowercase (a-z)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeNumbers}
                onChange={(e) => setIncludeNumbers(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-primary-600 focus:ring-primary-500 focus:ring-2"
              />
              <span className="text-sm text-slate-300">Numbers (0-9)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-primary-600 focus:ring-primary-500 focus:ring-2"
              />
              <span className="text-sm text-slate-300">Symbols (!@#$%...)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeAmbiguous}
                onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-primary-600 focus:ring-primary-500 focus:ring-2"
              />
              <span className="text-sm text-slate-300">Exclude Ambiguous (i, l, 1, L, o, 0, O)</span>
            </label>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={generatePassword}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            Generate Custom Password
          </button>
        </div>
      )}

      {/* Generated Password Display */}
      {generatedPassword && (
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">Generated Password:</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded ${strength.color} text-white font-medium`}>
                {strength.label}
              </span>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={generatedPassword}
              readOnly
              className="w-full px-4 py-3 pr-24 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 font-mono text-sm select-all focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
              <button
                type="button"
                onClick={copyToClipboard}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-300" />
                )}
              </button>
            </div>
          </div>

          {/* Use Password Button */}
          <button
            type="button"
            onClick={usePassword}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
          >
            Use This Password
          </button>
        </div>
      )}
    </div>
  );
};

export default PasswordGenerator;
