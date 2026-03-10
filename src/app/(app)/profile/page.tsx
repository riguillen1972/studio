"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, CheckCircle, Target, Gem, Sigma, Sparkles, Crown, Zap, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppState, SubscriptionTier } from "@/components/app-state-provider";
import { Progress } from "@/components/ui/progress";
import { UpgradeDialog } from "@/components/upgrade-dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/supabase/auth-provider";
import { Badge } from "@/components/ui/badge";

const user = {
    name: "Alex Doe",
    email: "alex.doe@example.com",
    gradeLevel: "High School",
    avatarUrl: "https://picsum.photos/seed/user/200/200",
    imageHint: "student portrait",
    learningGoals: [
        "Improve my grade in Physics from B to A.",
        "Prepare for the upcoming SATs.",
        "Learn the basics of Python programming.",
    ]
}

interface TierPlan {
    name: string;
    price: number;
    description: string;
    icon: React.ElementType;
    features: string[];
    highlighted?: boolean;
    badge?: string;
}

const tierPlans: Record<SubscriptionTier, TierPlan> = {
    free: {
        name: "Free",
        price: 0,
        description: "Get started with essential AI study tools.",
        icon: Zap,
        features: [
            "Gemini 2.5 Flash exclusively",
            "1M tokens/month",
            "AI Tutor, Homework Help, Summarizer",
            "Quiz & Flashcard Generator",
            "Bible Verse & Study Buddy",
            "Half of AI Tools Library",
            "Ad-supported",
        ],
    },
    pro: {
        name: "Pro",
        price: 15,
        description: "Unlock full potential with premium models & tools.",
        icon: Sparkles,
        highlighted: true,
        badge: "POPULAR",
        features: [
            "Everything in Free, plus:",
            "Gemini 2.5 Pro model unlocked",
            "1M tokens/month (both models)",
            "Full AI Tools Library (all tools)",
            "Ad-free experience",
            "Priority support",
        ],
    },
    max: {
        name: "Max",
        price: 30,
        description: "Maximum power for serious students.",
        icon: Crown,
        features: [
            "Everything in Pro, plus:",
            "Claude 3.5 Haiku model unlocked",
            "2M tokens/month (all 3 models)",
            "AI Mini-App Generator",
            "Create & save custom learning apps",
            "Highest priority support",
        ],
    },
};

export default function ProfilePage() {
  const { 
    tier, 
    setTier, 
    flashTokensRemaining, 
    flashTokenLimit, 
    proTokensRemaining, 
    proTokenLimit,
    haikuTokensRemaining,
    haikuTokenLimit,
    isPremium
  } = useAppState();
  const { user: supabaseUser } = useAuth();
  const displayName = supabaseUser?.user_metadata?.display_name || supabaseUser?.email?.split('@')[0] || user.name;
  const displayEmail = supabaseUser?.email || user.email;
  const role = supabaseUser?.user_metadata?.role || 'student';
  const isTeacher = role === 'teacher';
  const [upgradeTarget, setUpgradeTarget] = useState<{ tier: 'pro' | 'max'; price: number } | null>(null);

  const handleUpgrade = (newTier: 'pro' | 'max') => {
    setTier(newTier);
  }

  const handlePlanSelect = (plan: SubscriptionTier) => {
    if (plan === 'free') {
      setTier('free');
    } else {
      setUpgradeTarget({ tier: plan, price: tierPlans[plan].price });
    }
  };

  return (
    <>
    <UpgradeDialog 
      open={!!upgradeTarget} 
      onOpenChange={(isOpen) => !isOpen && setUpgradeTarget(null)}
      upgradeInfo={upgradeTarget}
      onUpgrade={handleUpgrade}
    />
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
                        <Input id="name" defaultValue={displayName} />
                    </div>
                    {!isTeacher && (
                         <div className="space-y-2">
                            <Label htmlFor="grade">Grade Level</Label>
                            <Input id="grade" defaultValue={user.gradeLevel} />
                        </div>
                    )}
                </CardContent>
            </Card>

            {!isTeacher && (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><Target/> Learning Goals</CardTitle>
                        <CardDescription>Your current objectives.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {user.learningGoals.map((goal, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                    <span>{goal}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>

        <div className="space-y-8">
             <Card className="text-center">
                <CardContent className="p-6">
                    <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/50">
                        <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.imageHint} />
                        <AvatarFallback><User className="h-10 w-10"/></AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-semibold font-headline">{displayName}</h2>
                    <p className="text-muted-foreground text-sm">{displayEmail}</p>
                    <Badge className="mt-2" variant={tier === 'max' ? 'default' : tier === 'pro' ? 'secondary' : 'outline'}>
                      {tierPlans[tier].name} Plan
                    </Badge>
                </CardContent>
             </Card>

             {/* Monthly Usage */}
             {!isTeacher && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <Sigma className="text-primary"/>
                            Monthly Usage
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        { tier === 'max' && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Claude 3.5 Haiku</Label>
                                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                    <span>Remaining</span>
                                    <span>{new Intl.NumberFormat().format(haikuTokensRemaining)} / {new Intl.NumberFormat().format(haikuTokenLimit)}</span>
                                </div>
                                <Progress value={(haikuTokensRemaining / haikuTokenLimit) * 100} />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Gemini 2.5 Flash</Label>
                            <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                <span>Remaining</span>
                                <span>{new Intl.NumberFormat().format(flashTokensRemaining)} / {new Intl.NumberFormat().format(flashTokenLimit)}</span>
                            </div>
                            <Progress value={(flashTokensRemaining / flashTokenLimit) * 100} />
                        </div>
                        { isPremium && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Gemini 2.5 Pro</Label>
                                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                    <span>Remaining</span>
                                    <span>{new Intl.NumberFormat().format(proTokensRemaining)} / {new Intl.NumberFormat().format(proTokenLimit)}</span>
                                </div>
                                <Progress value={(proTokensRemaining / proTokenLimit) * 100} />
                            </div>
                        )}
                         <p className="text-xs text-center text-muted-foreground pt-1">Your token count resets monthly.</p>
                    </CardContent>
                </Card>
             )}

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full">Change Password</Button>
                    <Separator/>
                    <Button variant="destructive" className="w-full">Delete Account</Button>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Pricing Plans */}
      {!isTeacher && (
        <div className="mt-8">
            <h2 className="text-xl sm:text-2xl font-bold font-headline tracking-tight mb-2 flex items-center gap-2">
                <Gem className="text-primary" /> Subscription Plans
            </h2>
            <p className="text-muted-foreground mb-6">Choose the plan that fits your learning needs.</p>
            <div className="grid gap-6 md:grid-cols-3">
            {(Object.entries(tierPlans) as [SubscriptionTier, TierPlan][]).map(([planKey, plan]) => {
            const Icon = plan.icon;
            const isCurrentPlan = tier === planKey;
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
                    <span className="text-4xl font-bold">${plan.price}</span>
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
                  ) : isDowngrade ? (
                    <Button className="w-full" variant="ghost" onClick={() => handlePlanSelect(planKey)}>
                      Downgrade
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      variant={plan.highlighted ? "default" : "outline"}
                      onClick={() => handlePlanSelect(planKey)}
                    >
                      Upgrade to {plan.name}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      )}
    </div>
    </>
  );
}
