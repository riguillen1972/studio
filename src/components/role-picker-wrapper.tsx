"use client";

import React from "react";
import { useAppState } from "./app-state-provider";
import { RolePicker } from "./role-picker";

export function RolePickerWrapper({ children }: { children: React.ReactNode }) {
  const { needsRolePicker, isLoaded } = useAppState();
  
  // Optionally show a loading spinner while waiting for user profile to load
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }
  
  if (needsRolePicker) {
    return <RolePicker />;
  }
  
  return <>{children}</>;
}
