import { PageTransition } from "@/components/page-transition";
import React from "react";

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  // The template.tsx file is a Next.js feature that wraps all child layouts and pages.
  // Unlike layout.tsx, it creates a new instance (remounts) on every navigation,
  // making it the perfect place to drop in a Framer Motion entrance animation.
  // By placing it under (app), only the main content animates, while the sidebar layout remains static.
  return <PageTransition className="w-full">{children}</PageTransition>;
}
