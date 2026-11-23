"use client";

// The four Study Buddy professors, drawn as simple SVGs (round, stylized shapes, adult features) so
// they're crisp at any size. Their moods follow the design notes in src/lib/mentors.ts:
// - talking: looks toward the page and points at it (guides attention to the material)
// - thinking: eyes up, hand on chin
// - encouraging: warm smile, raised eyebrows, head tilted (after a mistake: "not yet")
// - cheering: a proud nod and a big smile
// - happy: idle; the only mood with gentle motion, so nothing moves while a page is being read

import { motion, useReducedMotion } from "framer-motion";
import { MENTORS_BY_ID, type MentorId } from "@/lib/mentors";

export type MentorMood = "happy" | "talking" | "thinking" | "encouraging" | "cheering";

const INK = "#1F2937";
const HEAD_CX = 60;
const HEAD_CY = 46;

/** Eyes, eyebrows and mouth, shared so every professor emotes the same way. */
function Face({ mood, eyeY = 47, mouthY = 63, eyeGap = 12 }: { mood: MentorMood; eyeY?: number; mouthY?: number; eyeGap?: number }) {
  const reduce = useReducedMotion();
  const cx = HEAD_CX;
  // Where the pupils point: at the page (to the left, where the book is) while talking, up while thinking
  const look = mood === "talking" ? { dx: -2.2, dy: 0.5 } : mood === "thinking" ? { dx: 1.8, dy: -2.4 } : { dx: 0, dy: 0 };
  const browLift = mood === "encouraging" || mood === "cheering" ? -2.5 : 0;

  const eyes = mood === "cheering" ? (
    <g stroke={INK} strokeWidth={3.2} strokeLinecap="round" fill="none">
      <path d={`M${cx - eyeGap - 5} ${eyeY + 1.5} q5 -6 10 0`} />
      <path d={`M${cx + eyeGap - 5} ${eyeY + 1.5} q5 -6 10 0`} />
    </g>
  ) : (
    <motion.g
      style={{ originY: `${eyeY}px` }}
      animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1, 1] }}
      transition={{ duration: 5, times: [0, 0.9, 0.93, 0.96, 1], repeat: Infinity }}
    >
      {[-1, 1].map((side) => {
        const x = cx + side * eyeGap;
        return (
          <g key={side}>
            <ellipse cx={x} cy={eyeY} rx={5.5} ry={6.2} fill="#FFFFFF" />
            <circle cx={x + look.dx} cy={eyeY + 0.6 + look.dy} r={3.4} fill={INK} />
            <circle cx={x + look.dx + 1.1} cy={eyeY - 0.8 + look.dy} r={1.1} fill="#FFFFFF" />
          </g>
        );
      })}
    </motion.g>
  );

  let mouth;
  if (mood === "talking") {
    mouth = (
      <motion.ellipse cx={cx} cy={mouthY} rx={4.5} fill="#7F1D1D"
        animate={reduce ? { ry: 2.6 } : { ry: [1.5, 3.8, 2, 3.4, 1.5] }}
        transition={{ duration: 0.9, repeat: Infinity }} />
    );
  } else if (mood === "thinking") {
    mouth = <path d={`M${cx - 4} ${mouthY} q3 -2 8 0.5`} stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none" />;
  } else if (mood === "cheering") {
    mouth = <path d={`M${cx - 8} ${mouthY - 2} q8 11 16 0 z`} fill="#7F1D1D" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />;
  } else {
    // A warm smile (a little wider when encouraging)
    const w = mood === "encouraging" ? 8 : 6.5;
    mouth = <path d={`M${cx - w} ${mouthY - 1.5} q${w} 6.5 ${w * 2} 0`} stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none" />;
  }

  return (
    <g>
      {/* Eyebrows: raised when encouraging or proud, one raised when thinking */}
      <g stroke={INK} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.85}>
        <path d={`M${cx - eyeGap - 5} ${eyeY - 9 + browLift} q5 -3 10 0`} />
        <path d={`M${cx + eyeGap - 5} ${eyeY - 9 + browLift + (mood === "thinking" ? -2.5 : 0)} q5 -3 10 0`} />
      </g>
      {eyes}
      {mouth}
    </g>
  );
}

/** A hand: pointing toward the page (left) while talking, or resting on the chin while thinking. */
function Gesture({ mood, skin, sleeve }: { mood: MentorMood; skin: string; sleeve: string }) {
  if (mood === "talking") {
    return (
      <motion.g initial={{ x: 6, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
        <path d="M30 120 Q24 98 20 86" stroke={sleeve} strokeWidth={13} strokeLinecap="round" fill="none" />
        <circle cx={19} cy={82} r={6} fill={skin} />
        {/* Pointing finger, toward the textbook */}
        <path d="M16 80 L6 76" stroke={skin} strokeWidth={4.2} strokeLinecap="round" />
      </motion.g>
    );
  }
  if (mood === "thinking") {
    return (
      <motion.g initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
        <path d="M86 120 Q84 96 74 82" stroke={sleeve} strokeWidth={12} strokeLinecap="round" fill="none" />
        <ellipse cx={70} cy={76} rx={6.5} ry={5.5} fill={skin} />
      </motion.g>
    );
  }
  return null;
}

/** Shoulders, neck, ears and head, shared by every professor. The head tilts when encouraging. */
function Professor({ mood, skin, jacket, shirt, behindHead, hair, front, beard, extras }: {
  mood: MentorMood; skin: string; jacket: string; shirt: string;
  behindHead?: React.ReactNode; hair: React.ReactNode; front?: React.ReactNode;
  /** Drawn under the eyes and mouth, so they stay visible. */
  beard?: React.ReactNode;
  extras?: React.ReactNode;
}) {
  const tilt = mood === "encouraging" ? -7 : 0;
  return (
    <g>
      {/* Body: jacket with lapels over a shirt */}
      <path d="M8 120 Q10 92 38 86 L82 86 Q110 92 112 120 Z" fill={jacket} />
      <path d="M48 86 L60 104 L72 86 Z" fill={shirt} />
      <path d="M38 86 L54 112 L48 86 Z M82 86 L66 112 L72 86 Z" fill="#000000" opacity={0.12} />
      {front}
      <rect x={53} y={70} width={14} height={18} rx={6} fill={skin} />
      <motion.g animate={{ rotate: tilt }} style={{ originX: `${HEAD_CX}px`, originY: "78px" }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
        {behindHead}
        <circle cx={33} cy={48} r={5.5} fill={skin} />
        <circle cx={87} cy={48} r={5.5} fill={skin} />
        <ellipse cx={HEAD_CX} cy={HEAD_CY} rx={27} ry={29} fill={skin} />
        <circle cx={44} cy={58} r={4} fill="#F472B6" opacity={0.28} />
        <circle cx={76} cy={58} r={4} fill="#F472B6" opacity={0.28} />
        {hair}
        {beard}
        <Face mood={mood} />
        {extras}
      </motion.g>
      <Gesture mood={mood} skin={skin} sleeve={jacket} />
    </g>
  );
}

const glasses = (frame: string) => (
  <g stroke={frame} strokeWidth={2.2} fill="none">
    <rect x={40} y={40} width={17} height={14} rx={6} />
    <rect x={63} y={40} width={17} height={14} rx={6} />
    <path d="M57 46 Q60 44 63 46" />
  </g>
);

function Rivera({ mood }: { mood: MentorMood }) {
  const hair = "#3B2417";
  return (
    <Professor mood={mood} skin="#B9785A" jacket={MENTORS_BY_ID.rivera.color} shirt="#FFF7ED"
      behindHead={<path d="M30 46 Q26 16 60 14 Q94 16 90 46 Q96 70 86 80 Q84 60 80 50 L40 50 Q36 60 34 80 Q24 70 30 46 Z" fill={hair} />}
      hair={<path d="M33 44 Q34 18 60 17 Q86 18 87 44 Q78 28 62 30 Q48 34 33 44 Z" fill={hair} />}
      extras={glasses("#B91C1C")}
      front={<circle cx={60} cy={95} r={2.5} fill="#F59E0B" />}
    />
  );
}

function Okafor({ mood }: { mood: MentorMood }) {
  return (
    <Professor mood={mood} skin="#6B4430" jacket={MENTORS_BY_ID.okafor.color} shirt="#F8FAFC"
      hair={<path d="M34 40 Q34 18 60 17 Q86 18 86 40 Q80 26 60 26 Q40 26 34 40 Z" fill="#1C1917" />}
      beard={
        // Short, neat beard around the mouth
        <g fill="#1C1917" opacity={0.92}>
          <path d="M37 54 Q38 80 60 81 Q82 80 83 54 Q80 66 73 70 Q66 74 60 74 Q54 74 47 70 Q40 66 37 54 Z" />
          {/* Mustache, above the mouth */}
          <path d="M50 58.5 Q55 55 60 57.5 Q65 55 70 58.5 Q65 60 60 59 Q55 60 50 58.5 Z" />
        </g>
      }
      front={
        // Bow tie
        <g fill="#F59E0B"><path d="M60 89 L50 84 L50 94 Z" /><path d="M60 89 L70 84 L70 94 Z" /><circle cx={60} cy={89} r={2.4} /></g>
      }
    />
  );
}

function Chen({ mood }: { mood: MentorMood }) {
  const hair = "#111827";
  return (
    <Professor mood={mood} skin="#F2D3B3" jacket={MENTORS_BY_ID.chen.color} shirt="#FFFFFF"
      behindHead={<><circle cx={60} cy={14} r={11} fill={hair} /><path d="M66 6 L74 0" stroke="#FACC15" strokeWidth={3} strokeLinecap="round" /></>}
      hair={<path d="M33 46 Q32 18 60 18 Q88 18 87 46 Q84 30 70 27 Q60 33 46 28 Q36 32 33 46 Z" fill={hair} />}
      extras={glasses("#374151")}
    />
  );
}

function Hughes({ mood }: { mood: MentorMood }) {
  const hair = "#D1D5DB";
  return (
    <Professor mood={mood} skin="#F5C9A6" jacket={MENTORS_BY_ID.hughes.color} shirt="#E0F2FE"
      // Gray hair around the sides, thinner on top
      hair={<><path d="M33 50 Q30 30 40 24 Q38 36 38 48 Z M87 50 Q90 30 80 24 Q82 36 82 48 Z" fill={hair} /><path d="M42 24 Q60 16 78 24 Q60 21 42 24 Z" fill={hair} /></>}
      extras={
        // Mustache
        <path d="M50 58 Q55 54 60 57 Q65 54 70 58 Q65 61 60 59 Q55 61 50 58 Z" fill={hair} />
      }
      front={<path d="M54 86 L60 100 L66 86 Z" fill="#1E3A8A" />}
    />
  );
}

const DRAWINGS: Record<MentorId, (p: { mood: MentorMood }) => React.ReactElement> = { rivera: Rivera, okafor: Okafor, chen: Chen, hughes: Hughes };

/** A professor at the given size. Idle: a slow, gentle bob. Proud: a nod. Otherwise still. */
export function MentorAvatar({ mentorId, mood = "happy", size = 96, className }: {
  mentorId: MentorId; mood?: MentorMood; size?: number; className?: string;
}) {
  const reduce = useReducedMotion();
  const Drawing = DRAWINGS[mentorId] ?? Rivera;
  const motionProps = reduce ? {} : mood === "cheering"
    ? { animate: { y: [0, 3, 0, 3, 0], rotate: [0, 2, 0, 2, 0] }, transition: { duration: 0.9 } }
    : mood === "happy"
      ? { animate: { y: [0, -2, 0] }, transition: { duration: 4, repeat: Infinity, ease: "easeInOut" as const } }
      : {};
  return (
    <motion.svg
      key={mood === "cheering" ? "proud" : "still"}
      viewBox="0 0 120 120" width={size} height={size} className={className}
      role="img" aria-label={`${MENTORS_BY_ID[mentorId]?.name ?? "Mentor"}, ${mood}`}
      {...motionProps}
    >
      <Drawing mood={mood} />
    </motion.svg>
  );
}
