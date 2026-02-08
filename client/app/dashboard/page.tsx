"use client";

import React, { useEffect, useState } from "react";
import {
  Home, Users, UserPlus, Search, Bot, Bell, LogOut, Send, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [innerCircle, setInnerCircle] = useState<any[]>([]);

  // Start with empty array for real data
  const [tempFriends, setTempFriends] = useState<any[]>([]);

  useEffect(() => {
    // Check for user login and sync session to localStorage if needed
    const dbId = localStorage.getItem("user_db_id");
    const existingSession = localStorage.getItem("user_session");

    if (!existingSession && dbId) {
      const firstName = localStorage.getItem("user_first_name") || "Explorer";
      localStorage.setItem("user_session", JSON.stringify({ id: dbId, firstName }));
    }

    const savedUser = localStorage.getItem("user_session");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (parsedUser.inner_circle) {
        setInnerCircle(parsedUser.inner_circle);
      }

      // Check for transferred match from the Matches page
      const trialMatchRaw = localStorage.getItem("current_match_trial");
      if (trialMatchRaw) {
        try {
          const matchData = JSON.parse(trialMatchRaw);
          const formattedMatch = {
            id: matchData.id,
            alias: matchData.name, // The anonymous name (e.g., Anonymous 1)
            time: 'Trial Started',
            color: 'bg-primary/20 text-primary',
            bio: matchData.bio,
            interests: matchData.interests
          };

          setTempFriends([formattedMatch]);
          setSelectedFriend(formattedMatch);

          // Once loaded, clear from storage
          localStorage.removeItem("current_match_trial");
        } catch (e) {
          console.error("Failed to parse trial match data", e);
        }
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  // --- LOGOUT LOGIC ---
  const handleLogout = () => {
    localStorage.removeItem("user_session");
    router.push("/login");
  };

  // --- ADD FRIEND LOGIC (Connects to FastAPI) ---
  const handleAddFriend = async (friend: any) => {
    try {
      const response = await fetch(`http://localhost:8000/users/${user.id}/add-friend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend: friend })
      });

      if (response.ok) {
        setInnerCircle((prev) => [...prev, friend]);
        setTempFriends((prev) => prev.filter(f => f.id !== friend.id));
        setSelectedFriend(null);
        alert(`${friend.alias} added to your Inner Circle!`);
      }
    } catch (error) {
      console.error("Failed to add friend:", error);
    }
  };

  const getInitials = (name: string) => name ? name.split(" ").map(n => n[0]).join("").toUpperCase() : "??";

  if (!user) return <div className="min-h-screen bg-background flex items-center justify-center">Loading Quietly...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* --- TOP NAV --- */}
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/dashboard" onClick={() => setSelectedFriend(null)} className="text-2xl font-bold text-primary tracking-tighter font-space-grotesk">
            Quietly
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden lg:block text-sm font-medium">Hi, {user.firstName}</span>
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {getInitials(user.firstName)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </nav>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 pt-24">

        {/* --- LEFT SIDEBAR --- */}
        <aside className="sticky top-24 hidden h-[calc(100vh-6rem)] w-64 flex-col gap-8 lg:flex">
          <nav className="space-y-1">
            <Button
              variant="ghost"
              onClick={() => setSelectedFriend(null)}
              className={`w-full justify-start gap-3 rounded-lg transition-all ${!selectedFriend
                ? 'bg-[#D4FF3F] text-black hover:bg-[#D4FF3F]/90'
                : 'hover:bg-secondary/50'
                }`}
            >
              <Home className="h-5 w-5" /> Home Feed
            </Button>
          </nav>

          {/* Inner Circle (Permanent Friends) */}
          {innerCircle.length > 0 && (
            <section>
              <h3 className="mb-3 px-2 text-[11px] font-bold uppercase tracking-widest text-primary">Inner Circle</h3>
              <div className="space-y-1">
                {innerCircle.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFriend(f)}
                    className={`flex items-center gap-3 rounded-lg p-2 cursor-pointer transition-colors ${selectedFriend?.id === f.id ? 'bg-primary/10' : 'hover:bg-secondary/50'}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary text-[10px]">👤</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{f.alias}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Anonymous Matches */}
          <section>
            <div className="mb-3 flex items-center justify-between px-2">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Anonymous Matches</h3>
              <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600">Trial</span>
            </div>
            <div className="space-y-1">
              {tempFriends.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedFriend(m)}
                  className={`flex items-center gap-3 rounded-lg p-2 cursor-pointer transition-colors ${selectedFriend?.id === m.id ? 'bg-primary/10' : 'hover:bg-secondary/50'}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={`${m.color} text-[10px] font-bold`}>??</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium italic">{m.alias}</span>
                    <span className="text-[10px] text-orange-500 font-medium">{m.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="mt-auto w-full justify-start gap-3 text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-5 w-5" /> Log Out
          </Button>
        </aside>

        {/* --- CENTER: FEED OR CHAT --- */}
        <main className="flex-1 space-y-6 pb-20">
          {selectedFriend ? (
            /* --- CHAT VIEW --- */
            <Card className="flex flex-col h-[calc(100vh-10rem)] border-border/50 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedFriend(null)}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar><AvatarFallback className={selectedFriend.color}>??</AvatarFallback></Avatar>
                  <div>
                    <p className="text-sm font-bold italic">{selectedFriend.alias}</p>
                    <p className="text-[10px] text-green-500 font-bold">Online</p>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4 bg-secondary/5">
                <div className="space-y-4">
                  <div className="flex justify-start">
                    <div className="bg-card border border-border p-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm">
                      Hey! Based on our shared interests, the AI thought we should talk. How are you?
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border bg-card">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="rounded-full bg-secondary/50 border-none"
                  />
                  <Button size="icon" className="rounded-full bg-[#D4FF3F] text-black hover:bg-[#D4FF3F]/90">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            /* --- DEFAULT FEED VIEW --- */
            <>
              <Card className="p-4 border-border/50 shadow-sm">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(user.firstName)}</AvatarFallback>
                  </Avatar>
                  <button className="flex-1 rounded-full bg-secondary/50 px-5 text-left text-sm text-muted-foreground hover:bg-secondary transition-all">
                    What's on your mind, {user.firstName}?
                  </button>
                </div>
              </Card>

              <Card className="overflow-hidden border-border/50 shadow-sm">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10"><AvatarFallback>SJ</AvatarFallback></Avatar>
                    <div>
                      <p className="text-sm font-bold">Sarah Jenkins</p>
                      <p className="text-[11px] text-muted-foreground font-medium">2 hours ago</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <p className="text-sm leading-relaxed text-foreground/90">
                    Finally found a coffee shop that actually respects the "no loud music" vibe. ☕📖
                  </p>
                </div>
              </Card>
            </>
          )}
        </main>

        {/* --- RIGHT SIDEBAR: BIO & ADD FRIEND --- */}
        <aside className="sticky top-24 hidden w-80 flex-col gap-6 xl:flex">
          {selectedFriend ? (
            <Card className="p-6 border-primary/20 bg-primary/[0.03] animate-in slide-in-from-right-4">
              <div className="flex flex-col items-center text-center mb-4">
                <Avatar className="h-20 w-20 mb-3 border-4 border-background shadow-lg">
                  <AvatarFallback className={`${selectedFriend.color} text-2xl font-bold`}>??</AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-lg italic">{selectedFriend.alias}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[11px] font-bold text-muted-foreground uppercase mb-1">About Match</h4>
                  <p className="text-xs leading-relaxed text-foreground/80 bg-background/50 p-3 rounded-lg border">
                    "{selectedFriend.bio}"
                  </p>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-muted-foreground uppercase mb-2">Energy Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFriend.interests.map((tag: string) => (
                      <span key={tag} className="px-2 py-1 rounded-md bg-background border text-[10px] font-medium">#{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Show button ONLY if not already a friend */}
                {!innerCircle.some(f => f.id === selectedFriend.id) && (
                  <div className="mt-6 pt-6 border-t border-border/50">
                    <Button
                      className="w-full bg-[#D4FF3F] hover:bg-[#D4FF3F]/90 text-black font-bold gap-2 rounded-xl shadow-lg"
                      onClick={() => handleAddFriend(selectedFriend)}
                    >
                      <UserPlus className="h-4 w-4" />
                      Add to Inner Circle
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-5 border-primary/20 bg-primary/[0.03]">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" /> Personalized for {user.firstName}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Based on your interest in <span className="text-foreground font-medium italic">Quiet Spaces</span>, we recommend connecting with others in Montreal.
              </p>
              <Button size="sm" className="w-full rounded-full text-xs font-bold">Discover More</Button>
            </Card>
          )}
        </aside>

      </div>
    </div>
  );
}