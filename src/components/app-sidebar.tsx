
"use client";

import {
  BookOpen,
  Bot,
  Library,
  LineChart,
  NotebookText,
  PanelLeft,
  ScanLine,
  Settings,
  User,
  FileQuestion,
  BookMarked,
  Layers,
  WandSparkles,
  Shapes,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "./theme-switcher";
import { useAppState } from "./app-state-provider";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/supabase/auth-provider";
import { useRouter } from "next/navigation";

export function AppSidebar() {
  const pathname = usePathname();
  const { isPremium } = useAppState();
  const { signOut } = useAuth();
  const router = useRouter();
  const isActive = (href: string) => pathname === href;

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const menuItems = [
    {
      href: "/dashboard",
      icon: Bot,
      label: "AI Tutor",
    },
     {
      href: "/tools",
      icon: WandSparkles,
      label: "AI Tools",
    },
    {
      href: "/mini-app-generator",
      icon: Shapes,
      label: "App Generator",
      tier: "max",
    },
    {
      href: "/homework",
      icon: BookOpen,
      label: "Homework Help",
    },
    {
      href: "/scan",
      icon: ScanLine,
      label: "Scan Homework",
    },
    {
      href: "/summarizer",
      icon: NotebookText,
      label: "Summarizer",
    },
    {
      href: "/quiz",
      icon: FileQuestion,
      label: "Quiz Generator",
    },
    {
      href: "/flashcards",
      icon: Layers,
      label: "Flashcards",
    },
    {
      href: "/progress",
      icon: LineChart,
      label: "Progress",
    },
    {
      href: "/library",
      icon: Library,
      label: "Content Library",
    },
      {
      href: "/bible-verse",
      icon: BookMarked,
      label: "Bible Verse",
    },
  ];

  return (
      <Sidebar
        variant="sidebar"
        collapsible="icon"
        className="group-data-[variant=sidebar]:border-r"
      >
        <SidebarHeader className="h-14">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              asChild
            >
              <Link href="/dashboard">
                <Bot />
              </Link>
            </Button>
            <h1 className="text-lg font-semibold tracking-tight font-headline group-data-[collapsible=icon]:hidden">
              Study Buddy AI
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.href)}
                  tooltip={{ children: item.label }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                     {item.tier === 'max' && (
                        <Badge variant="secondary" className="ml-auto text-xs font-bold tracking-wider border-purple-500/50 text-purple-500 bg-purple-500/10 group-data-[collapsible=icon]:hidden">
                            MAX
                        </Badge>
                     )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
           <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/profile")}
                tooltip={{ children: "Profile" }}
              >
                <Link href="/profile">
                  <User />
                  <span>Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <ThemeSwitcher />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={{ children: "Sign Out" }}
                onClick={handleSignOut}
              >
                <LogOut />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
  );
}
