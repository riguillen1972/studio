"use client";

import React, { useState } from "react";
import { useAppState } from "./app-state-provider";
import { GraduationCap, User, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card } from "./ui/card";

export function RolePicker() {
  const { updateProfile } = useAppState();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [careerField, setCareerField] = useState<string>("");
  const [classCode, setClassCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) return;
    setIsLoading(true);
    await updateProfile({
      role: selectedRole,
      gradeLevel: selectedRole === "k12" ? gradeLevel : undefined,
      careerField: selectedRole === "college" ? careerField : undefined,
      classCode: classCode,
    });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-lg flex flex-col items-center space-y-8">
        <div className="flex items-center space-x-3 text-blue-500">
          <GraduationCap size={32} />
          <h1 className="text-2xl font-bold text-white">Study Buddy AI</h1>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Choose Your Role</h2>
          <p className="text-gray-400">Select how you'll be using Study Buddy AI</p>
        </div>

        <div className="w-full space-y-4">
          <RoleCard
            id="teacher"
            icon={<User size={32} />}
            title="Teacher"
            subtitle="Manage & Monitor"
            description="Set class codes, monitor student progress, and customize AI limits"
            isSelected={selectedRole === "teacher"}
            onClick={() => setSelectedRole("teacher")}
          />

          <RoleCard
            id="college"
            icon={<GraduationCap size={32} />}
            title="College Student"
            subtitle="Career-Focused"
            description="AI optimized for your career path and field of study"
            isSelected={selectedRole === "college"}
            onClick={() => setSelectedRole("college")}
          />

          {selectedRole === "college" && (
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label className="text-white">Career Field / Major</Label>
                <Input
                  placeholder="e.g. Computer Science"
                  value={careerField}
                  onChange={(e) => setCareerField(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Class Code (Optional)</Label>
                <Input
                  placeholder="e.g. A7X9WQ"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 uppercase"
                />
              </div>
            </div>
          )}

          <RoleCard
            id="k12"
            icon={<Users size={32} />}
            title="Elementary to High School"
            subtitle="Study Buddy AI"
            description="Your personal AI-powered study companion"
            isSelected={selectedRole === "k12"}
            onClick={() => setSelectedRole("k12")}
          />

          {selectedRole === "k12" && (
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label className="text-white">Grade Level</Label>
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(12)].map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        Grade {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Class Code (Optional)</Label>
                <Input
                  placeholder="e.g. A7X9WQ"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 uppercase"
                />
              </div>
            </div>
          )}
        </div>

        <Button
          className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white"
          disabled={!selectedRole || isLoading}
          onClick={handleContinue}
        >
          {isLoading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}

function RoleCard({
  id,
  icon,
  title,
  subtitle,
  description,
  isSelected,
  onClick,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      className={`cursor-pointer border-2 transition-colors ${
        isSelected ? "border-blue-500 bg-white/10" : "border-white/5 bg-[#111]"
      } hover:border-blue-500/50`}
      onClick={onClick}
    >
      <div className="p-6 flex flex-col items-center text-center space-y-4">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isSelected ? "text-blue-500 bg-blue-500/10" : "text-gray-400 bg-white/5"
          }`}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className={`text-sm ${isSelected ? "text-blue-400" : "text-gray-500"}`}>
            {subtitle}
          </p>
        </div>
        <p className="text-sm text-gray-400 max-w-[250px]">{description}</p>
      </div>
    </Card>
  );
}
