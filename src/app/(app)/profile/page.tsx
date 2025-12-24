
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, CheckCircle, Target, Gem, Sigma } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppState } from "@/components/app-state-provider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { UpgradeDialog } from "@/components/upgrade-dialog";


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

export default function ProfilePage() {
  const { isPremium, setIsPremium, requestsRemaining, requestLimit } = useAppState();
  const requestPercentage = (requestsRemaining / requestLimit) * 100;
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

  return (
    <>
    <UpgradeDialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen} onUpgrade={() => setIsPremium(true)} />
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          User Profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account information and learning goals.
        </p>
      </header>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue={user.name} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" defaultValue={user.email} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="grade">Grade Level</Label>
                        <Input id="grade" defaultValue={user.gradeLevel} />
                    </div>
                </CardContent>
            </Card>

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
        </div>
        <div className="space-y-8">
             <Card className="text-center">
                <CardContent className="p-6">
                    <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/50">
                        <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.imageHint} />
                        <AvatarFallback><User className="h-10 w-10"/></AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-semibold font-headline">{user.name}</h2>
                    <p className="text-muted-foreground text-sm">{user.email}</p>
                </CardContent>
             </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Gem className="text-primary"/>
                        Subscription
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <Label htmlFor="premium-toggle">
                                {isPremium ? "Premium Active" : "Free Tier"}
                            </Label>
                             <CardDescription>
                                {isPremium ? "Enjoy an ad-free experience!" : "Upgrade to unlock premium features."}
                            </CardDescription>
                        </div>
                        <Switch
                            id="premium-toggle"
                            checked={isPremium}
                            onCheckedChange={setIsPremium}
                        />
                    </div>
                     {!isPremium && <Button className="w-full" onClick={() => setIsUpgradeDialogOpen(true)}>Upgrade for $10</Button>}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Sigma className="text-primary"/>
                        Daily Usage
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                        <span>Requests remaining</span>
                        <span>{requestsRemaining} / {requestLimit}</span>
                    </div>
                     <Progress value={requestPercentage} />
                     <p className="text-xs text-center text-muted-foreground pt-1">Your request count resets daily.</p>
                </CardContent>
            </Card>


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
    </div>
    </>
  );
}
