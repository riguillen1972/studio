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
import { Loader2, Plus, Users, BookOpen, KeyRound, Copy } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface TeacherDashboardProps {
    user: User | null;
}

interface ClassModel {
    id: string;
    name: string;
    subject: string | null;
    join_code: string;
    created_at: string;
}

interface ContextPackModel {
    id: string;
    title: string;
    subject: string | null;
    type: string;
    class_id: string;
    created_at: string;
}

export function TeacherDashboard({ user }: TeacherDashboardProps) {
    const supabase = createClient();
    const [classes, setClasses] = useState<ClassModel[]>([]);
    const [contextPacks, setContextPacks] = useState<ContextPackModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Classes form state
    const [newClassName, setNewClassName] = useState("");
    const [newClassSubject, setNewClassSubject] = useState("");
    const [isCreatingClass, setIsCreatingClass] = useState(false);

    // Context pack form state
    const [packTitle, setPackTitle] = useState("");
    const [packSubject, setPackSubject] = useState("");
    const [packType, setPackType] = useState("lesson");
    const [packClassId, setPackClassId] = useState("");
    const [packContent, setPackContent] = useState("");
    const [isCreatingPack, setIsCreatingPack] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const headers = { 'Authorization': `Bearer ${session.access_token}` };

            const [classesRes, packsRes] = await Promise.all([
                fetch('/api/classes', { headers }),
                fetch('/api/context-packs', { headers })
            ]);

            if (classesRes.ok) {
                const data = await classesRes.json();
                setClasses(data.data || []);
            }
            if (packsRes.ok) {
                const data = await packsRes.json();
                setContextPacks(data.data || []);
            }
        } catch (error) {
            console.error("Failed to load teacher data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [supabase, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
            }
        } catch (error) {
            console.error("Failed to create class:", error);
        } finally {
            setIsCreatingClass(false);
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
                    content_raw: packContent
                })
            });

            if (res.ok) {
                setPackTitle("");
                setPackSubject("");
                setPackContent("");
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
        <Tabs defaultValue="classes" className="w-full">
            <TabsList className="mb-4">
                <TabsTrigger value="classes">My Classes</TabsTrigger>
                <TabsTrigger value="packs">Context Packs</TabsTrigger>
            </TabsList>

            <TabsContent value="classes" className="space-y-4">
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
                                </CardContent>
                                <CardFooter className="text-xs text-muted-foreground">
                                    Created {new Date(cls.created_at).toLocaleDateString()}
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>
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
        </Tabs>
    );
}
