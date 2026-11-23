"use client";

import { motion } from "framer-motion";
import { MentorAvatar } from "@/components/mentor/mentor-avatar";
import { MENTORS, type MentorId } from "@/lib/mentors";

/** Choose your mentor: four cards, each with the character and a line about them. */
export function MentorPicker({ current, onPick }: { current?: MentorId | null; onPick: (id: MentorId) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {MENTORS.map((m, i) => (
        <motion.button
          key={m.id}
          type="button"
          onClick={() => onPick(m.id)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.97 }}
          className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center transition-colors ${current === m.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
          style={current === m.id ? { borderColor: m.color } : undefined}
        >
          <MentorAvatar mentorId={m.id} mood={current === m.id ? "cheering" : "happy"} size={84} />
          <span className="font-semibold">{m.name}</span>
          <span className="text-xs text-muted-foreground">{m.tagline}</span>
        </motion.button>
      ))}
    </div>
  );
}
