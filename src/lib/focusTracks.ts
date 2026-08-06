export type FocusTrack = {
  id: string
  label: string
  description: string
  tier: 'pro' | 'max'
  url: string
}

export const FOCUS_TRACKS: FocusTrack[] = [
  {
    id: 'deep-focus',
    label: 'Deep Focus',
    description: 'Writing, coding, essays',
    tier: 'pro',
    url: 'https://feccdhxvyfdogfodglpk.supabase.co/storage/v1/object/public/focus-audio/tracks/Glass_Meridian_16Hz_focus.wav',
  },
  {
    id: 'memory-mode',
    label: 'Memory Mode',
    description: 'Reading, memorization',
    tier: 'pro',
    url: 'https://feccdhxvyfdogfodglpk.supabase.co/storage/v1/object/public/focus-audio/tracks/Clear_Water_Motif_16Hz_focus.wav',
  },
  {
    id: 'noise-shield',
    label: 'Noise Shield',
    description: 'Blocking distractions',
    tier: 'pro',
    url: 'https://feccdhxvyfdogfodglpk.supabase.co/storage/v1/object/public/focus-audio/tracks/Parallel_North_16Hz_focus.wav',
  },
  {
    id: 'adhd-mode',
    label: 'ADHD Mode',
    description: 'Attention challenges',
    tier: 'pro',
    url: 'https://feccdhxvyfdogfodglpk.supabase.co/storage/v1/object/public/focus-audio/tracks/Kinetic_Alignment_16Hz_focus.wav',
  },
  {
    id: 'chill-study',
    label: 'Chill Study',
    description: 'General studying',
    tier: 'pro',
    url: 'https://feccdhxvyfdogfodglpk.supabase.co/storage/v1/object/public/focus-audio/tracks/Glass_Architecture_16Hz_focus.wav',
  },
  {
    id: 'calm-study',
    label: 'Calm Study',
    description: 'Anxiety reduction, light focus',
    tier: 'pro',
    url: 'https://feccdhxvyfdogfodglpk.supabase.co/storage/v1/object/public/focus-audio/tracks/Steady_State_16Hz_focus.wav',
  },
]
