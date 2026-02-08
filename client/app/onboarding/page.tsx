"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Check, Plus, ArrowRight } from "lucide-react";

const INTEREST_TAGS = [
  "Reading", "Gaming", "Solo Hikes", "Lo-fi Music", "Cooking",
  "Coding", "Painting", "Gardening", "Coffee Shops", "Movies",
  "Yoga", "Photography", "Writing", "Puzzles", "Stargazing"
];

const QUESTIONS = [
  {
    id: "intro",
    question: "Hi there! I'm your AI companion. I'll help you find friends who match your energy. Ready to start?",
    type: "text"
  },
  {
    id: "interests",
    question: "What are some of your favorite hobbies? Pick as many as you like!",
    type: "tags"
  },
  {
    id: "dislikes",
    question: "To find the right circle, tell me: what's a major social dealbreaker for you?",
    options: ["Crowded/Loud spaces", "Small talk", "Unplanned hangouts", "Lack of personal space"],
    type: "options"
  },
  {
    id: "vibe",
    question: "Describe your ideal 'quiet' hangout vibe.",
    type: "text"
  },
];

export default function ChatOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const router = useRouter();

  // --- DATABASE SYNC LOGIC ---
  // --- DATABASE SYNC LOGIC ---
  const syncMessageWithDb = async (role: "ai" | "user", text: string) => {
    const dbId = localStorage.getItem("user_db_id");

    if (!dbId) {
      console.warn("❌ [SYNC] No User ID found.");
      return;
    }

    try {
      // UPDATE THIS URL BELOW 
      // Changed from /save-chat/ to /chat/save/
      const response = await fetch(`http://localhost:8000/chat/save/${dbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          text,
          timestamp: new Date().toISOString()
        }),
      });

      const data = await response.json();
      console.log("✅ [SYNC] Response:", data);
    } catch (error) {
      console.error("❌ [SYNC] DB Sync Error:", error);
    }
  };

  useEffect(() => {
    if (!hasInitialized.current) {
      askQuestion(0);
      hasInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const askQuestion = (stepIndex: number) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const q = QUESTIONS[stepIndex];
      setMessages((prev) => [...prev, { role: "ai", text: q.question }]);

      // Save AI question to DB
      syncMessageWithDb("ai", q.question);
    }, 1200);
  };

  const handleSend = async (overrideValue?: string) => {
    const isInitialQuestions = currentStep < QUESTIONS.length;
    const currentQuestionType = isInitialQuestions ? QUESTIONS[currentStep].type : "text";
    const finalValue = overrideValue || (currentQuestionType === "tags" ? selectedTags.join(", ") : inputValue);

    if (currentQuestionType === "tags" && selectedTags.length === 0) return;
    if (currentQuestionType === "text" && !finalValue.trim()) return;

    // 1. Update UI and DB Sync locally first
    setMessages((prev) => [...prev, { role: "user", text: finalValue }]);
    await syncMessageWithDb("user", finalValue);
    setInputValue("");
    setSelectedTags([]); // Reset for next turn

    if (isInitialQuestions) {
      if (currentStep === 0) {
        // Handle "Ready to start?" (Logic from teammate)
        const lowerText = finalValue.toLowerCase().trim();
        const positives = ["yes", "yeah", "yep", "sure", "ready", "ok", "go"];
        if (!positives.some(word => lowerText.includes(word))) {
          // (Simplified retry logic for space)
          return;
        }
      }

      const nextStep = currentStep + 1;
      if (nextStep < QUESTIONS.length) {
        setCurrentStep(nextStep);
        askQuestion(nextStep);
      } else {
        // --- TRANSITION TO AI INTERVIEW ---
        setCurrentStep(QUESTIONS.length); // Mark as AI phase
        startAIInterview();
      }
    } else {
      // --- AI CHAT PHASE ---
      fetchNextAIQuestion(finalValue);
    }
  };

  const startAIInterview = async () => {
    setIsTyping(true);
    const dbId = localStorage.getItem("user_db_id");

    // Extract initial data from messages
    const initialData = {
      intro: messages[1]?.text || "", // Just an example mapping
      likes: messages[3]?.text?.split(", ") || [],
      dislikes: messages[5]?.text || "",
    };

    try {
      await fetch(`http://localhost:8000/onboarding/start/${dbId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialData),
      });
      fetchNextAIQuestion(""); // Get first AI question
    } catch (e) {
      console.error("Failed to start AI interview", e);
    }
  };

  const fetchNextAIQuestion = async (userAnswer: string) => {
    setIsTyping(true);
    const dbId = localStorage.getItem("user_db_id");

    try {
      const response = await fetch(`http://localhost:8000/onboarding/chat/${dbId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_answer: userAnswer }),
      });

      const data = await response.json();
      setIsTyping(false);

      // Update UI with AI's dynamic response
      setMessages((prev) => [...prev, { role: "ai", text: data.next_question }]);

      // Handle completion
      if (data.should_end) {
        finishOnboarding();
      }
    } catch (e) {
      console.error("AI Chat Error", e);
      setIsTyping(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const finishOnboarding = async () => {
    setIsTyping(true);
    const dbId = localStorage.getItem("user_db_id");

    try {
      const resp = await fetch(`http://localhost:8000/onboarding/complete/${dbId}`, {
        method: "POST"
      });
      const data = await resp.json();

      setIsTyping(false);
      setMessages((prev) => [...prev, { role: "ai", text: "Got it! I've analyzed your profile and found some great matches for you." }]);

      setTimeout(() => router.push("/matches"), 3000);
    } catch (e) {
      console.error("Completion error", e);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="p-4 border-b border-border bg-card/50 backdrop-blur-md flex items-center gap-3 sticky top-0 z-10">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <Bot className="text-primary-foreground w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-sm tracking-tight">Quietly AI</h2>
          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Onboarding Session</p>
        </div>
      </header>

      <ScrollArea className="flex-1 px-4 py-6 md:px-8">
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none shadow-md" : "bg-card border border-border text-foreground rounded-tl-none"
                }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {!isTyping && currentStep < QUESTIONS.length && QUESTIONS[currentStep].type === "tags" && messages.length > 0 && messages[messages.length - 1].role === "ai" && (
            <div className="flex flex-wrap gap-2 p-4 bg-secondary/10 rounded-2xl border border-dashed border-border animate-in zoom-in-95">
              {INTEREST_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${selectedTags.includes(tag) ? "bg-primary text-primary-foreground scale-105" : "bg-background border border-border hover:border-primary/50 text-muted-foreground"
                    }`}
                >
                  {selectedTags.includes(tag) ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {tag}
                </button>
              ))}
              <Button size="sm" className="w-full mt-2 rounded-xl" onClick={() => handleSend()} disabled={selectedTags.length === 0}>
                Confirm Interests <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {!isTyping && currentStep < QUESTIONS.length && QUESTIONS[currentStep].type === "options" && messages.length > 0 && messages[messages.length - 1].role === "ai" && (
            <div className="grid grid-cols-1 gap-2 animate-in slide-in-from-left-4">
              {QUESTIONS[currentStep].options?.map((opt) => (
                <Button key={opt} variant="outline" className="justify-start h-12 rounded-xl border-border hover:bg-primary/5 hover:border-primary transition-all" onClick={() => handleSend(opt)}>
                  {opt}
                </Button>
              ))}
            </div>
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center shadow-sm">
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <footer className="p-4 md:p-6 border-t border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Input
            placeholder={QUESTIONS[currentStep].type === "tags" ? "Pick your favorites above..." : "Type your message..."}
            value={inputValue}
            disabled={QUESTIONS[currentStep].type === "tags" || isTyping}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="rounded-full bg-secondary border-none h-12 px-6 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
          />
          <Button
            onClick={() => handleSend()}
            disabled={(QUESTIONS[currentStep].type === "tags" ? selectedTags.length === 0 : !inputValue.trim()) || isTyping}
            className="h-12 w-12 rounded-full shrink-0 shadow-lg active:scale-95 transition-transform"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </footer>
    </div>
  );
}