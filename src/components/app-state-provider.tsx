
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

const MONTHLY_TOKEN_LIMIT = 1000000;

interface TokenInfo {
  flashUsedTokens: number;
  proUsedTokens: number;
  date: string; // YYYY-MM
}

interface AppState {
  isPremium: boolean;
  setIsPremium: (isPremium: boolean) => void;
  
  flashTokenLimit: number;
  flashTokensRemaining: number;
  proTokenLimit: number;
  proTokensRemaining: number;

  hasTokens: (model: 'flash' | 'pro') => boolean;
  consumeTokens: (amount: number, model: 'flash' | 'pro') => void;
  
  // For backwards compatibility in some UI components
  tokensRemaining: number;
  tokenLimit: number;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremiumState] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({ flashUsedTokens: 0, proUsedTokens: 0, date: '' });
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
            const parsed: Partial<TokenInfo> = JSON.parse(storedTokenInfo);
            if (parsed.date === currentMonth) {
                setTokenInfo({
                    flashUsedTokens: parsed.flashUsedTokens || 0,
                    proUsedTokens: parsed.proUsedTokens || 0,
                    date: parsed.date,
                });
            } else {
                 setTokenInfo({ flashUsedTokens: 0, proUsedTokens: 0, date: currentMonth });
            }
        } else {
            setTokenInfo({ flashUsedTokens: 0, proUsedTokens: 0, date: currentMonth });
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

  const flashTokenLimit = MONTHLY_TOKEN_LIMIT;
  const proTokenLimit = isPremium ? MONTHLY_TOKEN_LIMIT : 0;

  const hasTokens = useCallback((model: 'flash' | 'pro'): boolean => {
    if (!isMounted) return false;
    const currentMonth = getCurrentMonth();
    if (tokenInfo.date !== currentMonth) return true;

    if (model === 'pro') {
        return isPremium && tokenInfo.proUsedTokens < proTokenLimit;
    }
    // model === 'flash'
    return tokenInfo.flashUsedTokens < flashTokenLimit;
  }, [isMounted, isPremium, tokenInfo, flashTokenLimit, proTokenLimit]);
  
  const consumeTokens = useCallback((amount: number, model: 'flash' | 'pro') => {
    if (!isMounted) return;
    const currentMonth = getCurrentMonth();
    
    setTokenInfo(prev => {
        const isNewMonth = prev.date !== currentMonth;
        let newFlashUsed = isNewMonth ? 0 : prev.flashUsedTokens;
        let newProUsed = isNewMonth ? 0 : prev.proUsedTokens;
        
        if (model === 'pro' && isPremium) {
            newProUsed += amount;
        } else { // model === 'flash'
            newFlashUsed += amount;
        }
        
        const newInfo: TokenInfo = { flashUsedTokens: newFlashUsed, proUsedTokens: newProUsed, date: currentMonth };
        try {
            localStorage.setItem('tokenInfo', JSON.stringify(newInfo));
        } catch (error) {
            console.error("Could not access local storage:", error);
        }
        return newInfo;
    });
  }, [isMounted, isPremium]);
  
  const flashTokensRemaining = isMounted ? Math.max(0, flashTokenLimit - tokenInfo.flashUsedTokens) : flashTokenLimit;
  const proTokensRemaining = isMounted ? Math.max(0, proTokenLimit - tokenInfo.proUsedTokens) : proTokenLimit;

  // Simplified legacy values for simple UI displays.
  // Free users see flash tokens, premium users see their pro tokens.
  const tokensRemaining = isPremium ? proTokensRemaining : flashTokensRemaining;
  const tokenLimit = isPremium ? proTokenLimit : flashTokenLimit;

  const value = {
    isPremium: isMounted ? isPremium : false,
    setIsPremium,
    flashTokenLimit,
    flashTokensRemaining,
    proTokenLimit,
    proTokensRemaining,
    hasTokens,
    consumeTokens,
    tokensRemaining,
    tokenLimit,
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
