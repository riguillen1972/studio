"use client";

import { useState, useEffect, Suspense } from "react";
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
            "Gemini 2.5 Flash-Lite exclusively",
            "250k tokens/month",
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
            "500k tokens/month (Gemini 2.5 Pro)",
            "Full AI Tools Library (all tools)",
            "Ad-free experience",
            "Priority support",
        ],
    },
    max: {
        name: "Max",
        price: 25,
        description: "Maximum power for serious students.",
        icon: Crown,
        features: [
            "Everything in Pro, plus:",
            "Claude Haiku 4.5 model unlocked",
            "2M tokens/month (both models)",
            "AI Mini-App Generator",
            "Create & save custom learning apps",
            "Highest priority support",
        ],
    },
};

function ProfileContent() {
  const { 
    tier, 
    gemma3TokensRemaining,
    gemma3TokenLimit,
    flashTokensRemaining, 
    flashTokenLimit, 
    proTokensRemaining, 
    proTokenLimit,
    haikuTokensRemaining,
    haikuTokenLimit,
    isPremium
  } = useAppState();
  const { user: supabaseUser } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const displayName = supabaseUser?.user_metadata?.display_name || supabaseUser?.email?.split('@')[0] || 'Student';
  const displayEmail = supabaseUser?.email || '';
  const role = supabaseUser?.user_metadata?.role || 'student';
  const isTeacher = role === 'teacher';
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

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
                        <Input id="name" defaultValue={displayName} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
                        <Input id="email" defaultValue={displayEmail} readOnly className="bg-muted/50 cursor-default" />
                    </div>
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
                    {!isTeacher && (
                      <Badge className="mt-2" variant={tier === 'max' ? 'default' : tier === 'pro' ? 'secondary' : 'outline'}>
                        {tierPlans[tier].name} Plan
                      </Badge>
                    )}
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
                                <Label className="text-sm font-medium">Claude Haiku 4.5</Label>
                                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                    <span>Remaining</span>
                                    <span>{new Intl.NumberFormat().format(haikuTokensRemaining)} / {new Intl.NumberFormat().format(haikuTokenLimit)}</span>
                                </div>
                                <Progress value={(haikuTokensRemaining / haikuTokenLimit) * 100} />
                            </div>
                        )}
                        { tier === 'free' ? (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Gemini 2.5 Flash-Lite</Label>
                                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                    <span>Remaining</span>
                                    <span>{new Intl.NumberFormat().format(gemma3TokensRemaining)} / {new Intl.NumberFormat().format(gemma3TokenLimit)}</span>
                                </div>
                                <Progress value={gemma3TokenLimit > 0 ? (gemma3TokensRemaining / gemma3TokenLimit) * 100 : 0} />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Gemini 2.5 Flash</Label>
                                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                    <span>Remaining</span>
                                    <span>{new Intl.NumberFormat().format(flashTokensRemaining)} / {new Intl.NumberFormat().format(flashTokenLimit)}</span>
                                </div>
                                <Progress value={flashTokenLimit > 0 ? (flashTokensRemaining / flashTokenLimit) * 100 : 0} />
                            </div>
                        )}
                        { tier === 'pro' && (
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
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
