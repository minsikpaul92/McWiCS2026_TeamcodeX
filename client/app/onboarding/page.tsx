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

const DISLIKE_TAGS = [
  "Cilantro", "Spicy food", "Soggy texture", "Seafood", "Mint chocolate",
  "Olives", "Greasy food", "Pickiness", "Rudeness", "Arrogance",
  "Small talk", "Lying", "Tardiness", "Judgmental people", "Attention seeking",
  "Crowded places", "Loud noises", "Humid weather", "Bright lights", "Strong perfumes",
  "Procrastination", "Commuting", "Waking up early", "Insects", "Waiting in line"
];

const QUESTIONS = [
  {
    id: "interests",
    question: "Hey {name}! So glad you're here. 🌟 To help you find your people, let's start with what you love doing! What are some of your favorite hobbies? Pick from the tags or just type them in!",
    type: "tags"
  },
  {
    id: "dislikes",
    question: "Got it! Honestly, we all have those things that just don't vibe with us. 😅 What are your social dealbreakers or things you're not a fan of? Feel free to pick or type them.",
    type: "tags"
  },
  {
    id: "vibe",
    question: "Love it! Lastly, I'd love to get to know you a bit better. How would you describe your personality or your ideal hangout vibe? Just speak from the heart!",
    type: "text"
  },
];

export default function ChatOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [aiOptions, setAiOptions] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const router = useRouter();

  // --- DATABASE SYNC LOGIC ---
  const syncMessageWithDb = async (role: "ai" | "user", text: string) => {
    const dbId = localStorage.getItem("user_db_id");

    if (!dbId) {
      console.warn("❌ [SYNC] No User ID found.");
      return;
    }

    try {
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
    const userName = localStorage.getItem("user_first_name") || "there";

    setTimeout(() => {
      setIsTyping(false);
      const q = QUESTIONS[stepIndex];
      const personalizedQuestion = q.question.replace("{name}", userName);

      setMessages((prev) => [...prev, { role: "ai", text: personalizedQuestion }]);

      // Save AI question to DB
      syncMessageWithDb("ai", personalizedQuestion);
    }, 1200);
  };

  const handleSend = async (overrideValue?: string) => {
    const isInitialQuestions = currentStep < QUESTIONS.length;
    const currentQuestionType = isInitialQuestions ? QUESTIONS[currentStep].type : "text";

    // Combine Tags + Typed Text
    let finalValue = overrideValue || "";
    if (!overrideValue) {
      const tagsString = selectedTags.join(", ");
      const typedText = inputValue.trim();

      if (tagsString && typedText) {
        finalValue = `${tagsString}, ${typedText}`;
      } else {
        finalValue = tagsString || typedText;
      }
    }

    if (currentQuestionType === "tags" && selectedTags.length === 0) return;
    if (currentQuestionType === "text" && !finalValue.trim()) return;

    // 1. Update UI and DB Sync locally first
    setMessages((prev) => [...prev, { role: "user", text: finalValue }]);
    await syncMessageWithDb("user", finalValue);
    setInputValue("");
    setSelectedTags([]); // Reset for next turn
    setAiOptions([]); // Clear AI options

    if (isInitialQuestions) {
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

    // Extract initial data from messages (Indices based on Turn 1-3 sequence)
    const initialData = {
      likes: messages[1]?.text?.split(", ") || [],
      dislikes: messages[3]?.text?.split(", ") || [],
      intro: messages[5]?.text || "",
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
      // Handle completion only if user explicitly says "No" via button
      if (userAnswer === "No, I'm all set!") {
        finishOnboarding();
        return;
      }

      const response = await fetch(`http://localhost:8000/onboarding/chat/${dbId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_answer: userAnswer }),
      });

      const data = await response.json();
      setIsTyping(false);

      // Update UI with AI's dynamic response and options
      setMessages((prev) => [...prev, { role: "ai", text: data.next_question }]);
      setAiOptions(data.options || []);
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
    setIsAnalyzing(true);
    const dbId = localStorage.getItem("user_db_id");

    try {
      const resp = await fetch(`http://localhost:8000/onboarding/complete/${dbId}`, {
        method: "POST"
      });
      const data = await resp.json();

      // Shortened to 3 seconds as requested
      setTimeout(() => {
        router.push("/matches");
      }, 3000);
    } catch (e) {
      console.error("Completion error", e);
      setIsAnalyzing(false);
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
              {(QUESTIONS[currentStep].id === "interests" ? INTEREST_TAGS : DISLIKE_TAGS).map((tag) => (
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
                Confirm Selection <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {!isTyping && aiOptions.length > 0 && messages[messages.length - 1].role === "ai" && (
            <div className="flex flex-wrap gap-2 p-4 bg-secondary/10 rounded-2xl border border-dashed border-border animate-in zoom-in-95">
              {aiOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSend(opt)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 bg-background border border-border hover:border-primary/50 text-muted-foreground"
                >
                  <Plus className="w-3 h-3" />
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

      <footer className="p-4 md:p-6 border-t border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Input
            placeholder={(currentStep < QUESTIONS.length && QUESTIONS[currentStep].type === "tags") ? "Pick from above or type here..." : "Type your message..."}
            value={inputValue}
            disabled={isTyping}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="rounded-full bg-secondary border-none h-12 px-6 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
          />
          <Button
            onClick={() => handleSend()}
            disabled={((currentStep < QUESTIONS.length && QUESTIONS[currentStep].type === "tags") ? (selectedTags.length === 0 && !inputValue.trim()) : !inputValue.trim()) || isTyping}
            className="h-12 w-12 rounded-full shrink-0 shadow-lg active:scale-95 transition-transform"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </footer>

      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-xl animate-in fade-in duration-700">
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Bot className="w-12 h-12 text-primary animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-bold font-space-grotesk tracking-tight text-center px-6">
            Connecting your kindred spirits...
          </h2>
          <p className="text-muted-foreground mt-2 text-sm text-center">Connecty is hand-picking your best matches.</p>

          <div className="mt-12 flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}