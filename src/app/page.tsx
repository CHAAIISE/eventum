import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"
import { Calendar, MapPin, Search, ArrowRight } from "lucide-react"

export default function Home() {
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
                placeholder="Search events..."
                className="pl-10 bg-transparent border-transparent focus-visible:ring-0 text-base h-12"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 px-2 md:px-0 no-scrollbar">
              {["All", "Hackathons", "Workshops", "Parties", "Meetups"].map((category) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EVENTS.map((event) => (
              <Link key={event.id} href={`/event/${event.id}`}>
                <GlassCard hoverEffect gradient className="h-full flex flex-col group">
                  <div className="relative h-48 w-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <Badge className="absolute top-3 left-3 z-20 bg-background/50 backdrop-blur-md border-white/10 text-white hover:bg-background/60">
                      {event.category}
                    </Badge>
                    <div className="absolute top-3 right-3 z-20 flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-6 w-6 rounded-full border border-background bg-gradient-to-br from-cyan-500 to-blue-600"
                        />
                      ))}
                      <div className="h-6 w-6 rounded-full border border-background bg-white/10 backdrop-blur-sm flex items-center justify-center text-[10px] text-white">
                        +42
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-cyan-400 mb-2 font-mono">
                      <Calendar className="h-3 w-3" />
                      {event.date}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                      {event.title}
                    </h3>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                        <span className="text-xs text-muted-foreground">By {event.organizer}</span>
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

const EVENTS = [
  {
    id: 1,
    title: "Sui Builder House: Denver",
    date: "MAR 15 • 10:00 AM",
    location: "Denver, CO",
    category: "Hackathon",
    image: "/placeholder.svg?height=400&width=600",
    organizer: "Sui Foundation",
  },
  {
    id: 2,
    title: "DeFi Summit 2025",
    date: "MAR 22 • 2:00 PM",
    location: "Virtual Event",
    category: "Workshop",
    image: "/placeholder.svg?height=400&width=600",
    organizer: "Mysten Labs",
  },
  {
    id: 3,
    title: "Midnight NFT Drop Party",
    date: "APR 05 • 9:00 PM",
    location: "Decentraland",
    category: "Party",
    image: "/placeholder.svg?height=400&width=600",
    organizer: "BlueMove",
  },
  {
    id: 4,
    title: "Move Language Workshop",
    date: "APR 12 • 11:00 AM",
    location: "San Francisco, CA",
    category: "Workshop",
    image: "/placeholder.svg?height=400&width=600",
    organizer: "Sui Foundation",
  },
  {
    id: 5,
    title: "Sui overflow Afterparty",
    date: "MAY 20 • 8:00 PM",
    location: "New York, NY",
    category: "Party",
    image: "/placeholder.svg?height=400&width=600",
    organizer: "SuiNS",
  },
  {
    id: 6,
    title: "GameFi Championship",
    date: "JUN 01 • 10:00 AM",
    location: "Seoul, Korea",
    category: "Hackathon",
    image: "/placeholder.svg?height=400&width=600",
    organizer: "Sui Games",
  },
]
