
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { SupportedModel } from '@/ai/genkit';
import { useAuth } from '@/lib/supabase/auth-provider';
import { createClient } from '@/lib/supabase/client';

// Free tier: Gemini 2.5 Flash-Lite (Ads everywhere)
const FREE_GEMMA3_TOKEN_LIMIT = 250000;
const FREE_FLASH_TOKEN_LIMIT = 0;    // No access
const FREE_PRO_TOKEN_LIMIT = 0;      // No access
const FREE_HAIKU_TOKEN_LIMIT = 0;    // No access

// Pro tier: Gemini 2.5 Flash + Gemini 2.5 Pro
const PRO_GEMMA3_TOKEN_LIMIT = 500000; // Give them lite access just in case
const PRO_FLASH_TOKEN_LIMIT = 1000000;
const PRO_PRO_TOKEN_LIMIT = 500000;
const PRO_HAIKU_TOKEN_LIMIT = 0;     // No access

// Max tier: Gemini 2.5 Flash + Claude Haiku 4.5
const MAX_GEMMA3_TOKEN_LIMIT = 500000; // Give them lite access just in case
const MAX_FLASH_TOKEN_LIMIT = 2000000;
const MAX_PRO_TOKEN_LIMIT = 0;       // No access
const MAX_HAIKU_TOKEN_LIMIT = 2000000;


export type SubscriptionTier = 'free' | 'pro' | 'max';

interface TokenInfo {
  gemma3UsedTokens: number;
  flashUsedTokens: number;
  proUsedTokens: number;
  haikuUsedTokens: number;
  date: string; // YYYY-MM
}

interface AppState {
  tier: SubscriptionTier;
  setTier: (tier: SubscriptionTier) => void;
  isPremium: boolean;
  
  role: string | null;
  gradeLevel: string | null;
  careerField: string | null;
  classCode: string | null;
  needsRolePicker: boolean;
  updateProfile: (updates: { role?: string; gradeLevel?: string; careerField?: string; classCode?: string }) => Promise<void>;
  
  gemma3TokenLimit: number;
  gemma3TokensRemaining: number;
  flashTokenLimit: number;
  flashTokensRemaining: number;
  proTokenLimit: number;
  proTokensRemaining: number;
  haikuTokenLimit: number;
  haikuTokensRemaining: number;

  hasTokens: (model: SupportedModel) => boolean;
  consumeTokens: (amount: number, model: SupportedModel) => void;
  isLoaded: boolean;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [tier, setTierState] = useState<SubscriptionTier>('free');
  const [role, setRole] = useState<string | null>(null);
  const [gradeLevel, setGradeLevel] = useState<string | null>(null);
  const [careerField, setCareerField] = useState<string | null>(null);
  const [classCode, setClassCode] = useState<string | null>(null);
  const [needsRolePicker, setNeedsRolePicker] = useState<boolean>(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({ gemma3UsedTokens: 0, flashUsedTokens: 0, proUsedTokens: 0, haikuUsedTokens: 0, date: '' });
  const [isMounted, setIsMounted] = useState(false);

  const getCurrentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

  // Load user profile & token usage from Supabase
  useEffect(() => {
    setIsMounted(true);
    if (!user) return;

    const loadProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier, role, grade_level, career_field, class_code')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        if (profile.tier) setTierState(profile.tier as SubscriptionTier);
        setRole(profile.role);
        setGradeLevel(profile.grade_level);
        setCareerField(profile.career_field);
        setClassCode(profile.class_code);
        
        // If role is missing or empty, they need to pick one
        setNeedsRolePicker(!profile.role || profile.role.trim() === '');
      } else {
        setNeedsRolePicker(true);
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
          gemma3UsedTokens: usage.flash_lite_used || 0,
          flashUsedTokens: usage.flash_used || 0,
          proUsedTokens: usage.pro_used || 0,
          haikuUsedTokens: usage.haiku_used || 0,
          date: currentMonth,
        });
      } else {
        setTokenInfo({ gemma3UsedTokens: 0, flashUsedTokens: 0, proUsedTokens: 0, haikuUsedTokens: 0, date: currentMonth });
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

  const updateProfile = async (updates: { role?: string; gradeLevel?: string; careerField?: string; classCode?: string }) => {
    if (!user) return;
    
    const dbUpdates: any = {};
    if (updates.role !== undefined) {
      dbUpdates.role = updates.role;
      setRole(updates.role);
    }
    if (updates.gradeLevel !== undefined) {
      dbUpdates.grade_level = updates.gradeLevel;
      setGradeLevel(updates.gradeLevel);
    }
    if (updates.careerField !== undefined) {
      dbUpdates.career_field = updates.careerField;
      setCareerField(updates.careerField);
    }
    if (updates.classCode !== undefined) {
      dbUpdates.class_code = updates.classCode;
      setClassCode(updates.classCode);
    }

    await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', user.id);
      
    setNeedsRolePicker(false);
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

  const getGemma3TokenLimit = () => {
    switch (tier) {
        case 'max': return MAX_GEMMA3_TOKEN_LIMIT;
        case 'pro': return PRO_GEMMA3_TOKEN_LIMIT;
        default: return FREE_GEMMA3_TOKEN_LIMIT;
    }
  }

  const gemma3TokenLimit = getGemma3TokenLimit();
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
        // Only Max tier has access to Claude Haiku 4.5
        return tier === 'max' && tokenInfo.haikuUsedTokens < haikuTokenLimit;
    }
    if (model === 'gemma3') {
        return tokenInfo.gemma3UsedTokens < gemma3TokenLimit;
    }
    // model === 'flash' — available to all tiers
    return tokenInfo.flashUsedTokens < flashTokenLimit;
  }, [isMounted, tier, tokenInfo, gemma3TokenLimit, flashTokenLimit, proTokenLimit, haikuTokenLimit]);
  
  const consumeTokens = useCallback((amount: number, model: SupportedModel) => {
    if (!isMounted) return;
    const currentMonth = getCurrentMonth();
    
    // Optimistic UI update
    setTokenInfo(prev => {
        const isNewMonth = prev.date !== currentMonth;
        let newGemma3Used = isNewMonth ? 0 : prev.gemma3UsedTokens;
        let newFlashUsed = isNewMonth ? 0 : prev.flashUsedTokens;
        let newProUsed = isNewMonth ? 0 : prev.proUsedTokens;
        let newHaikuUsed = isNewMonth ? 0 : prev.haikuUsedTokens;
        
        if (model === 'pro' && isPremium) {
            newProUsed += amount;
        } else if (model === 'haiku') {
            newHaikuUsed += amount;
        } else if (model === 'gemma3') {
            newGemma3Used += amount;
        } else { // model === 'flash'
            newFlashUsed += amount;
        }
        
        return { gemma3UsedTokens: newGemma3Used, flashUsedTokens: newFlashUsed, proUsedTokens: newProUsed, haikuUsedTokens: newHaikuUsed, date: currentMonth };
    });

    // Save to Supabase in background securely via API
    if (user) {
      // Get the session token to authenticate the API request
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          fetch('/api/token-usage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              tokens: amount,
              model: model,
              month: currentMonth,
            })
          }).catch(err => console.error("Failed to sync tokens:", err));
        }
      });
    }
  }, [isMounted, isPremium, user, supabase]);
  
  const gemma3TokensRemaining = isMounted ? Math.max(0, gemma3TokenLimit - tokenInfo.gemma3UsedTokens) : gemma3TokenLimit;
  const flashTokensRemaining = isMounted ? Math.max(0, flashTokenLimit - tokenInfo.flashUsedTokens) : flashTokenLimit;
  const proTokensRemaining = isMounted ? Math.max(0, proTokenLimit - tokenInfo.proUsedTokens) : proTokenLimit;
  const haikuTokensRemaining = isMounted ? Math.max(0, haikuTokenLimit - tokenInfo.haikuUsedTokens) : haikuTokenLimit;

  const value = {
    tier: isMounted ? tier : 'free',
    setTier,
    isPremium: isMounted ? isPremium : false,
    gemma3TokenLimit,
    gemma3TokensRemaining,
    flashTokenLimit,
    flashTokensRemaining,
    proTokenLimit,
    proTokensRemaining,
    haikuTokenLimit,
    haikuTokensRemaining,
    hasTokens,
    consumeTokens,
    isLoaded: isMounted,
    role: isMounted ? role : null,
    gradeLevel: isMounted ? gradeLevel : null,
    careerField: isMounted ? careerField : null,
    classCode: isMounted ? classCode : null,
    needsRolePicker: isMounted ? needsRolePicker : false,
    updateProfile,
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
