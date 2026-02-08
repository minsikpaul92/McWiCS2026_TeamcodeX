"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Home, Users, UserPlus, Search, Bot, Bell, LogOut, Send, ArrowLeft, Sparkles, Zap
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [user, setUser] = useState<any>(null);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [postInput, setPostInput] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [innerCircle, setInnerCircle] = useState<any[]>([]);
  const [tempFriends, setTempFriends] = useState<any[]>([]);
  
  // Chat History State: { "friendId": [messages] }
  const [chatHistories, setChatHistories] = useState<{ [key: string]: any[] }>({});

  // --- AUTO SCROLL ---
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistories, selectedFriend]);

  // --- INITIALIZATION ---
  useEffect(() => {
    const savedUserSession = localStorage.getItem("user_session");
    if (!savedUserSession) {
      router.push("/login");
      return;
    }

    const dbId = localStorage.getItem("user_db_id");
    if (dbId) {
      const parsedUser = JSON.parse(savedUserSession);
      setUser(parsedUser);

      // Load actual friends from user data
      if (parsedUser.inner_circle) {
        setInnerCircle(parsedUser.inner_circle);
      }

      const multiTrialRaw = localStorage.getItem("current_matches_trial");
      if (multiTrialRaw) {
        try {
          const matchesData = JSON.parse(multiTrialRaw);
          const formattedMatches = matchesData.map((m: any) => ({
            id: m.id,
            alias: m.name,
            bio: m.bio,
            interests: m.interests || []
          }));
          setTempFriends(formattedMatches);
          localStorage.removeItem("current_matches_trial");
        } catch (e) {
          console.error("Failed to parse matches", e);
        }
      }
    }
  }, [router]);

  // --- HANDLERS ---
  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  const handlePostSubmit = () => {
    if (!postInput.trim()) return;
    const newPost = {
      id: Date.now().toString(),
      author: user.firstName,
      initials: user.firstName?.[0] || "U",
      time: 'Just now',
      content: postInput
    };
    setPosts([newPost, ...posts]);
    setPostInput("");
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !selectedFriend) return;

    const messageId = Date.now();
    const newMessage = {
      id: messageId,
      text: chatInput,
      sender: "me",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update local chat state
    setChatHistories(prev => ({
      ...prev,
      [selectedFriend.id]: [...(prev[selectedFriend.id] || []), newMessage]
    }));

    setChatInput("");

    // OPTIONAL: Mock a reply after 1.5 seconds
    setTimeout(() => {
      const reply = {
        id: messageId + 1,
        text: `Hey! I'm just processing that. "Quietly" is a cool vibe, right?`,
        sender: "them",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistories(prev => ({
        ...prev,
        [selectedFriend.id]: [...(prev[selectedFriend.id] || []), reply]
      }));
    }, 1500);
  };

  const handleAddFriend = async (friend: any) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`http://localhost:8000/users/${user.id}/add-friend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend })
      });
      if (response.ok) {
        const data = await response.json();

        // Use the REVEALED friend object from backend if available
        const revealedFriend = data.friend || friend;

        const updatedInnerCircle = [...innerCircle, revealedFriend];
        setInnerCircle(updatedInnerCircle);
        setTempFriends((prev) => prev.filter(f => f.id !== friend.id));
        setSelectedFriend(revealedFriend);

        // Update local session
        const updatedUser = { ...user, inner_circle: updatedInnerCircle };
        setUser(updatedUser);
        localStorage.setItem("user_session", JSON.stringify(updatedUser));
      }
    } catch (e) { console.error(e); }
  };

  const getDisplayName = (f: any) => {
    if (!f) return "Kindred Spirit";
    if (f.alias) return f.alias;
    if (f.name) return f.name;
    if (f.firstName || f.lastName) {
      return `${f.firstName || ""} ${f.lastName || ""}`.trim();
    }
    return "Kindred Spirit";
  };

  const getInitials = (name: string) => {
    if (!name || name === "??") return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) return <div className="min-h-screen bg-black flex items-center justify-center font-black text-[#D4FF3F]">SYNCING...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* TOP NAV */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/dashboard" onClick={() => setSelectedFriend(null)} className="text-2xl font-black text-[#D4FF3F] tracking-tighter uppercase italic">
            Quietly
          </Link>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <div className="w-2 h-2 rounded-full bg-[#D4FF3F] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Encrypted</span>
             </div>
             <Avatar className="h-8 w-8 border border-[#D4FF3F]/50 shadow-[0_0_10px_rgba(212,255,63,0.2)]">
                <AvatarFallback className="bg-zinc-900 text-[#D4FF3F] text-xs font-bold">{getInitials(user.firstName)}</AvatarFallback>
             </Avatar>
          </div>
        </div>
      </nav>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 pt-24">
        {/* LEFT SIDEBAR */}
        <aside className="sticky top-24 hidden h-[calc(100vh-6rem)] w-64 flex-col gap-6 lg:flex">
          <nav className="space-y-2">
            <Button variant="ghost" onClick={() => setSelectedFriend(null)} className={`w-full justify-start gap-3 rounded-xl font-bold uppercase text-xs tracking-widest h-11 ${!selectedFriend ? 'bg-[#D4FF3F] text-black shadow-lg shadow-[#D4FF3F]/20' : 'hover:bg-secondary'}`}>
              <Home className="h-4 w-4" /> Home Feed
            </Button>
            <Button variant="ghost" onClick={() => router.push("/onboarding?mode=discovery")} className="w-full justify-start gap-3 rounded-xl font-bold uppercase text-xs tracking-widest h-11 border border-[#D4FF3F]/20 text-[#D4FF3F] hover:bg-[#D4FF3F] hover:text-black">
              <UserPlus className="h-4 w-4" /> Find Matches
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
                  <Avatar className={`h-8 w-8 border border-white/10 ${f.color || 'bg-zinc-800'}`}>
                    <AvatarFallback className="text-[10px] font-bold">
                      {getInitials(getDisplayName(f))}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-bold">{getDisplayName(f)}</span>
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
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={`text-[10px] font-black ${m.color || 'bg-orange-500/20 text-orange-500'}`}>
                        {getInitials(m.alias || m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold italic">{m.alias || m.name}</span>
                      <span className="text-[9px] uppercase font-black text-orange-500">Trial Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </section>

          {tempFriends.length > 0 && (
            <section className="mt-4">
              <h3 className="mb-3 px-2 text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2"><Zap className="h-3 w-3 fill-orange-500" /> Active Trials</h3>
              {tempFriends.map((m) => (
                <div key={m.id} onClick={() => setSelectedFriend(m)} className={`flex items-center gap-3 rounded-xl p-2 cursor-pointer border border-orange-500/20 mb-1 ${selectedFriend?.id === m.id ? 'bg-orange-500/10' : ''}`}>
                  <Avatar className="h-8 w-8"><AvatarFallback className="bg-orange-500/20 text-orange-500 text-[10px] font-black">??</AvatarFallback></Avatar>
                  <span className="text-sm font-bold italic truncate">{m.alias}</span>
                </div>
              ))}
            </section>
          )}

          <Button onClick={handleLogout} variant="ghost" className="mt-auto w-full justify-start gap-3 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 text-xs font-bold uppercase h-11 rounded-xl">
            <LogOut className="h-4 w-4" /> Logoff
          </Button>
        </aside>

        {/* CENTER CONTENT */}
        <main className="flex-1 space-y-6 pb-20">
          {selectedFriend ? (
            <Card className="flex flex-col h-[calc(100vh-12rem)] border-white/5 bg-zinc-900/40 backdrop-blur-xl overflow-hidden shadow-2xl">
              {/* Chat Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/60 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedFriend(null)}><ArrowLeft /></Button>
                  <Avatar className={selectedFriend.color || 'bg-zinc-800'}>
                    <AvatarFallback className="font-bold">
                      {getInitials(getDisplayName(selectedFriend))}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-black italic uppercase tracking-tight">{getDisplayName(selectedFriend)}</p>
                    <p className="text-[10px] text-[#D4FF3F] font-black uppercase tracking-widest">Encrypted Connection</p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  <div className="flex justify-center mb-8 opacity-40">
                    <span className="text-[9px] uppercase font-black tracking-[0.4em] text-white border border-white/10 px-4 py-1 rounded-full">Secure Handshake Complete</span>
                  </div>

                  {(chatHistories[selectedFriend.id] || []).map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
                      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                        msg.sender === "me" 
                          ? "bg-[#D4FF3F] text-black font-semibold rounded-tr-none shadow-[0_5px_15px_rgba(212,255,63,0.15)]" 
                          : "bg-zinc-800 text-white border border-white/10 rounded-tl-none"
                      }`}>
                        <p className="leading-relaxed">{msg.text}</p>
                        <p className={`text-[8px] mt-2 font-black uppercase opacity-40 ${msg.sender === "me" ? "text-black" : "text-white"}`}>{msg.timestamp}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-4 bg-zinc-900/60 border-t border-white/5">
                <div className="flex gap-2 max-w-3xl mx-auto">
                  <Input
                    placeholder={`Speak to ${selectedFriend.alias}...`}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="rounded-xl bg-white/5 border-white/10 focus:border-[#D4FF3F]/50 h-12 text-white"
                  />
                  <Button onClick={handleSendMessage} size="icon" className="rounded-xl bg-[#D4FF3F] text-black hover:bg-[#D4FF3F]/90 h-12 w-12 shrink-0 transition-transform active:scale-90">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            /* HOME FEED */
            <div className="space-y-6">
              <Card className="p-4 border-white/5 bg-zinc-900/50 backdrop-blur-xl">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10 border border-[#D4FF3F]/30"><AvatarFallback className="bg-zinc-800 text-[#D4FF3F] font-bold">{getInitials(user.firstName)}</AvatarFallback></Avatar>
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

              {posts.map((post) => (
                <Card key={post.id} className="border-white/5 bg-zinc-900/30 overflow-hidden group hover:bg-zinc-900/50 transition-all">
                  <div className="p-4 flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-white/10"><AvatarFallback className="bg-zinc-800 font-bold">{post.initials}</AvatarFallback></Avatar>
                    <div><p className="text-xs font-black uppercase">{post.author}</p><p className="text-[9px] text-muted-foreground font-bold">{post.time}</p></div>
                  </div>
                  <div className="px-4 pb-6 text-sm text-zinc-300">{post.content}</div>
                </Card>
              ))}
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR - VIBE PANEL */}
        <aside className="sticky top-24 hidden w-80 flex-col gap-6 xl:flex">
          {selectedFriend ? (
            <Card className="p-6 border-[#D4FF3F]/20 bg-[#D4FF3F]/5 backdrop-blur-xl animate-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center text-center mb-6">
                <Avatar className={`h-20 w-20 mb-3 border-4 border-zinc-900 shadow-2xl ${selectedFriend.color || 'bg-zinc-800'}`}>
                  <AvatarFallback className="text-2xl font-black italic">
                    {getInitials(getDisplayName(selectedFriend))}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-black text-xl italic uppercase tracking-tighter">{getDisplayName(selectedFriend)}</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-[#D4FF3F] uppercase tracking-widest mb-2 flex items-center gap-2"><Bot className="h-3 w-3" /> AI Analysis</h4>
                  <p className="text-xs leading-relaxed text-zinc-300 bg-black/40 p-4 rounded-xl italic">"{selectedFriend.bio}"</p>
                </div>
                {!innerCircle.some(f => f.id === selectedFriend.id) && (
                  <Button className="w-full bg-[#D4FF3F] hover:bg-[#D4FF3F]/90 text-black font-black uppercase text-xs h-12 rounded-xl" onClick={() => handleAddFriend(selectedFriend)}>Add to Inner Circle</Button>
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