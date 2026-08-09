import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runTool } from "@/ai/flows/run-tool";

// Import all existing flows to route to them
import { generateExplanation } from "@/ai/flows/generate-explanation";
import { provideHomeworkHints } from "@/ai/flows/provide-homework-hints";
import { summarizeText } from "@/ai/flows/summarize-text";
import { scanHomework } from "@/ai/flows/scan-homework-flow";
import { generateQuiz } from "@/ai/flows/generate-quiz";
import { generateQuizFromScan } from "@/ai/flows/generate-quiz-from-scan";
import { getBibleVerse } from "@/ai/flows/get-bible-verse";
import { generateFlashcards } from "@/ai/flows/generate-flashcards";
import { getFriendlyAdvice } from "@/ai/flows/get-friendly-advice";
import { generateMiniApp } from "@/ai/flows/generate-mini-app";
import { interactWithMiniApp } from "@/ai/flows/interact-with-mini-app";
import { webTutor } from "@/ai/flows/web-tutor";
import { focusRecommend } from "@/ai/flows/focus-recommend";
import { examOracle } from "@/ai/flows/exam-oracle";
import { knowledgeGap } from "@/ai/flows/knowledge-gap";
import { mvPlanner } from "@/ai/flows/mv-study-planner";
import { smartSummarizer as newSmartSummarizer } from "@/ai/flows/smart-summarizer";
import { conceptStoryteller } from "@/ai/flows/concept-storyteller";
import { debateMode } from "@/ai/flows/debate-mode";
import { curiosityRabbitHole } from "@/ai/flows/curiosity-rabbit-hole";
import { personalityTutor } from "@/ai/flows/personality-tutor";
import { makeItClick } from "@/ai/flows/make-it-click";
import { feynmanMode } from "@/ai/flows/feynman-mode";
import { deepUnderstanding } from "@/ai/flows/deep-understanding";
import { mentalModel } from "@/ai/flows/mental-model";
import { essayBrutalist } from "@/ai/flows/essay-brutalist";
import { crossSubject } from "@/ai/flows/cross-subject";
import { metacognition } from "@/ai/flows/metacognition";
import { professorMode } from "@/ai/flows/professor-mode";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    
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
    const { toolId, input, model, classId, contextPackId } = body;
    
    if (!toolId) {
      return NextResponse.json({ error: "Missing toolId" }, { status: 400 });
    }

    // Token Limits Check
    const currentMonth = new Date().toISOString().substring(0, 7);
    const { data: usage } = await supabase
      .from("token_usage")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", currentMonth)
      .single();

    const maxTokens = tier === 'max' ? 4000000 : tier === 'pro' ? 1500000 : 250000;
    
    // Check if they exceed general tokens (for simplicity we check the aggregate or specific model limits)
    // Here we'll check if the requested model is allowed for their tier and if they have tokens left.
    const requestedModel = model || "gemini-2.5-flash"; // Default model

    let hasTokens = false;
    if (requestedModel.includes("haiku")) {
      if (tier === 'max') {
        const used = usage?.haiku_used || 0;
        hasTokens = used < maxTokens;
      }
    } else if (requestedModel.includes("pro")) {
      if (tier === 'max' || tier === 'pro') {
        const used = usage?.pro_used || 0;
        hasTokens = used < maxTokens;
      }
    } else if (requestedModel.includes("flash-lite")) {
      const used = usage?.flash_lite_used || 0;
      hasTokens = used < maxTokens;
    } else { // default flash
      const used = usage?.flash_used || 0;
      hasTokens = used < maxTokens;
    }

    if (!hasTokens) {
      return NextResponse.json({ error: "Token limit exceeded or model not allowed for tier" }, { status: 402 });
    }

    // Phase 3 - Fetch context pack if provided and inject into groundingContext
    if (contextPackId) {
      const { data: contextPack, error: cpError } = await supabase
        .from("context_packs")
        .select("content_parsed, rubric")
        .eq("id", contextPackId)
        .single();
        
      if (!cpError && contextPack) {
        // Build grounding context string
        let groundingData = `[Context Pack Data]:\n${contextPack.content_parsed || ""}\n`;
        if (contextPack.rubric) {
          groundingData += `\n[Grading Rubric]:\n${contextPack.rubric}\n`;
        }
        
        // Append to existing groundingContext or set it
        if (input.groundingContext) {
          input.groundingContext = `${groundingData}\n\n${input.groundingContext}`;
        } else {
          input.groundingContext = groundingData;
        }
      }
    }

    let result;
    
    switch (toolId) {
      // Phase 0/Legacy routing
      case "generateExplanation":
        result = await generateExplanation(input);
        break;
      case "provideHomeworkHints":
        result = await provideHomeworkHints(input);
        break;
      case "summarizeText":
        result = await summarizeText(input);
        break;
      case "scanHomework":
        result = await scanHomework(input);
        break;
      case "generateQuiz":
        result = await generateQuiz(input);
        break;
      case "generateQuizFromScan":
        result = await generateQuizFromScan(input);
        break;
      case "getBibleVerse":
        result = await getBibleVerse(input);
        break;
      case "generateFlashcards":
        result = await generateFlashcards(input);
        break;
      case "getFriendlyAdvice":
        result = await getFriendlyAdvice(input);
        break;
      case "generateMiniApp":
        result = await generateMiniApp(input);
        break;
      case "interactWithMiniApp":
        result = await interactWithMiniApp(input);
        break;
      case "runTool":
        result = await runTool(input);
        break;
      case "webTutor":
        result = await webTutor(input);
        break;
      case "focusRecommend":
        result = await focusRecommend(input);
        break;
      case "examOracle":
        result = await examOracle(input);
        break;
      case "knowledgeGap":
        result = await knowledgeGap(input);
        break;
      case "mvPlanner":
        result = await mvPlanner(input);
        break;
      case "smartSummarizer":
        result = await newSmartSummarizer(input);
        break;
      case "conceptStoryteller":
        result = await conceptStoryteller(input);
        break;
      case "debateMode":
        result = await debateMode(input);
        break;
      case "curiosityRabbitHole":
        result = await curiosityRabbitHole(input);
        break;
      case "personalityTutor":
        result = await personalityTutor(input);
        break;
      case "makeItClick":
        result = await makeItClick(input);
        break;
      case "feynmanMode":
        result = await feynmanMode(input);
        break;
      case "deepUnderstanding":
        result = await deepUnderstanding(input);
        break;
      case "mentalModel":
        result = await mentalModel(input);
        break;
      case "essayBrutalist":
        result = await essayBrutalist(input);
        break;
      case "crossSubject":
        result = await crossSubject(input);
        break;
      case "metacognition":
        result = await metacognition(input);
        break;
      case "professorMode":
        result = await professorMode(input);
        break;
      default:
        return NextResponse.json({ error: `Unknown toolId: ${toolId}` }, { status: 404 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Error in /api/tools:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" }, 
      { status: 500 }
    );
  }
}
