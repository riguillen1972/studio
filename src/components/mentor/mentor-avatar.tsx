"use client";

// The four Study Buddy mentors, drawn as simple SVGs (round shapes, big eyes, bright colors) so
// they're crisp at any size and can change mood: happy, talking, thinking or cheering.

import { motion, useReducedMotion } from "framer-motion";
import { MENTORS_BY_ID, type MentorId } from "@/lib/mentors";

export type MentorMood = "happy" | "talking" | "thinking" | "cheering";

const INK = "#1F2937";

/** Eyes and mouth, shared by every mentor so they all emote the same way. */
function Face({ mood, cx = 60, eyeY = 60, mouthY = 78, eyeGap = 15, light = false }: {
  mood: MentorMood; cx?: number; eyeY?: number; mouthY?: number; eyeGap?: number; light?: boolean;
}) {
  const reduce = useReducedMotion();
  const ink = light ? "#ECFEFF" : INK;
  const eyes = mood === "cheering" ? (
    // Happy closed eyes: little upside-down arcs
    <g stroke={ink} strokeWidth={4} strokeLinecap="round" fill="none">
      <path d={`M${cx - eyeGap - 6} ${eyeY + 2} q6 -8 12 0`} />
      <path d={`M${cx + eyeGap - 6} ${eyeY + 2} q6 -8 12 0`} />
    </g>
  ) : (
    <motion.g
      style={{ originY: `${eyeY}px` }}
      animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1, 1] }}
      transition={{ duration: 4.5, times: [0, 0.9, 0.93, 0.96, 1], repeat: Infinity }}
    >
      {[-1, 1].map((side) => {
        const x = cx + side * eyeGap;
        const look = mood === "thinking" ? { dx: 2, dy: -3 } : { dx: 0, dy: 0 };
        return (
          <g key={side}>
            <ellipse cx={x} cy={eyeY} rx={7.5} ry={9} fill={light ? "#ECFEFF" : "#FFFFFF"} />
            <circle cx={x + look.dx} cy={eyeY + 1 + look.dy} r={4.6} fill={light ? "#0F766E" : INK} />
            <circle cx={x + look.dx + 1.6} cy={eyeY - 1 + look.dy} r={1.6} fill="#FFFFFF" />
          </g>
        );
      })}
    </motion.g>
  );

  let mouth;
  if (mood === "talking") {
    mouth = (
      <motion.ellipse
        cx={cx} cy={mouthY} rx={6} fill={light ? "#ECFEFF" : "#7F1D1D"}
        animate={reduce ? { ry: 3.5 } : { ry: [2, 5, 2.5, 4.5, 2] }}
        transition={{ duration: 0.9, repeat: Infinity }}
      />
    );
  } else if (mood === "thinking") {
    mouth = <path d={`M${cx - 6} ${mouthY} q4 -3 10 1`} stroke={ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />;
  } else {
    // Smile; a bigger open smile when cheering
    mouth = mood === "cheering"
      ? <path d={`M${cx - 10} ${mouthY - 3} q10 14 20 0 z`} fill={light ? "#ECFEFF" : "#7F1D1D"} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      : <path d={`M${cx - 8} ${mouthY - 2} q8 8 16 0`} stroke={ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />;
  }

  return (
    <g>
      {mood === "thinking" && (
        <path d={`M${cx + eyeGap - 7} ${eyeY - 14} q7 -5 13 0`} stroke={ink} strokeWidth={3} strokeLinecap="round" fill="none" />
      )}
      {eyes}
      {mouth}
    </g>
  );
}

function Pip({ mood }: { mood: MentorMood }) {
  const { color, accent } = MENTORS_BY_ID.pip;
  return (
    <g>
      {/* Ears */}
      <path d="M22 44 L30 8 L52 32 Z" fill={color} />
      <path d="M98 44 L90 8 L68 32 Z" fill={color} />
      <path d="M29 30 L32 16 L42 28 Z" fill={INK} opacity={0.8} />
      <path d="M91 30 L88 16 L78 28 Z" fill={INK} opacity={0.8} />
      {/* Head */}
      <ellipse cx={60} cy={64} rx={42} ry={38} fill={color} />
      {/* White cheeks and muzzle */}
      <path d="M20 70 Q40 66 60 88 Q80 66 100 70 Q90 100 60 102 Q30 100 20 70 Z" fill="#FFF7ED" />
      <circle cx={34} cy={78} r={5} fill={accent} opacity={0.9} />
      <circle cx={86} cy={78} r={5} fill={accent} opacity={0.9} />
      <Face mood={mood} eyeY={58} mouthY={86} />
      <ellipse cx={60} cy={75} rx={5} ry={3.5} fill={INK} />
    </g>
  );
}

function Bolt({ mood }: { mood: MentorMood }) {
  const { color, accent } = MENTORS_BY_ID.bolt;
  return (
    <g>
      {/* Antenna */}
      <line x1={60} y1={22} x2={60} y2={8} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <circle cx={60} cy={8} r={6} fill={mood === "cheering" ? "#FACC15" : accent} stroke={INK} strokeWidth={2} />
      {/* Ears */}
      <rect x={6} y={52} width={12} height={24} rx={5} fill={accent} stroke={INK} strokeWidth={2} />
      <rect x={102} y={52} width={12} height={24} rx={5} fill={accent} stroke={INK} strokeWidth={2} />
      {/* Head */}
      <rect x={16} y={22} width={88} height={84} rx={26} fill={color} stroke={INK} strokeWidth={2.5} />
      {/* Screen face */}
      <rect x={26} y={36} width={68} height={58} rx={18} fill="#134E4A" />
      <Face mood={mood} eyeY={60} mouthY={80} eyeGap={14} light />
    </g>
  );
}

function Shelly({ mood }: { mood: MentorMood }) {
  const { color, accent } = MENTORS_BY_ID.shelly;
  return (
    <g>
      {/* Shell peeking out behind the head */}
      <ellipse cx={60} cy={86} rx={56} ry={30} fill="#A16207" />
      <ellipse cx={60} cy={84} rx={48} ry={24} fill="#CA8A04" />
      <path d="M30 84 L45 72 L60 84 L75 72 L90 84" stroke="#A16207" strokeWidth={4} fill="none" strokeLinejoin="round" />
      {/* Head */}
      <ellipse cx={60} cy={58} rx={38} ry={36} fill={color} />
      <ellipse cx={60} cy={70} rx={26} ry={16} fill={accent} />
      <circle cx={30} cy={70} r={5} fill="#F9A8D4" opacity={0.8} />
      <circle cx={90} cy={70} r={5} fill="#F9A8D4" opacity={0.8} />
      <Face mood={mood} eyeY={52} mouthY={72} eyeGap={14} />
    </g>
  );
}

function Nova({ mood }: { mood: MentorMood }) {
  const { color, accent } = MENTORS_BY_ID.nova;
  return (
    <g>
      {/* Wings */}
      <path d="M14 70 Q0 44 18 30 Q20 52 34 58 Z" fill={accent} stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <path d="M106 70 Q120 44 102 30 Q100 52 86 58 Z" fill={accent} stroke={color} strokeWidth={3} strokeLinejoin="round" />
      {/* Horns */}
      <path d="M38 30 Q34 14 44 8 Q44 20 50 26 Z" fill="#FDE68A" />
      <path d="M82 30 Q86 14 76 8 Q76 20 70 26 Z" fill="#FDE68A" />
      {/* Head */}
      <ellipse cx={60} cy={62} rx={40} ry={38} fill={color} />
      {/* Snout */}
      <ellipse cx={60} cy={80} rx={24} ry={16} fill={accent} />
      <circle cx={53} cy={78} r={2} fill={INK} opacity={0.6} />
      <circle cx={67} cy={78} r={2} fill={INK} opacity={0.6} />
      <Face mood={mood} eyeY={56} mouthY={88} eyeGap={15} />
    </g>
  );
}

const DRAWINGS: Record<MentorId, (p: { mood: MentorMood }) => React.ReactElement> = { pip: Pip, bolt: Bolt, shelly: Shelly, nova: Nova };

/** A mentor at the given size; it bobs gently and jumps when cheering. */
export function MentorAvatar({ mentorId, mood = "happy", size = 96, className }: {
  mentorId: MentorId; mood?: MentorMood; size?: number; className?: string;
}) {
  const reduce = useReducedMotion();
  const Drawing = DRAWINGS[mentorId] ?? Pip;
  const motionProps = reduce ? {} : mood === "cheering"
    ? { animate: { y: [0, -14, 0, -8, 0], rotate: [0, -6, 6, -3, 0] }, transition: { duration: 0.9 } }
    : { animate: { y: [0, -3, 0] }, transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const } };
  return (
    <motion.svg
      key={mood === "cheering" ? "cheer" : "idle"}
      viewBox="0 0 120 120" width={size} height={size} className={className}
      role="img" aria-label={`${MENTORS_BY_ID[mentorId]?.name ?? "Mentor"}, ${mood}`}
      {...motionProps}
    >
      <Drawing mood={mood} />
    </motion.svg>
  );
}
