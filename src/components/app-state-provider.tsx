
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

const FREE_FLASH_TOKEN_LIMIT = 1000000;
const PRO_FLASH_TOKEN_LIMIT = 1000000;
const PRO_PRO_TOKEN_LIMIT = 1000000;
const MAX_FLASH_TOKEN_LIMIT = 2000000;
const MAX_PRO_TOKEN_LIMIT = 2000000;

export type SubscriptionTier = 'free' | 'pro' | 'max';

interface TokenInfo {
  flashUsedTokens: number;
  proUsedTokens: number;
  date: string; // YYYY-MM
}

interface AppState {
  tier: SubscriptionTier;
  setTier: (tier: SubscriptionTier) => void;
  
  flashTokenLimit: number;
  flashTokensRemaining: number;
  proTokenLimit: number;
  proTokensRemaining: number;

  hasTokens: (model: 'flash' | 'pro') => boolean;
  consumeTokens: (amount: number, model: 'flash' | 'pro') => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [tier, setTierState] = useState<SubscriptionTier>('free');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({ flashUsedTokens: 0, proUsedTokens: 0, date: '' });
  const [isMounted, setIsMounted] = useState(false);

  const getCurrentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

  useEffect(() => {
    setIsMounted(true);
    try {
        const storedTier = localStorage.getItem('subscriptionTier');
        if (storedTier && (storedTier === 'free' || storedTier === 'pro' || storedTier === 'max')) {
          setTierState(storedTier);
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

  const setTier = (newTier: SubscriptionTier) => {
    setTierState(newTier);
     try {
        localStorage.setItem('subscriptionTier', newTier);
    } catch (error) {
        console.error("Could not access local storage:", error);
    }
  };

  const flashTokenLimit = tier === 'max' ? MAX_FLASH_TOKEN_LIMIT : tier === 'pro' ? PRO_FLASH_TOKEN_LIMIT : FREE_FLASH_TOKEN_LIMIT;
  const proTokenLimit = tier === 'max' ? MAX_PRO_TOKEN_LIMIT : tier === 'pro' ? PRO_PRO_TOKEN_LIMIT : 0;

  const hasTokens = useCallback((model: 'flash' | 'pro'): boolean => {
    if (!isMounted) return false;
    const currentMonth = getCurrentMonth();
    if (tokenInfo.date !== currentMonth) return true;

    if (model === 'pro') {
        return (tier === 'pro' || tier === 'max') && tokenInfo.proUsedTokens < proTokenLimit;
    }
    // model === 'flash'
    return tokenInfo.flashUsedTokens < flashTokenLimit;
  }, [isMounted, tier, tokenInfo, flashTokenLimit, proTokenLimit]);
  
  const consumeTokens = useCallback((amount: number, model: 'flash' | 'pro') => {
    if (!isMounted) return;
    const currentMonth = getCurrentMonth();
    
    setTokenInfo(prev => {
        const isNewMonth = prev.date !== currentMonth;
        let newFlashUsed = isNewMonth ? 0 : prev.flashUsedTokens;
        let newProUsed = isNewMonth ? 0 : prev.proUsedTokens;
        
        if (model === 'pro' && (tier === 'pro' || tier === 'max')) {
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
  }, [isMounted, tier]);
  
  const flashTokensRemaining = isMounted ? Math.max(0, flashTokenLimit - tokenInfo.flashUsedTokens) : flashTokenLimit;
  const proTokensRemaining = isMounted ? Math.max(0, proTokenLimit - tokenInfo.proUsedTokens) : proTokenLimit;

  const value = {
    tier: isMounted ? tier : 'free',
    setTier,
    flashTokenLimit,
    flashTokensRemaining,
    proTokenLimit,
    proTokensRemaining,
    hasTokens,
    consumeTokens,
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
