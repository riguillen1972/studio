"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, MessageSquareText, FileText, UserCircle2, Save, Loader2 } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface TeacherDashboardProps {
    user: User | null;
}

interface Student {
    id: string;
    display_name: string | null;
    grade_level: string | null;
}

export function TeacherDashboard({ user }: TeacherDashboardProps) {
    const supabase = createClient();
    const classCode = user?.user_metadata?.class_code || "CLASS-CODE-MISSING";

    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [isLoadingRoster, setIsLoadingRoster] = useState(true);
    const [debugInfo, setDebugInfo] = useState<string>("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [instructions, setInstructions] = useState<string>("");
    const [limits, setLimits] = useState({ allowNonAcademic: false, enableBreakEnforcer: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [chatLogs, setChatLogs] = useState<any[]>([]);
    const [isStudentDataLoading, setIsStudentDataLoading] = useState(false);
    const [isSavingInstructions, setIsSavingInstructions] = useState(false);

    const loadStudentData = useCallback(async (studentId: string) => {
        setIsStudentDataLoading(true);

        const [instRes, limitRes, chatRes] = await Promise.all([
            // Fetch instructions
            supabase
                .from('student_instructions')
                .select('instructions')
                .eq('teacher_id', user?.id || '')
                .eq('student_id', studentId)
                .maybeSingle(),
            // Fetch limits
            supabase
                .from('student_limits')
                .select('allow_non_academic, enable_break_enforcer')
                .eq('teacher_id', user?.id || '')
                .eq('student_id', studentId)
                .maybeSingle(),
            // Fetch chat history
            supabase
                .from('chat_history')
                .select('*')
                .eq('user_id', studentId)
                .order('updated_at', { ascending: false })
                .limit(5)
        ]);

        setInstructions(instRes.data?.instructions || "");

        setLimits({
            allowNonAcademic: limitRes.data?.allow_non_academic ?? false,
            enableBreakEnforcer: limitRes.data?.enable_break_enforcer ?? true
        });

        // Flatten chat messages
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allMessages: any[] = [];
        if (chatRes.data) {
            chatRes.data.forEach(chat => {
                if (chat.messages && Array.isArray(chat.messages)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    chat.messages.forEach((msg: any, i: number) => {
                        allMessages.push({
                            id: `${chat.id}-${i}`,
                            role: msg.role,
                            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
                            timestamp: new Date(chat.updated_at).toLocaleString()
                        });
                    });
                }
            });
        }
        setChatLogs(allMessages.reverse());

        setIsStudentDataLoading(false);
    }, [supabase, user?.id]);

    const saveInstructions = async () => {
        if (!selectedStudentId || !user?.id) return;
        setIsSavingInstructions(true);
        await supabase
            .from('student_instructions')
            .upsert({
                teacher_id: user.id,
                student_id: selectedStudentId,
                instructions,
                updated_at: new Date().toISOString()
            }, { onConflict: 'teacher_id,student_id' });
        setIsSavingInstructions(false);
    };

    const saveLimits = async (key: 'allowNonAcademic' | 'enableBreakEnforcer', val: boolean) => {
        if (!selectedStudentId || !user?.id) return;
        const newLimits = { ...limits, [key]: val };
        setLimits(newLimits);

        await supabase
            .from('student_limits')
            .upsert({
                teacher_id: user.id,
                student_id: selectedStudentId,
                allow_non_academic: newLimits.allowNonAcademic,
                enable_break_enforcer: newLimits.enableBreakEnforcer,
                updated_at: new Date().toISOString()
            }, { onConflict: 'teacher_id,student_id' });
    };

    const loadStudents = useCallback(async () => {
        if (!classCode || classCode === "CLASS-CODE-MISSING") {
            setIsLoadingRoster(false);
            return;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('id, display_name, grade_level')
            .eq('class_code', classCode)
            .neq('id', user?.id || ''); // Exclude the teacher themselves just in case

        setDebugInfo(`Query for: ${classCode}`);
        if (error) {
            setErrorMsg(error.message || JSON.stringify(error));
        }

        if (data) {
            setDebugInfo(`Query for: ${classCode} | Found: ${data.length}`);
            setStudents(data);
            if (data.length > 0 && !selectedStudentId) {
                setSelectedStudentId(data[0].id);
            }
        }
        setIsLoadingRoster(false);
    }, [supabase, classCode, user?.id, selectedStudentId]);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    useEffect(() => {
        if (selectedStudentId) {
            loadStudentData(selectedStudentId);
        }
    }, [selectedStudentId, loadStudentData]);

    const selectedStudent = students.find(s => s.id === selectedStudentId);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-12rem)] min-h-[600px]">
            {/* Student Roster Sidebar */}
            <Card className="md:col-span-1 flex flex-col overflow-hidden">
                <CardHeader className="bg-muted/50 pb-4">
                    <CardTitle className="text-lg flex justify-between items-center">
                        My Students
                        <Badge variant="secondary">{students.length}</Badge>
                    </CardTitle>
                    <CardDescription>Class Code: <span className="font-mono font-bold text-primary">{classCode}</span></CardDescription>
                </CardHeader>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-2">
                        {isLoadingRoster ? (
                            <p className="text-sm text-center text-muted-foreground p-4">Loading students...</p>
                        ) : students.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                                <p className="text-sm">No students have joined your class yet.</p>
                                <p className="text-xs mt-2">Have them sign up using your class code:<br /><span className="font-bold text-foreground">{classCode}</span></p>
                                <div className="mt-4 p-2 bg-muted rounded text-[10px] font-mono text-left max-w-full">
                                    <p>Debug: {debugInfo}</p>
                                    {errorMsg && <p className="text-red-500 mt-1">Error: {errorMsg}</p>}
                                </div>
                            </div>
                        ) : (
                            students.map((student) => (
                                <Button
                                    key={student.id}
                                    variant={selectedStudentId === student.id ? "secondary" : "ghost"}
                                    className="w-full justify-start h-16 group"
                                    onClick={() => setSelectedStudentId(student.id)}
                                >
                                    <UserCircle2 className="mr-3 h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <div className="flex flex-col items-start truncate text-left">
                                        <span className="font-medium">{student.display_name || 'Unnamed Student'}</span>
                                        <span className="text-xs text-muted-foreground">{student.grade_level || 'Grade not specified'}</span>
                                    </div>
                                </Button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </Card>

            {/* Main Content Area */}
            <Card className="md:col-span-3 flex flex-col overflow-hidden">
                {selectedStudent ? (
                    <>
                        <CardHeader className="border-b bg-card pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl">{selectedStudent.display_name || 'Unnamed Student'}</CardTitle>
                                    <CardDescription>Managing AI interactions for this student.</CardDescription>
                                </div>
                                <Badge variant="default">
                                    Active
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                            <Tabs defaultValue="instructions" className="flex-1 flex flex-col h-full">
                                <div className="px-6 pt-4">
                                    <TabsList className="grid w-full grid-cols-3 mb-4">
                                        <TabsTrigger value="instructions"><FileText className="w-4 h-4 mr-2" /> Custom Instructions</TabsTrigger>
                                        <TabsTrigger value="chatlogs"><MessageSquareText className="w-4 h-4 mr-2" /> Chat Logs</TabsTrigger>
                                        <TabsTrigger value="limits"><SlidersHorizontal className="w-4 h-4 mr-2" /> Limits & Restrictions</TabsTrigger>
                                    </TabsList>
                                </div>

                                {isStudentDataLoading ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground opacity-50" />
                                    </div>
                                ) : (
                                    <>
                                        {/* AI Instructions Tab */}
                                        <TabsContent value="instructions" className="flex-1 px-6 pb-6 mt-0">
                                            <div className="flex flex-col h-full space-y-4">
                                                <div>
                                                    <h3 className="text-lg font-medium">AI Teaching Optimization</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Provide instructions to Study Buddy AI on how it should tutor {selectedStudent.display_name || 'this student'}. The AI will use these instructions as its core directive.
                                                    </p>
                                                </div>
                                                <Textarea
                                                    placeholder="e.g. Jimmy struggles with fractions. Please explain all math problems step-by-step using visual analogies like pizza slices. Do not give him the direct answer, guide him to it."
                                                    className="flex-1 resize-none h-full min-h-[300px]"
                                                    value={instructions}
                                                    onChange={(e) => setInstructions(e.target.value)}
                                                />
                                                <div className="flex justify-end pt-4">
                                                    <Button onClick={saveInstructions} disabled={isSavingInstructions}>
                                                        {isSavingInstructions ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                                        Save AI Instructions
                                                    </Button>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* Chat Logs Tab */}
                                        <TabsContent value="chatlogs" className="flex-1 px-0 pb-0 mt-0 flex flex-col h-full overflow-hidden">
                                            <div className="px-6 mb-4">
                                                <h3 className="text-lg font-medium">Recent AI Conversations</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Review what {selectedStudent.display_name || 'this student'} is asking the AI to monitor their progress and struggles.
                                                </p>
                                            </div>
                                            <ScrollArea className="flex-1 px-6 pb-6">
                                                <div className="space-y-4">
                                                    {chatLogs.length === 0 ? (
                                                        <p className="text-sm text-center text-muted-foreground p-4">No recent chat logs found.</p>
                                                    ) : (
                                                        chatLogs.map((msg) => (
                                                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                                    : 'bg-muted rounded-tl-sm'
                                                                    }`}>
                                                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                                    <p className={`text-xs mt-2 opacity-70 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                                                        {msg.role === 'user' ? selectedStudent.display_name || 'Student' : 'Study Buddy AI'} • {msg.timestamp}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </TabsContent>

                                        {/* Limits Tab */}
                                        <TabsContent value="limits" className="flex-1 px-6 pb-6 mt-0">
                                            <div className="space-y-6">
                                                <div>
                                                    <h3 className="text-lg font-medium">Usage Limits & Content Restrictions</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Set boundaries for {selectedStudent.display_name || 'this student'}&apos;s AI usage.
                                                    </p>
                                                </div>

                                                <Separator />

                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-0.5">
                                                            <Label className="text-base" htmlFor="academic-only">Allow Non-Academic Topics</Label>
                                                            <p className="text-sm text-muted-foreground">
                                                                If disabled, the AI will refuse to answer questions not related to school subjects.
                                                            </p>
                                                        </div>
                                                        <Switch
                                                            id="academic-only"
                                                            checked={limits.allowNonAcademic}
                                                            onCheckedChange={(c) => saveLimits('allowNonAcademic', c)}
                                                        />
                                                    </div>

                                                    <Separator />

                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-0.5">
                                                            <Label className="text-base" htmlFor="break-enforcer">Break Enforcer</Label>
                                                            <p className="text-sm text-muted-foreground">
                                                                AI will encourage taking a break after 60 minutes of continuous studying.
                                                            </p>
                                                        </div>
                                                        <Switch
                                                            id="break-enforcer"
                                                            checked={limits.enableBreakEnforcer}
                                                            onCheckedChange={(c) => saveLimits('enableBreakEnforcer', c)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </>
                                )}

                            </Tabs>
                        </CardContent>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <UserCircle2 className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
                        <h3 className="text-xl font-medium text-muted-foreground">Select a student</h3>
                        <p className="text-sm text-muted-foreground mt-2">Choose a student from the roster to manage their AI settings.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
