"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, Gem, Sigma, Sparkles, Crown, Zap, Mail, Loader2, CreditCard, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppState, SubscriptionTier } from "@/components/app-state-provider";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/supabase/auth-provider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLANS, TEACHER_MAX, TEACHER_AVATAR_FEATURE, AI_TOOL_COUNT, requiresSchoolConsent } from "@/lib/plans";
import { createClient } from "@/lib/supabase/client";

interface TierPlan {
    name: string;
    priceLabel: string;
    description: string;
    icon: React.ElementType;
    features: string[];
    highlighted?: boolean;
    badge?: string;
}

const tierPlans: Record<SubscriptionTier, TierPlan> = {
    free: {
        name: PLANS.free.name,
        priceLabel: PLANS.free.priceLabel,
        description: "Get started with essential AI study tools.",
        icon: Zap,
        features: [
            "Gemini 2.5 Flash-Lite exclusively",
            PLANS.free.tokenSummary,
            "AI Tutor, Homework Help, Summarizer",
            "Quiz & Flashcard Generator",
            "Bible Verse & Study Buddy",
            "Half of AI Tools Library",
            "Ad-supported",
        ],
    },
    pro: {
        name: PLANS.pro.name,
        priceLabel: PLANS.pro.priceLabel,
        description: "Unlock full potential with premium models & tools.",
        icon: Sparkles,
        highlighted: true,
        badge: "POPULAR",
        features: [
            "Everything in Free, plus:",
            "Claude Haiku 5.5 model unlocked",
            PLANS.pro.tokenSummary,
            `All ${AI_TOOL_COUNT} AI tools`,
            "Ad-free experience",
        ],
    },
    max: {
        name: PLANS.max.name,
        priceLabel: PLANS.max.priceLabel,
        description: "Maximum power for serious students.",
        icon: Crown,
        features: [
            "Everything in Pro, plus:",
            "Claude Haiku 5.5",
            PLANS.max.tokenSummary,
            "AI Mini-App Generator",
            "Create & save custom learning apps",
        ],
    },
};

function ProfileContent() {
  const { 
    tier, 
    gemma3TokensRemaining,
    gemma3TokenLimit,
    haikuTokensRemaining,
    haikuTokenLimit,
    isPremium,
    billingPlan,
    displayName: profileName,
    role,
    gradeLevel,
    classCode,
    updateProfile,
    joinClass,
    leaveClass,
  } = useAppState();
  const { user: supabaseUser } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fallbackName = supabaseUser?.user_metadata?.display_name || supabaseUser?.user_metadata?.full_name || supabaseUser?.email?.split('@')[0] || '';
  const displayName = profileName || fallbackName;
  const displayEmail = supabaseUser?.email || '';
  const isTeacher = role === 'teacher';
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [nameInput, setNameInput] = useState(displayName);
  const [isSavingName, setIsSavingName] = useState(false);
  const [classCodeInput, setClassCodeInput] = useState("");
  const [isJoiningClass, setIsJoiningClass] = useState(false);
  const [isLeavingClass, setIsLeavingClass] = useState(false);
  // The class the student is actually enrolled in (not just a saved code)
  const [currentClass, setCurrentClass] = useState<{ name: string; join_code: string } | null>(null);
  const mustStayInClass = requiresSchoolConsent(role, gradeLevel);

  const loadCurrentClass = useCallback(async () => {
    const { data: { session } } = await createClient().auth.getSession();
    if (!session) return;
    const res = await fetch('/api/enroll', { headers: { Authorization: `Bearer ${session.access_token}` } });
    if (res.ok) setCurrentClass((await res.json()).class ?? null);
  }, []);

  useEffect(() => {
    if (supabaseUser && !isTeacher) loadCurrentClass();
  }, [supabaseUser, isTeacher, loadCurrentClass]);

  // The profile loads after first render, so sync the name field once it arrives
  useEffect(() => {
    setNameInput(displayName);
  }, [displayName]);

  const handleProfileChange = async (updates: { role?: string; gradeLevel?: string }) => {
    const newRole = updates.role ?? role;
    const newGrade = updates.gradeLevel ?? gradeLevel;
    if (requiresSchoolConsent(newRole, newGrade) && !classCode) {
      toast({
        title: "Class code needed",
        description: newRole === 'k12' && !newGrade
          ? "Choose your grade first."
          : "Students in 7th grade and below need to join a teacher's class first. Enter the class code below.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingRole(true);
    const { error } = await updateProfile(updates);
    setIsUpdatingRole(false);
    toast(error
      ? { title: "Error", description: "Could not update your profile. Please try again.", variant: "destructive" }
      : { title: "Profile Updated", description: "Your changes have been saved." });
  };

  const handleSaveName = async () => {
    const name = nameInput.trim();
    if (!name) return;
    setIsSavingName(true);
    const { error } = await updateProfile({ displayName: name });
    setIsSavingName(false);
    toast(error
      ? { title: "Error", description: "Could not save your name.", variant: "destructive" }
      : { title: "Name Saved", description: "Your name has been updated." });
  };

  const handleJoinClass = async () => {
    const switching = !!currentClass && currentClass.join_code !== classCodeInput.trim().toUpperCase();
    if (switching && !confirm(`Switch from ${currentClass!.name} to the new class? Your current teacher will be notified that you left.`)) return;
    setIsJoiningClass(true);
    const { error } = await joinClass(classCodeInput);
    setIsJoiningClass(false);
    if (error) {
      toast({ title: "Couldn't join class", description: error, variant: "destructive" });
    } else {
      setClassCodeInput("");
      loadCurrentClass();
      toast({ title: switching ? "Class changed" : "Joined class", description: "You're now linked to your teacher's class." });
    }
  };

  const handleLeaveClass = async () => {
    if (!currentClass) return;
    if (!confirm(`Remove your class code and leave ${currentClass.name}? Your teacher will be notified.`)) return;
    setIsLeavingClass(true);
    const { error } = await leaveClass();
    setIsLeavingClass(false);
    if (error) {
      toast({ title: "Couldn't leave class", description: error, variant: "destructive" });
    } else {
      setCurrentClass(null);
      toast({ title: "Left class", description: "Your class code was removed." });
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) return;
    try {
      const res = await fetch('/api/user', { method: 'DELETE' });
      if (!res.ok) throw new Error("Could not delete account");
      toast({
        title: "Account Deleted",
        description: "Your account has been deleted.",
      });
      window.location.href = '/login';
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to delete account.",
        variant: "destructive",
      });
    }
  };

  // Handle Stripe redirect query params
  useEffect(() => {
    const upgrade = searchParams.get('upgrade');
    if (upgrade === 'success') {
      // Verify and sync the tier from Stripe directly
      const verifyTier = async () => {
        try {
          const res = await fetch('/api/stripe/verify', { method: 'POST' });
          const data = await res.json();
          if (data.synced && data.tier !== 'free') {
            toast({
              title: "🎉 Upgrade Successful!",
              description: `You are now on the ${data.tier.charAt(0).toUpperCase() + data.tier.slice(1)} plan. Refreshing...`,
            });
            // Reload the page after a short delay to reflect the new tier
            setTimeout(() => window.location.href = '/profile', 1500);
          } else {
            toast({
              title: "🎉 Payment Received!",
              description: "Your subscription is processing. Please refresh in a moment.",
            });
          }
        } catch {
          toast({
            title: "🎉 Upgrade Successful!",
            description: "Your subscription is now active. Please refresh to see changes.",
          });
        }
      };
      verifyTier();
    } else if (upgrade === 'cancelled') {
      toast({
        title: "Upgrade Cancelled",
        description: "No changes were made to your subscription.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const handleStripeCheckout = async (plan: 'pro' | 'max') => {
    setIsCheckoutLoading(plan);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: data.error || "Could not start checkout. Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: data.error || "Could not open subscription portal.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPortalLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl py-8 space-y-8 animate-in fade-in duration-500 pb-24 lg:pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
          User Profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account, subscription, and learning goals.
        </p>
      </div>

      {/* Profile + Info Row */}
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="flex gap-2">
                            <Input id="name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Your name" />
                            <Button
                                variant="outline"
                                onClick={handleSaveName}
                                disabled={isSavingName || !nameInput.trim() || nameInput.trim() === displayName}
                            >
                                {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
                        <Input id="email" defaultValue={displayEmail} readOnly className="bg-muted/50 cursor-default" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Your Role</Label>
                        <Select value={role ?? undefined} onValueChange={(newRole) => handleProfileChange({ role: newRole })} disabled={isUpdatingRole}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="k12">Elementary to High School</SelectItem>
                                <SelectItem value="college">College Student</SelectItem>
                                <SelectItem value="teacher">Teacher</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground pt-1">
                            Changing your role updates the AI's teaching style and features.
                        </p>
                    </div>
                    {role === 'k12' && (
                        <div className="space-y-2">
                            <Label htmlFor="grade">Grade</Label>
                            <Select value={gradeLevel ?? undefined} onValueChange={(grade) => handleProfileChange({ gradeLevel: grade })} disabled={isUpdatingRole}>
                                <SelectTrigger id="grade">
                                    <SelectValue placeholder="Select your grade" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((g) => (
                                        <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {!isTeacher && (
                        <div className="space-y-2">
                            <Label htmlFor="joinClass">My Class</Label>
                            {currentClass ? (
                                <div className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm">
                                    <span>
                                        <span className="font-medium">{currentClass.name}</span>
                                        <span className="text-muted-foreground"> · code <span className="font-mono">{currentClass.join_code}</span></span>
                                    </span>
                                    {!mustStayInClass && (
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleLeaveClass} disabled={isLeavingClass}>
                                            {isLeavingClass ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove code"}
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">You&apos;re not in a class yet.</p>
                            )}
                            <div className="flex gap-2">
                                <Input
                                    id="joinClass"
                                    placeholder={currentClass ? "New class code to switch classes" : "Class code from your teacher"}
                                    value={classCodeInput}
                                    onChange={(e) => setClassCodeInput(e.target.value.toUpperCase())}
                                    className="uppercase"
                                />
                                <Button variant="outline" onClick={handleJoinClass} disabled={isJoiningClass || !classCodeInput.trim()}>
                                    {isJoiningClass ? <Loader2 className="h-4 w-4 animate-spin" /> : currentClass ? "Change" : "Join"}
                                </Button>
                            </div>
                            {currentClass && (
                                <p className="text-xs text-muted-foreground">
                                    {mustStayInClass
                                        ? "Students in 7th grade and below need to stay in a class, but you can change to a new class code. "
                                        : ""}
                                    If you change or remove your code, your teacher is notified.
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                {role === 'college'
                                    ? "Your teacher can see work you turn in. Your AI chats and apps stay private."
                                    : "Your teacher can see what you ask the AI, the apps you save, and the work you turn in."}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>

        <div className="space-y-8">
             <Card className="text-center overflow-hidden">
                <div className="h-20 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />
                <CardContent className="p-6 -mt-12">
                    <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-background shadow-lg ring-2 ring-primary/30">
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{displayName?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-semibold font-headline">{displayName}</h2>
                    <p className="text-muted-foreground text-sm">{displayEmail}</p>
                      <Badge className="mt-2" variant={tier === 'max' ? 'default' : tier === 'pro' ? 'secondary' : 'outline'}>
                        {tierPlans[tier].name} Plan
                      </Badge>
                    {isPremium && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 w-full gap-2" 
                        onClick={handleManageSubscription}
                        disabled={isPortalLoading}
                      >
                        {isPortalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                        Manage Subscription
                      </Button>
                    )}
                </CardContent>
             </Card>

             {/* Monthly Usage */}
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <Sigma className="text-primary"/>
                            Monthly Usage
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(() => {
                            // Free: Gemini 2.5 Flash-Lite. Pro and Max: Claude Haiku 5.5.
                            const [label, remaining, limit] = tier === 'free'
                                ? ["Gemini 2.5 Flash-Lite", gemma3TokensRemaining, gemma3TokenLimit]
                                : ["Claude Haiku 5.5", haikuTokensRemaining, haikuTokenLimit];
                            return (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">{label}</Label>
                                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                        <span>Remaining</span>
                                        <span>{new Intl.NumberFormat().format(remaining)} / {new Intl.NumberFormat().format(limit)}</span>
                                    </div>
                                    <Progress value={limit > 0 ? (remaining / limit) * 100 : 0} />
                                </div>
                            );
                        })()}
                         <p className="text-xs text-center text-muted-foreground pt-1">Your token count resets monthly.</p>
                    </CardContent>
                </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full" asChild>
                        <a href="/forgot-password">Change Password</a>
                    </Button>
                    <Separator/>
                    <Button variant="destructive" className="w-full" onClick={handleDeleteAccount}>Delete Account</Button>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Pricing Plans */}
        <div id="plans" className="mt-8 scroll-mt-8">
            <h2 className="text-xl sm:text-2xl font-bold font-headline tracking-tight mb-2 flex items-center gap-2">
                <Gem className="text-primary" /> Subscription Plans
            </h2>
            <p className="text-muted-foreground mb-6">Choose the plan that fits your learning needs.</p>
            <div className="grid gap-6 md:grid-cols-3">
            {(Object.entries(tierPlans) as [SubscriptionTier, TierPlan][]).map(([planKey, basePlan]) => {
            // Teachers pay the teacher Max price, which includes the AI Teacher Avatar
            const plan: TierPlan = planKey === 'max' && isTeacher
              ? {
                  ...basePlan,
                  priceLabel: TEACHER_MAX.priceLabel,
                  description: "Maximum power for teachers, with a live AI co-teacher.",
                  features: [...basePlan.features.slice(0, 3), TEACHER_AVATAR_FEATURE, ...basePlan.features.slice(3)],
                }
              : basePlan;
            const Icon = plan.icon;
            // A teacher on student Max can switch to Teacher Max (same tier, includes the AI Teacher)
            const canSwitchToTeacherMax = planKey === 'max' && isTeacher && tier === 'max' && billingPlan === 'max';
            const isCurrentPlan = tier === planKey && !canSwitchToTeacherMax;
            const isDowngrade = (planKey === 'free' && tier !== 'free') || (planKey === 'pro' && tier === 'max');

            return (
              <Card 
                key={planKey}
                className={cn(
                  "flex flex-col relative transition-all duration-200",
                  plan.highlighted && "border-primary shadow-lg shadow-primary/10",
                  isCurrentPlan && "ring-2 ring-primary"
                )}
              >
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    {plan.badge}
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline text-xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">{plan.priceLabel}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="p-6 pt-0">
                  {isCurrentPlan ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : planKey === 'free' ? (
                    isPremium ? (
                      <Button 
                        className="w-full" 
                        variant="ghost" 
                        onClick={handleManageSubscription}
                        disabled={isPortalLoading}
                      >
                        {isPortalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Manage Subscription
                      </Button>
                    ) : null
                  ) : isDowngrade ? (
                    <Button 
                      className="w-full" 
                      variant="ghost" 
                      onClick={handleManageSubscription}
                      disabled={isPortalLoading}
                    >
                      {isPortalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Change Plan
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      variant={plan.highlighted ? "default" : "outline"}
                      onClick={() => handleStripeCheckout(planKey as 'pro' | 'max')}
                      disabled={isCheckoutLoading !== null}
                    >
                      {isCheckoutLoading === planKey ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      {canSwitchToTeacherMax ? 'Switch to Teacher Max' : `Upgrade to ${plan.name}`}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
