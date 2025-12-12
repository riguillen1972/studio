import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, CheckCircle, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
  return (
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
  );
}
