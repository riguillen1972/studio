"use client";

import {
  BookOpen,
  Bot,
  Library,
  LineChart,
  NotebookText,
  PanelLeft,
  Settings,
  User,
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
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "./theme-switcher";

const menuItems = [
  {
    href: "/dashboard",
    icon: Bot,
    label: "AI Tutor",
  },
  {
    href: "/homework",
    icon: BookOpen,
    label: "Homework Help",
  },
  {
    href: "/summarizer",
    icon: NotebookText,
    label: "Summarizer",
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
];

export function AppSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

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
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
