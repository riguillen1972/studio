
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { SupportedModel } from '@/ai/genkit';

const FREE_FLASH_TOKEN_LIMIT = 1000000;
const FREE_HAIKU_TOKEN_LIMIT = 1000000;

const PRO_FLASH_TOKEN_LIMIT = 1000000;
const PRO_PRO_TOKEN_LIMIT = 1000000;
const PRO_HAIKU_TOKEN_LIMIT = 1000000;

const MAX_FLASH_TOKEN_LIMIT = 2000000;
const MAX_PRO_TOKEN_LIMIT = 2000000;
const MAX_HAIKU_TOKEN_LIMIT = 2000000;


export type SubscriptionTier = 'free' | 'pro' | 'max';

interface TokenInfo {
  flashUsedTokens: number;
  proUsedTokens: number;
  haikuUsedTokens: number;
  date: string; // YYYY-MM
}

interface AppState {
  tier: SubscriptionTier;
  setTier: (tier: SubscriptionTier) => void;
  isPremium: boolean;
  
  flashTokenLimit: number;
  flashTokensRemaining: number;
  proTokenLimit: number;
  proTokensRemaining: number;
  haikuTokenLimit: number;
  haikuTokensRemaining: number;

  hasTokens: (model: SupportedModel) => boolean;
  consumeTokens: (amount: number, model: SupportedModel) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [tier, setTierState] = useState<SubscriptionTier>('free');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({ flashUsedTokens: 0, proUsedTokens: 0, haikuUsedTokens: 0, date: '' });
  const [isMounted, setIsMounted] = useState(false);

  const getCurrentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

  useEffect(() => {
    setIsMounted(true);
    try {
        const storedTier = localStorage.getItem('subscriptionTier');
        if (storedTier && (storedTier === 'free' || storedTier === 'pro' || storedTier === 'max')) {
          setTierState(storedTier as SubscriptionTier);
        }

        const currentMonth = getCurrentMonth();
        const storedTokenInfo = localStorage.getItem('tokenInfo');
        if (storedTokenInfo) {
            const parsed: Partial<TokenInfo> = JSON.parse(storedTokenInfo);
            if (parsed.date === currentMonth) {
                setTokenInfo({
                    flashUsedTokens: parsed.flashUsedTokens || 0,
                    proUsedTokens: parsed.proUsedTokens || 0,
                    haikuUsedTokens: parsed.haikuUsedTokens || 0,
                    date: parsed.date,
                });
            } else {
                 setTokenInfo({ flashUsedTokens: 0, proUsedTokens: 0, haikuUsedTokens: 0, date: currentMonth });
            }
        } else {
            setTokenInfo({ flashUsedTokens: 0, proUsedTokens: 0, haikuUsedTokens: 0, date: currentMonth });
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

  const isPremium = tier === 'pro' || tier === 'max';

  const getFlashTokenLimit = () => {
    switch (tier) {
        case 'max': return MAX_FLASH_TOKEN_LIMIT;
        case 'pro': return PRO_FLASH_TOKEN_LIMIT;
        default: return FREE_FLASH_TOKEN_LIMIT;
    }
  }

  const getProTokenLimit = () => {
    switch (tier) {
        case 'max': return MAX_PRO_TOKEN_LIMIT;
        case 'pro': return PRO_PRO_TOKEN_LIMIT;
        default: return 0;
    }
  }

  const getHaikuTokenLimit = () => {
    switch (tier) {
        case 'max': return MAX_HAIKU_TOKEN_LIMIT;
        case 'pro': return PRO_HAIKU_TOKEN_LIMIT;
        default: return FREE_HAIKU_TOKEN_LIMIT;
    }
  }

  const flashTokenLimit = getFlashTokenLimit();
  const proTokenLimit = getProTokenLimit();
  const haikuTokenLimit = getHaikuTokenLimit();

  const hasTokens = useCallback((model: SupportedModel): boolean => {
    if (!isMounted) return false;
    const currentMonth = getCurrentMonth();
    if (tokenInfo.date !== currentMonth) return true;

    if (model === 'pro') {
        return isPremium && tokenInfo.proUsedTokens < proTokenLimit;
    }
    if (model === 'haiku') {
        return tokenInfo.haikuUsedTokens < haikuTokenLimit;
    }
    // model === 'flash'
    return tokenInfo.flashUsedTokens < flashTokenLimit;
  }, [isMounted, isPremium, tokenInfo, flashTokenLimit, proTokenLimit, haikuTokenLimit]);
  
  const consumeTokens = useCallback((amount: number, model: SupportedModel) => {
    if (!isMounted) return;
    const currentMonth = getCurrentMonth();
    
    setTokenInfo(prev => {
        const isNewMonth = prev.date !== currentMonth;
        let newFlashUsed = isNewMonth ? 0 : prev.flashUsedTokens;
        let newProUsed = isNewMonth ? 0 : prev.proUsedTokens;
        let newHaikuUsed = isNewMonth ? 0 : prev.haikuUsedTokens;
        
        if (model === 'pro' && isPremium) {
            newProUsed += amount;
        } else if (model === 'haiku') {
            newHaikuUsed += amount;
        } else { // model === 'flash'
            newFlashUsed += amount;
        }
        
        const newInfo: TokenInfo = { flashUsedTokens: newFlashUsed, proUsedTokens: newProUsed, haikuUsedTokens: newHaikuUsed, date: currentMonth };
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
  const haikuTokensRemaining = isMounted ? Math.max(0, haikuTokenLimit - tokenInfo.haikuUsedTokens) : haikuTokenLimit;

  const value = {
    tier: isMounted ? tier : 'free',
    setTier,
    isPremium: isMounted ? isPremium : false,
    flashTokenLimit,
    flashTokensRemaining,
    proTokenLimit,
    proTokensRemaining,
    haikuTokenLimit,
    haikuTokensRemaining,
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
