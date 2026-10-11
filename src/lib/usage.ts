// Server-only helpers for enforcing and recording monthly AI token usage.
// Usage is checked and recorded on the server so the limits can't be skipped from the browser.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { TOKEN_LIMITS, USAGE_COLUMNS, MODEL_LABELS, type SubscriptionTier, type UsageModel } from '@/lib/plans';

let adminClient: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase service role is not configured');
    adminClient = createClient(url, key, { auth: { persistSession: false } });
  }
  return adminClient;
}

export const currentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const { data } = await getAdminClient().from('profiles').select('tier').eq('id', userId).maybeSingle();
  const tier = data?.tier;
  return tier === 'pro' || tier === 'max' ? tier : 'free';
}

/** Returns an error message if the user may not use this model right now, or null if they can. */
export async function checkUsage(userId: string, model: UsageModel): Promise<string | null> {
  const tier = await getUserTier(userId);
  const limit = TOKEN_LIMITS[tier][model];
  if (limit <= 0) {
    return `${MODEL_LABELS[model]} isn't included in your plan.`;
  }

  const column = USAGE_COLUMNS[model];
  const { data: usage, error } = await getAdminClient()
    .from('token_usage')
    .select(column)
    .eq('user_id', userId)
    .eq('month', currentMonth())
    .maybeSingle();

  if (error) {
    console.error('Token usage lookup failed:', error);
    return 'Could not check your usage. Please try again.';
  }

  const used = (usage as Record<string, number> | null)?.[column] ?? 0;
  if (used >= limit) {
    return `You have reached your monthly token limit for ${MODEL_LABELS[model]}. It resets at the start of next month.`;
  }
  return null;
}

/** Adds tokens to the user's usage row for this month, creating the row on first use. */
export async function recordUsage(userId: string, model: UsageModel, tokens: number): Promise<void> {
  if (!Number.isFinite(tokens) || tokens <= 0) return;
  const supabase = getAdminClient();
  const column = USAGE_COLUMNS[model];
  const month = currentMonth();
  const amount = Math.round(tokens);

  const { error } = await supabase.rpc('increment_token_usage', {
    p_user_id: userId,
    p_month: month,
    p_column_name: column,
    p_tokens: amount,
  });
  if (!error) return;

  // Fallback for databases where the RPC is missing or broken: read, then upsert.
  console.error('increment_token_usage failed, falling back to upsert:', error);
  const { data: existing } = await supabase
    .from('token_usage')
    .select(column)
    .eq('user_id', userId)
    .eq('month', month)
    .maybeSingle();
  const current = (existing as Record<string, number> | null)?.[column] ?? 0;
  const { error: upsertError } = await supabase
    .from('token_usage')
    .upsert({ user_id: userId, month, [column]: current + amount }, { onConflict: 'user_id,month' });
  if (upsertError) console.error('Token usage upsert failed:', upsertError);
}
