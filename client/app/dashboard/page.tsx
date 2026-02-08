"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Home, Users, UserPlus, Search, Bot, Bell, LogOut, Send,
  ArrowLeft, Sparkles, Zap, Trash2, Mail, Loader2, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();

  // --- STATE ---
  const [user, setUser] = useState<any>(null);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [postInput, setPostInput] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [innerCircle, setInnerCircle] = useState<any[]>([]);
  const [tempFriends, setTempFriends] = useState<any[]>([]);
  const [conversationPartners, setConversationPartners] = useState<any[]>([]);
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [matchesList, setMatchesList] = useState<any[]>([]);
  
  // Search State
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const selectedFriendRef = useRef<any>(null);
  const userRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  selectedFriendRef.current = selectedFriend;
  userRef.current = user;

  // 1. Initial Load & Auth logic
  useEffect(() => {
    const savedSession = localStorage.getItem("user_session");
    const dbId = localStorage.getItem("user_db_id");

    if (!savedSession) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(savedSession);
    const userId = parsedUser.id || parsedUser._id || dbId;
    setUser({ ...parsedUser, id: userId });

    // Load Inner Circle
    const persistedInner = localStorage.getItem(`inner_circle_${userId}`);
    if (persistedInner) {
      try {
        setInnerCircle(JSON.parse(persistedInner));
      } catch (e) { 
        console.error("Data corruption in Inner Circle storage", e); 
      }
    } else if (parsedUser.inner_circle) {
      setInnerCircle(parsedUser.inner_circle);
    }

    // Load Discovery Matches
    const persistedTrials = localStorage.getItem(`temp_trials_${userId}`);
    let loadedTrials = persistedTrials ? JSON.parse(persistedTrials) : [];
    
    const newMatchRaw = localStorage.getItem("current_matches_trial");
    if (newMatchRaw) {
      const newMatches = JSON.parse(newMatchRaw).map((m: any) => ({
        id: m.id, alias: m.name, bio: m.bio, interests: m.interests || [], match_score: m.match_score
      }));
      const existingIds = new Set(loadedTrials.map((t: any) => t.id));
      loadedTrials = [...loadedTrials, ...newMatches.filter((m: any) => !existingIds.has(m.id))];
      localStorage.setItem(`temp_trials_${userId}`, JSON.stringify(loadedTrials));
      localStorage.removeItem("current_matches_trial");
    }
    setTempFriends(loadedTrials);

    // Initial Data Fetch
    fetch(`http://localhost:8000/chat/conversations/${userId}`)
      .then(res => res.json()).then(data => setConversationPartners(data.conversations || []))
      .catch(() => {});

    fetch(`http://localhost:8000/matching/list/${userId}`)
      .then(res => res.json()).then(data => setMatchesList(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [router]);

  // 2. Resolve Names
  const fetchDisplayNames = useCallback(async () => {
    if (!user?.id) return;
    const ids = new Set<string>();
    [...innerCircle, ...conversationPartners, ...tempFriends].forEach(f => f?.id && ids.add(f.id));
    
    if (ids.size === 0) return;
    try {
      const res = await fetch(`http://localhost:8000/users/${user.id}/resolve-display-names`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend_ids: Array.from(ids) }),
      });
      if (res.ok) setDisplayNames(await res.json());
    } catch (_) {}
  }, [user?.id, innerCircle, conversationPartners, tempFriends]);

  useEffect(() => { fetchDisplayNames(); }, [innerCircle.length, tempFriends.length, fetchDisplayNames]);

  // 3. Handlers
  const handlePostSubmit = () => {
    if (!postInput.trim() || !user) return;
    const newPost = {
      id: Math.random().toString(36).substr(2, 9),
      author: user.firstName || "Explorer",
      authorId: user.id,
      initials: (user.firstName?.[0] || "E").toUpperCase(),
      content: postInput,
      time: "Just now"
    };
    setPosts([newPost, ...posts]);
    setPostInput("");
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleDisconnect = (friendId: string) => {
    if (confirm("Sever this connection? Signal history will be archived.")) {
      const updated = innerCircle.filter(f => f.id !== friendId);
      setInnerCircle(updated);
      localStorage.setItem(`inner_circle_${user.id}`, JSON.stringify(updated));
      setSelectedFriend(null);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedFriend) return;
    const res = await fetch(`http://localhost:8000/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: user.id, receiverId: selectedFriend.id, content: chatInput.trim() })
    });
    if (res.ok) {
      setMessages(prev => [...prev, { senderId: user.id, content: chatInput.trim() }]);
      setChatInput("");
    }
  };

  const handleSearchAndAdd = async () => {
    if (!searchEmail.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`http://localhost:8000/users/search-and-add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, target_email: searchEmail.toLowerCase().trim() })
      });
      const data = await res.json();
      if (res.ok) {
        const updated = [...innerCircle, data.friend];
        setInnerCircle(updated);
        localStorage.setItem(`inner_circle_${user.id}`, JSON.stringify(updated));
        setIsSearchOpen(false);
        setSelectedFriend(data.friend);
      } else { setSearchError(data.detail); }
    } finally { setIsSearching(false); }
  };

  const getDisplayName = (f: any) => displayNames[f?.id] ?? f?.alias ?? f?.name ?? "Anonymous";
  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "A";

  if (!user) return <div className="min-h-screen bg-black flex items-center justify-center text-[#D4FF3F] font-black italic uppercase tracking-widest">Initialising System...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#D4FF3F] selection:text-black">
      {/* NAVBAR */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/dashboard" onClick={() => setSelectedFriend(null)} className="text-2xl font-black text-[#D4FF3F] tracking-tighter uppercase italic">Quietly</Link>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
               <p className="text-[10px] font-black uppercase text-[#D4FF3F] leading-none">{user.firstName}</p>
               <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">Status: Active</p>
             </div>
             <Avatar className="h-9 w-9 border border-[#D4FF3F]/30"><AvatarFallback className="bg-zinc-950 text-[#D4FF3F] text-xs font-black">{getInitials(user.firstName || "U")}</AvatarFallback></Avatar>
          </div>
        </div>
      </nav>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 pt-24">
        {/* SIDEBAR LEFT */}
        <aside className="sticky top-24 hidden h-[calc(100vh-6rem)] w-64 flex-col gap-6 lg:flex">
          <nav className="space-y-2">
            <Button variant="ghost" onClick={() => setSelectedFriend(null)} className={`w-full justify-start gap-4 rounded-xl font-black uppercase text-[10px] tracking-widest h-12 transition-all ${!selectedFriend ? 'bg-[#D4FF3F] text-black shadow-[0_0_20px_rgba(212,255,63,0.2)]' : 'text-zinc-400 hover:bg-zinc-900'}`}>
              <Home className="h-4 w-4" /> Home
            </Button>
            
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-4 rounded-xl font-black uppercase text-[10px] tracking-widest h-12 border border-white/5 text-zinc-400 hover:bg-zinc-900">
                  <Search className="h-4 w-4" /> Search
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-white/10 text-white">
                <DialogHeader><DialogTitle className="text-[#D4FF3F] font-black uppercase italic tracking-widest">Establish Link</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <Input placeholder="Enter user email..." value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} className="bg-white/5 border-white/10" />
                  {searchError && <p className="text-red-500 text-[10px] font-black uppercase">{searchError}</p>}
                  <Button onClick={handleSearchAndAdd} disabled={isSearching} className="w-full bg-[#D4FF3F] text-black font-black uppercase text-xs h-11">Sync Link</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" onClick={() => router.push("/onboarding?mode=discovery")} className="w-full justify-start gap-4 rounded-xl font-black uppercase text-[10px] tracking-widest h-12 border border-[#D4FF3F]/10 text-[#D4FF3F] hover:bg-[#D4FF3F] hover:text-black transition-colors">
              <UserPlus className="h-4 w-4" /> Discover
            </Button>
          </nav>

          <section className="flex-1 overflow-hidden">
            <h3 className="mb-4 px-2 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Inner Circle</h3>
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-3">
                {innerCircle.map((f) => (
                  <div key={f.id} onClick={() => setSelectedFriend(f)} className={`flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-all ${selectedFriend?.id === f.id ? 'bg-zinc-900 border border-white/5' : 'hover:bg-zinc-900/50'}`}>
                    <Avatar className="h-8 w-8 border border-white/10"><AvatarFallback className="bg-zinc-800 text-[10px] font-bold">{getInitials(getDisplayName(f))}</AvatarFallback></Avatar>
                    <span className="text-sm font-bold truncate tracking-tight">{getDisplayName(f)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </section>

          <Button onClick={() => { localStorage.clear(); router.push("/login"); }} variant="ghost" className="mt-auto w-full justify-start gap-3 text-zinc-500 hover:text-red-500 text-[10px] font-black uppercase h-12 rounded-xl">
            <LogOut className="h-4 w-4" /> Logoff
          </Button>
        </aside>

        {/* CENTER FEED */}
        <main className="flex-1 space-y-6 pb-20">
          {selectedFriend ? (
            <Card className="flex flex-col h-[calc(100vh-12rem)] border-white/5 bg-zinc-950 rounded-[2rem] overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/20">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedFriend(null)}><ArrowLeft /></Button>
                  <p className="text-sm font-black italic uppercase tracking-widest text-[#D4FF3F]">{getDisplayName(selectedFriend)}</p>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-4 rounded-2xl text-sm ${msg.senderId === user.id ? 'bg-[#D4FF3F] text-black font-bold' : 'bg-zinc-900 text-white border border-white/5'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <div className="p-4 bg-zinc-900/30 border-t border-white/5 flex gap-2">
                <Input placeholder="Transmit message..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} className="bg-white/5 border-white/10 focus:border-[#D4FF3F]/50 h-12 rounded-xl" />
                <Button onClick={handleSendMessage} size="icon" className="h-12 w-12 bg-[#D4FF3F] text-black hover:scale-95 transition-transform"><Send className="h-5 w-5" /></Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-center p-12 text-zinc-600">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">What's on your mind</p>
              </div>

              <Card className="p-4 border-white/5 bg-zinc-900/40 backdrop-blur-md rounded-2xl">
                <div className="flex gap-4">
                  <Input value={postInput} onChange={(e) => setPostInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePostSubmit()} placeholder="Broadcast a thought to the network..." className="bg-white/5 border-white/5 focus:border-[#D4FF3F]/30" />
                  <Button onClick={handlePostSubmit} disabled={!postInput.trim()} className="bg-[#D4FF3F] text-black font-black uppercase text-xs px-8 rounded-xl">Post</Button>
                </div>
              </Card>

              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="p-6 border-white/5 bg-zinc-900/20 hover:bg-zinc-900/30 transition-all rounded-3xl group relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-7 w-7 border border-[#D4FF3F]/20"><AvatarFallback className="text-[10px] bg-black text-[#D4FF3F] font-black">{post.initials}</AvatarFallback></Avatar>
                        <p className="text-[10px] font-black uppercase tracking-widest">{post.author} <span className="text-zinc-600 mx-2">•</span> {post.time}</p>
                      </div>
                      {post.authorId === user.id && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePost(post.id)} className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-zinc-500 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed font-medium">{post.content}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* SIDEBAR RIGHT */}
        <aside className="sticky top-24 hidden w-80 flex-col gap-6 xl:flex">
          {selectedFriend ? (
            <Card className="p-8 rounded-[2.5rem] border-white/5 bg-zinc-950 shadow-2xl animate-in slide-in-from-right-4 duration-500">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-6 border-2 border-[#D4FF3F]/20 p-1 bg-black">
                  <AvatarFallback className="text-3xl font-black bg-zinc-900 text-[#D4FF3F] w-full h-full rounded-full flex items-center justify-center">
                    {getInitials(getDisplayName(selectedFriend))}
                  </AvatarFallback>
                </Avatar>
                
                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">{getDisplayName(selectedFriend)}</h3>
                <p className="text-xs text-zinc-500 mb-8 italic leading-relaxed">"{selectedFriend.bio || "No profile bio decrypted."}"</p>
                
                <div className="flex flex-wrap justify-center gap-2 mb-10">
                  {(selectedFriend.interests || []).map((i: string) => (
                    <span key={i} className="text-[9px] font-black uppercase bg-zinc-900 text-zinc-400 border border-white/5 px-3 py-1.5 rounded-full">#{i}</span>
                  ))}
                </div>

                {innerCircle.some(f => f.id === selectedFriend.id) ? (
                  <Button 
                    onClick={() => handleDisconnect(selectedFriend.id)}
                    className="w-full bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white font-black uppercase text-[10px] tracking-widest h-14 rounded-2xl transition-all"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Disconnect
                  </Button>
                ) : (
                  <Button className="w-full bg-[#D4FF3F] text-black font-black uppercase text-[10px] tracking-widest h-14 rounded-2xl cursor-default">
                    Discovery Profile
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="p-6 border-white/5 bg-zinc-900/40 rounded-3xl">
                <h3 className="font-black text-[10px] uppercase text-[#D4FF3F] mb-4 flex items-center gap-2"><Bot className="h-4 w-4" /> System Insight</h3>
                <p className="text-xs text-zinc-400 italic">"Detected {matchesList.length} resonance patterns. Your signal is clear."</p>
              </Card>
              
              <section>
                <h3 className="mb-4 px-2 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 flex items-center justify-between">
                  Suggested Matches <Sparkles className="h-3 w-3 text-[#D4FF3F]" />
                </h3>
                <div className="space-y-3">
                  {matchesList.slice(0, 3).map((match: any) => (
                    <Card key={match.id} onClick={() => setSelectedFriend(match)} className="p-4 border-white/5 bg-zinc-900/20 hover:bg-[#D4FF3F]/5 transition-all cursor-pointer group rounded-2xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#D4FF3F] shadow-[0_0_8px_#D4FF3F]" />
                        <span className="text-[11px] font-black uppercase italic group-hover:text-[#D4FF3F]">{match.name || "Anonymous"}</span>
                        <span className="ml-auto text-[10px] font-black text-[#D4FF3F]">{match.match_score}%</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 line-clamp-2 italic leading-snug">{match.bio || "Analysing signal..."}</p>
                    </Card>
                  ))}
                </div>
              </section>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}