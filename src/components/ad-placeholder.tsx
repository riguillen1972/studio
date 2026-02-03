
"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Gem } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdPlaceholder({ className }: { className?: string }) {
    return (
        <Card className={cn("border-dashed border-accent", className)}>
            <CardContent className="p-4 text-center">
                <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">Advertisement</p>
                    <p className="font-semibold text-lg">Tired of Ads? Upgrade Your Plan!</p>
                    <Button asChild size="sm">
                        <Link href="/profile">
                           <Gem className="mr-2 h-4 w-4" /> Upgrade Now
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
