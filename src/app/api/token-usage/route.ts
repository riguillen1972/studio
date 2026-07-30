import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // We use service role to bypass RLS for incrementing safely
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { model, tokens, month } = await req.json();

    if (!model || !tokens || !month) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Determine which column to increment
    let column = '';
    if (model.includes('flash-lite')) {
        column = 'flash_lite_used';
    } else if (model.includes('flash')) {
        column = 'flash_used';
    } else if (model.includes('pro')) {
        column = 'pro_used';
    } else if (model.includes('claude') || model.includes('haiku')) {
        column = 'haiku_used';
    } else {
        return NextResponse.json({ error: "Unknown model" }, { status: 400 });
    }

    // Since PostgREST doesn't support raw incrementing without RPC easily unless we fetch and update,
    // and we want to avoid race conditions, we will fetch current and update. 
    // In production, an RPC is better.
    const { data: currentUsage, error: fetchError } = await supabase
        .from('token_usage')
        .select(column)
        .eq('user_id', user.id)
        .eq('month', month)
        .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
        return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
    }

    let newValue = tokens;
    if (currentUsage) {
        newValue = (currentUsage[column] || 0) + tokens;
        
        const { error: updateError } = await supabase
            .from('token_usage')
            .update({ [column]: newValue })
            .eq('user_id', user.id)
            .eq('month', month);
            
        if (updateError) {
            return NextResponse.json({ error: "Failed to update usage" }, { status: 500 });
        }
    } else {
        const { error: insertError } = await supabase
            .from('token_usage')
            .insert({
                user_id: user.id,
                month: month,
                [column]: newValue
            });
            
        if (insertError) {
            return NextResponse.json({ error: "Failed to insert usage" }, { status: 500 });
        }
    }

    return NextResponse.json({ success: true, updatedValue: newValue });

  } catch (error) {
    console.error("Token Usage API POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
