"use client";

import { useState } from "react";
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

interface AITeacherBuilderProps {
  tier: string;
}

export function AITeacherBuilder({ tier }: AITeacherBuilderProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
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

  if (tier !== "max") {
    return (
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <CardTitle className="text-2xl">AI Teacher Avatar</CardTitle>
          <CardDescription className="text-base max-w-lg mx-auto mt-2">
            Build a custom, conversational AI avatar that teaches your students in real-time. Complete with voice, personality, and data-driven teaching strategies.
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
            <Link href="/pricing">Upgrade to Max to Unlock</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(r => setTimeout(r, 1500));
    setIsSaving(false);
    toast({
      title: "Avatar Configuration Saved!",
      description: "Your AI Teacher is ready for live sessions.",
    });
  };

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
              <Label>Voice Selection (Flash Models)</Label>
              <div className="flex gap-2">
                <Select defaultValue="voice1">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="voice1">Rachel (Calm, Warm)</SelectItem>
                    <SelectItem value="voice2">Drew (Energetic, Coach)</SelectItem>
                    <SelectItem value="voice3">Sarah (Professional, Strict)</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" title="Preview Voice">
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Uses cost-optimized ElevenLabs Flash synthesis.</p>
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
            <div className="p-3 bg-purple-500/10 rounded-md border border-purple-500/20 text-sm flex gap-3 mt-4">
              <Sparkles className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <p>When you save, the system will pre-generate and cache audio for 200 common conversational phrases using your chosen voice, saving on live streaming costs during sessions.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
