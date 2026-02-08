"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Check, Plus, ArrowRight } from "lucide-react";
import { BACKEND_URL } from "@/lib/api";

const INTEREST_TAGS = [
  "Reading", "Gaming", "Solo Hikes", "Lo-fi Music", "Cooking",
  "Coding", "Painting", "Gardening", "Coffee Shops", "Movies",
  "Yoga", "Photography", "Writing", "Puzzles", "Stargazing"
];

const DISLIKE_TAGS = [
  "Cilantro", "Spicy food", "Soggy texture", "Seafood", "Mint chocolate",
  "Olives", "Greasy food", "Pickiness", "Rudeness", "Arrogance",
  "Small talk", "Lying", "Tardiness", "Judgmental people", "Attention seeking"
];

const QUESTIONS = [
  {
    id: "interests",
    question: "Hey {name}! So glad you're here. 🌟 To help you find your people, let's start with what you love doing! What are some of your favorite hobbies?",
    type: "tags"
  },
  {
    id: "dislikes",
    question: "Got it! Honestly, we all have those things that just don't vibe with us. 😅 What are your social dealbreakers?",
    type: "tags"
  },
  {
    id: "vibe",
    question: "Love it! Lastly, how would you describe your ideal hangout vibe? Just speak from the heart!",
    type: "text"
  },
];

const DISCOVERY_QUESTION = {
  id: "discovery",
  question: "Welcome back, {name}! 🔍 Let's find some fresh faces. Specifically, what kind of energy or interests are you looking for in a new friend today?",
  type: "text"
};

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDiscoveryMode = searchParams.get("mode") === "discovery";

  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [aiOptions, setAiOptions] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // --- DATABASE SYNC ---
  const syncMessageWithDb = async (role: "ai" | "user", text: string) => {
    const dbId = localStorage.getItem("user_db_id");
    if (!dbId) return;
    try {
      await fetch(`${BACKEND_URL}/chat/save/${dbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, text, timestamp: new Date().toISOString() }),
      });
    } catch (error) {
      console.error("❌ [SYNC] Error:", error);
    }
  };

  useEffect(() => {
    const dbId = localStorage.getItem("user_db_id");
    if (!dbId) {
      router.push("/login");
      return;
    }

    if (!hasInitialized.current) {
      const name = localStorage.getItem("user_first_name") || "there";

      if (isDiscoveryMode) {
        // --- START DISCOVERY MODE ---
        setCurrentStep(99); // 99 = Discovery Phase
        const q = DISCOVERY_QUESTION.question.replace("{name}", name);
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setMessages([{ role: "ai", text: q }]);
          syncMessageWithDb("ai", q);
        }, 1000);
      } else {
        // --- START NORMAL ONBOARDING ---
        askQuestion(0);
      }
      hasInitialized.current = true;
    }
  }, [isDiscoveryMode]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const askQuestion = (stepIndex: number) => {
    setIsTyping(true);
    const userName = localStorage.getItem("user_first_name") || "there";
    setTimeout(() => {
      setIsTyping(false);
      const q = QUESTIONS[stepIndex];
      const text = q.question.replace("{name}", userName);
      setMessages((prev) => [...prev, { role: "ai", text }]);
      syncMessageWithDb("ai", text);
    }, 1200);
  };

  const handleSend = async (overrideValue?: string) => {
    const isDiscovery = currentStep === 99;
    const currentQuestionType = (isDiscovery || currentStep >= QUESTIONS.length) ? "text" : QUESTIONS[currentStep].type;

    let finalValue = overrideValue || "";
    if (!overrideValue) {
      const tagsString = selectedTags.join(", ");
      const typedText = inputValue.trim();
      finalValue = tagsString && typedText ? `${tagsString}, ${typedText}` : tagsString || typedText;
    }

    if (!finalValue.trim()) return;

    // UI Update
    setMessages((prev) => [...prev, { role: "user", text: finalValue }]);
    await syncMessageWithDb("user", finalValue);
    setInputValue("");
    setSelectedTags([]);
    setAiOptions([]);

    if (isDiscovery) {
      // Transition from discovery question to AI interview
      setCurrentStep(QUESTIONS.length);
      fetchNextAIQuestion(finalValue);
    } else if (currentStep < QUESTIONS.length) {
      const nextStep = currentStep + 1;
      if (nextStep < QUESTIONS.length) {
        setCurrentStep(nextStep);
        askQuestion(nextStep);
      } else {
        setCurrentStep(QUESTIONS.length); // Enter AI Chat Phase
        startAIInterview();
      }
    } else {
      fetchNextAIQuestion(finalValue);
    }
  };

  const startAIInterview = async () => {
    setIsTyping(true);
    const dbId = localStorage.getItem("user_db_id");
    const initialData = {
      likes: messages.find(m => m.text.includes("hobbies"))?.text || "",
      dislikes: messages.find(m => m.text.includes("dealbreakers"))?.text || "",
      intro: messages[messages.length - 1]?.text || "",
    };

    try {
      await fetch(`${BACKEND_URL}/onboarding/start/${dbId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialData),
      });
      fetchNextAIQuestion("");
    } catch (e) {
      console.error("AI Interview Error", e);
    }
  };

  const fetchNextAIQuestion = async (userAnswer: string) => {
    if (userAnswer === "No, I'm all set!") {
      finishOnboarding();
      return;
    }
    setIsTyping(true);
    const dbId = localStorage.getItem("user_db_id");
    try {
      const response = await fetch(`${BACKEND_URL}/onboarding/chat/${dbId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_answer: userAnswer }),
      });
      const data = await response.json();
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: "ai", text: data.next_question }]);
      setAiOptions(data.options || []);
    } catch (e) {
      setIsTyping(false);
    }
  };

  const finishOnboarding = async () => {
    setIsAnalyzing(true);
    const dbId = localStorage.getItem("user_db_id");
    try {
      await fetch(`${BACKEND_URL}/onboarding/complete/${dbId}`, { method: "POST" });
      setTimeout(() => router.push("/matches"), 3000);
    } catch (e) {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="p-4 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="text-primary-foreground w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight">Quietly AI</h2>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">
              {isDiscoveryMode ? "Discovery Session" : "Onboarding Session"}
            </p>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none shadow-md" : "bg-card border border-border text-foreground rounded-tl-none"
                }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {!isTyping && currentStep < QUESTIONS.length && QUESTIONS[currentStep].type === "tags" && (
            <div className="flex flex-wrap gap-2 p-4 bg-secondary/10 rounded-2xl border border-dashed border-border">
              {(QUESTIONS[currentStep].id === "interests" ? INTEREST_TAGS : DISLIKE_TAGS).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${selectedTags.includes(tag) ? "bg-primary text-primary-foreground scale-105" : "bg-background border border-border text-muted-foreground"
                    }`}
                >
                  {selectedTags.includes(tag) ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {tag}
                </button>
              ))}
              <Button size="sm" className="w-full mt-2 rounded-xl" onClick={() => handleSend()} disabled={selectedTags.length === 0}>
                Confirm Selection <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {!isTyping && aiOptions.length > 0 && (
            <div className="flex flex-wrap gap-2 p-4 bg-secondary/10 rounded-2xl border border-dashed border-border">
              {aiOptions.map((opt) => (
                <button key={opt} onClick={() => handleSend(opt)} className="px-3 py-1.5 rounded-full text-xs font-medium bg-background border border-border hover:border-primary/50 text-muted-foreground transition-all">
                  {opt}
                </button>
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

      <footer className="p-4 border-t border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Input
            placeholder="Type your message..."
            value={inputValue}
            disabled={isTyping}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="rounded-full bg-secondary border-none h-12 px-6 focus-visible:ring-2 focus-visible:ring-primary/20"
          />
          <Button onClick={() => handleSend()} disabled={!inputValue.trim() && selectedTags.length === 0} className="h-12 w-12 rounded-full shrink-0 shadow-lg">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </footer>

      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-xl">
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
            <Bot className="absolute inset-0 m-auto w-12 h-12 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-center px-6 italic uppercase">
            {isDiscoveryMode ? "Scanning for new resonance..." : "Connecting your kindred spirits..."}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">Quietly AI is hand-picking your best matches.</p>
        </div>
      )}
    </div>
  );
}

export default function ChatOnboarding() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <Bot className="text-primary w-12 h-12 animate-pulse" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}