"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, MessageSquareText, FileText, UserCircle2, Save } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface TeacherDashboardProps {
    user: User | null;
}

// Mock Data for UI demonstration
const MOCK_STUDENTS = [
    { id: "1", name: "Jimmy Smith", grade: "5th Grade", status: "Active" },
    { id: "2", name: "Sarah Johnson", grade: "5th Grade", status: "Active" },
    { id: "3", name: "Michael Chen", grade: "6th Grade", status: "Needs Review" },
];

const MOCK_CHAT_LOGS = [
    { id: 'c1', role: 'user', content: 'Can you help me understand how photosynthesis works?', timestamp: '10:00 AM' },
    { id: 'c2', role: 'assistant', content: 'Of course! Photosynthesis is how plants make their food using sunlight, water, and air...', timestamp: '10:01 AM' },
    { id: 'c3', role: 'user', content: 'So plants eat sunlight?', timestamp: '10:05 AM' },
    { id: 'c4', role: 'assistant', content: 'Good question! They don\'t eat it like we eat food. They use the energy from the sunlight to change water and carbon dioxide into sugar...', timestamp: '10:06 AM' },
];

export function TeacherDashboard({ user }: TeacherDashboardProps) {
    const [selectedStudentId, setSelectedStudentId] = useState<string>(MOCK_STUDENTS[0].id);
    const classCode = user?.user_metadata?.class_code || "CLASS-CODE-MISSING";

    const selectedStudent = MOCK_STUDENTS.find(s => s.id === selectedStudentId);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-12rem)] min-h-[600px]">
            {/* Student Roster Sidebar */}
            <Card className="md:col-span-1 flex flex-col overflow-hidden">
                <CardHeader className="bg-muted/50 pb-4">
                    <CardTitle className="text-lg flex justify-between items-center">
                        My Students
                        <Badge variant="secondary">{MOCK_STUDENTS.length}</Badge>
                    </CardTitle>
                    <CardDescription>Class Code: <span className="font-mono font-bold text-primary">{classCode}</span></CardDescription>
                </CardHeader>
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-2">
                        {MOCK_STUDENTS.map((student) => (
                            <Button
                                key={student.id}
                                variant={selectedStudentId === student.id ? "secondary" : "ghost"}
                                className="w-full justify-start h-16 group"
                                onClick={() => setSelectedStudentId(student.id)}
                            >
                                <UserCircle2 className="mr-3 h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                <div className="flex flex-col items-start truncate text-left">
                                    <span className="font-medium">{student.name}</span>
                                    <span className="text-xs text-muted-foreground">{student.grade}</span>
                                </div>
                            </Button>
                        ))}
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
                                    <CardTitle className="text-2xl">{selectedStudent.name}</CardTitle>
                                    <CardDescription>Managing AI interactions for this student.</CardDescription>
                                </div>
                                <Badge variant={selectedStudent.status === 'Active' ? 'default' : 'destructive'}>
                                    {selectedStudent.status}
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

                                {/* AI Instructions Tab */}
                                <TabsContent value="instructions" className="flex-1 px-6 pb-6 mt-0">
                                    <div className="flex flex-col h-full space-y-4">
                                        <div>
                                            <h3 className="text-lg font-medium">AI Teaching Optimization</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Provide instructions to Study Buddy AI on how it should tutor {selectedStudent.name}. The AI will use these instructions as its core directive.
                                            </p>
                                        </div>
                                        <Textarea
                                            placeholder="e.g. Jimmy struggles with fractions. Please explain all math problems step-by-step using visual analogies like pizza slices. Do not give him the direct answer, guide him to it."
                                            className="flex-1 resize-none h-full min-h-[300px]"
                                            defaultValue="Jimmy is currently learning about plants in science class. If he asks questions, try to relate concepts back to biology when possible."
                                        />
                                        <div className="flex justify-end pt-4">
                                            <Button><Save className="w-4 h-4 mr-2" /> Save AI Instructions</Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Chat Logs Tab */}
                                <TabsContent value="chatlogs" className="flex-1 px-0 pb-0 mt-0 flex flex-col h-full overflow-hidden">
                                    <div className="px-6 mb-4">
                                        <h3 className="text-lg font-medium">Recent AI Conversations</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Review what {selectedStudent.name} is asking the AI to monitor their progress and struggles.
                                        </p>
                                    </div>
                                    <ScrollArea className="flex-1 px-6 pb-6">
                                        <div className="space-y-4">
                                            {MOCK_CHAT_LOGS.map((msg) => (
                                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                            : 'bg-muted rounded-tl-sm'
                                                        }`}>
                                                        <p className="text-sm">{msg.content}</p>
                                                        <p className={`text-xs mt-2 opacity-70 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                                            {msg.role === 'user' ? selectedStudent.name : 'Study Buddy AI'} • {msg.timestamp}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>

                                {/* Limits Tab */}
                                <TabsContent value="limits" className="flex-1 px-6 pb-6 mt-0">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-medium">Usage Limits & Content Restrictions</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Set boundaries for {selectedStudent.name}'s AI usage.
                                            </p>
                                        </div>

                                        <Separator />

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base">Allow Non-Academic Topics</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        If disabled, the AI will refuse to answer questions not related to school subjects.
                                                    </p>
                                                </div>
                                                <Switch id="academic-only" defaultChecked={false} />
                                            </div>

                                            <Separator />

                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base">Break Enforcer</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        AI will encourage taking a break after 60 minutes of continuous studying.
                                                    </p>
                                                </div>
                                                <Switch id="break-enforcer" defaultChecked={true} />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

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
