"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

const MONTHLY_REQUEST_LIMIT = 1000000;

interface RequestInfo {
  count: number;
  date: string; // YYYY-MM
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

  const getCurrentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

  useEffect(() => {
    setIsMounted(true);
    try {
        const storedPremium = localStorage.getItem('isPremium');
        if (storedPremium) {
          setIsPremiumState(JSON.parse(storedPremium));
        }

        const currentMonth = getCurrentMonth();

        const storedRequestInfo = localStorage.getItem('requestInfo');
        if (storedRequestInfo) {
            const parsed: RequestInfo = JSON.parse(storedRequestInfo);
            if (parsed.date === currentMonth) {
                setRequestInfo(parsed);
            } else {
                setRequestInfo({ count: 0, date: currentMonth });
            }
        } else {
            setRequestInfo({ count: 0, date: currentMonth });
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

  const requestLimit = MONTHLY_REQUEST_LIMIT;

  const canMakeRequest = useCallback(() => {
    if (!isMounted) return false;
    const currentMonth = getCurrentMonth();
    if (requestInfo.date !== currentMonth) {
      return true; // Will be reset on next action
    }
    return requestInfo.count < requestLimit;
  }, [isMounted, requestInfo, requestLimit]);
  
  const incrementRequestCount = useCallback(() => {
    if (!isMounted) return;
    const currentMonth = getCurrentMonth();
    setRequestInfo(prev => {
        const newCount = prev.date === currentMonth ? prev.count + 1 : 1;
        const newInfo = { count: newCount, date: currentMonth };
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
