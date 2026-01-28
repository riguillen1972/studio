
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

const MONTHLY_TOKEN_LIMIT = 1000000;

interface TokenInfo {
  usedTokens: number;
  date: string; // YYYY-MM
}

interface AppState {
  isPremium: boolean;
  setIsPremium: (isPremium: boolean) => void;
  tokensUsed: number;
  tokenLimit: number;
  hasTokens: () => boolean;
  consumeTokens: (amount: number) => void;
  tokensRemaining: number;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremiumState] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({ usedTokens: 0, date: '' });
  const [isMounted, setIsMounted] = useState(false);

  const getCurrentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

  useEffect(() => {
    setIsMounted(true);
    try {
        const storedPremium = localStorage.getItem('isPremium');
        if (storedPremium) {
          setIsPremiumState(JSON.parse(storedPremium));
        }

        const currentMonth = getCurrentMonth();

        const storedTokenInfo = localStorage.getItem('tokenInfo');
        if (storedTokenInfo) {
            const parsed: TokenInfo = JSON.parse(storedTokenInfo);
            if (parsed.date === currentMonth) {
                setTokenInfo(parsed);
            } else {
                setTokenInfo({ usedTokens: 0, date: currentMonth });
            }
        } else {
            setTokenInfo({ usedTokens: 0, date: currentMonth });
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

  const tokenLimit = MONTHLY_TOKEN_LIMIT;

  const hasTokens = useCallback(() => {
    if (!isMounted) return false;
    const currentMonth = getCurrentMonth();
    if (tokenInfo.date !== currentMonth) {
      return true; // Will be reset on next action
    }
    return tokenInfo.usedTokens < tokenLimit;
  }, [isMounted, tokenInfo, tokenLimit]);
  
  const consumeTokens = useCallback((amount: number) => {
    if (!isMounted) return;
    const currentMonth = getCurrentMonth();
    setTokenInfo(prev => {
        const newUsed = prev.date === currentMonth ? prev.usedTokens + amount : amount;
        const newInfo = { usedTokens: newUsed, date: currentMonth };
        try {
            localStorage.setItem('tokenInfo', JSON.stringify(newInfo));
        } catch (error) {
            console.error("Could not access local storage:", error);
        }
        return newInfo;
    });
  }, [isMounted]);
  
  const tokensRemaining = isMounted ? Math.max(0, tokenLimit - tokenInfo.usedTokens) : tokenLimit;

  const value = {
    isPremium: isMounted ? isPremium : false,
    setIsPremium,
    tokensUsed: tokenInfo.usedTokens,
    tokenLimit,
    hasTokens,
    consumeTokens,
    tokensRemaining,
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
