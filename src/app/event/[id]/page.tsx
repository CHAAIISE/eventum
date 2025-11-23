"use client"

import { use } from "react" // Nouveau hook React 19/Next 14 pour les params
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"
import { Calendar, MapPin, Clock, ExternalLink, ShieldCheck, Trophy, Loader2 } from "lucide-react"
import Link from "next/link"
import { BuyTicketButton } from "@/components/event/BuyTicketButton" // Import du bouton qu'on vient de créer
import { useSuiClientQuery } from "@mysten/dapp-kit"

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  // Déballage des params (Nécessaire en Client Component Next.js récents)
  const { id } = use(params)

  // 1. Fetcher les données on-chain de l'Event
  const { data: objectData, isPending, error } = useSuiClientQuery(
    "getObject",
    {
      id: id,
      options: { showContent: true },
    }
  )

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
      </div>
    )
  }

  if (error || !objectData?.data) {
    return <div className="text-white pt-32 text-center">Event not found or Error loading data.</div>
  }

  // 2. Parser les champs Move
  // Note: On assume que c'est un MoveObject. On caste grossièrement pour l'accès rapide.
  const fields = (objectData.data.content as any)?.fields
  
  // Normalisation des données
  const event = {
    id,
    title: fields?.title || "Unknown Event",
    description: fields?.description || "No description provided.",
    date: fields?.date || "TBA",
    // time: "10:00 AM", // Pas stocké on-chain dans ta struct actuelle, à ajouter ou parser de la date
    // location: "Online", // Idem
    price: fields?.price || "0",
    spotsTotal: Number(fields?.max_supply || 0),
    spotsTaken: Number(fields?.minted_count || 0),
    organizer: fields?.organizer || "Anonymous",
    image: "/placeholder.svg?height=600&width=1200&text=Event+Cover", // Idéalement stocké dans IPFS/Url
    hasPrizePool: fields?.prize_distribution?.length > 0,
    // Calcul approx du prize pool actuel (balance)
    currentBalance: fields?.balance || 0,
  }

  const spotsLeft = event.spotsTotal - event.spotsTaken
  const progress = event.spotsTotal > 0 ? (event.spotsTaken / event.spotsTotal) * 100 : 0

  return (
    <div className="min-h-screen pb-20">
      {/* Header Image with Gradient Overlay */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-10" />
        <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay z-10" />
        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute bottom-0 left-0 w-full z-20 p-4">
          <div className="container mx-auto max-w-6xl">
            <Badge className="mb-4 bg-cyan-500/20 text-cyan-300 border-cyan-500/30 backdrop-blur-md">
              {event.hasPrizePool ? "Competition" : "Event"}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">{event.title}</h1>
            <div className="flex items-center gap-2 text-white/80 mb-8">
              <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
              <span className="font-mono text-sm">Org: {event.organizer.slice(0, 6)}...{event.organizer.slice(-4)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 -mt-8 relative z-30">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <GlassCard className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-cyan-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium text-white">{event.date}</p>
                  </div>
                </div>
                {/* Placeholder Time/Location si pas dans contract */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-blue-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium text-white">All Day</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-cyan-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium text-white">On-Chain</p>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-4 text-white">About Event</h2>
              <p className="text-muted-foreground leading-relaxed text-lg mb-8">{event.description}</p>
            </GlassCard>
          </div>

          {/* Sidebar Action Area */}
          <div className="lg:col-span-1 space-y-6">
            <GlassCard className="p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <span className="text-muted-foreground">Ticket Price</span>
                <span className="text-2xl font-bold text-cyan-400">
                  {Number(event.price) / 1_000_000_000} SUI
                </span>
              </div>

              <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Spots Remaining</span>
                  <span className="text-white">
                    {spotsLeft} / {event.spotsTotal}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* BOUTON D'ACHAT CONNECTÉ */}
              <BuyTicketButton 
                eventId={event.id} 
                price={event.price} 
              />

              <Link
                href="#"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors w-full py-2"
              >
                View Secondary Market (TradePort)
                <ExternalLink className="h-3 w-3" />
              </Link>

              {/* Status Section (Placeholder, nécessiterait de vérifier si user a un ticket) */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Your Status</p>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Not Registered</p>
                    <p className="text-xs text-muted-foreground/50">Mint a ticket to join</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {event.hasPrizePool && (
              <GlassCard className="p-6 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="h-5 w-5 text-amber-400" />
                  <h3 className="font-bold text-amber-400">
                    Current Prize Pool
                  </h3>
                </div>
                <p className="text-2xl font-bold text-white mb-2">
                    {(Number(event.currentBalance) / 1_000_000_000).toLocaleString()} SUI
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Funded by ticket sales.
                </p>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}