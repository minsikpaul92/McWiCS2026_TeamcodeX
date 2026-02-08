"use client";

import React, { useEffect, useState } from "react";
import {
  Home, Users, UserPlus, Search, Bot, Bell, LogOut, Send, ArrowLeft, Sparkles
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
  const [postInput, setPostInput] = useState("");
  const [posts, setPosts] = useState<any[]>([]); // Empty state for real data
  const [innerCircle, setInnerCircle] = useState<any[]>([]);
  const [tempFriends, setTempFriends] = useState<any[]>([]);

  useEffect(() => {
    // 1. Auth check (Route Guard)
    const savedUserSession = localStorage.getItem("user_session");
    if (!savedUserSession) {
      router.push("/login");
      return;
    }

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
      
      // Load actual friends from user data
      if (parsedUser.inner_circle) {
        setInnerCircle(parsedUser.inner_circle);
      }

      // Check for transferred matches from the Matches page
      const multiTrialRaw = localStorage.getItem("current_matches_trial");
      if (multiTrialRaw) {
        try {
          const matchesData = JSON.parse(multiTrialRaw);
          const formattedMatches = matchesData.map((m: any) => ({
            id: m.id,
            alias: m.name,
            time: 'Trial Started',
            color: m.color || 'bg-primary/20 text-primary',
            bio: m.bio,
            interests: m.interests || []
          }));

          setTempFriends(formattedMatches);
          if (formattedMatches.length > 0) {
            setSelectedFriend(formattedMatches[0]);
          }

          // Once loaded, clear from storage
          localStorage.removeItem("current_matches_trial");
        } catch (e) {
          console.error("Failed to parse multi-trial matches data", e);
        }
      }

      // Legacy fallback (single match)
      const trialMatchRaw = localStorage.getItem("current_match_trial");
      if (trialMatchRaw) {
        try {
          const matchData = JSON.parse(trialMatchRaw);
          const formattedMatch = {
            id: matchData.id,
            alias: matchData.name,
            time: 'Trial Started',
            color: matchData.color || 'bg-primary/20 text-primary',
            bio: matchData.bio,
            interests: matchData.interests || []
          };

          setTempFriends(prev => [...prev, formattedMatch]);
          setSelectedFriend(formattedMatch);
          localStorage.removeItem("current_match_trial");
        } catch (e) {
          console.error("Failed to parse trial match data", e);
        }
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    router.push("/login");
  };

  const handlePostSubmit = () => {
    if (!postInput.trim()) return;

    const newPost = {
      id: Date.now().toString(),
      author: `${user.firstName}`,
      initials: getInitials(user.firstName),
      time: 'Just now',
      content: postInput
    };

    setPosts([newPost, ...posts]);
    setPostInput("");
  };

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
      }
    } catch (error) {
      console.error("Failed to add friend:", error);
    }
  };

  const getInitials = (name: string) => name ? name.split(" ").map(n => n[0]).join("").toUpperCase() : "??";

  if (!user) return <div className="min-h-screen bg-background flex items-center justify-center font-bold tracking-tighter">INITIALIZING...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* --- TOP NAV --- */}
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/dashboard" onClick={() => setSelectedFriend(null)} className="text-2xl font-black text-[#D4FF3F] tracking-tighter uppercase italic">
            Quietly
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-accent/50">
              Home
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem("user_session");
                localStorage.removeItem("user_db_id");
                router.push("/");
              }}
              className="text-sm font-medium text-muted-foreground hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/10"
            >
              Sign out
            </button>
            <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
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
              className={`w-full justify-start gap-3 rounded-xl transition-all font-bold uppercase text-xs tracking-widest ${!selectedFriend ? 'bg-[#D4FF3F] text-black' : 'hover:bg-secondary'}`}
            >
              <Home className="h-4 w-4" /> Home Feed
            </Button>
          </nav>

          <section>
            <h3 className="mb-3 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Inner Circle</h3>
            <div className="space-y-1">
              {innerCircle.length === 0 && <p className="px-2 text-[10px] italic text-muted-foreground">Your circle is empty.</p>}
              {innerCircle.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFriend(f)}
                  className={`flex items-center gap-3 rounded-xl p-2 cursor-pointer transition-all ${selectedFriend?.id === f.id ? 'bg-secondary' : 'hover:bg-secondary/50'}`}
                >
                  <Avatar className="h-8 w-8 border border-white/10">
                    <AvatarFallback className="bg-zinc-800 text-xs">👤</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-bold">{f.alias}</span>
                </div>
              ))}
            </div>
          </section>

          {tempFriends.length > 0 && (
            <section className="animate-pulse">
              <h3 className="mb-3 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Active Trials</h3>
              <div className="space-y-1">
                {tempFriends.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedFriend(m)}
                    className={`flex items-center gap-3 rounded-xl p-2 cursor-pointer border border-orange-500/20 ${selectedFriend?.id === m.id ? 'bg-orange-500/10' : 'hover:bg-orange-500/5'}`}
                  >
                    <Avatar className="h-8 w-8"><AvatarFallback className="bg-orange-500/20 text-orange-500 text-[10px] font-black">??</AvatarFallback></Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold italic">{m.alias}</span>
                      <span className="text-[9px] uppercase font-black text-orange-500">Trial Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <Button onClick={handleLogout} variant="ghost" className="mt-auto w-full justify-start gap-3 text-muted-foreground hover:text-destructive text-xs font-bold uppercase tracking-widest">
            <LogOut className="h-4 w-4" /> Terminate Session
          </Button>
        </aside>

        {/* --- CENTER: FEED OR CHAT --- */}
        <main className="flex-1 space-y-6 pb-20">
          {selectedFriend ? (
            <Card className="flex flex-col h-[calc(100vh-12rem)] border-white/5 bg-zinc-900/50 backdrop-blur-xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/80">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedFriend(null)}><ArrowLeft /></Button>
                  <Avatar><AvatarFallback className="bg-zinc-800 font-bold">??</AvatarFallback></Avatar>
                  <div>
                    <p className="text-sm font-black italic uppercase tracking-tight">{selectedFriend.alias}</p>
                    <p className="text-[10px] text-[#D4FF3F] font-black uppercase tracking-widest">Encrypted Connection</p>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  <div className="flex justify-center mb-8">
                    <span className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground bg-white/5 px-4 py-1 rounded-full">Conversation Started</span>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-4 bg-zinc-900/80 border-t border-white/5">
                <div className="flex gap-2">
                  <Input
                    placeholder="Send message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="rounded-xl bg-white/5 border-white/10 focus:border-[#D4FF3F]/50"
                  />
                  <Button size="icon" className="rounded-xl bg-[#D4FF3F] text-black hover:bg-[#D4FF3F]/90">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-700">
              <Card className="p-4 border-white/5 bg-zinc-900/50 backdrop-blur-xl">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 border border-[#D4FF3F]/30">
                    <AvatarFallback className="bg-zinc-800 text-[#D4FF3F] font-bold">{getInitials(user.firstName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Input 
                      value={postInput}
                      onChange={(e) => setPostInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePostSubmit()}
                      placeholder={`Broadcast a thought, ${user.firstName}...`}
                      className="flex-1 rounded-xl bg-white/5 border-white/10 focus:border-[#D4FF3F]/50"
                    />
                    <Button onClick={handlePostSubmit} disabled={!postInput.trim()} className="rounded-xl bg-[#D4FF3F] text-black hover:bg-[#D4FF3F]/90 font-black uppercase text-xs tracking-widest px-6">
                      Post
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                {posts.length === 0 && (
                  <div className="py-20 text-center space-y-4">
                    <div className="inline-block p-4 rounded-full bg-white/5 mb-4"><Search className="h-8 w-8 text-muted-foreground opacity-20" /></div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Feed is quiet. Be the first to speak.</p>
                  </div>
                )}
                {posts.map((post) => (
                  <Card key={post.id} className="border-white/5 bg-zinc-900/30 backdrop-blur-sm overflow-hidden hover:bg-zinc-900/50 transition-all">
                    <div className="p-4 flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-white/10"><AvatarFallback className="bg-zinc-800 font-bold">{post.initials}</AvatarFallback></Avatar>
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight">{post.author}</p>
                        <p className="text-[10px] text-muted-foreground font-bold">{post.time}</p>
                      </div>
                    </div>
                    <div className="px-4 pb-6">
                      <p className="text-sm leading-relaxed text-zinc-300 font-medium">{post.content}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* --- RIGHT SIDEBAR --- */}
        <aside className="sticky top-24 hidden w-80 flex-col gap-6 xl:flex">
          {selectedFriend ? (
            <Card className="p-6 border-[#D4FF3F]/20 bg-[#D4FF3F]/5 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2"><Sparkles className="h-4 w-4 text-[#D4FF3F] opacity-50" /></div>
              <div className="flex flex-col items-center text-center mb-6">
                <Avatar className="h-20 w-20 mb-3 border-4 border-zinc-900 shadow-2xl">
                  <AvatarFallback className="bg-zinc-800 text-2xl font-black italic">??</AvatarFallback>
                </Avatar>
                <h3 className="font-black text-xl italic uppercase tracking-tighter">{selectedFriend.alias}</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-[#D4FF3F] uppercase tracking-widest mb-2">AI Vibe Analysis</h4>
                  <p className="text-xs leading-relaxed text-zinc-300 bg-black/40 p-4 rounded-xl border border-white/5 italic">
                    "{selectedFriend.bio || "No bio provided."}"
                  </p>
                </div>

                {selectedFriend.interests?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Interest Resonance</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedFriend.interests.map((tag: string) => (
                        <span key={tag} className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-[#D4FF3F]">#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {!innerCircle.some(f => f.id === selectedFriend.id) && (
                  <Button
                    className="w-full bg-[#D4FF3F] hover:bg-[#D4FF3F]/90 text-black font-black uppercase text-xs tracking-[0.2em] h-12 rounded-xl"
                    onClick={() => handleAddFriend(selectedFriend)}
                  >
                    Add to Inner Circle
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-6 border-white/5 bg-zinc-900/50 backdrop-blur-xl">
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-[#D4FF3F] mb-4 flex items-center gap-2">
                <Bot className="h-4 w-4" /> System Insight
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Welcome, <span className="text-white">{user.firstName}</span>. Your feed is currently filtered for high-compatibility matches. 
                Use the <span className="text-[#D4FF3F]">Matches</span> page to find new people.
              </p>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}