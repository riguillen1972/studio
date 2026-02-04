
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionTier } from "./app-state-provider";

type UpgradeableTiers = 'pro' | 'max';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade: (tier: UpgradeableTiers) => void;
  upgradeInfo: { tier: UpgradeableTiers, price: number } | null;
}

export function UpgradeDialog({ open, onOpenChange, onUpgrade, upgradeInfo }: UpgradeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradeInfo) return;

    setIsLoading(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsLoading(false);
      onUpgrade(upgradeInfo.tier);
      onOpenChange(false);
      toast({
        title: "Upgrade Successful!",
        description: `Welcome to Study Buddy ${upgradeInfo.tier.charAt(0).toUpperCase() + upgradeInfo.tier.slice(1)}. Enjoy your new features!`,
      });
    }, 1500);
  };

  if (!upgradeInfo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handlePayment}>
            <DialogHeader>
            <DialogTitle className="font-headline">Upgrade to {upgradeInfo.tier.charAt(0).toUpperCase() + upgradeInfo.tier.slice(1)}</DialogTitle>
            <DialogDescription>
                Unlock all features and get an ad-free experience for just ${upgradeInfo.price}/month.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Name on Card</Label>
                    <Input id="name" placeholder="Alex Doe" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="card-number">Card Number</Label>
                    <div className="relative">
                        <Input id="card-number" placeholder="0000 0000 0000 0000" required />
                        <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
                 <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry</Label>
                        <Input id="expiry" placeholder="MM/YY" required />
                    </div>
                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input id="cvc" placeholder="123" required />
                    </div>
                </div>
            </div>
            <DialogFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : `Pay $${upgradeInfo.price} and Upgrade`}
            </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
