"use client";

import { motion } from "framer-motion";
import React from "react";

export function PageTransition({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        duration: 0.4 
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
