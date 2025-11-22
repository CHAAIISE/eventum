"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Camera, ExternalLink, Calendar, MapPin, CheckCircle2, Trophy, Medal, Award } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type TabType = "active" | "past"

export default function MyEventsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("active")
  const [showQRScanner, setShowQRScanner] = useState(false)

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            My Events
          </h1>
          <p className="text-muted-foreground text-lg">Your event tickets and proof-of-attendance badges</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-10 p-1 bg-white/5 rounded-lg w-fit border border-white/10">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-8 py-3 rounded-md text-sm font-medium transition-all ${
              activeTab === "active"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/30"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            Upcoming / Active
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`px-8 py-3 rounded-md text-sm font-medium transition-all ${
              activeTab === "past"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/30"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            Past / POAPs
          </button>
        </div>

        {/* Active Events */}
        {activeTab === "active" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ACTIVE_EVENTS.map((event) => (
              <GlassCard key={event.id} className="overflow-hidden group">
                {/* Ticket Visual */}
                <div className="relative h-56 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border-b border-white/10 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
                  <div className="relative z-10 text-center">
                    <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">#{event.ticketId}</Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">{event.title}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-cyan-400" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-cyan-400" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Action: Scan QR */}
                  <Button
                    onClick={() => setShowQRScanner(true)}
                    className="w-full h-12 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0 shadow-lg shadow-cyan-900/30 font-bold group-hover:shadow-cyan-500/40 transition-all"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Scan QR to Check-in
                  </Button>

                  {/* Secondary Action: Trade */}
                  <button className="w-full text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-2 py-2">
                    Trade on TradePort
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Past Events / POAPs */}
        {activeTab === "past" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PAST_EVENTS.map((event) => (
              <GlassCard key={event.id} className="overflow-hidden">
                {/* Badge Visual */}
                <div className="relative h-56 bg-gradient-to-br from-slate-600/20 to-slate-800/20 border-b border-white/10 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
                  <div className="relative z-10 text-center">
                    {/* Badge Icon */}
                    <div
                      className={`h-24 w-24 mx-auto mb-3 rounded-full flex items-center justify-center shadow-2xl ${
                        event.rank === "Gold"
                          ? "bg-gradient-to-br from-amber-400 to-yellow-600"
                          : event.rank === "Silver"
                            ? "bg-gradient-to-br from-gray-300 to-gray-500"
                            : event.rank === "Bronze"
                              ? "bg-gradient-to-br from-amber-700 to-orange-800"
                              : "bg-gradient-to-br from-slate-500 to-slate-700"
                      }`}
                    >
                      {event.rank === "Gold" ? (
                        <Trophy className="h-12 w-12 text-white" />
                      ) : event.rank === "Silver" ? (
                        <Medal className="h-12 w-12 text-white" />
                      ) : event.rank === "Bronze" ? (
                        <Award className="h-12 w-12 text-white" />
                      ) : (
                        <CheckCircle2 className="h-12 w-12 text-white" />
                      )}
                    </div>
                    <Badge
                      className={`${
                        event.rank === "Gold"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : event.rank === "Silver"
                            ? "bg-gray-400/20 text-gray-300 border-gray-500/30"
                            : event.rank === "Bronze"
                              ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                              : "bg-white/20 text-white border-white/30"
                      }`}
                    >
                      {event.rank || "Attended"}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-2">{event.title}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-cyan-400" />
                      <span>{event.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 font-medium">Verified On-Chain</span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* QR Scanner Modal */}
        <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
          <DialogContent className="max-w-lg bg-[#03132b] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Scan Check-in QR Code</DialogTitle>
            </DialogHeader>
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden border-2 border-cyan-500/30">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cyan-950/50 to-blue-950/50">
                <div className="text-center space-y-4">
                  <Camera className="h-16 w-16 text-cyan-400 mx-auto animate-pulse" />
                  <p className="text-muted-foreground">Camera viewfinder would appear here</p>
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Simulated Camera</Badge>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Position the organizer's entrance QR code within the frame to check in.
            </p>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

const ACTIVE_EVENTS = [
  {
    id: 1,
    ticketId: "00542",
    title: "Sui Builder House: Denver",
    date: "Mar 15, 2025 • 6:00 PM",
    location: "Denver Convention Center",
  },
  {
    id: 2,
    ticketId: "00891",
    title: "Move Language Workshop",
    date: "Apr 12, 2025 • 2:00 PM",
    location: "Virtual Event",
  },
  {
    id: 3,
    ticketId: "01203",
    title: "Sui Summer Hackathon",
    date: "Jun 01, 2025 • 9:00 AM",
    location: "San Francisco",
  },
]

const PAST_EVENTS = [
  {
    id: 1,
    title: "Sui Devcon 2024",
    date: "Dec 10, 2024",
    rank: "Gold" as const,
  },
  {
    id: 2,
    title: "DeFi Builders Meetup",
    date: "Nov 22, 2024",
    rank: "Silver" as const,
  },
  {
    id: 3,
    title: "NFT Art Gallery Opening",
    date: "Oct 15, 2024",
    rank: "Bronze" as const,
  },
  {
    id: 4,
    title: "Web3 Security Workshop",
    date: "Sep 08, 2024",
    rank: null,
  },
]
