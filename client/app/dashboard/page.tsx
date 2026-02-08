"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
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

  // --- STATE ---
  const [user, setUser] = useState<any>(null);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [postInput, setPostInput] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]); // Chat history state
  const [innerCircle, setInnerCircle] = useState<any[]>([]);
  const [tempFriends, setTempFriends] = useState<any[]>([]);
  const [conversationPartners, setConversationPartners] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const selectedFriendRef = useRef<any>(null);
  const userRef = useRef<any>(null);
  const innerCircleRef = useRef<any[]>([]);
  const tempFriendsRef = useRef<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fetchDisplayNamesRef = useRef<() => void>(() => {});
  selectedFriendRef.current = selectedFriend;
  userRef.current = user;
  innerCircleRef.current = innerCircle;
  tempFriendsRef.current = tempFriends;

  // --- SEARCH STATE ---
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [showMatchCongrats, setShowMatchCongrats] = useState(false);
  const [matchesList, setMatchesList] = useState<any[]>([]); // For profile lookup (bio, interests, match_score)

  // 1. Auth & Initial Data Load
  useEffect(() => {
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
      const userId = parsedUser.id || dbId;
      setUser(parsedUser);

      // Load persisted inner circle (who we already added) - survives refresh
      const persistedInner = localStorage.getItem(`inner_circle_${userId}`);
      if (persistedInner) {
        try {
          setInnerCircle(JSON.parse(persistedInner));
        } catch (e) {
          console.error("Failed to parse persisted inner circle", e);
        }
      } else if (parsedUser.inner_circle) {
        setInnerCircle(parsedUser.inner_circle);
      }

      // Load persisted temp trials (active trials) - survives refresh
      const persistedTrials = localStorage.getItem(`temp_trials_${userId}`);
      let loadedTempFriends: any[] = [];

      if (persistedTrials) {
        try {
          loadedTempFriends = JSON.parse(persistedTrials);
        } catch (e) {
          console.error("Failed to parse persisted trials", e);
        }
      }

      // Check for NEW transferred matches from the Matches page (merge with persisted)
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
            interests: m.interests || [],
            match_score: m.match_score
          }));
          // Merge new matches, avoid duplicates
          const existingIds = new Set(loadedTempFriends.map((t: any) => t.id));
          const newOnes = formattedMatches.filter((m: any) => !existingIds.has(m.id));
          loadedTempFriends = [...loadedTempFriends, ...newOnes];
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
            interests: matchData.interests || [],
            match_score: matchData.match_score
          };
          if (!loadedTempFriends.some((t: any) => t.id === formattedMatch.id)) {
            loadedTempFriends = [...loadedTempFriends, formattedMatch];
          }
          localStorage.removeItem("current_match_trial");
        } catch (e) {
          console.error("Failed to parse trial match data", e);
        }
      }

      setTempFriends(loadedTempFriends);
      if (loadedTempFriends.length > 0) {
        setSelectedFriend(loadedTempFriends[0]);
      }

      // Persist temp trials for next load
      if (loadedTempFriends.length > 0) {
        localStorage.setItem(`temp_trials_${userId}`, JSON.stringify(loadedTempFriends));
      }

      // 1b. Fetch conversation partners (people who have messaged us or we've messaged)
      const innerIds = new Set((persistedInner ? JSON.parse(persistedInner) : parsedUser.inner_circle || []).map((f: any) => f.id));
      const tempIds = new Set(loadedTempFriends.map((t: any) => t.id));
      fetch(`http://localhost:8000/chat/conversations/${userId}`)
        .then((res) => res.ok ? res.json() : { conversations: [] })
        .then((data) => {
          const partners = (data.conversations || []).map((c: any) => ({
            id: c.partnerId,
            alias: "Anonymous",
            label: "Messages",
            bio: c.lastMessage || "",
            interests: []
          }));
          const filtered = partners.filter((p: any) => !innerIds.has(p.id) && !tempIds.has(p.id));
          setConversationPartners(filtered);
        })
        .catch(() => setConversationPartners([]));

      // 1c. Fetch matches list for profile lookup (bio, interests, match_score) in chat sidebar
      fetch(`http://localhost:8000/matching/list/${userId}`)
        .then((res) => res.ok ? res.json() : [])
        .then((data) => setMatchesList(Array.isArray(data) ? data : []))
        .catch(() => setMatchesList([]));
    }
  }, [router]);

  // 1c. Resolve display names (reveal real name only when both added each other = match)
  const fetchDisplayNames = useCallback(async (extraIds?: string[]) => {
    const userId = user?.id || localStorage.getItem("user_db_id");
    if (!userId) return;
    const ids = new Set<string>(extraIds || []);
    innerCircle.forEach((f) => f?.id && ids.add(f.id));
    conversationPartners.forEach((p) => p?.id && ids.add(p.id));
    tempFriends.forEach((t) => t?.id && ids.add(t.id));
    if (ids.size === 0) return;
    try {
      const res = await fetch(`http://localhost:8000/users/${userId}/resolve-display-names`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend_ids: Array.from(ids) }),
      });
      if (res.ok) {
        const data = await res.json();
        setDisplayNames(data);
      }
    } catch (_) { }
  }, [user?.id, innerCircle, conversationPartners, tempFriends]);

  useEffect(() => {
    if (user?.id) fetchDisplayNames();
  }, [user?.id, innerCircle, conversationPartners, tempFriends]);

  useEffect(() => {
    fetchDisplayNamesRef.current = fetchDisplayNames;
  }, [fetchDisplayNames]);

  // 2. WebSocket for real-time messages
  useEffect(() => {
    if (!user?.id) return;
    const wsUrl = `${typeof window !== "undefined" && window.location.protocol === "https:" ? "wss" : "ws"}://localhost:8000/chat/ws/${user.id}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "match_update") {
          fetchDisplayNamesRef.current?.();
          setShowMatchCongrats(true);
          return;
        }
        if (data.type === "new_message" && data.message) {
          const msg = data.message;
          const u = userRef.current;
          const sf = selectedFriendRef.current;
          if (msg.receiverId === u?.id && msg.senderId === sf?.id) {
            setMessages((prev) => [...prev, msg]);
          }
          setConversationPartners((prev) => {
            const has = prev.some((p) => p.id === msg.senderId);
            const inInner = innerCircleRef.current.some((f) => f.id === msg.senderId);
            const inTemp = tempFriendsRef.current.some((f) => f.id === msg.senderId);
            if (msg.receiverId === u?.id && !has && !inInner && !inTemp) {
              return [...prev, { id: msg.senderId, alias: "Anonymous", label: "New message", bio: msg.content, interests: [] }];
            }
            return prev;
          });
        }
      } catch (_) { }
    };
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [user?.id]);

  // 3. Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Fetch Chat History when a friend is selected
  useEffect(() => {
    if (selectedFriend && user) {
      const fetchMessages = async () => {
        try {
          // Adjust URL if your backend port differs
          const response = await fetch(`http://localhost:8000/chat/${user.id}/${selectedFriend.id}`);
          if (response.ok) {
            const data = await response.json();
            setMessages(data);
          }
        } catch (error) {
          console.error("Failed to fetch messages:", error);
        }
      };
      fetchMessages();
    } else {
      setMessages([]); // Clear messages when returning to feed
    }
  }, [selectedFriend, user]);

  // 5. Handle Sending Messages
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedFriend || !user) return;

    const messageData = {
      senderId: user.id,
      receiverId: selectedFriend.id,
      content: chatInput.trim(),
    };

    try {
      const response = await fetch(`http://localhost:8000/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        const savedMsg = await response.json();
        setMessages((prev) => [...prev, savedMsg]);
        setChatInput(""); // Clear input
        setConversationPartners((prev) =>
          prev.map((p) => p.id === selectedFriend.id ? { ...p, label: "Messages" } : p)
        );
      }
    } catch (error) {
      console.error("Send error:", error);
    }
  };

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
        const newInnerCircle = [...innerCircle, data.friend];
        setInnerCircle(newInnerCircle);
        const updatedUser = { ...user, inner_circle: newInnerCircle };
        setUser(updatedUser);
        localStorage.setItem(`inner_circle_${user.id}`, JSON.stringify(newInnerCircle));
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

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    localStorage.removeItem("user_db_id");
    router.push("/login");
  };

  const handleAddFriend = async (friend: any) => {
    try {
      const response = await fetch(`http://localhost:8000/users/${user.id}/add-friend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend: friend })
      });
      if (response.ok) {
        const data = await response.json();
        const newInnerCircle = [...innerCircle, friend];
        const newTempFriends = tempFriends.filter(f => f.id !== friend.id);
        setInnerCircle(newInnerCircle);
        setTempFriends(newTempFriends);
        setConversationPartners((prev) => prev.filter((p) => p.id !== friend.id));
        setSelectedFriend(null);
        fetchDisplayNames([friend.id]);
        localStorage.setItem(`inner_circle_${user.id}`, JSON.stringify(newInnerCircle));
        if (newTempFriends.length > 0) {
          localStorage.setItem(`temp_trials_${user.id}`, JSON.stringify(newTempFriends));
        } else {
          localStorage.removeItem(`temp_trials_${user.id}`);
        }
        if (data.is_match) setShowMatchCongrats(true);
      }
    } catch (error) {
      console.error("Failed to add friend:", error);
    }
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
        const userId = user?.id || localStorage.getItem("user_db_id");
        if (userId) localStorage.setItem(`inner_circle_${userId}`, JSON.stringify(updated));
        localStorage.setItem("user_session", JSON.stringify({ ...user, inner_circle: updated }));
        if (selectedFriend?.id === friendId) setSelectedFriend(null);
      }
    } catch (e) { console.error(e); }
  };

  const getDisplayName = (f: any) => displayNames[f?.id] ?? f?.alias ?? f?.name ?? "Anonymous";
  const getInitials = (name: string) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??";

  // Merge selectedFriend with match profile (bio, interests, match_score) for chat sidebar
  const getChatProfile = (f: any) => {
    if (!f) return null;
    const matchData = matchesList.find((m: any) => m.id === f.id);
    // Use real bio from matches; avoid showing last message as "bio" for conversation partners
    const bio = matchData?.bio || (f.match_score != null ? f.bio : null) || "";
    const interests = f.interests?.length ? f.interests : (matchData?.interests || []);
    const match_score = f.match_score ?? matchData?.match_score;
    return {
      ...f,
      bio,
      interests,
      match_score,
      displayName: getDisplayName(f),
    };
  };

  if (!user) return <div className="min-h-screen bg-black flex items-center justify-center text-[#D4FF3F]">SYNCING...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Dialog open={showMatchCongrats} onOpenChange={setShowMatchCongrats}>
        <DialogContent className="bg-zinc-950 border-[#D4FF3F]/30 text-white max-w-md text-center">
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="rounded-full bg-[#D4FF3F]/20 p-6">
              <Sparkles className="h-16 w-16 text-[#D4FF3F]" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase italic text-[#D4FF3F] mb-3">
                It&apos;s a Match!
              </DialogTitle>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Congratulations! You and your new friend have both added each other to your Inner Circle.
                Your personal info is now revealed to each other — enjoy your connection!
              </p>
            </div>
            <Button
              onClick={() => setShowMatchCongrats(false)}
              className="w-full bg-[#D4FF3F] hover:bg-[#D4FF3F]/90 text-black font-black uppercase tracking-widest"
            >
              Awesome!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                {innerCircle.length === 0 && <p className="px-2 text-[10px] italic text-muted-foreground">Your circle is empty.</p>}
                {innerCircle.map((f) => (
                  <div key={f.id} onClick={() => setSelectedFriend(f)} className={`flex items-center gap-3 rounded-xl p-2 cursor-pointer transition-all ${selectedFriend?.id === f.id ? 'bg-secondary' : 'hover:bg-secondary/50'}`}>
                    <Avatar className="h-8 w-8 border border-white/10"><AvatarFallback className="bg-zinc-800 text-[10px]">{getInitials(getDisplayName(f))}</AvatarFallback></Avatar>
                    <span className="text-sm font-bold truncate">{getDisplayName(f)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </section>

          {conversationPartners.length > 0 && (
            <section>
              <h3 className="mb-3 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4FF3F]">Messages</h3>
              <div className="space-y-1">
                {conversationPartners.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedFriend(p)}
                    className={`flex items-center gap-3 rounded-xl p-2 cursor-pointer border border-[#D4FF3F]/20 ${selectedFriend?.id === p.id ? 'bg-[#D4FF3F]/10' : 'hover:bg-[#D4FF3F]/5'}`}
                  >
                    <Avatar className="h-8 w-8"><AvatarFallback className="bg-[#D4FF3F]/20 text-[#D4FF3F] text-[10px] font-black">??</AvatarFallback></Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold truncate">{getDisplayName(p)}</span>
                      <span className="text-[9px] uppercase font-black text-[#D4FF3F]">{p.label || "Messages"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

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
                  {messages.length === 0 && (
                    <div className="flex justify-center mb-8">
                      <span className="text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground bg-white/5 px-4 py-1 rounded-full">Conversation Started</span>
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${msg.senderId === user.id
                          ? 'bg-[#D4FF3F] text-black rounded-tr-none font-bold'
                          : 'bg-zinc-800 text-white rounded-tl-none border border-white/5'
                        }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 bg-zinc-900/80 border-t border-white/5">
                <div className="flex gap-2">
                  <Input
                    placeholder="Send message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="rounded-xl bg-white/5 border-white/10 focus:border-[#D4FF3F]/50"
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="icon"
                    className="rounded-xl bg-[#D4FF3F] text-black hover:bg-[#D4FF3F]/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-[60vh] text-muted-foreground text-xs uppercase font-black tracking-widest italic">Broadcast range: Global | Selection required.</div>
          )}
        </main>

        <aside className="sticky top-24 hidden w-80 flex-col gap-6 xl:flex">
          {selectedFriend && (() => {
            const profile = getChatProfile(selectedFriend);
            if (!profile) return null;
            return (
              <Card className="p-6 rounded-3xl border-[#D4FF3F]/20 bg-[#D4FF3F]/5 backdrop-blur-xl">
                <div className="flex justify-between items-start mb-4">
                  <Avatar className="h-12 w-12 rounded-full border border-[#D4FF3F]/30">
                    <AvatarFallback className="bg-zinc-800 text-[#D4FF3F] text-sm font-black">
                      {getInitials(profile.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  {profile.match_score != null && (
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-green-500/20 text-[#D4FF3F] rounded-full">
                      {profile.match_score}% Match
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-1 italic tracking-tight">{profile.displayName}</h3>
                {profile.bio && (
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-3">"{profile.bio}"</p>
                )}
                {profile.interests?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {profile.interests.slice(0, 6).map((interest: string) => (
                      <span key={interest} className="text-[9px] font-bold uppercase tracking-tighter bg-secondary/50 px-2 py-0.5 rounded">
                        #{interest}
                      </span>
                    ))}
                  </div>
                )}
                {innerCircle.some(f => f.id === selectedFriend.id) ? (
                  <Button className="w-full bg-red-500 hover:bg-red-600 text-black font-black uppercase text-xs h-12 rounded-xl" onClick={() => handleRemoveFriend(selectedFriend.id)}>Disconnect</Button>
                ) : (
                  <Button className="w-full bg-[#D4FF3F] hover:bg-[#D4FF3F]/90 text-black font-black uppercase text-xs h-12 rounded-xl" onClick={() => handleAddFriend(selectedFriend)}>Add to Inner Circle</Button>
                )}
              </Card>
            );
          })()}
        </aside>
      </div>
    </div>
  );
}