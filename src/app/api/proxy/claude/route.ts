import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    
    // Initialize Supabase admin client to verify token and fetch profile
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Fetch user tier
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .single();
      
    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const tier = profile.tier || "free";
    const body = await req.json();
    const requestedModel = body.model || "";

    // Enforce tier limitations for Claude
    // Only Max tier can use Claude models
    if (tier !== "max") {
      return NextResponse.json({ error: "Claude models are only available on the Max tier." }, { status: 403 });
    }

    // Whitelist allowed Claude models
    const ALLOWED_MODELS = ["claude-haiku-4-5", "claude-3-5-haiku-20241022"];
    if (!ALLOWED_MODELS.some(m => requestedModel.includes(m))) {
      return NextResponse.json({ error: "This Claude model is not allowed." }, { status: 403 });
    }

    // Proxy the request to Anthropic
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json({ error: "Anthropic API key not configured" }, { status: 500 });
    }

    // Sanitize the request body — only forward safe, whitelisted fields
    const MAX_TOKENS_CAP = 8192;
    const sanitizedBody = {
      model: requestedModel,
      messages: Array.isArray(body.messages) ? body.messages.slice(0, 50) : [], // cap conversation length
      max_tokens: Math.min(Number(body.max_tokens) || 4096, MAX_TOKENS_CAP),
      ...(typeof body.temperature === 'number' && body.temperature >= 0 && body.temperature <= 2
        ? { temperature: body.temperature }
        : {}),
    };

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(sanitizedBody),
    });

    const responseData = await anthropicResponse.json();
    
    return NextResponse.json(responseData, {
      status: anthropicResponse.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
    
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
