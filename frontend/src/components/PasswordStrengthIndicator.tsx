import { useMemo } from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { calculatePasswordStrength, getStrengthLabel } from '../utils/passwordStrength';

interface PasswordStrengthIndicatorProps {
  password: string;
  showLabel?: boolean;
  showBar?: boolean;
  showFeedback?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showLabel = true,
  showBar = true,
  showFeedback = false,
}) => {
  const result = useMemo(() => calculatePasswordStrength(password), [password]);

  if (!password && !showFeedback) return null;

  return (
    <div className="space-y-2">
      {/* Strength Bar */}
      {showBar && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            {showLabel && (
              <span className="text-slate-400">Password Strength:</span>
            )}
            <span style={{ color: result.color }} className="font-medium">
              {getStrengthLabel(result.strength)}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${result.score}%`,
                backgroundColor: result.color,
              }}
            />
          </div>
        </div>
      )}

      {/* Icon Only Mode (for compact display) */}
      {!showBar && showLabel && (
        <div className="flex items-center gap-2">
          {result.strength === 'weak' && (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          )}
          {result.strength === 'medium' && (
            <Shield className="w-4 h-4 text-orange-400" />
          )}
          {(result.strength === 'strong' || result.strength === 'very-strong') && (
            <CheckCircle className="w-4 h-4 text-green-400" />
          )}
          <span style={{ color: result.color }} className="text-xs font-medium">
            {getStrengthLabel(result.strength)}
          </span>
        </div>
      )}

      {/* Feedback */}
      {showFeedback && result.feedback.length > 0 && (
        <div className="text-xs text-slate-400 space-y-1">
          {result.feedback.map((tip, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-slate-600 mt-0.5">•</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
