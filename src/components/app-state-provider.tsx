"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

const FREE_REQUEST_LIMIT = 70;
const PREMIUM_REQUEST_LIMIT = 160;

interface RequestInfo {
  count: number;
  date: string; // YYYY-MM-DD
}

interface AppState {
  isPremium: boolean;
  setIsPremium: (isPremium: boolean) => void;
  requestCount: number;
  requestLimit: number;
  canMakeRequest: () => boolean;
  incrementRequestCount: () => void;
  requestsRemaining: number;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremiumState] = useState(false);
  const [requestInfo, setRequestInfo] = useState<RequestInfo>({ count: 0, date: '' });
  const [isMounted, setIsMounted] = useState(false);

  const getToday = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    setIsMounted(true);
    try {
        const storedPremium = localStorage.getItem('isPremium');
        if (storedPremium) {
          setIsPremiumState(JSON.parse(storedPremium));
        }

        const storedRequestInfo = localStorage.getItem('requestInfo');
        const today = getToday();
        if (storedRequestInfo) {
            const parsed: RequestInfo = JSON.parse(storedRequestInfo);
            if (parsed.date === today) {
                setRequestInfo(parsed);
            } else {
                // Reset count for a new day
                const newInfo = { count: 0, date: today };
                setRequestInfo(newInfo);
                localStorage.setItem('requestInfo', JSON.stringify(newInfo));
            }
        } else {
            setRequestInfo({ count: 0, date: today });
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

  const requestLimit = isPremium ? PREMIUM_REQUEST_LIMIT : FREE_REQUEST_LIMIT;

  const canMakeRequest = useCallback(() => {
    if (!isMounted) return false;
    const today = getToday();
    if (requestInfo.date !== today) {
      return true; // Will be reset on next action
    }
    return requestInfo.count < requestLimit;
  }, [isMounted, requestInfo, requestLimit]);
  
  const incrementRequestCount = useCallback(() => {
    if (!isMounted) return;

    const today = getToday();
    setRequestInfo(prev => {
        const newCount = prev.date === today ? prev.count + 1 : 1;
        const newInfo = { count: newCount, date: today };
        try {
            localStorage.setItem('requestInfo', JSON.stringify(newInfo));
        } catch (error) {
            console.error("Could not access local storage:", error);
        }
        return newInfo;
    });
  }, [isMounted]);
  
  const requestsRemaining = isMounted ? Math.max(0, requestLimit - requestInfo.count) : requestLimit;

  const value = {
    isPremium: isMounted ? isPremium : false,
    setIsPremium,
    requestCount: requestInfo.count,
    requestLimit,
    canMakeRequest,
    incrementRequestCount,
    requestsRemaining,
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
