import { useEffect, useRef } from 'react';
import * as App from '../wailsjs/go/main/App';

interface UseAutoLockOptions {
  enabled: boolean;
  timeoutMinutes: number;
  onLock?: () => void;
}

/**
 * Hook to automatically lock the vault after inactivity
 */
export const useAutoLock = ({ enabled, timeoutMinutes, onLock }: UseAutoLockOptions) => {
  const timeoutRef = useRef<number | null>(null);
  const timeoutMs = timeoutMinutes * 60 * 1000; // Convert to milliseconds

  const resetTimer = () => {
    // Clear existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only set new timer if enabled
    if (enabled && timeoutMinutes > 0) {
      timeoutRef.current = window.setTimeout(() => {
        console.log('[AutoLock] Inactivity timeout - locking vault');
        App.LockVault();
        if (onLock) {
          onLock();
        }
      }, timeoutMs);
    }
  };

  useEffect(() => {
    if (!enabled) {
      // Clear timer if auto-lock is disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Events to track user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Reset timer on any user activity
    const handleActivity = () => {
      resetTimer();
    };

    // Attach event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, timeoutMs]);

  return {
    resetTimer, // Expose reset function for manual reset if needed
  };
};
