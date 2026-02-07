"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Check, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Available tags for the multi-select question
const INTEREST_TAGS = [
  "Reading", "Gaming", "Solo Hikes", "Lo-fi Music", "Cooking", 
  "Coding", "Painting", "Gardening", "Coffee Shops", "Movies", 
  "Yoga", "Photography", "Writing", "Puzzles", "Stargazing"
];

const QUESTIONS = [
  { id: "intro", question: "Hi there! I'm your AI companion. I'll help you find friends who match your energy. Ready to start?", type: "text" },
  { id: "interests", question: "What are some of your favorite hobbies? Pick as many as you like!", type: "tags" },
  { id: "energy", question: "How do you usually recharge your social battery?", options: ["Complete solitude", "Small group (2-3)", "One-on-one deep talks", "Listening more than talking"], type: "options" },
  { id: "vibe", question: "Describe your ideal 'quiet' hangout vibe.", type: "text" },
];

export default function ChatOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string; component?: React.ReactNode }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 1. Initial Greeting
  useEffect(() => {
    askQuestion(0);
  }, []);

  // 2. Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const askQuestion = (stepIndex: int) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const q = QUESTIONS[stepIndex];
      setMessages((prev) => [...prev, { role: "ai", text: q.question }]);
    }, 1000);
  };

  const handleSend = () => {
    if (QUESTIONS[currentStep].type === "tags" && selectedTags.length === 0) return;
    if (QUESTIONS[currentStep].type === "text" && !inputValue.trim()) return;

    // Add user message to chat
    const userText = QUESTIONS[currentStep].type === "tags" ? selectedTags.join(", ") : inputValue;
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    
    // Clear inputs
    setInputValue("");
    
    // Move to next question or finish
    if (currentStep < QUESTIONS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      askQuestion(nextStep);
    } else {
      finishOnboarding();
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const finishOnboarding = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: "ai", text: "Got it. I'm analyzing your personality now... I've found some great matches for you!" }]);
      setTimeout(() => router.push("/matches"), 2000);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Navbar */}
      <header className="p-4 border-b border-border bg-card/50 backdrop-blur-md flex items-center gap-3 sticky top-0 z-10">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Bot className="text-primary-foreground w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold font-space-grotesk text-sm">IntroConnect AI</h2>
          <p className="text-[10px] text-muted-foreground uppercase">Onboarding Session</p>
        </div>
      </header>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                msg.role === "user" 
                ? "bg-primary text-primary-foreground rounded-tr-none shadow-md" 
                : "bg-card border border-border text-foreground rounded-tl-none"
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {/* Special Input: Tags (Visible only during the tags step) */}
          {!isTyping && QUESTIONS[currentStep].type === "tags" && messages.length > 0 && messages[messages.length-1].role === "ai" && (
            <div className="flex flex-wrap gap-2 p-4 bg-secondary/20 rounded-2xl border border-dashed border-border animate-in zoom-in-95">
              {INTEREST_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                    selectedTags.includes(tag)
                    ? "bg-primary text-primary-foreground scale-105"
                    : "bg-background border border-border hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  {selectedTags.includes(tag) ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Special Input: Options */}
          {!isTyping && QUESTIONS[currentStep].type === "options" && messages.length > 0 && messages[messages.length-1].role === "ai" && (
            <div className="grid grid-cols-1 gap-2 animate-in slide-in-from-left-4">
              {QUESTIONS[currentStep].options?.map((opt) => (
                <Button 
                  key={opt} 
                  variant="outline" 
                  className={`justify-start h-12 rounded-xl border-border hover:bg-primary/5 hover:border-primary ${inputValue === opt ? 'border-primary bg-primary/10' : ''}`}
                  onClick={() => { setInputValue(opt); }}
                >
                  {opt}
                </Button>
              ))}
            </div>
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Sticky Bottom Input */}
      <footer className="p-4 md:p-6 border-t border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Input 
            placeholder={QUESTIONS[currentStep].type === "tags" ? "Pick tags above..." : "Type your message..."}
            value={inputValue}
            disabled={QUESTIONS[currentStep].type === "tags" || isTyping}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="rounded-full bg-secondary border-none h-12 px-6 focus-visible:ring-1 focus-visible:ring-primary"
          />
          <Button 
            onClick={handleSend} 
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