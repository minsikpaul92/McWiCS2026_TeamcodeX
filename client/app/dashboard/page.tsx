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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BACKEND_URL, getWebSocketUrl } from "@/lib/api";

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
  const [showMatchCongrats, setShowMatchCongrats] = useState(false);
  
  // Search State
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResult, setSearchResult] = useState<{ id: string; firstName: string; lastName: string; name: string } | null>(null);

  // --- DISCONNECT CONFIRM ---
  const [disconnectConfirmFriend, setDisconnectConfirmFriend] = useState<{ id: string; displayName: string } | null>(null);

  const selectedFriendRef = useRef<any>(null);
  const userRef = useRef<any>(null);
  const innerCircleRef = useRef<any[]>([]);
  const tempFriendsRef = useRef<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fetchDisplayNamesRef = useRef<() => void>(() => {});
  const wsRef = useRef<WebSocket | null>(null);

  selectedFriendRef.current = selectedFriend;
  userRef.current = user;
  innerCircleRef.current = innerCircle;
  tempFriendsRef.current = tempFriends;

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
      fetch(`${BACKEND_URL}/chat/conversations/${userId}`)
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
      fetch(`${BACKEND_URL}/matching/list/${userId}`)
        .then((res) => res.ok ? res.json() : [])
        .then((data) => setMatchesList(Array.isArray(data) ? data : []))
        .catch(() => setMatchesList([]));
  }, [router]);

  // 2. Resolve Names
  const fetchDisplayNames = useCallback(async () => {
    if (!user?.id) return;
    const ids = new Set<string>();
    [...innerCircle, ...conversationPartners, ...tempFriends].forEach(f => f?.id && ids.add(f.id));
    
    if (ids.size === 0) return;
    try {
      const res = await fetch(`${BACKEND_URL}/users/${user.id}/resolve-display-names`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend_ids: Array.from(ids) }),
      });
      if (res.ok) setDisplayNames(await res.json());
    } catch (_) {}
  }, [user?.id, innerCircle, conversationPartners, tempFriends]);

  useEffect(() => { fetchDisplayNames(); }, [innerCircle.length, tempFriends.length, fetchDisplayNames]);

  useEffect(() => {
    fetchDisplayNamesRef.current = fetchDisplayNames;
  }, [fetchDisplayNames]);

  // 2. WebSocket for real-time messages
  useEffect(() => {
    if (!user?.id) return;
    const wsUrl = getWebSocketUrl(`/chat/ws/${user.id}`);
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
          const response = await fetch(`${BACKEND_URL}/chat/${user.id}/${selectedFriend.id}`);
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
      setMessages([]);
    }
  }, [selectedFriend, user]);

  // 5. Handlers
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

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedFriend || !user) return;

    const messageData = {
      senderId: user.id,
      receiverId: selectedFriend.id,
      content: chatInput.trim(),
    };

    try {
      const response = await fetch(`${BACKEND_URL}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        const savedMsg = await response.json();
        setMessages((prev) => [...prev, savedMsg]);
        setChatInput("");
        setConversationPartners((prev) =>
          prev.map((p) => p.id === selectedFriend.id ? { ...p, label: "Messages" } : p)
        );
      }
    } catch (error) {
      console.error("Send error:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setIsSearching(true);
    setSearchError("");
    setSearchResult(null);
    const userId = user?.id || localStorage.getItem("user_db_id");
    try {
      const response = await fetch(`${BACKEND_URL}/users/search-by-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: searchEmail.toLowerCase().trim(), user_id: userId }),
      });
      const data = await response.json();
      if (response.ok) {
        setSearchResult({ id: data.id, firstName: data.firstName, lastName: data.lastName, name: data.name });
      } else {
        setSearchError(data.detail || "No user found with this email.");
      }
    } catch (e) {
      setSearchError("Connection error.");
    } finally {
      setIsSearching(false);
    }
  };

  const asSearchResultFriend = (r: { id: string; firstName: string; lastName: string; name: string }) => ({
    id: r.id,
    alias: r.name,
    name: r.name,
  });

  const handleStartChatWithSearchResult = () => {
    if (!searchResult) return;
    const friend = asSearchResultFriend(searchResult);
    // Reveal their real name immediately since we searched for them
    setDisplayNames((prev) => ({ ...prev, [friend.id]: searchResult.name }));
    const alreadyInInner = innerCircle.some((f) => f.id === friend.id);
    const alreadyInTemp = tempFriends.some((f) => f.id === friend.id);
    const alreadyInPartners = conversationPartners.some((p) => p.id === friend.id);
    if (!alreadyInPartners && !alreadyInInner && !alreadyInTemp) {
      setConversationPartners((prev) => [...prev, { ...friend, label: "Messages" }]);
    }
    setSelectedFriend(friend);
    setIsSearchOpen(false);
    setSearchEmail("");
    setSearchResult(null);
    setSearchError("");
  };

  const handleAddSearchResultToInner = async () => {
    if (!searchResult || !user) return;
    const friend = asSearchResultFriend(searchResult);
    try {
      const response = await fetch(`${BACKEND_URL}/users/${user.id}/add-friend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend }),
      });
      if (response.ok) {
        const data = await response.json();
        const newInnerCircle = [...innerCircle, friend];
        setInnerCircle(newInnerCircle);
        setUser({ ...user, inner_circle: newInnerCircle });
        localStorage.setItem(`inner_circle_${user.id}`, JSON.stringify(newInnerCircle));
        localStorage.setItem("user_session", JSON.stringify({ ...user, inner_circle: newInnerCircle }));
        setConversationPartners((prev) => prev.filter((p) => p.id !== friend.id));
        setSelectedFriend(friend);
        setIsSearchOpen(false);
        setSearchEmail("");
        setSearchResult(null);
        setSearchError("");
        if (data.is_match) setShowMatchCongrats(true);
      }
    } catch (e) {
      console.error("Failed to add friend", e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    localStorage.removeItem("user_db_id");
    router.push("/login");
  };

  const handleAddFriend = async (friend: any) => {
    try {
      const response = await fetch(`${BACKEND_URL}/users/${user.id}/add-friend`, {
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
        fetchDisplayNames();
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
    const userId = user?.id || localStorage.getItem("user_db_id");
    try {
      const response = await fetch(`${BACKEND_URL}/users/${userId}/remove-friend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend_id: friendId }),
      });
      if (response.ok) {
        const updated = innerCircle.filter((f) => f.id !== friendId);
        setInnerCircle(updated);
        setUser({ ...user, inner_circle: updated });
        if (userId) localStorage.setItem(`inner_circle_${userId}`, JSON.stringify(updated));
        localStorage.setItem("user_session", JSON.stringify({ ...user, inner_circle: updated }));
        if (selectedFriend?.id === friendId) setSelectedFriend(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDisconnectConfirmFriend(null);
    }
  };

  const getDisplayName = (f: any) => displayNames[f?.id] ?? f?.alias ?? f?.name ?? "Anonymous";
  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "A";

  if (!user) return <div className="min-h-screen bg-black flex items-center justify-center text-[#D4FF3F] font-black italic uppercase tracking-widest">Initialising System...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#D4FF3F] selection:text-black">
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

      <AlertDialog open={!!disconnectConfirmFriend} onOpenChange={(open) => !open && setDisconnectConfirmFriend(null)}>
        <AlertDialogContent className="bg-zinc-950 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#D4FF3F] font-black uppercase">Remove from Inner Circle?</AlertDialogTitle>
            <AlertDialogDescription>
              {disconnectConfirmFriend
                ? `Remove ${disconnectConfirmFriend.displayName} from your Inner Circle? You can add them again later.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-black font-black hover:bg-red-600"
              onClick={() => disconnectConfirmFriend && handleRemoveFriend(disconnectConfirmFriend.id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

            {/* SEARCH BUTTON & DIALOG */}
            <Dialog open={isSearchOpen} onOpenChange={(open) => { setIsSearchOpen(open); if (!open) { setSearchResult(null); setSearchError(""); } }}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-4 rounded-xl font-black uppercase text-[10px] tracking-widest h-12 border border-white/5 text-zinc-400 hover:bg-zinc-900">
                  <Search className="h-4 w-4" /> Search
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle className="text-[#D4FF3F] font-black uppercase italic">Search by Email</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="friend@email.com"
                      className="pl-10 bg-white/5 border-white/10 focus:border-[#D4FF3F]"
                      value={searchEmail}
                      onChange={(e) => { setSearchEmail(e.target.value); setSearchError(""); setSearchResult(null); }}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  {searchError && <p className="text-red-500 text-[10px] font-bold uppercase">{searchError}</p>}
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="w-full bg-[#D4FF3F] text-black font-black uppercase text-xs h-11"
                  >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                  </Button>
                  {searchResult && (
                    <div className="rounded-xl border border-[#D4FF3F]/20 bg-[#D4FF3F]/5 p-4 space-y-4">
                      <p className="text-sm font-bold text-[#D4FF3F]">Found: {searchResult.name}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 border-[#D4FF3F]/30 text-[#D4FF3F] hover:bg-[#D4FF3F]/10"
                          onClick={handleStartChatWithSearchResult}
                        >
                          Start chat
                        </Button>
                        <Button
                          className="flex-1 bg-[#D4FF3F] text-black font-black hover:bg-[#D4FF3F]/90"
                          onClick={handleAddSearchResultToInner}
                        >
                          Add to Inner Circle
                        </Button>
                      </div>
                    </div>
                  )}
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
                    onClick={() => setDisconnectConfirmFriend({ id: selectedFriend.id, displayName: getDisplayName(selectedFriend) })}
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