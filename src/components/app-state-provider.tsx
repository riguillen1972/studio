"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AppState {
  isPremium: boolean;
  setIsPremium: (isPremium: boolean) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremiumState] = useState(false);

  useEffect(() => {
    const storedValue = localStorage.getItem('isPremium');
    if (storedValue) {
      setIsPremiumState(JSON.parse(storedValue));
    }
  }, []);

  const setIsPremium = (newValue: boolean) => {
    setIsPremiumState(newValue);
    localStorage.setItem('isPremium', JSON.stringify(newValue));
  };

  return (
    <AppStateContext.Provider value={{ isPremium, setIsPremium }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
