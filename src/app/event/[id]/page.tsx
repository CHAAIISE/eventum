import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"
import { Calendar, MapPin, Clock, ExternalLink, Ticket, ShieldCheck, Trophy } from "lucide-react"
import Link from "next/link"

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Mock data - in a real app, fetch based on ID
  const event = {
    id,
    title: "Sui Builder House: Denver",
    description:
      "Join the Sui community for a day of hacking, learning, and networking. This event brings together the best builders in the ecosystem to collaborate on the future of Move. We'll have workshops, lightning talks, and plenty of opportunities to connect with the Mysten Labs team.",
    date: "March 15, 2025",
    time: "10:00 AM - 6:00 PM",
    location: "The McNichols Building, Denver, CO",
    price: "5 SUI",
    spotsTotal: 500,
    spotsLeft: 42,
    organizer: "Sui Foundation",
    image: "/placeholder.svg?height=600&width=1200&text=Event+Cover",
    status: "Open", // Open, Sold Out, Ended
    userStatus: "none", // none, acquired, checked-in, winner
    hasPrizePool: true, // Added hasPrizePool
    prizePoolAmount: 5000, // Added prizePoolAmount
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header Image with Gradient Overlay */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-10" />
        <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay z-10" />
        <img src={event.image || "/placeholder.svg"} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute bottom-0 left-0 w-full z-20 p-4">
          <div className="container mx-auto max-w-6xl">
            <Badge className="mb-4 bg-cyan-500/20 text-cyan-300 border-cyan-500/30 backdrop-blur-md">Hackathon</Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">{event.title}</h1>
            <div className="flex items-center gap-2 text-white/80 mb-8">
              <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
              <span>Hosted by {event.organizer}</span>
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
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-blue-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium text-white">{event.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-cyan-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium text-white">{event.location}</p>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-4 text-white">About Event</h2>
              <p className="text-muted-foreground leading-relaxed text-lg mb-8">{event.description}</p>

              <h3 className="text-lg font-bold mb-4 text-white">Attendees</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-10 w-10 rounded-full border-2 border-background bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg"
                    />
                  ))}
                  <div className="h-10 w-10 rounded-full border-2 border-background bg-white/10 backdrop-blur-sm flex items-center justify-center text-xs text-white">
                    +458
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="text-white font-medium">458</span> attending
                </p>
              </div>
            </GlassCard>
          </div>

          {/* Sidebar Action Area */}
          <div className="lg:col-span-1 space-y-6">
            <GlassCard className="p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <span className="text-muted-foreground">Ticket Price</span>
                <span className="text-2xl font-bold text-cyan-400">{event.price}</span>
              </div>

              <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Spots Remaining</span>
                  <span className="text-white">
                    {event.spotsLeft} / {event.spotsTotal}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    style={{ width: `${(1 - event.spotsLeft / event.spotsTotal) * 100}%` }}
                  />
                </div>
              </div>

              <Button className="w-full h-12 text-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0 shadow-lg shadow-cyan-900/20 mb-4 font-bold tracking-wide group">
                <Ticket className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                Mint Ticket
              </Button>

              <Link
                href="#"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors w-full py-2"
              >
                View Secondary Market (TradePort)
                <ExternalLink className="h-3 w-3" />
              </Link>

              {/* Ticket Status Mockup */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Your Status</p>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <ShieldCheck className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-400">Ticket Acquired</p>
                    <p className="text-xs text-green-400/70">Token ID #8832</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {event.hasPrizePool && (
              <GlassCard className="p-6 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="h-5 w-5 text-amber-400" />
                  <h3 className="font-bold text-amber-400">
                    Prize Pool Locked: {event.prizePoolAmount?.toLocaleString()} SUI
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Participate to earn reputation points and share from the prize pool.
                </p>
                <div className="flex -space-x-1 overflow-hidden py-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-amber-500/80" />
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
