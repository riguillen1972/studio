"use client";

// Small animation pieces for Math Quest. Everything respects the device's "reduce motion"
// setting: movement is skipped (the page wraps Math Quest in MotionConfig reducedMotion="user"),
// and confetti and counting numbers turn off.

import { Children, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { animate, motion, useReducedMotion } from "framer-motion";

/** A number that counts from its last value (or `from`) to `value`. */
export function CountUp({ value, from, duration = 0.8, className }: { value: number; from?: number; duration?: number; className?: string }) {
  const reduced = useReducedMotion();
  const previous = useRef(from ?? value);
  const [shown, setShown] = useState(from ?? value);

  useEffect(() => {
    if (reduced) {
      previous.current = value;
      setShown(value);
      return;
    }
    const controls = animate(previous.current, value, { duration, ease: "easeOut", onUpdate: (v) => setShown(Math.round(v)) });
    previous.current = value;
    return () => controls.stop();
  }, [value, duration, reduced]);

  return <span className={className}>{shown}</span>;
}

const CONFETTI_COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6", "#ef4444", "#14b8a6"];

/**
 * A burst of confetti. The small one bursts from the middle of its (relative) parent; `big`
 * covers the screen, for mastering a skill or finishing a check.
 */
export function ConfettiBurst({ big = false }: { big?: boolean }) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pieces = useMemo(() => Array.from({ length: big ? 70 : 22 }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = (big ? 120 : 50) + Math.random() * (big ? 260 : 70);
    const size = 6 + Math.random() * 6;
    return {
      id: i, size,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance * 0.7 - (big ? 120 : 40),
      rotate: Math.random() * 720 - 360,
      delay: Math.random() * (big ? 0.25 : 0.1),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      round: i % 3 === 0,
    };
  }), [big]);

  if (reduced || !mounted) return null;
  const duration = big ? 2 : 1.1;
  const burst = (
    <span aria-hidden className={`pointer-events-none absolute block h-0 w-0 ${big ? "left-1/2 top-[38%]" : "left-1/2 top-1/2"}`}>
      {pieces.map((p) => (
        <motion.span key={p.id} className="absolute block"
          style={{ width: p.size, height: p.round ? p.size : p.size * 0.5, borderRadius: p.round ? "50%" : 2, backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + (big ? 260 : 90)], opacity: [1, 1, 0], scale: 1, rotate: p.rotate }}
          transition={{
            duration, delay: p.delay, ease: "easeOut",
            y: { duration, delay: p.delay, times: [0, 0.4, 1], ease: ["easeOut", "easeIn"] },
            opacity: { duration, delay: p.delay, times: [0, 0.7, 1] },
          }} />
      ))}
    </span>
  );
  // The full-screen burst is drawn on top of the whole page
  return big ? createPortal(<span className="pointer-events-none fixed inset-0 z-[100] block overflow-hidden">{burst}</span>, document.body) : burst;
}

/** Springs into place: for good news. */
export function Pop({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 18, delay }}>
      {children}
    </motion.div>
  );
}

/** A short side-to-side shake: for "not quite". */
export function Shake({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0 }} animate={{ opacity: 1, x: [0, -8, 8, -6, 6, -3, 0] }} transition={{ duration: 0.45 }}>
      {children}
    </motion.div>
  );
}

export function FadeUp({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}

/** Slides in from the right: for the next question. */
export function SlideIn({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}

/** Fades its children up one after another. */
export function Stagger({ children, className, step = 0.07 }: { children: React.ReactNode; className?: string; step?: number }) {
  return (
    <div className={className}>
      {Children.toArray(children).map((child, i) => (
        <FadeUp key={isValidElement(child) && child.key !== null ? child.key : i} delay={i * step}>{child}</FadeUp>
      ))}
    </div>
  );
}

/** A progress bar that grows from `from` to `to` (both 0–100). */
export function AnimatedBar({ from = 0, to, className = "" }: { from?: number; to: number; className?: string }) {
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  return (
    <div className={`h-4 w-full overflow-hidden rounded-full bg-secondary ${className}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clamp(to))}>
      <motion.div className="h-full rounded-full bg-primary" initial={{ width: `${clamp(from)}%` }} animate={{ width: `${clamp(to)}%` }}
        transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }} />
    </div>
  );
}
