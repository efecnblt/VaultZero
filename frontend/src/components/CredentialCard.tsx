import { useState } from 'react';
import { Copy, Eye, EyeOff, Trash2, Edit, Check, AlertCircle, Star } from 'lucide-react';
import { Credential } from '../types';
import * as App from '../wailsjs/go/main/App';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { countPasswordUsage } from '../utils/duplicatePassword';

interface CredentialCardProps {
  credential: Credential;
  allCredentials: Credential[];
  onDelete: (id: string) => void;
  onEdit: (credential: Credential) => void;
}

const CredentialCard: React.FC<CredentialCardProps> = ({ credential, allCredentials, onDelete, onEdit }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Count how many times this password is used
  const passwordUsageCount = countPasswordUsage(credential.password, allCredentials);
  const isPasswordReused = passwordUsageCount > 1;

  const handleCopyUsername = async () => {
    try {
      await App.CopyUsername(credential.id);
      setCopiedUsername(true);
      setTimeout(() => setCopiedUsername(false), 2000);
    } catch (error) {
      console.error('Failed to copy username:', error);
    }
  };

  const handleCopyPassword = async () => {
    try {
      await App.CopyPassword(credential.id);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    } catch (error) {
      console.error('Failed to copy password:', error);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await App.ToggleFavorite(credential.id);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Social: 'bg-blue-500/10 text-blue-400',
      Work: 'bg-purple-500/10 text-purple-400',
      Finance: 'bg-green-500/10 text-green-400',
      Other: 'bg-gray-500/10 text-gray-400',
    };
    return colors[category] || colors.Other;
  };

  return (
    <div className="group relative bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 hover:bg-slate-800/80 transition-all duration-300 border border-slate-700/50 hover:border-slate-600 hover:shadow-xl hover:shadow-primary-500/10">
      {/* Icon and Service Name */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0">
          {credential.iconURL ? (
            <img
              src={credential.iconURL}
              alt={credential.serviceName}
              className="w-16 h-16 rounded-lg object-cover bg-slate-700"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold">
              {credential.serviceName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-slate-100 mb-1 truncate">
            {credential.serviceName}
          </h3>
          {credential.url && (
            <a
              href={credential.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-400 hover:text-primary-400 transition-colors truncate block"
            >
              {credential.url}
            </a>
          )}
          <span
            className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
              credential.category
            )}`}
          >
            {credential.category}
          </span>
        </div>

        {/* Action buttons - visible on hover */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded-lg transition-colors ${
              credential.isFavorite
                ? 'bg-amber-500/20 hover:bg-amber-500/30'
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
            title={credential.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              className={`w-4 h-4 ${
                credential.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
              }`}
            />
          </button>
          <button
            onClick={() => onEdit(credential)}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-slate-300" />
          </button>
          <button
            onClick={() => onDelete(credential.id)}
            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Username */}
      <div className="mb-3">
        <div className="flex items-center justify-between bg-slate-900/50 rounded-lg px-4 py-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 mb-1">Username</div>
            <div className="text-slate-200 font-medium truncate">{credential.username}</div>
          </div>
          <button
            onClick={handleCopyUsername}
            className="ml-3 p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors flex-shrink-0"
            title="Copy username"
          >
            {copiedUsername ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-slate-300" />
            )}
          </button>
        </div>
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between bg-slate-900/50 rounded-lg px-4 py-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="text-xs text-slate-500">Password</div>
                {isPasswordReused && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded text-xs text-amber-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>Used in {passwordUsageCount} places</span>
                  </div>
                )}
              </div>
              <PasswordStrengthIndicator
                password={credential.password}
                showLabel={true}
                showBar={false}
                showFeedback={false}
              />
            </div>
            <div className="text-slate-200 font-mono">
              {showPassword ? credential.password : '••••••••••••'}
            </div>
          </div>
          <div className="flex gap-2 ml-3 flex-shrink-0">
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-slate-300" />
              ) : (
                <Eye className="w-4 h-4 text-slate-300" />
              )}
            </button>
            <button
              onClick={handleCopyPassword}
              className="p-2 rounded-lg bg-primary-600 hover:bg-primary-500 transition-colors"
              title="Copy password"
            >
              {copiedPassword ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <Copy className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CredentialCard;
