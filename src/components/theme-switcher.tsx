'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <SidebarMenuButton
      onClick={toggleTheme}
      tooltip={{
        children: theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode',
      }}
    >
      {theme === 'light' ? <Sun /> : <Moon />}
       <span>Toggle Theme</span>
    </SidebarMenuButton>
  );
}
