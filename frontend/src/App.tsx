import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import * as App from './wailsjs/go/main/App';

function AppComponent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const unlocked = await App.IsUnlocked();
      setIsAuthenticated(unlocked);
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Loading VaultZero...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      {isAuthenticated ? (
        <Dashboard />
      ) : (
        <Auth onAuthenticated={handleAuthenticated} />
      )}
    </div>
  );
}

export default AppComponent;
