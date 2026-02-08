"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Home, Users, UserPlus, Search, Bot, Bell, LogOut, Send, 
  ArrowLeft, Sparkles, Zap, Trash2, Mail, Loader2
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [user, setUser] = useState<any>(null);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [postInput, setPostInput] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [innerCircle, setInnerCircle] = useState<any[]>([]);
  const [tempFriends, setTempFriends] = useState<any[]>([]);
  const [chatHistories, setChatHistories] = useState<{ [key: string]: any[] }>({});

  // --- SEARCH STATE ---
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistories, selectedFriend]);

  useEffect(() => {
    const savedUserSession = localStorage.getItem("user_session");
    if (!savedUserSession) {
      router.push("/login");
      return;
    }
    const dbId = localStorage.getItem("user_db_id");
    const parsedUser = JSON.parse(savedUserSession || "{}");
    if (!parsedUser.id && dbId) parsedUser.id = dbId;
    setUser(parsedUser);
    if (parsedUser.inner_circle) setInnerCircle(parsedUser.inner_circle);
  }, [router]);

  const handleSearchAndAdd = async () => {
    if (!searchEmail.trim()) return;
    setIsSearching(true);
    setSearchError("");
    const userId = user?.id || localStorage.getItem("user_db_id");

    try {
      const response = await fetch(`http://localhost:8000/users/search-and-add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, target_email: searchEmail.toLowerCase().trim() })
      });
      const data = await response.json();
      if (response.ok) {
        const updatedInnerCircle = [...innerCircle, data.friend];
        setInnerCircle(updatedInnerCircle);
        const updatedUser = { ...user, inner_circle: updatedInnerCircle };
        setUser(updatedUser);
        localStorage.setItem("user_session", JSON.stringify(updatedUser));
        setIsSearchOpen(false);
        setSearchEmail("");
        setSelectedFriend(data.friend);
      } else {
        setSearchError(data.detail || "User not found.");
      }
    } catch (e) {
      setSearchError("Connection error.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = () => { localStorage.clear(); router.push("/login"); };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !selectedFriend) return;
    const newMessage = {
      id: Date.now(),
      text: chatInput,
      sender: "me",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatHistories(prev => ({ ...prev, [selectedFriend.id]: [...(prev[selectedFriend.id] || []), newMessage] }));
    setChatInput("");
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm("Terminate connection?")) return;
    const userId = user?.id || localStorage.getItem("user_db_id");
    try {
      const response = await fetch(`http://localhost:8000/users/${userId}/remove-friend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_id: friendId })
      });
      if (response.ok) {
        const updated = innerCircle.filter(f => f.id !== friendId);
        setInnerCircle(updated);
        setUser({ ...user, inner_circle: updated });
        localStorage.setItem("user_session", JSON.stringify({ ...user, inner_circle: updated }));
        if (selectedFriend?.id === friendId) setSelectedFriend(null);
      }
    } catch (e) { console.error(e); }
  };

  const getDisplayName = (f: any) => f?.alias || f?.name || "Kindred Spirit";
  const getInitials = (name: string) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??";

  if (!user) return <div className="min-h-screen bg-black flex items-center justify-center text-[#D4FF3F]">SYNCING...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/dashboard" onClick={() => setSelectedFriend(null)} className="text-2xl font-black text-[#D4FF3F] tracking-tighter uppercase italic">Quietly</Link>
          <Avatar className="h-8 w-8 border border-[#D4FF3F]/50"><AvatarFallback className="bg-zinc-900 text-[#D4FF3F] text-xs">{getInitials(user.firstName)}</AvatarFallback></Avatar>
        </div>
      </nav>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 pt-24">
        <aside className="sticky top-24 hidden h-[calc(100vh-6rem)] w-64 flex-col gap-6 lg:flex">
          <nav className="space-y-2">
            <Button variant="ghost" onClick={() => setSelectedFriend(null)} className={`w-full justify-start gap-3 rounded-xl font-bold uppercase text-xs tracking-widest h-11 ${!selectedFriend ? 'bg-[#D4FF3F] text-black' : 'hover:bg-secondary'}`}><Home className="h-4 w-4" /> Home</Button>
            
            {/* SEARCH BUTTON & DIALOG */}
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl font-bold uppercase text-xs tracking-widest h-11 border border-white/10 hover:bg-secondary"><Search className="h-4 w-4" /> Search </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle className="text-[#D4FF3F] font-black uppercase italic">Invite by Email</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="friend@email.com" 
                      className="pl-10 bg-white/5 border-white/10 focus:border-[#D4FF3F]" 
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchAndAdd()}
                    />
                  </div>
                  {searchError && <p className="text-red-500 text-[10px] font-bold uppercase">{searchError}</p>}
                  <Button 
                    onClick={handleSearchAndAdd} 
                    disabled={isSearching}
                    className="w-full bg-[#D4FF3F] text-black font-black uppercase text-xs h-11"
                  >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sync Connection"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" onClick={() => router.push("/onboarding?mode=discovery")} className="w-full justify-start gap-3 rounded-xl font-bold uppercase text-xs tracking-widest h-11 border border-[#D4FF3F]/20 text-[#D4FF3F] hover:bg-[#D4FF3F] hover:text-black"><UserPlus className="h-4 w-4" /> Discover</Button>
          </nav>

          <section className="flex-1 overflow-hidden">
            <h3 className="mb-3 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Inner Circle</h3>
            <ScrollArea className="h-full">
              <div className="space-y-1 pr-3">
                {innerCircle.map((f) => (
                  <div key={f.id} onClick={() => setSelectedFriend(f)} className={`flex items-center gap-3 rounded-xl p-2 cursor-pointer transition-all ${selectedFriend?.id === f.id ? 'bg-secondary' : 'hover:bg-secondary/50'}`}>
                    <Avatar className="h-8 w-8 border border-white/10"><AvatarFallback className="bg-zinc-800 text-[10px]">{getInitials(getDisplayName(f))}</AvatarFallback></Avatar>
                    <span className="text-sm font-bold truncate">{getDisplayName(f)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </section>

          <Button onClick={handleLogout} variant="ghost" className="mt-auto w-full justify-start gap-3 text-muted-foreground hover:text-red-500 text-xs font-bold uppercase h-11 rounded-xl"><LogOut className="h-4 w-4" /> Logoff</Button>
        </aside>

        <main className="flex-1 space-y-6 pb-20">
          {selectedFriend ? (
            <Card className="flex flex-col h-[calc(100vh-12rem)] border-white/5 bg-zinc-900/40 backdrop-blur-xl">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedFriend(null)}><ArrowLeft /></Button>
                  <p className="text-sm font-black italic uppercase">{getDisplayName(selectedFriend)}</p>
                </div>
              </div>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {(chatHistories[selectedFriend.id] || []).map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${msg.sender === "me" ? "bg-[#D4FF3F] text-black font-semibold" : "bg-zinc-800 text-white border border-white/10"}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-white/5">
                <div className="flex gap-2 max-w-3xl mx-auto">
                  <Input placeholder="Message..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} className="rounded-xl bg-white/5 border-white/10" />
                  <Button onClick={handleSendMessage} size="icon" className="bg-[#D4FF3F] text-black h-12 w-12 shrink-0"><Send className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-[60vh] text-muted-foreground text-xs uppercase font-black tracking-widest italic">Broadcast range: Global | Selection required.</div>
          )}
        </main>

        <aside className="sticky top-24 hidden w-80 flex-col gap-6 xl:flex">
          {selectedFriend && (
            <Card className="p-6 border-[#D4FF3F]/20 bg-[#D4FF3F]/5 backdrop-blur-xl">
              <div className="flex flex-col items-center text-center mb-6">
                <Avatar className="h-20 w-20 mb-4"><AvatarFallback className="bg-zinc-800 text-xl font-black">{getInitials(getDisplayName(selectedFriend))}</AvatarFallback></Avatar>
                <h3 className="font-black text-lg italic uppercase">{getDisplayName(selectedFriend)}</h3>
              </div>
              <Button className="w-full bg-red-500 hover:bg-red-600 text-black font-black uppercase text-xs h-12 rounded-xl" onClick={() => handleRemoveFriend(selectedFriend.id)}>Disconnect</Button>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}