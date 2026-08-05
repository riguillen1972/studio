"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, RotateCcw, Volume2, Headphones } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-provider";
import { createClient } from "@/lib/supabase/client";

const SOUNDS = [
  { id: "none", name: "No Sound", file: "" },
  { id: "lofi", name: "Lo-Fi Beats", file: "/audio/lofi_study.m4a" },
  { id: "rain", name: "Rain Nature", file: "/audio/rain_nature.m4a" },
  { id: "cafe", name: "Coffee Shop", file: "/audio/cafe_ambient.m4a" }
];

export default function FocusModePage() {
  const { user } = useAuth();
  const supabase = createClient();
  
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  
  const [selectedSound, setSelectedSound] = useState(SOUNDS[0]);
  const [volume, setVolume] = useState([50]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer finished!
      setIsActive(false);
      
      // Log session to supabase if it was a focus session
      if (!isBreak && user) {
        supabase.from('focus_sessions').insert({
          user_id: user.id,
          sound_id: selectedSound.id,
          duration_minutes: 25,
          completed: true
        }).then(() => console.log("Session saved."));
      }

      // Switch mode
      if (isBreak) {
        setIsBreak(false);
        setTimeLeft(25 * 60);
      } else {
        setIsBreak(true);
        setTimeLeft(5 * 60);
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, isBreak, user, selectedSound, supabase]);

  // Audio handling
  useEffect(() => {
    if (selectedSound.id === "none") {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(selectedSound.file);
      audioRef.current.loop = true;
    } else {
      audioRef.current.src = selectedSound.file;
    }

    if (isActive) {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    } else {
      audioRef.current.pause();
    }
  }, [selectedSound, isActive]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-8 h-full items-center justify-center py-10">
      <div className="text-center space-y-2 mb-4">
        <h1 className="text-3xl font-bold font-headline flex items-center justify-center gap-2">
          <Headphones className="w-8 h-8 text-primary" />
          Focus Mode
        </h1>
        <p className="text-muted-foreground">Boost your productivity with Pomodoro timing and ambient sounds.</p>
      </div>

      <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-primary/20 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center gap-4 mb-4">
            <Button 
              variant={!isBreak ? "default" : "outline"} 
              size="sm"
              onClick={() => {
                setIsBreak(false);
                setIsActive(false);
                setTimeLeft(25 * 60);
              }}
            >
              Focus (25m)
            </Button>
            <Button 
              variant={isBreak ? "default" : "outline"} 
              size="sm"
              onClick={() => {
                setIsBreak(true);
                setIsActive(false);
                setTimeLeft(5 * 60);
              }}
            >
              Break (5m)
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-8 pb-10">
          <div className="text-[6rem] font-mono font-bold tracking-tighter text-foreground tabular-nums">
            {formatTime(timeLeft)}
          </div>
          
          <div className="flex gap-4">
            <Button 
              size="lg" 
              className="w-32 h-14 text-lg rounded-full" 
              onClick={toggleTimer}
            >
              {isActive ? <><Pause className="mr-2" /> Pause</> : <><Play className="mr-2" /> Start</>}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-14 h-14 rounded-full p-0" 
              onClick={resetTimer}
            >
              <RotateCcw className="w-6 h-6" />
            </Button>
          </div>

          <div className="w-full space-y-6 pt-6 border-t mt-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">Ambient Sound</label>
              <Select 
                value={selectedSound.id} 
                onValueChange={(val) => setSelectedSound(SOUNDS.find(s => s.id === val) || SOUNDS[0])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sound" />
                </SelectTrigger>
                <SelectContent>
                  {SOUNDS.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSound.id !== "none" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Volume2 className="w-4 h-4" /> Volume
                  </label>
                  <span className="text-xs text-muted-foreground">{volume}%</span>
                </div>
                <Slider 
                  value={volume} 
                  onValueChange={setVolume} 
                  max={100} 
                  step={1} 
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
