import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { AppStateProvider } from "@/components/app-state-provider";
import FriendlyTutor from "@/components/friendly-tutor";
import { FirebaseClientProvider } from "@/firebase";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
       <FirebaseClientProvider>
        <AppStateProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <main className="min-h-svh p-4 sm:p-6 lg:p-8">{children}</main>
              <FriendlyTutor />
            </SidebarInset>
          </SidebarProvider>
        </AppStateProvider>
      </FirebaseClientProvider>
    </ThemeProvider>
  );
}
