"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"
import { Calendar, MapPin, Search, ArrowRight, Loader2, Users } from "lucide-react"

// --- SUI IMPORTS ---
import { useAllEvents } from "@/features/events/useAllEvents";

export default function Home() {
  // 1. Récupération de TOUS les événements créés via EventCreated
  const { events: suiData, isLoading: isPending, error } = useAllEvents()

  // 2. Transformation des données (Parsing)
  const events = suiData?.map((obj) => {
    // Sécurité : si l'objet n'existe pas ou erreur
    if (!obj || !obj.content) return null
    
    // Casting des champs Move
    const fields = (obj.content as any).fields

    return {
      id: obj.objectId,
      title: fields.title || "Untitled Event",
      // Le contrat actuel stocke la date en string, parfait
      date: fields.date || "TBA", 
      // Le contrat n'a pas de "location", on met "On-Chain" pour le style
      location: "On-Chain / Sui Network", 
      // Mapping du boolean is_competition vers une catégorie UI
      category: fields.is_competition ? "Competition" : "Standard",
      // Récupération de l'image depuis asset_urls (premier élément du vecteur)
      image: fields.asset_urls && fields.asset_urls.length > 0 ? fields.asset_urls[0] : "/placeholder.svg?height=400&width=600", 
      organizer: "Community Organizer", // On pourrait afficher l'adresse fields.organizer raccourcie
      price: Number(fields.price) / 1_000_000_000,
      attendees: fields.minted_count,
      max: fields.max_supply
    }
  }).filter((e) => e !== null) || []

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-cyan-400 mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Live on Sui testnet
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Discover the Future of <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Events on Sui
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Connect, participate, and earn rewards. The first decentralized event management platform built for the Sui
            ecosystem.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="#events">
              <Button
                size="lg"
                className="h-12 px-8 text-lg rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-0 shadow-lg shadow-cyan-900/20"
              >
                Explore Events
              </Button>
            </Link>
            <Link href="/manage">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-lg rounded-full border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm"
              >
                Create Event
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="relative z-10 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <GlassCard className="p-2 flex flex-col md:flex-row items-center gap-4 bg-background/60">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events (coming soon)..."
                className="pl-10 bg-transparent border-transparent focus-visible:ring-0 text-base h-12"
                disabled // Disabled pour le hackathon tant qu'on n'a pas d'indexer
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 px-2 md:px-0 no-scrollbar">
              {["All", "Competitions", "Standard"].map((category) => (
                <Button
                  key={category}
                  variant={category === "All" ? "default" : "ghost"}
                  className={
                    category === "All"
                      ? "rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
                      : "rounded-full text-muted-foreground hover:text-white hover:bg-white/5"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Events Grid */}
      <section id="events" className="relative z-10 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          
          {/* ETAT : LOADING */}
          {isPending && (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
                <p className="text-muted-foreground">Fetching events from Sui Blockchain...</p>
             </div>
          )}

          {/* ETAT : ERROR */}
          {error && (
            <div className="text-center py-20 bg-red-500/10 rounded-xl border border-red-500/20">
              <p className="text-red-400">Failed to load events. Check your connection or contract IDs.</p>
            </div>
          )}

          {/* ETAT : EMPTY */}
          {!isPending && events.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No featured events found.</p>
            </div>
          )}

          {/* ETAT : SUCCESS - La Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link key={event!.id} href={`/event/${event!.id}`}>
                <GlassCard hoverEffect gradient className="h-full flex flex-col group">
                  <div className="relative h-48 w-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                    {/* Affichage de l'image de couverture ou gradient de fallback */}
                    {event!.image && !event!.image.includes('placeholder') ? (
                      <img src={event!.image} alt={event!.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${event!.category === 'Competition' ? 'from-amber-600/20 to-purple-900/40' : 'from-cyan-600/20 to-blue-900/40'}`}></div>
                    )}
                    
                    <Badge className={`absolute top-3 left-3 z-20 backdrop-blur-md border-white/10 text-white hover:bg-background/60 ${
                        event!.category === 'Competition' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-background/50'
                    }`}>
                      {event!.category}
                    </Badge>

                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                        <Users className="h-3 w-3 text-cyan-400" />
                        <span className="text-[10px] text-white font-mono">{event!.attendees}/{event!.max}</span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
                            <Calendar className="h-3 w-3" />
                            {event!.date}
                        </div>
                        {event!.price > 0 && (
                            <span className="text-xs font-bold text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-500/30">
                                {event!.price} SUI
                            </span>
                        )}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-1">
                      {event!.title}
                    </h3>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <MapPin className="h-3 w-3" />
                      {event!.location}
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                        <span className="text-xs text-muted-foreground">Verified Org</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-medium text-white bg-white/5 px-2 py-1 rounded-md border border-white/10 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 transition-all">
                        View Details
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}