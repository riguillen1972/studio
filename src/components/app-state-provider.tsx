
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { SupportedModel } from '@/ai/genkit';
import { useAuth } from '@/lib/supabase/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { TOKEN_LIMITS, toUsageModel, type SubscriptionTier, type UsageModel } from '@/lib/plans';

export type { SubscriptionTier } from '@/lib/plans';

type UsedTokens = Record<UsageModel, number>;

interface TokenInfo {
  used: UsedTokens;
  date: string; // YYYY-MM
}

const emptyUsage = (): UsedTokens => ({ gemma3: 0, flash: 0, pro: 0, haiku: 0 });

interface ProfileUpdates {
  role?: string;
  gradeLevel?: string;
  careerField?: string;
  displayName?: string;
}

interface AppState {
  tier: SubscriptionTier;
  isPremium: boolean;

  displayName: string | null;
  role: string | null;
  gradeLevel: string | null;
  careerField: string | null;
  classCode: string | null;
  needsRolePicker: boolean;
  researchModeAllowed: boolean;
  updateProfile: (updates: ProfileUpdates) => Promise<{ error: string | null }>;
  joinClass: (code: string) => Promise<{ error: string | null }>;

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

const getCurrentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [gradeLevel, setGradeLevel] = useState<string | null>(null);
  const [careerField, setCareerField] = useState<string | null>(null);
  const [classCode, setClassCode] = useState<string | null>(null);
  const [needsRolePicker, setNeedsRolePicker] = useState<boolean>(false);
  const [researchModeAllowed, setResearchModeAllowed] = useState<boolean>(true);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({ used: emptyUsage(), date: '' });
  const [isMounted, setIsMounted] = useState(false);

  const authHeaders = useCallback(async (): Promise<Record<string, string> | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : null;
  }, [supabase]);

  // Research Mode is off if a teacher of any of the student's classes turned it off.
  const loadClassSettings = useCallback(async () => {
    const headers = await authHeaders();
    if (!headers) return;
    try {
      const res = await fetch('/api/classes', { headers });
      if (!res.ok) return;
      const { data } = await res.json();
      const blocked = (data ?? []).some(
        (c: { settings?: { allow_research_mode?: boolean } }) => c?.settings?.allow_research_mode === false
      );
      setResearchModeAllowed(!blocked);
    } catch (e) {
      console.error('Failed to load class settings:', e);
    }
  }, [authHeaders]);

  // Load user profile & token usage from Supabase
  useEffect(() => {
    setIsMounted(true);
    if (!user) return;

    const loadProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier, display_name, role, grade_level, career_field, class_code')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        if (profile.tier) setTier(profile.tier as SubscriptionTier);
        setDisplayName(profile.display_name);
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
      // A new user has no row for this month yet, so this must not use .single()
      const { data: usage } = await supabase
        .from('token_usage')
        .select('flash_lite_used, flash_used, pro_used, haiku_used')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .maybeSingle();

      setTokenInfo({
        used: {
          gemma3: usage?.flash_lite_used || 0,
          flash: usage?.flash_used || 0,
          pro: usage?.pro_used || 0,
          haiku: usage?.haiku_used || 0,
        },
        date: currentMonth,
      });
    };

    loadProfile();
    loadTokenUsage();
    loadClassSettings();
  }, [user, supabase, loadClassSettings]);

  const updateProfile = async (updates: ProfileUpdates): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not signed in' };

    const dbUpdates: Record<string, string | null> = {};
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.gradeLevel !== undefined) dbUpdates.grade_level = updates.gradeLevel;
    if (updates.careerField !== undefined) dbUpdates.career_field = updates.careerField;
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', user.id);

    if (error) {
      console.error('Profile update failed:', error);
      return { error: error.message };
    }

    if (updates.role !== undefined) setRole(updates.role);
    if (updates.gradeLevel !== undefined) setGradeLevel(updates.gradeLevel);
    if (updates.careerField !== undefined) setCareerField(updates.careerField);
    if (updates.displayName !== undefined) setDisplayName(updates.displayName);
    if (updates.role) setNeedsRolePicker(false);
    return { error: null };
  };

  const joinClass = async (code: string): Promise<{ error: string | null }> => {
    const joinCode = code.trim().toUpperCase();
    if (!joinCode) return { error: 'Enter a class code' };
    const headers = await authHeaders();
    if (!headers) return { error: 'Not signed in' };

    const res = await fetch('/api/enroll', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ join_code: joinCode }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error || 'Could not join the class' };

    setClassCode(joinCode);
    loadClassSettings();
    return { error: null };
  };

  const isPremium = tier === 'pro' || tier === 'max';
  const limits = TOKEN_LIMITS[tier];

  const usedFor = useCallback((model: UsageModel) => {
    return tokenInfo.date === getCurrentMonth() ? tokenInfo.used[model] : 0;
  }, [tokenInfo]);

  // Client-side check is only for the UI; the server enforces the real limit.
  const hasTokens = useCallback((model: SupportedModel): boolean => {
    if (!isMounted) return false;
    const m = toUsageModel(model);
    if (!m) return false;
    return limits[m] > 0 && usedFor(m) < limits[m];
  }, [isMounted, limits, usedFor]);

  // Optimistic UI update. Usage is recorded on the server when the AI request runs.
  const consumeTokens = useCallback((amount: number, model: SupportedModel) => {
    if (!isMounted) return;
    const m = toUsageModel(model);
    if (!m) return;
    const currentMonth = getCurrentMonth();
    setTokenInfo(prev => {
      const used = prev.date === currentMonth ? { ...prev.used } : emptyUsage();
      used[m] += amount;
      return { used, date: currentMonth };
    });
  }, [isMounted]);

  const remaining = (m: UsageModel) => isMounted ? Math.max(0, limits[m] - usedFor(m)) : limits[m];

  const value: AppState = {
    tier: isMounted ? tier : 'free',
    isPremium: isMounted ? isPremium : false,
    gemma3TokenLimit: limits.gemma3,
    gemma3TokensRemaining: remaining('gemma3'),
    flashTokenLimit: limits.flash,
    flashTokensRemaining: remaining('flash'),
    proTokenLimit: limits.pro,
    proTokensRemaining: remaining('pro'),
    haikuTokenLimit: limits.haiku,
    haikuTokensRemaining: remaining('haiku'),
    hasTokens,
    consumeTokens,
    isLoaded: isMounted,
    displayName: isMounted ? displayName : null,
    role: isMounted ? role : null,
    gradeLevel: isMounted ? gradeLevel : null,
    careerField: isMounted ? careerField : null,
    classCode: isMounted ? classCode : null,
    needsRolePicker: isMounted ? needsRolePicker : false,
    researchModeAllowed,
    updateProfile,
    joinClass,
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
