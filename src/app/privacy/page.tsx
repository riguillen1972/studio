import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageTransition } from "@/components/page-transition";

export default function PrivacyPage() {
  return (
    <PageTransition className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5 relative">
      <ThemeToggle />
      <div className="w-full max-w-3xl space-y-6">
        <Link href="/login" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" />
          Back
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none space-y-4 text-sm">
            <p><strong>Last updated:</strong> August 8, 2026</p>

            <h3 className="text-lg font-semibold">1. Information We Collect</h3>
            <p>We collect information you provide directly: email address, display name, and grade level. We also collect usage data such as questions asked, quizzes taken, and token consumption for service improvement and billing.</p>

            <h3 className="text-lg font-semibold">2. How We Use Your Information</h3>
            <p>Your information is used to: provide and improve the service, track subscription usage, personalize your learning experience, and communicate important service updates.</p>

            <h3 className="text-lg font-semibold">3. AI Processing</h3>
            <p>Your questions and inputs are sent to third-party AI providers (Google Gemini) for processing. These providers have their own privacy policies regarding data handling. We do not share your personal identity with AI providers.</p>

            <h3 className="text-lg font-semibold">4. Data Storage</h3>
            <p>Your data is stored securely using Supabase (powered by PostgreSQL) with Row Level Security policies ensuring that only you can access your own data.</p>

            <h3 className="text-lg font-semibold">5. Data Retention</h3>
            <p>We retain your data for as long as your account is active. You can request deletion of your data at any time by deleting your account from the Profile page.</p>

            <h3 className="text-lg font-semibold">6. Third-Party Services</h3>
            <p>We use the following third-party services: Supabase (authentication & database), Google Cloud (Gemini AI), and Vercel (hosting).</p>

            <h3 className="text-lg font-semibold">7. Children&apos;s Privacy</h3>
            <p>Study Buddy AI is designed for students of all ages. For users under 13, parental consent is required in accordance with COPPA regulations.</p>

            <h3 className="text-lg font-semibold">8. Contact</h3>
            <p>For privacy-related questions, please contact us through the application.</p>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
