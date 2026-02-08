"use client";

import React, { useEffect, useState } from "react";
import { 
  Home, Users, UserPlus, Search, Image as ImageIcon, 
  MoreHorizontal, MessageSquare, Heart, Share2,
  Bot, Bell, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  
  // 1. STATE FOR USER DATA
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 2. ACCESS DATA FROM DATABASE SESSION
    const savedUser = localStorage.getItem("user_session");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // If no session found, kick back to login
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    router.push("/login");
  };

  // Helper to get initials (e.g., "Jane Doe" -> "JD")
  const getInitials = (name: string) => {
    return name ? name.split(" ").map(n => n[0]).join("").toUpperCase() : "??";
  };

  if (!user) return <div className="min-h-screen bg-background flex items-center justify-center">Loading Quietly...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* --- TOP NAVIGATION BAR --- */}
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/home" className="text-2xl font-bold text-primary font-space-grotesk tracking-tighter">
              Quietly
            </Link>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input 
                placeholder="Search friends or posts..." 
                className="h-10 w-72 rounded-full bg-secondary/50 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div className="h-8 w-[1px] bg-border mx-2 hidden sm:block" />
            
            {/* DYNAMIC USER AVATAR */}
            <div className="flex items-center gap-3 pl-2">
                <span className="hidden lg:block text-sm font-medium">Hi, {user.firstName}</span>
                <Avatar className="h-9 w-9 border border-border cursor-pointer hover:opacity-80 transition-opacity">
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {getInitials(user.firstName)}
                    </AvatarFallback>
                </Avatar>
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 pt-24">
        
        {/* --- LEFT SIDEBAR --- */}
        <aside className="sticky top-24 hidden h-[calc(100vh-6rem)] w-64 flex-col gap-8 lg:flex">
          <nav className="space-y-1">
            <Button variant="ghost" className="w-full justify-start gap-3 rounded-lg bg-accent text-accent-foreground">
              <Home className="h-5 w-5" /> Home Feed
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 rounded-lg">
              <Users className="h-5 w-5" /> Friends
            </Button>
          </nav>

          {/* Temporary Friends (Trial Phase) */}
          <section>
            <div className="mb-3 flex items-center justify-between px-2">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Anonymous Matches</h3>
              <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600">Trial</span>
            </div>
            <div className="space-y-1">
              {[
                { alias: 'User #842', time: '4h left', color: 'bg-blue-500/10 text-blue-600' },
                { alias: 'Quiet Penguin', time: '2d left', color: 'bg-purple-500/10 text-purple-600' }
              ].map((m) => (
                <div key={m.alias} className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/50 cursor-pointer transition-colors group">
                  <Avatar className="h-8 w-8 border-none">
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

        {/* --- CENTER: THE FEED --- */}
        <main className="flex-1 space-y-6 pb-20">
          <Card className="p-4 border-border/50 shadow-sm">
            <div className="flex gap-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user.firstName)}
                </AvatarFallback>
              </Avatar>
              <button className="flex-1 rounded-full bg-secondary/50 px-5 text-left text-sm text-muted-foreground hover:bg-secondary transition-all outline-none">
                What's on your mind, {user.firstName}?
              </button>
            </div>
          </Card>

          {/* Sample Feed Post */}
          <Card className="overflow-hidden border-border/50 shadow-sm">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>SJ</AvatarFallback>
                </Avatar>
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
        </main>

        {/* --- RIGHT SIDEBAR: AI DISCOVERY --- */}
        <aside className="sticky top-24 hidden w-80 flex-col gap-6 xl:flex">
          <Card className="p-5 border-primary/20 bg-primary/[0.03] relative overflow-hidden">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" /> Personalized for {user.firstName}
            </h3>
            <p className="text-xs text-muted-foreground mb-4 leading-normal">
              Based on your interest in <span className="text-foreground font-medium italic">Quiet Spaces</span>, we recommend connecting with others in Montreal.
            </p>
            <Button size="sm" className="w-full rounded-full text-xs font-bold">Discover More</Button>
          </Card>
        </aside>

      </div>
    </div>
  );
}