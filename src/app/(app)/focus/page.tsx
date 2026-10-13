"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw, Volume2, Headphones, Lock, Brain, BookOpen, Shield, Zap, Coffee, Leaf } from "lucide-react";
import { FOCUS_TRACKS, FocusTrack } from "@/lib/focusTracks";
import { useFocus, formatFocusTime } from "@/components/focus-provider";
import { useAppState } from "@/components/app-state-provider";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function FocusModePage() {
  const { tier } = useAppState();
  const {
    mode, timeLeft, isActive, currentTrack, volume, error,
    toggleTimer, resetTimer, setMode, selectTrack, setVolume,
  } = useFocus();
  const isBreak = mode === "break";

  const getTrackIcon = (id: string) => {
    switch (id) {
      case 'deep-focus': return <Brain className="w-5 h-5" />;
      case 'memory-mode': return <BookOpen className="w-5 h-5" />;
      case 'noise-shield': return <Shield className="w-5 h-5" />;
      case 'adhd-mode': return <Zap className="w-5 h-5" />;
      case 'chill-study': return <Coffee className="w-5 h-5" />;
      case 'calm-study': return <Leaf className="w-5 h-5" />;
      default: return <Headphones className="w-5 h-5" />;
    }
  };

  const handleTrackSelect = (track: FocusTrack) => {
    if (tier === 'free') return;
    selectTrack(track);
  };

  return (
    <div className="flex flex-col gap-8 h-full items-center justify-center py-10 px-4">
      <div className="text-center space-y-2 mb-2">
        <h1 className="text-3xl font-bold font-headline flex items-center justify-center gap-2">
          <Headphones className="w-8 h-8 text-primary" />
          Focus Mode
        </h1>
        <p className="text-muted-foreground">Stay on task with Pomodoro timing and ambient study sounds. Keep using the app while it plays.</p>
      </div>

      <Card className="w-full max-w-lg bg-card/50 backdrop-blur-sm border-primary/20 shadow-xl overflow-hidden">
        <CardHeader className="text-center pb-2 bg-muted/30">
          <div className="flex justify-center gap-4">
            <Button 
              variant={!isBreak ? "default" : "outline"} 
              size="sm"
              onClick={() => setMode("focus")}
            >
              Focus (25m)
            </Button>
            <Button 
              variant={isBreak ? "default" : "outline"} 
              size="sm"
              onClick={() => setMode("break")}
            >
              Break (5m)
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center space-y-8 pt-8 pb-10">
          <div className="text-[6rem] font-mono font-bold tracking-tighter text-foreground tabular-nums leading-none">
            {formatFocusTime(timeLeft)}
          </div>
          
          <div className="flex gap-4">
            <Button 
              size="lg" 
              className="w-32 h-14 text-lg rounded-full shadow-lg shadow-primary/20" 
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

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <div className="w-full space-y-4 pt-6 border-t mt-6">
            <div className="flex flex-col items-center gap-2 mb-4">
              <span className="text-sm font-medium text-muted-foreground">Select Audio Track</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs text-primary/80 bg-primary/10 px-3 py-1 rounded-full cursor-help">
                      About these focus tracks
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-center">These tracks use 16 Hz amplitude modulation. Some listeners find this kind of audio helps them focus, but results vary from person to person.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* Horizontal Track Selector */}
            <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
              <div className="flex gap-3 px-2 min-w-max">
                {FOCUS_TRACKS.map(track => {
                  const isSelected = currentTrack?.id === track.id;
                  const isLocked = tier === 'free';
                  
                  return (
                    <div key={track.id} className="relative group">
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        className={`h-24 w-28 flex flex-col items-center justify-center gap-2 relative overflow-hidden transition-all duration-300 ${isSelected ? 'shadow-md shadow-primary/30 border-primary' : 'hover:border-primary/50'}`}
                        onClick={() => handleTrackSelect(track)}
                      >
                        {getTrackIcon(track.id)}
                        <span className="text-xs font-medium text-center whitespace-normal leading-tight">
                          {track.label}
                        </span>
                        
                        {isLocked && (
                          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                            <Lock className="w-6 h-6 text-foreground/80 drop-shadow-md" />
                          </div>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {tier === 'free' && (
              <div className="bg-primary/10 rounded-xl p-4 text-center mt-2 flex flex-col items-center gap-3 border border-primary/20">
                <div className="bg-primary/20 p-2 rounded-full">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-primary">Focus Audio is a Pro feature</p>
                  <p className="text-xs text-muted-foreground">Upgrade to unlock focus study sounds.</p>
                </div>
                <Button asChild variant="default" size="sm" className="mt-1 w-full max-w-[200px] shadow-sm">
                  <Link href="/profile">Upgrade to Pro</Link>
                </Button>
              </div>
            )}

            {currentTrack && !isBreak && (
              <div className="space-y-3 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                    <Volume2 className="w-4 h-4 text-primary" /> Volume
                  </label>
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
                <Slider 
                  value={[volume * 100]} 
                  onValueChange={(vals) => setVolume(vals[0] / 100)} 
                  max={100} 
                  step={1}
                  className="py-2"
                />
              </div>
            )}
            
            {!currentTrack && tier !== 'free' && (
              <p className="text-sm text-center text-muted-foreground italic pt-2">
                Select a track above to play during focus sessions.
              </p>
            )}
            
            {isBreak && (
              <p className="text-sm text-center text-muted-foreground italic pt-2">
                Audio is paused during break time.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
