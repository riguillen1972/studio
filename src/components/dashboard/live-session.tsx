"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Markdown } from "@/components/markdown";
import { useToast } from "@/hooks/use-toast";
import { Bot, Loader2, Lock, Mic, MicOff, Play, Send, Square, Users, Volume2, VolumeX } from "lucide-react";
import { useAvatarVoice } from "@/hooks/use-avatar-voice";
import { useSpeechInput } from "@/hooks/use-speech-input";

interface ClassOption { id: string; name: string }
interface PackOption { id: string; title: string; class_id: string }

interface Usage { used: number; included: number; extra: number; remaining: number }
interface RecentSession {
  id: string;
  status: string;
  started_at: string;
  classes: { name: string } | { name: string }[] | null;
}
interface ActiveSession { id: string; avatar_name: string | null; class_name: string | null }
interface DisplayMessage { role: "avatar" | "class"; text: string }

const NO_PACK = "none";
// Sessions left open longer than this are treated as finished
const RESUME_WINDOW_MS = 3 * 60 * 60 * 1000;

const className = (s: RecentSession) => (Array.isArray(s.classes) ? s.classes[0]?.name : s.classes?.name) ?? "Class";

interface LiveSessionProps {
  tier: string;
  classes: ClassOption[];
  contextPacks: PackOption[];
}

export function LiveSession({ tier, classes, contextPacks }: LiveSessionProps) {
  const { toast } = useToast();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [recent, setRecent] = useState<RecentSession[]>([]);
  const [classId, setClassId] = useState("");
  const [packId, setPackId] = useState(NO_PACK);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Set when a new avatar reply arrives, so it's spoken once (not when resuming a session)
  const speakNextRef = useRef(false);
  const voice = useAvatarVoice(session?.id ?? null);
  const mic = useSpeechInput(setInput);

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const { data: { session: auth } } = await createClient().auth.getSession();
    if (!auth) throw new Error("Your session has expired. Please sign in again.");
    const res = await fetch(path, {
      ...init,
      headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), Authorization: `Bearer ${auth.access_token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || "Something went wrong."), { data });
    return data;
  }, []);

  const loadOverview = useCallback(async () => {
    try {
      const data = await api("/api/sessions");
      setUsage(data.usage);
      setRecent(data.sessions);
    } catch (e) {
      console.error("Failed to load sessions:", e);
    }
  }, [api]);

  useEffect(() => {
    if (tier === "max") loadOverview();
  }, [tier, loadOverview]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isSending]);

  // Speak each new avatar reply aloud
  const { enabled: voiceOn, speak } = voice;
  useEffect(() => {
    if (!speakNextRef.current) return;
    speakNextRef.current = false;
    const last = messages[messages.length - 1];
    if (!voiceOn || last?.role !== "avatar") return;
    const turn = messages.filter((m) => m.role === "avatar").length - 1;
    speak(turn, last.text);
  }, [messages, voiceOn, speak]);

  useEffect(() => {
    if (mic.error) toast({ title: "Microphone", description: mic.error, variant: "destructive" });
  }, [mic.error, toast]);

  const showError = (e: unknown) =>
    toast({ title: "AI Teacher", description: e instanceof Error ? e.message : "Something went wrong.", variant: "destructive" });

  const startSession = async () => {
    setIsStarting(true);
    try {
      const data = await api("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ class_id: classId, context_pack_id: packId === NO_PACK ? null : packId }),
      });
      speakNextRef.current = true;
      setSession(data.session);
      setMessages(data.messages);
      setUsage(data.usage);
    } catch (e) {
      const usageFromError = (e as { data?: { usage?: Usage } }).data?.usage;
      if (usageFromError) setUsage(usageFromError);
      showError(e);
    } finally {
      setIsStarting(false);
    }
  };

  const resumeSession = async (id: string) => {
    try {
      const data = await api(`/api/sessions/${id}`);
      setSession({ id: data.session.id, avatar_name: data.session.avatar_name, class_name: data.session.class_name });
      setMessages(data.messages);
    } catch (e) {
      showError(e);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!session || !text) return;
    mic.stop();
    voice.stop();
    setIsSending(true);
    setMessages((prev) => [...prev, { role: "class", text }]);
    setInput("");
    try {
      const data = await api(`/api/sessions/${session.id}/messages`, { method: "POST", body: JSON.stringify({ text }) });
      speakNextRef.current = true;
      setMessages((prev) => [...prev, { role: "avatar", text: data.reply }]);
    } catch (e) {
      // Nothing was saved on the server, so put the message back to edit and resend
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
      showError(e);
    } finally {
      setIsSending(false);
    }
  };

  const endSession = async () => {
    if (!session) return;
    mic.stop();
    voice.stop();
    try {
      await api(`/api/sessions/${session.id}/end`, { method: "POST" });
    } catch (e) {
      showError(e);
    }
    setSession(null);
    setMessages([]);
    loadOverview();
  };

  const buyExtraSession = async () => {
    setIsBuying(true);
    try {
      const res = await fetch("/api/stripe/overage", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error(data.error || "Could not start checkout.");
    } catch (e) {
      showError(e);
    } finally {
      setIsBuying(false);
    }
  };

  if (tier !== "max") {
    return (
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <CardTitle className="text-2xl">Live AI Teacher Sessions</CardTitle>
          <CardDescription className="text-base max-w-lg mx-auto mt-2">
            Let your AI Teacher lead a live lesson on your classroom screen, grounded in your own lesson material. Included in Teacher Max.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center pb-8">
          <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-white rounded-full">
            <Link href="/profile#plans">{tier === "student-max" ? "Switch to Teacher Max to Unlock" : "Upgrade to Max to Unlock"}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // ---------- Active session ----------
  if (session) {
    const avatarName = session.avatar_name || "AI Teacher";
    return (
      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-purple-500/50">
              <AvatarFallback className="bg-purple-600 text-white"><Bot className="h-5 w-5" /></AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{avatarName}</CardTitle>
              <CardDescription className="flex items-center gap-1"><Users className="h-3 w-3" /> {session.class_name}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={voice.toggle}
              title={voice.enabled ? "Turn the AI Teacher's voice off" : "Turn the AI Teacher's voice on"}
            >
              {voice.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">{voice.enabled ? "Voice on" : "Voice off"}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={endSession} disabled={isSending}>
              <Square className="mr-2 h-3 w-3" /> End session
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 420px)", minHeight: 240 }}>
          {(() => {
            let avatarTurn = -1;
            return messages.map((m, i) => {
              if (m.role === "class") {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="rounded-lg p-3 max-w-[85%] bg-primary text-primary-foreground text-sm">
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    </div>
                  </div>
                );
              }
              const turn = ++avatarTurn;
              const isSpeaking = voice.speakingTurn === turn;
              return (
                <div key={i} className="flex items-start gap-2">
                  <div className="rounded-lg p-3 max-w-[85%] bg-purple-500/10 text-base">
                    <Markdown>{m.text}</Markdown>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`shrink-0 h-8 w-8 ${voice.blockedTurn === turn ? "animate-pulse text-purple-600" : ""}`}
                    title={isSpeaking ? "Stop" : "Play this reply"}
                    onClick={() => (isSpeaking ? voice.stop() : voice.speak(turn, m.text))}
                  >
                    {voice.loadingTurn === turn ? <Loader2 className="h-4 w-4 animate-spin" />
                      : isSpeaking ? <Square className="h-3 w-3" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
              );
            });
          })()}
          {isSending && (
            <div className="flex">
              <div className="rounded-lg p-3 bg-purple-500/10"><Loader2 className="h-5 w-5 animate-spin" /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>
        <CardFooter className="border-t pt-4">
          <form className="flex w-full items-end gap-2" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
            <Textarea
              rows={2}
              placeholder={mic.listening ? "Listening… speak now" : "Type or speak what the class says, e.g. “Maya says plants eat dirt”"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              maxLength={2000}
              disabled={isSending}
            />
            {mic.supported && (
              <Button
                type="button"
                variant={mic.listening ? "destructive" : "outline"}
                onClick={() => {
                  if (mic.listening) {
                    mic.stop();
                  } else {
                    voice.stop();
                    mic.start(input);
                  }
                }}
                disabled={isSending}
                title={mic.listening ? "Stop listening" : "Speak what the class says"}
              >
                {mic.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            <Button type="submit" disabled={isSending || !input.trim()}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardFooter>
      </Card>
    );
  }

  // ---------- Setup ----------
  const packsForClass = contextPacks.filter((p) => p.class_id === classId);
  const resumable = recent.filter((s) => s.status === "active" && Date.now() - new Date(s.started_at).getTime() < RESUME_WINDOW_MS);
  const outOfSessions = usage !== null && usage.remaining <= 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Start a Live Lesson</CardTitle>
              <CardDescription>Your AI Teacher leads the lesson on your screen. You type what students say.</CardDescription>
            </div>
            {usage && (
              <Badge variant="secondary" className="shrink-0">
                {usage.used} of {usage.included + usage.extra} sessions used
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="liveClass">Class</Label>
            <Select value={classId} onValueChange={(v) => { setClassId(v); setPackId(NO_PACK); }}>
              <SelectTrigger id="liveClass"><SelectValue placeholder={classes.length ? "Select a class" : "Create a class first"} /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="livePack">Lesson material</Label>
            <Select value={packId} onValueChange={setPackId} disabled={!classId}>
              <SelectTrigger id="livePack"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PACK}>No material (ask the class)</SelectItem>
                {packsForClass.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center gap-3">
          <Button onClick={startSession} disabled={!classId || isStarting || outOfSessions} className="bg-purple-600 hover:bg-purple-700 text-white">
            {isStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Start session
          </Button>
          {outOfSessions && (
            <>
              <p className="text-sm text-muted-foreground">You&apos;ve used all your sessions this month.</p>
              <Button variant="outline" onClick={buyExtraSession} disabled={isBuying}>
                {isBuying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buy an extra session
              </Button>
            </>
          )}
          {!outOfSessions && <p className="text-xs text-muted-foreground">Starting uses one of this month&apos;s sessions.</p>}
        </CardFooter>
      </Card>

      {resumable.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sessions in progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resumable.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="text-sm">
                  <p className="font-medium">{className(s)}</p>
                  <p className="text-muted-foreground text-xs">Started {new Date(s.started_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => resumeSession(s.id)}>Resume</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
