
"use client";

import {
  BookOpen,
  Bot,
  Globe,
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
  Shapes,
  LogOut,
  LayoutDashboard,
  WandSparkles,
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
  const { tier, isPremium, role } = useAppState();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const isActive = (href: string) => pathname === href;

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const userRole = role || 'student';
  const isTeacher = userRole === 'teacher';

  const baseMenuItems = [
    {
      href: "/dashboard",
      icon: isTeacher ? LayoutDashboard : Bot,
      label: isTeacher ? "My Class" : "AI Tutor",
      visibleTo: ['all'],
    },
     {
      href: "/tools",
      icon: WandSparkles,
      label: "AI Tools",
      visibleTo: ['student'],
    },
    {
      href: "/mini-app-generator",
      icon: Shapes,
      label: "App Generator",
      tier: "max",
      visibleTo: ['student'],
    },
    {
      href: "/web-tutor",
      icon: Globe,
      label: "Web Tutor",
      tier: "max",
      visibleTo: ['student'],
    },
    {
      href: "/homework",
      icon: BookOpen,
      label: "Homework Help",
      visibleTo: ['student'],
    },
    {
      href: "/scan",
      icon: ScanLine,
      label: "Scan Homework",
      visibleTo: ['student'],
    },
    {
      href: "/summarizer",
      icon: NotebookText,
      label: "Summarizer",
      visibleTo: ['student'],
    },
    {
      href: "/quiz",
      icon: FileQuestion,
      label: "Quiz Generator",
      visibleTo: ['student'],
    },
    {
      href: "/flashcards",
      icon: Layers,
      label: "Flashcards",
      visibleTo: ['student'],
    },
    {
      href: "/progress",
      icon: LineChart,
      label: "Progress",
      visibleTo: ['student'],
    },
    {
      href: "/bible-verse",
      icon: BookMarked,
      label: "Bible Verse",
      visibleTo: ['student'],
    },
  ];

  const menuItems = baseMenuItems.filter(item => {
    const roleMatch = item.visibleTo.includes('all') || item.visibleTo.includes(isTeacher ? 'teacher' : 'student');
    const tierMatch = item.tier === 'max' ? tier === 'max' : true;
    return roleMatch && tierMatch;
  });

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
              className="size-9 shrink-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 hover:text-primary-foreground shadow-sm"
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
