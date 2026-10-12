"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Lock, Volume2, Save, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

interface AITeacherBuilderProps {
  tier: string;
}

export function AITeacherBuilder({ tier }: AITeacherBuilderProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [voiceId, setVoiceId] = useState("");
  const [voiceSpeed, setVoiceSpeed] = useState([1]);
  const [voices, setVoices] = useState<{ voice_id: string; name: string; labels: Record<string, string>; preview_url: string | null }[]>([]);
  const [voiceConfigured, setVoiceConfigured] = useState(true);
  const [guardrails, setGuardrails] = useState({ neverDo: "", special: "" });
  
  const [identity, setIdentity] = useState({
    name: "Ms. Nova",
    title: "Science Teacher",
    greeting: "Welcome back! Are we ready to learn?",
    signOff: "Great work today. See you next time!",
    backstory: "A passionate scientist who loves breaking down complex ideas into simple analogies.",
  });

  const [personality, setPersonality] = useState({
    warmth: [8],
    energy: [7],
    strictness: [4],
    humor: [6]
  });

  const [teachingStyle, setTeachingStyle] = useState({
    method: "socratic",
    adaptation: "analogy",
    pacing: "adaptive",
    questions: "profile"
  });

  // Load the saved AI Teacher, if any
  useEffect(() => {
    if (tier !== "max") return;
    (async () => {
      try {
        const { data: { session } } = await createClient().auth.getSession();
        if (!session) return;
        const headers = { Authorization: `Bearer ${session.access_token}` };
        const [res, voicesRes] = await Promise.all([
          fetch("/api/avatar", { headers }),
          fetch("/api/avatar/voices", { headers }),
        ]);
        const voiceData = await voicesRes.json().catch(() => ({ configured: false, voices: [] }));
        setVoiceConfigured(!!voiceData.configured);
        setVoices(voiceData.voices ?? []);
        const { data } = await res.json();
        if (data) {
          setIdentity({
            name: data.name ?? "",
            title: data.title ?? "",
            greeting: data.greeting_phrase ?? "",
            signOff: data.sign_off_phrase ?? "",
            backstory: data.backstory ?? "",
          });
          setPersonality({
            warmth: [data.warmth ?? 5],
            energy: [data.energy ?? 5],
            strictness: [data.strictness ?? 5],
            humor: [data.humor ?? 5],
          });
          setTeachingStyle(prev => ({
            ...prev,
            method: data.teaching_method ?? prev.method,
            adaptation: data.adaptation_style ?? prev.adaptation,
          }));
          setVoiceId(data.voice_id ?? "");
          setVoiceSpeed([data.voice_speed ?? 1]);
          setGuardrails({ neverDo: data.never_do ?? "", special: data.special_instructions ?? "" });
        }
      } catch (e) {
        console.error("Failed to load AI Teacher:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [tier]);

  if (tier !== "max") {
    return (
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <CardTitle className="text-2xl">AI Teacher Avatar</CardTitle>
          <CardDescription className="text-base max-w-lg mx-auto mt-2">
            Build a custom AI co-teacher that leads live lessons for your students, with its own personality and teaching style. Included in Teacher Max.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <ul className="space-y-3 text-sm text-left max-w-sm mx-auto">
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" /> Custom voice and personality
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" /> Adaptive Socratic teaching
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" /> Real-time confusion detection
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" /> Post-session analytics reports
            </li>
          </ul>
        </CardContent>
        <CardFooter className="flex justify-center pb-8">
          <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-white rounded-full">
            <Link href="/profile#plans">{tier === "student-max" ? "Switch to Teacher Max to Unlock" : "Upgrade to Max to Unlock"}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { session } } = await createClient().auth.getSession();
      if (!session) throw new Error("Your session has expired. Please sign in again.");
      const res = await fetch("/api/avatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          name: identity.name,
          title: identity.title,
          backstory: identity.backstory,
          greeting_phrase: identity.greeting,
          sign_off_phrase: identity.signOff,
          warmth: personality.warmth[0],
          energy: personality.energy[0],
          strictness: personality.strictness[0],
          humor: personality.humor[0],
          teaching_method: teachingStyle.method,
          adaptation_style: teachingStyle.adaptation,
          never_do: guardrails.neverDo,
          special_instructions: guardrails.special,
          voice_id: voiceId,
          voice_speed: voiceSpeed[0],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save your AI Teacher.");
      toast({
        title: "AI Teacher Saved!",
        description: "Start a live lesson from the Live Session tab.",
      });
    } catch (e) {
      toast({
        title: "Couldn't save",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-500" />
            Avatar Character Builder
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Design your custom AI co-teacher for live student sessions.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700 text-white">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Avatar Config
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identity & Voice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Avatar Name</Label>
                <Input value={identity.name} onChange={e => setIdentity({...identity, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Display Title</Label>
                <Input value={identity.title} onChange={e => setIdentity({...identity, title: e.target.value})} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Voice</Label>
              <div className="flex gap-2">
                <Select value={voiceId} onValueChange={setVoiceId} disabled={!voices.length}>
                  <SelectTrigger>
                    <SelectValue placeholder={voices.length ? "Choose a voice" : "Voices aren't available yet"} />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map(v => {
                      const details = [v.labels.gender, v.labels.accent, v.labels.description ?? v.labels.descriptive].filter(Boolean).join(", ");
                      return (
                        <SelectItem key={v.voice_id} value={v.voice_id}>
                          {v.name}{details ? ` (${details})` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  title="Preview voice"
                  disabled={!voices.find(v => v.voice_id === voiceId)?.preview_url}
                  onClick={() => {
                    const url = voices.find(v => v.voice_id === voiceId)?.preview_url;
                    if (url) new Audio(url).play().catch(() => {});
                  }}
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {voiceConfigured
                  ? "Your AI Teacher speaks its replies aloud in live lessons."
                  : "Voice isn't available yet. Live lessons use your browser's built-in voice until it is."}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <Label>Speaking speed</Label>
                <span className="text-muted-foreground text-xs">{voiceSpeed[0].toFixed(2)}x</span>
              </div>
              <Slider min={0.7} max={1.2} step={0.05} value={voiceSpeed} onValueChange={setVoiceSpeed} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Slower</span>
                <span>Faster</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Background Story</Label>
              <Textarea 
                value={identity.backstory} 
                onChange={e => setIdentity({...identity, backstory: e.target.value})}
                className="h-20"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personality Traits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <Label>Warmth</Label>
                <span className="text-muted-foreground text-xs">{personality.warmth[0]}/10</span>
              </div>
              <Slider 
                min={1} max={10} step={1} 
                value={personality.warmth} 
                onValueChange={v => setPersonality({...personality, warmth: v})} 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Cold & Professional</span>
                <span>Warm & Encouraging</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <Label>Energy</Label>
                <span className="text-muted-foreground text-xs">{personality.energy[0]}/10</span>
              </div>
              <Slider 
                min={1} max={10} step={1} 
                value={personality.energy} 
                onValueChange={v => setPersonality({...personality, energy: v})} 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Calm & Measured</span>
                <span>High & Exciting</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <Label>Strictness</Label>
                <span className="text-muted-foreground text-xs">{personality.strictness[0]}/10</span>
              </div>
              <Slider 
                min={1} max={10} step={1} 
                value={personality.strictness} 
                onValueChange={v => setPersonality({...personality, strictness: v})} 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Laid Back</span>
                <span>Firm & Demanding</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <Label>Humor</Label>
                <span className="text-muted-foreground text-xs">{personality.humor[0]}/10</span>
              </div>
              <Slider 
                min={1} max={10} step={1} 
                value={personality.humor} 
                onValueChange={v => setPersonality({...personality, humor: v})} 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Serious</span>
                <span>Playful & Funny</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pedagogy & Teaching Style</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Primary Teaching Method</Label>
              <Select value={teachingStyle.method} onValueChange={v => setTeachingStyle({...teachingStyle, method: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="socratic">Socratic (Questions-led)</SelectItem>
                  <SelectItem value="explainer">Direct Explainer</SelectItem>
                  <SelectItem value="coach">Encouraging Coach</SelectItem>
                  <SelectItem value="storyteller">Storyteller</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Confusion Response Strategy</Label>
              <Select value={teachingStyle.adaptation} onValueChange={v => setTeachingStyle({...teachingStyle, adaptation: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="analogy">Use a different analogy</SelectItem>
                  <SelectItem value="slower">Re-explain slower</SelectItem>
                  <SelectItem value="scaffolding">Ask a scaffolding question</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">How the avatar reacts when 3+ students flag confusion.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Greeting Phrase (Exact)</Label>
              <Input value={identity.greeting} onChange={e => setIdentity({...identity, greeting: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Sign-off Phrase (Exact)</Label>
              <Input value={identity.signOff} onChange={e => setIdentity({...identity, signOff: e.target.value})} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Classroom Rules</CardTitle>
          <CardDescription>Tell your AI Teacher what to avoid and anything special about your class.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Never do</Label>
            <Textarea
              placeholder="e.g. Never use sarcasm. Never compare students to each other."
              value={guardrails.neverDo}
              onChange={e => setGuardrails({ ...guardrails, neverDo: e.target.value })}
              className="h-24"
              maxLength={1000}
            />
          </div>
          <div className="space-y-2">
            <Label>Special instructions</Label>
            <Textarea
              placeholder="e.g. Several students are English learners, so use simple words. Use sports examples."
              value={guardrails.special}
              onChange={e => setGuardrails({ ...guardrails, special: e.target.value })}
              className="h-24"
              maxLength={2000}
            />
          </div>
          <div className="md:col-span-2 p-3 bg-purple-500/10 rounded-md border border-purple-500/20 text-sm flex gap-3">
            <Sparkles className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
            <p>Your AI Teacher keeps its answers short in live lessons and never gives away homework or quiz answers.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
