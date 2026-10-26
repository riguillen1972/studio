"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Users, BookOpen, KeyRound, Copy, CalendarClock, Trash2 } from "lucide-react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User } from "@supabase/supabase-js";

interface TeacherDashboardProps {
    user: User | null;
    tier: string;
}

interface ClassModel {
    id: string;
    name: string;
    subject: string | null;
    join_code: string;
    settings: { allow_research_mode?: boolean } | null;
    created_at: string;
}

interface ContextPackModel {
    id: string;
    title: string;
    subject: string | null;
    type: string;
    class_id: string;
    due_date: string | null;
    created_at: string;
}

import { AITeacherBuilder } from "./ai-teacher-builder";
import { dueDateToIso, todayIso } from "@/lib/dates";
import { useAppState } from "@/components/app-state-provider";
import { LiveSession } from "./live-session";
import { WorksheetGenerator } from "./worksheet-generator";
import { StudentsPanel } from "./students-panel";
import { TeacherNotifications } from "./teacher-notifications";

export function TeacherDashboard({ user, tier }: TeacherDashboardProps) {
    // The AI Teacher needs Teacher Max; student Max has the same tier but a cheaper price
    const { billingPlan } = useAppState();
    const avatarTier = tier === "max" && billingPlan === "max" ? "student-max" : tier;
    const supabase = createClient();
    const [classes, setClasses] = useState<ClassModel[]>([]);
    const [contextPacks, setContextPacks] = useState<ContextPackModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Classes form state
    const [newClassName, setNewClassName] = useState("");
    const [newClassSubject, setNewClassSubject] = useState("");
    const [isCreatingClass, setIsCreatingClass] = useState(false);
    const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

    // Context pack form state
    const [packTitle, setPackTitle] = useState("");
    const [packSubject, setPackSubject] = useState("");
    const [packType, setPackType] = useState("lesson");
    const [packClassId, setPackClassId] = useState("");
    const [packContent, setPackContent] = useState("");
    const [packDueDate, setPackDueDate] = useState(""); // YYYY-MM-DD from the date picker
    const [isCreatingPack, setIsCreatingPack] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user) return;
        // isLoading starts true, so only the first load shows the full-page spinner;
        // refreshes after creating things keep the current tab and its state
        setLoadError(null);
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setLoadError("Your session has expired. Please sign in again.");
                return;
            }

            const headers = { 'Authorization': `Bearer ${session.access_token}` };

            const [classesRes, packsRes] = await Promise.all([
                fetch('/api/classes', { headers }),
                fetch('/api/context-packs', { headers })
            ]);

            if (classesRes.ok) {
                const data = await classesRes.json();
                setClasses(data.data || []);
            } else {
                setLoadError("Couldn't load your classes.");
            }
            if (packsRes.ok) {
                const data = await packsRes.json();
                setContextPacks(data.data || []);
            }
        } catch (error) {
            console.error("Failed to load teacher data:", error);
            setLoadError("Couldn't load your classes.");
        } finally {
            setIsLoading(false);
        }
    }, [supabase, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteClass = async (classId: string) => {
        setDeletingClassId(classId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const res = await fetch(`/api/classes/${classId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setLoadError(data.error || "Couldn't delete the class.");
            } else {
                setClasses(prev => prev.filter(c => c.id !== classId));
                setContextPacks(prev => prev.filter(p => p.class_id !== classId));
            }
        } catch (error) {
            console.error("Failed to delete class:", error);
            setLoadError("Couldn't delete the class.");
        } finally {
            setDeletingClassId(null);
        }
    };

    const handleCreateClass = async () => {
        if (!newClassName) return;
        setIsCreatingClass(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch('/api/classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    name: newClassName,
                    subject: newClassSubject
                })
            });

            if (res.ok) {
                setNewClassName("");
                setNewClassSubject("");
                await fetchData();
            } else {
                const data = await res.json().catch(() => ({}));
                setLoadError(data.error || "Couldn't create the class.");
            }
        } catch (error) {
            console.error("Failed to create class:", error);
        } finally {
            setIsCreatingClass(false);
        }
    };

    const handleResearchModeChange = async (classId: string, allowed: boolean) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        // Optimistic update, rolled back if the request fails
        const setAllowed = (value: boolean) => setClasses(prev => prev.map(c =>
            c.id === classId ? { ...c, settings: { ...(c.settings ?? {}), allow_research_mode: value } } : c
        ));
        setAllowed(allowed);
        try {
            const res = await fetch(`/api/classes/${classId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ settings: { allow_research_mode: allowed } })
            });
            if (!res.ok) setAllowed(!allowed);
        } catch (error) {
            console.error("Failed to update class settings:", error);
            setAllowed(!allowed);
        }
    };

    const handleCreateContextPack = async () => {
        if (!packTitle || !packClassId || !packContent) return;
        setIsCreatingPack(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch('/api/context-packs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    title: packTitle,
                    subject: packSubject,
                    type: packType,
                    class_id: packClassId,
                    content_raw: packContent,
                    due_date: dueDateToIso(packDueDate)
                })
            });

            if (res.ok) {
                setPackTitle("");
                setPackSubject("");
                setPackContent("");
                setPackDueDate("");
                await fetchData();
            }
        } catch (error) {
            console.error("Failed to create context pack:", error);
        } finally {
            setIsCreatingPack(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <>
        <TeacherNotifications />
        <Tabs defaultValue="classes" className="w-full">
            <TabsList className="mb-4 h-auto flex-wrap">
                <TabsTrigger value="classes">My Classes</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="packs">Context Packs</TabsTrigger>
                <TabsTrigger value="worksheets" className="text-purple-600 dark:text-purple-400">Worksheets</TabsTrigger>
                <TabsTrigger value="avatar" className="text-purple-600 dark:text-purple-400">My AI Teacher</TabsTrigger>
                <TabsTrigger value="live" className="text-purple-600 dark:text-purple-400">Live Session</TabsTrigger>
            </TabsList>

            <TabsContent value="classes" className="space-y-4">
                {classes.length > 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Each teacher has one class code. To start a new class, delete this one first.
                    </p>
                ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Create New Class</CardTitle>
                        <CardDescription>Create a class to share assignments and materials with students.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="className">Class Name</Label>
                            <Input
                                id="className"
                                placeholder="e.g. AP US History"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="classSubject">Subject (Optional)</Label>
                            <Input
                                id="classSubject"
                                placeholder="e.g. History"
                                value={newClassSubject}
                                onChange={(e) => setNewClassSubject(e.target.value)}
                            />
                        </div>
                        <Button 
                            onClick={handleCreateClass} 
                            disabled={!newClassName || isCreatingClass}
                        >
                            {isCreatingClass && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Plus className="mr-2 h-4 w-4" />
                            Create Class
                        </Button>
                    </CardContent>
                </Card>
                )}

                {loadError && (
                    <div className="flex items-center justify-between gap-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                        <span>{loadError}</span>
                        <Button variant="outline" size="sm" onClick={fetchData}>Try again</Button>
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {classes.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-muted-foreground border rounded-lg border-dashed">
                            <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>You haven't created any classes yet.</p>
                        </div>
                    ) : (
                        classes.map((cls) => (
                            <Card key={cls.id}>
                                <CardHeader>
                                    <CardTitle>{cls.name}</CardTitle>
                                    {cls.subject && <CardDescription>{cls.subject}</CardDescription>}
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                                        <div className="flex items-center gap-2">
                                            <KeyRound className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-mono font-medium">{cls.join_code}</span>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => navigator.clipboard.writeText(cls.join_code)}
                                            title="Copy Code"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 pt-4">
                                        <div>
                                            <Label htmlFor={`research-${cls.id}`} className="text-sm">Allow Research Mode</Label>
                                            <p className="text-xs text-muted-foreground">When off, students only get guided hints.</p>
                                        </div>
                                        <Switch
                                            id={`research-${cls.id}`}
                                            checked={cls.settings?.allow_research_mode !== false}
                                            onCheckedChange={(checked) => handleResearchModeChange(cls.id, checked)}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Created {new Date(cls.created_at).toLocaleDateString()}</span>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={deletingClassId === cls.id}>
                                                {deletingClassId === cls.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1 h-3 w-3" />}
                                                Delete class
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete {cls.name}?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This deletes the class code {cls.join_code}, removes every student from the class, and permanently deletes its lesson materials, assignments, turned-in work and grades. It can&apos;t be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteClass(cls.id)}>
                                                    Delete class
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>
            </TabsContent>

            <TabsContent value="students" className="space-y-4">
                <StudentsPanel classes={classes} />
            </TabsContent>

            <TabsContent value="packs" className="space-y-4">
                {classes.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>You need to create a class before you can upload Context Packs.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>Upload Context Pack</CardTitle>
                                <CardDescription>Provide materials to ground the AI for your students.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="packTitle">Title</Label>
                                        <Input
                                            id="packTitle"
                                            placeholder="e.g. Chapter 4 Reading"
                                            value={packTitle}
                                            onChange={(e) => setPackTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="packClass">Class</Label>
                                        <Select value={packClassId} onValueChange={setPackClassId}>
                                            <SelectTrigger id="packClass">
                                                <SelectValue placeholder="Select a class" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classes.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="packType">Material Type</Label>
                                        <Select value={packType} onValueChange={setPackType}>
                                            <SelectTrigger id="packType">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="lesson">Lesson/Reading</SelectItem>
                                                <SelectItem value="homework">Homework Assignment</SelectItem>
                                                <SelectItem value="quiz">Quiz/Test</SelectItem>
                                                <SelectItem value="rubric">Grading Rubric</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="packSubject">Subject (Optional)</Label>
                                        <Input
                                            id="packSubject"
                                            placeholder="e.g. History"
                                            value={packSubject}
                                            onChange={(e) => setPackSubject(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="packContent">Raw Content / Text</Label>
                                    <Textarea
                                        id="packContent"
                                        placeholder="Paste the text of your lesson, assignment, or rubric here..."
                                        className="min-h-[150px]"
                                        value={packContent}
                                        onChange={(e) => setPackContent(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">The AI will parse this text into a structured Context Pack.</p>
                                </div>
                                {(packType === "homework" || packType === "quiz") && (
                                    <div className="grid gap-2 sm:max-w-xs">
                                        <Label htmlFor="packDueDate">Due date (optional)</Label>
                                        <Input
                                            id="packDueDate"
                                            type="date"
                                            min={todayIso()}
                                            value={packDueDate}
                                            onChange={(e) => setPackDueDate(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">Students see it in My Assignments, sorted by what&apos;s due first.</p>
                                    </div>
                                )}
                                <Button 
                                    onClick={handleCreateContextPack} 
                                    disabled={!packTitle || !packClassId || !packContent || isCreatingPack}
                                >
                                    {isCreatingPack && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Plus className="mr-2 h-4 w-4" />
                                    Generate Pack
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {contextPacks.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-muted-foreground border rounded-lg border-dashed">
                                    <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                    <p>No context packs uploaded yet.</p>
                                </div>
                            ) : (
                                contextPacks.map((pack) => {
                                    const assignedClass = classes.find(c => c.id === pack.class_id);
                                    return (
                                        <Card key={pack.id}>
                                            <CardHeader>
                                                <CardTitle className="text-base">{pack.title}</CardTitle>
                                                <CardDescription>{pack.type.charAt(0).toUpperCase() + pack.type.slice(1)}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="text-sm">
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Users className="h-4 w-4" />
                                                    <span>{assignedClass?.name || 'Unknown Class'}</span>
                                                </div>
                                                {pack.due_date && (
                                                    <div className="flex items-center gap-1 text-muted-foreground mt-1">
                                                        <CalendarClock className="h-4 w-4" />
                                                        <span>Due {new Date(pack.due_date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                            <CardFooter className="text-xs text-muted-foreground">
                                                Created {new Date(pack.created_at).toLocaleDateString()}
                                            </CardFooter>
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </TabsContent>

            <TabsContent value="worksheets" className="space-y-4">
                <WorksheetGenerator tier={avatarTier} classes={classes} onSaved={fetchData} />
            </TabsContent>

            <TabsContent value="avatar" className="space-y-4">
                <AITeacherBuilder tier={avatarTier} />
            </TabsContent>

            <TabsContent value="live" className="space-y-4">
                <LiveSession tier={avatarTier} classes={classes} contextPacks={contextPacks} />
            </TabsContent>
        </Tabs>
        </>
    );
}
