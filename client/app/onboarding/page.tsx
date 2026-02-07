"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress"; // Optional: Shadcn progress
import { motion, AnimatePresence } from "framer-motion"; // Optional: for smooth transitions

const QUESTIONS = [
  {
    id: "interests",
    question: "First, what are some things you truly enjoy? (e.g., Reading, Gaming, Solo hikes)",
    placeholder: "I love...",
    type: "text",
  },
  {
    id: "energy",
    question: "How do you usually recharge your social battery?",
    options: ["Complete solitude", "Small group of 2-3", "One-on-one deep talks", "Listening more than talking"],
    type: "options",
  },
  {
    id: "friend_pref",
    question: "What do you value most in a friend?",
    options: ["Quiet presence", "Shared hobbies", "Intellectual talks", "Consistent check-ins"],
    type: "options",
  },
  {
    id: "vibe",
    question: "Describe your ideal hangout vibe.",
    placeholder: "e.g. A quiet cafe, a parallel play session, or a long walk...",
    type: "text",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [inputValue, setInputValue] = useState("");
  const router = useRouter();

  const progress = ((step + 1) / QUESTIONS.length) * 100;
  const currentQ = QUESTIONS[step];

  const handleNext = () => {
    const updatedAnswers = { ...answers, [currentQ.id]: inputValue };
    setAnswers(updatedAnswers);
    setInputValue("");

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Final Step: Submit to AI/Database
      console.log("Final Answers:", updatedAnswers);
      router.push("/dashboard"); // Or wherever your matching happens
    }
  };

  const selectOption = (option: string) => {
    setInputValue(option);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 font-sans">
      <div className="w-full max-w-xl space-y-12">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground font-space-grotesk uppercase tracking-widest">
            <span>AI Matching Assistant</span>
            <span>
              Step {step + 1} of {QUESTIONS.length}
            </span>
          </div>
          <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="space-y-8 min-h-[300px]">
          <h2 className="text-2xl md:text-3xl font-bold font-space-grotesk leading-tight text-foreground">
            {currentQ.question}
          </h2>

          {currentQ.type === "text" ? (
            <textarea
              className="w-full p-4 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary outline-none transition-all resize-none text-lg"
              rows={4}
              placeholder={currentQ.placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentQ.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => selectOption(option)}
                  className={`p-4 text-left rounded-xl border transition-all ${
                    inputValue === option
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/30 border-border hover:border-primary/50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-8">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            Back
          </Button>
          <Button
            className="px-8 py-6 rounded-full text-lg font-bold"
            onClick={handleNext}
            disabled={!inputValue}
          >
            {step === QUESTIONS.length - 1 ? "Find My Matches" : "Next Question"}
          </Button>
        </div>
      </div>
    </div>
  );
}
