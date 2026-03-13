import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppStateProvider } from "@/components/app-state-provider";
import { Separator } from "@/components/ui/separator";
import { Bot } from "lucide-react";

export const maxDuration = 60; // Extend Vercel function timeout to 60 seconds for AI tasks

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppStateProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            {/* Mobile header with sidebar trigger */}
            <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:hidden">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <span className="font-semibold font-headline text-sm">Study Buddy AI</span>
              </div>
            </header>
            <main className="min-h-svh p-4 sm:p-6 lg:p-8">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </AppStateProvider>
  );
}
