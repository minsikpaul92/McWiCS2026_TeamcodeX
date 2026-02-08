"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { User, MessageCircle, Heart } from "lucide-react"
import { BACKEND_URL } from "@/lib/api"

// Define what a "Match" looks like
interface Match {
  id: string
  name: string
  bio: string
  interests: string[]
  match_score: number
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleGlobalSayHi = () => {
    const selectedMatches = matches.filter(m => selectedIds.includes(m.id));
    if (selectedMatches.length === 0) return;

    // Store the list for Dashboard to pick up
    localStorage.setItem("current_matches_trial", JSON.stringify(selectedMatches));
    router.push("/dashboard");
  };

  const handleRedoOnboarding = () => {
    // Navigate back to onboarding with a "resume" flag
    router.push("/onboarding?resume=true");
  };

  useEffect(() => {
    let dbId = localStorage.getItem("user_db_id");
    const sessionStr = localStorage.getItem("user_session");

    // Route Guard
    if (!sessionStr) {
      router.push("/login");
      return;
    }

    const session = JSON.parse(sessionStr);
    if (!dbId && session.id) {
      dbId = session.id;
      localStorage.setItem("user_db_id", dbId);
    }

    if (!dbId) {
      router.push("/login");
      return;
    }

    fetch(`${BACKEND_URL}/matching/list/${dbId}`)
      .then((res) => res.json())
      .then((data) => {
        setMatches(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching matches:", err);
        setMatches([]);
        setLoading(false);
      });
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-xl font-space-grotesk italic">Connecting your kindred spirits...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 pb-32">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold font-space-grotesk tracking-tighter italic">Found Spirits</h1>
            <p className="text-muted-foreground text-sm">Quiet connections picked just for you.</p>
          </div>
          <Button
            variant="outline"
            onClick={handleRedoOnboarding}
            className="text-xs font-bold uppercase tracking-widest border-primary/20 hover:bg-primary/5"
          >
            Redo Conversation?
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((match) => {
            const isSelected = selectedIds.includes(match.id);
            return (
              <div
                key={match.id}
                className={`p-6 rounded-3xl border transition-all cursor-pointer ${isSelected ? "border-primary bg-primary/5 shadow-inner" : "border-border bg-card hover:border-primary/30"
                  }`}
                onClick={() => toggleSelect(match.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                    }`}>
                    {isSelected ? <Check size={20} /> : <User size={20} />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-green-500/10 text-green-500 rounded-full">
                    {match.match_score}% Match
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-1 italic tracking-tight">{match.name}</h3>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-2">"{match.bio}"</p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {match.interests.map(interest => (
                    <span key={interest} className="text-[9px] font-bold uppercase tracking-tighter bg-secondary/50 px-2 py-0.5 rounded">
                      #{interest}
                    </span>
                  ))}
                </div>

                <Button
                  variant={isSelected ? "default" : "outline"}
                  className="w-full rounded-xl text-xs font-bold uppercase tracking-widest"
                >
                  {isSelected ? "Added to Circle" : "Add Friend"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8">
          <Button
            size="lg"
            onClick={handleGlobalSayHi}
            className="rounded-full px-8 h-14 shadow-2xl bg-primary text-primary-foreground hover:scale-105 transition-transform font-bold gap-3"
          >
            <MessageCircle size={20} />
            Say Hi to {selectedIds.length} Friends
          </Button>
        </div>
      )}
    </div>
  )
}

function Check({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}