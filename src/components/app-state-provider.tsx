"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

const FREE_REQUEST_LIMIT = 70;
const PREMIUM_REQUEST_LIMIT = 160;
const PREMIUM_VIDEO_REQUEST_LIMIT = 2;

interface RequestInfo {
  count: number;
  date: string; // YYYY-MM-DD
}

interface VideoRequestInfo {
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
  videoRequestCount: number;
  videoRequestLimit: number;
  canMakeVideoRequest: () => boolean;
  incrementVideoRequestCount: () => void;
  videoRequestsRemaining: number;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremiumState] = useState(false);
  const [requestInfo, setRequestInfo] = useState<RequestInfo>({ count: 0, date: '' });
  const [videoRequestInfo, setVideoRequestInfo] = useState<VideoRequestInfo>({ count: 0, date: '' });
  const [isMounted, setIsMounted] = useState(false);

  const getToday = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    setIsMounted(true);
    try {
        const storedPremium = localStorage.getItem('isPremium');
        if (storedPremium) {
          setIsPremiumState(JSON.parse(storedPremium));
        }

        const today = getToday();

        const storedRequestInfo = localStorage.getItem('requestInfo');
        if (storedRequestInfo) {
            const parsed: RequestInfo = JSON.parse(storedRequestInfo);
            if (parsed.date === today) {
                setRequestInfo(parsed);
            } else {
                setRequestInfo({ count: 0, date: today });
            }
        } else {
            setRequestInfo({ count: 0, date: today });
        }
        
        const storedVideoRequestInfo = localStorage.getItem('videoRequestInfo');
        if(storedVideoRequestInfo) {
            const parsed: VideoRequestInfo = JSON.parse(storedVideoRequestInfo);
            if (parsed.date === today) {
                setVideoRequestInfo(parsed);
            } else {
                setVideoRequestInfo({ count: 0, date: today });
            }
        } else {
             setVideoRequestInfo({ count: 0, date: today });
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
  const videoRequestLimit = isPremium ? PREMIUM_VIDEO_REQUEST_LIMIT : 0;

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

  const canMakeVideoRequest = useCallback(() => {
    if (!isMounted || !isPremium) return false;
     const today = getToday();
    if (videoRequestInfo.date !== today) {
      return true;
    }
    return videoRequestInfo.count < videoRequestLimit;
  }, [isMounted, isPremium, videoRequestInfo, videoRequestLimit]);

  const incrementVideoRequestCount = useCallback(() => {
    if (!isMounted || !isPremium) return;
    const today = getToday();
    setVideoRequestInfo(prev => {
        const newCount = prev.date === today ? prev.count + 1 : 1;
        const newInfo = { count: newCount, date: today };
        try {
            localStorage.setItem('videoRequestInfo', JSON.stringify(newInfo));
        } catch (error) {
             console.error("Could not access local storage:", error);
        }
        return newInfo;
    });
  }, [isMounted, isPremium]);
  
  const requestsRemaining = isMounted ? Math.max(0, requestLimit - requestInfo.count) : requestLimit;
  const videoRequestsRemaining = isMounted ? Math.max(0, videoRequestLimit - videoRequestInfo.count) : videoRequestLimit;

  const value = {
    isPremium: isMounted ? isPremium : false,
    setIsPremium,
    requestCount: requestInfo.count,
    requestLimit,
    canMakeRequest,
    incrementRequestCount,
    requestsRemaining,
    videoRequestCount: videoRequestInfo.count,
    videoRequestLimit,
    canMakeVideoRequest,
    incrementVideoRequestCount,
    videoRequestsRemaining,
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
