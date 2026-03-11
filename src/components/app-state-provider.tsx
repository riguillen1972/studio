
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { SupportedModel } from '@/ai/genkit';
import { useAuth } from '@/lib/supabase/auth-provider';
import { createClient } from '@/lib/supabase/client';

// Free tier: Gemini 2.5 Flash only
const FREE_FLASH_TOKEN_LIMIT = 1000000;
const FREE_PRO_TOKEN_LIMIT = 0;      // No access
const FREE_HAIKU_TOKEN_LIMIT = 0;    // No access

// Pro tier: Gemini 2.5 Flash + Gemini 2.5 Pro
const PRO_FLASH_TOKEN_LIMIT = 1000000;
const PRO_PRO_TOKEN_LIMIT = 1000000;
const PRO_HAIKU_TOKEN_LIMIT = 0;     // No access

// Max tier: Gemini 2.5 Flash + Claude 3 Haiku + Gemini 2.5 Pro
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
  const { user } = useAuth();
  const supabase = createClient();
  const [tier, setTierState] = useState<SubscriptionTier>('free');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({ flashUsedTokens: 0, proUsedTokens: 0, haikuUsedTokens: 0, date: '' });
  const [isMounted, setIsMounted] = useState(false);

  const getCurrentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

  // Load user profile & token usage from Supabase
  useEffect(() => {
    setIsMounted(true);
    if (!user) return;

    const loadProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .single();
      
      if (profile?.tier) {
        setTierState(profile.tier as SubscriptionTier);
      }
    };

    const loadTokenUsage = async () => {
      const currentMonth = getCurrentMonth();
      const { data: usage } = await supabase
        .from('token_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .single();
      
      if (usage) {
        setTokenInfo({
          flashUsedTokens: usage.flash_used || 0,
          proUsedTokens: usage.pro_used || 0,
          haikuUsedTokens: usage.haiku_used || 0,
          date: currentMonth,
        });
      } else {
        setTokenInfo({ flashUsedTokens: 0, proUsedTokens: 0, haikuUsedTokens: 0, date: currentMonth });
      }
    };

    loadProfile();
    loadTokenUsage();
  }, [user, supabase]);

  const setTier = async (newTier: SubscriptionTier) => {
    setTierState(newTier);
    if (user) {
      await supabase
        .from('profiles')
        .update({ tier: newTier })
        .eq('id', user.id);
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
        case 'pro': return PRO_PRO_TOKEN_LIMIT;
        case 'max': return MAX_PRO_TOKEN_LIMIT;
        default: return FREE_PRO_TOKEN_LIMIT;
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
        // Only Pro tier has access to Gemini 2.5 Pro
        return tier === 'pro' && tokenInfo.proUsedTokens < proTokenLimit;
    }
    if (model === 'haiku') {
        // Only Max tier has access to Claude 3 Haiku
        return tier === 'max' && tokenInfo.haikuUsedTokens < haikuTokenLimit;
    }
    // model === 'flash' — available to all tiers
    return tokenInfo.flashUsedTokens < flashTokenLimit;
  }, [isMounted, tier, tokenInfo, flashTokenLimit, proTokenLimit, haikuTokenLimit]);
  
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
        
        // Save to Supabase in background
        if (user) {
          supabase
            .from('token_usage')
            .upsert({
              user_id: user.id,
              month: currentMonth,
              flash_used: newFlashUsed,
              pro_used: newProUsed,
              haiku_used: newHaikuUsed,
            }, { onConflict: 'user_id,month' })
            .then();
        }
        
        return newInfo;
    });
  }, [isMounted, isPremium, user, supabase]);
  
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
