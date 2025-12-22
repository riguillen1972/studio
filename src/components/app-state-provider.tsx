"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AppState {
  isPremium: boolean;
  setIsPremium: (isPremium: boolean) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremiumState] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
        const storedValue = localStorage.getItem('isPremium');
        if (storedValue) {
          setIsPremiumState(JSON.parse(storedValue));
        }
    } catch (error) {
        console.error("Could not access local storage:", error);
    }
  }, []);

  const setIsPremium = (newValue: boolean) => {
    setIsPremiumState(newValue);
    try {
        localStorage.setItem('isPremium', JSON.stringify(newValue));
    } catch (error) {
        console.error("Could not access local storage:", error);
    }
  };

  const value = {
    isPremium: isMounted ? isPremium : false,
    setIsPremium,
  };

  return (
    <AppStateContext.Provider value={value}>
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
