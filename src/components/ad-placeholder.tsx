
"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { Gem } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdPlaceholder({ className }: { className?: string }) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 p-4",
            className
        )}>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 opacity-50" />
            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-center sm:text-left">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sponsored</p>
                    <p className="font-semibold text-sm mt-0.5">Enjoying Study Buddy? Go ad-free with Pro!</p>
                </div>
                <Button asChild size="sm" variant="outline" className="shrink-0 border-primary/30 hover:bg-primary/10">
                    <Link href="/profile">
                       <Gem className="mr-1.5 h-3.5 w-3.5" /> Upgrade
                    </Link>
                </Button>
            </div>
        </div>
    );
}
