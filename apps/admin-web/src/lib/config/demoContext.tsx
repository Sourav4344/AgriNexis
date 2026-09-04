'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface DemoContextType {
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  toggleDemoMode: () => void;
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  authToken: string;
  setAuthToken: (token: string) => void;
  isBackendConnected: boolean;
  setIsBackendConnected: (connected: boolean) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [demoMode, setDemoModeState] = useState<boolean>(false);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('http://localhost:8000/api/v1');
  const [authToken, setAuthToken] = useState<string>('');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  useEffect(() => {
    // Check saved preferences
    const savedDemo = localStorage.getItem('agrinexis_admin_demo_mode');
    if (savedDemo !== null) {
      setDemoModeState(savedDemo === 'true');
    }
    const savedUrl = localStorage.getItem('agrinexis_admin_api_url');
    if (savedUrl) {
      setApiBaseUrl(savedUrl);
    }
    const savedToken = localStorage.getItem('agrinexis_admin_token');
    if (savedToken) {
      setAuthToken(savedToken);
    }
  }, []);

  const setDemoMode = (enabled: boolean) => {
    setDemoModeState(enabled);
    localStorage.setItem('agrinexis_admin_demo_mode', String(enabled));
  };

  const toggleDemoMode = () => {
    setDemoMode(!demoMode);
  };

  const handleSetApiBaseUrl = (url: string) => {
    setApiBaseUrl(url);
    localStorage.setItem('agrinexis_admin_api_url', url);
  };

  const handleSetAuthToken = (token: string) => {
    setAuthToken(token);
    localStorage.setItem('agrinexis_admin_token', token);
  };

  return (
    <DemoContext.Provider
      value={{
        demoMode,
        setDemoMode,
        toggleDemoMode,
        apiBaseUrl,
        setApiBaseUrl: handleSetApiBaseUrl,
        authToken,
        setAuthToken: handleSetAuthToken,
        isBackendConnected,
        setIsBackendConnected,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
