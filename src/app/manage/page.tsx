"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"
import { Switch } from "@/components/ui/switch"
import {
  Calendar,
  Clock,
  ImageIcon,
  Ticket,
  Upload,
  Rocket,
  Trophy,
  Coins,
  Percent,
  Users,
  Search,
  Save,
  Download,
  ChevronRight,
  QrCode,
  X,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface Event {
  id: number
  title: string
  date: string
  attendees: number
  status: "Active" | "Upcoming" | "Finished"
  type: "standard" | "competition"
}

export default function ManagePage() {
  const [view, setView] = useState<"create" | "dashboard">("dashboard")

  // Create form state
  const [eventType, setEventType] = useState<"standard" | "competition">("standard")
  const [isPaid, setIsPaid] = useState(false)
  const [hasPrizePool, setHasPrizePool] = useState(false)

  // Dashboard state
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"Active" | "Upcoming" | "Finished">("Active")
  const [showQRModal, setShowQRModal] = useState(false)

  const handleEventClick = (id: number) => {
    setSelectedEventId(id === selectedEventId ? null : id)
  }

  const handleEndEvent = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    setEvents(events.map((ev) => (ev.id === id ? { ...ev, status: "Finished" } : ev)))
    if (selectedEventId === id) setSelectedEventId(null)
  }

  const currentEvent = events.find((e) => e.id === selectedEventId)
  const filteredEvents = events.filter((e) => e.status === activeTab)

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Manage
          </h1>
          <p className="text-muted-foreground text-lg">Create and manage your events</p>
        </div>

        <div className="flex items-center gap-2 mb-10 p-1 bg-white/5 rounded-lg w-fit border border-white/10">
          <button
            onClick={() => setView("dashboard")}
            className={`px-8 py-3 rounded-md text-sm font-medium transition-all ${
              view === "dashboard"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/30"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            My Created Events
          </button>
          <button
            onClick={() => setView("create")}
            className={`px-8 py-3 rounded-md text-sm font-medium transition-all ${
              view === "create"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/30"
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            }`}
          >
            Create New Event
          </button>
        </div>

        {/* View A: Create New Event Form */}
        {view === "create" && (
          <div className="max-w-3xl mx-auto">
            <GlassCard className="p-8 md:p-10 border-white/10">
              <form className="space-y-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">
                      Event Title
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g. Sui Builder House 2025"
                      className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50 focus:ring-cyan-500/20 h-12 text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Tell us about your event..."
                      className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50 focus:ring-cyan-500/20 min-h-[150px] resize-none text-base"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-white">
                        Date
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="date"
                          type="date"
                          className="pl-10 bg-white/5 border-white/10 text-white focus:border-cyan-500/50 focus:ring-cyan-500/20 h-12"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-white">
                        Time
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="time"
                          type="time"
                          className="pl-10 bg-white/5 border-white/10 text-white focus:border-cyan-500/50 focus:ring-cyan-500/20 h-12"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="space-y-0.5">
                      <Label className="text-base text-white">Competition Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable ranking systems and scoreboards for this event.
                      </p>
                    </div>
                    <Switch
                      checked={eventType === "competition"}
                      onCheckedChange={(checked) => setEventType(checked ? "competition" : "standard")}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="space-y-0.5">
                        <Label className="text-base text-white">Paid Event & Royalties</Label>
                        <p className="text-sm text-muted-foreground">
                          Require a ticket purchase and set secondary sales royalties.
                        </p>
                      </div>
                      <Switch checked={isPaid} onCheckedChange={setIsPaid} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="supply" className="text-white">
                          Total Ticket Supply
                        </Label>
                        <div className="relative">
                          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="supply"
                            type="number"
                            placeholder="1000"
                            className="pl-10 bg-white/5 border-white/10 text-white focus:border-cyan-500/50 focus:ring-cyan-500/20 h-12"
                          />
                        </div>
                      </div>

                      {isPaid && (
                        <>
                          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label htmlFor="price" className="text-white">
                              Price (SUI)
                            </Label>
                            <div className="relative">
                              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="price"
                                type="number"
                                placeholder="10"
                                className="pl-10 bg-white/5 border-white/10 text-white focus:border-cyan-500/50 focus:ring-cyan-500/20 h-12"
                              />
                            </div>
                          </div>

                          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 md:col-span-2">
                            <Label htmlFor="royalty" className="text-white">
                              Royalty Percentage (%)
                            </Label>
                            <div className="relative">
                              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="royalty"
                                type="number"
                                placeholder="5"
                                max="100"
                                className="pl-10 bg-white/5 border-white/10 text-white focus:border-cyan-500/50 focus:ring-cyan-500/20 h-12"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Percentage of secondary sales revenue sent to the creator.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="space-y-0.5">
                        <Label className="text-base text-white">Prize Pool</Label>
                        <p className="text-sm text-muted-foreground">Lock SUI to be distributed to winners.</p>
                      </div>
                      <Switch checked={hasPrizePool} onCheckedChange={setHasPrizePool} />
                    </div>

                    {hasPrizePool && (
                      <div className="space-y-6 p-6 rounded-lg bg-cyan-500/5 border border-cyan-500/20 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <Label htmlFor="poolAmount" className="text-white">
                            Total Prize Pool to Lock (SUI)
                          </Label>
                          <div className="relative">
                            <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
                            <Input
                              id="poolAmount"
                              type="number"
                              placeholder="5000"
                              className="pl-10 bg-white/5 border-white/10 text-white focus:border-cyan-500/50 focus:ring-cyan-500/20 h-12"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white">Distribution Percentages (%)</Label>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground">1st Place</span>
                              <Input placeholder="50" className="bg-white/5 border-white/10 text-white text-center" />
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground">2nd Place</span>
                              <Input placeholder="30" className="bg-white/5 border-white/10 text-white text-center" />
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground">3rd Place</span>
                              <Input placeholder="20" className="bg-white/5 border-white/10 text-white text-center" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Cover Image</Label>
                    <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:bg-white/5 hover:border-cyan-500/30 transition-all cursor-pointer group">
                      <div className="mx-auto h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6 text-muted-foreground group-hover:text-cyan-400" />
                      </div>
                      <p className="text-sm text-muted-foreground group-hover:text-white transition-colors">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground/50 mt-2">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                    </div>
                    <div className="relative mt-2">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Or paste image URL..."
                        className="pl-10 bg-white/5 border-white/10 text-white focus:border-cyan-500/50 focus:ring-cyan-500/20"
                      />
                    </div>
                  </div>
                </div>

                <Button className="w-full h-14 text-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0 shadow-lg shadow-cyan-900/20 font-bold tracking-wide mt-8 group">
                  <Rocket className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                  Launch Event On-Chain
                </Button>
              </form>
            </GlassCard>
          </div>
        )}

        {/* View B: My Created Events Dashboard */}
        {view === "dashboard" && (
          <>
            <div className="flex items-center justify-between mb-8">
              <Button className="bg-white/10 text-white hover:bg-white/20 border border-white/10">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>

            <div className="flex items-center gap-2 mb-8 p-1 bg-white/5 rounded-lg w-fit border border-white/10">
              {(["Active", "Upcoming", "Finished"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab)
                    setSelectedEventId(null)
                  }}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/20"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Events List */}
              <div className="lg:col-span-4 space-y-4">
                <h2 className="text-xl font-bold text-white mb-4">{activeTab} Events</h2>

                {filteredEvents.length === 0 ? (
                  <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10 border-dashed">
                    <p className="text-muted-foreground">No {activeTab.toLowerCase()} events found.</p>
                  </div>
                ) : (
                  filteredEvents.map((event) => (
                    <GlassCard
                      key={event.id}
                      className={`p-4 cursor-pointer transition-all group ${
                        selectedEventId === event.id
                          ? "border-cyan-500/50 bg-white/10 ring-1 ring-cyan-500/20"
                          : "hover:bg-white/10"
                      }`}
                      onClick={() => handleEventClick(event.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            event.status === "Active"
                              ? "border-green-500/30 text-green-400"
                              : event.status === "Upcoming"
                                ? "border-blue-500/30 text-blue-400"
                                : "border-white/20 text-muted-foreground"
                          }`}
                        >
                          {event.status}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]"
                        >
                          {event.type === "competition" ? "Competition" : "Standard"}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-white mb-1">{event.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-cyan-400 mb-3">
                        <Calendar className="h-3 w-3" />
                        {event.date}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.attendees} Attendees
                        </div>
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${selectedEventId === event.id ? "rotate-90 text-cyan-400" : ""}`}
                        />
                      </div>

                      {activeTab === "Active" && (
                        <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                          <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-0 h-9 shadow-lg shadow-green-900/20"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowQRModal(true)
                            }}
                          >
                            <QrCode className="mr-2 h-4 w-4" />
                            Show Entrance QR
                          </Button>
                          <Button
                            size="sm"
                            className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20 h-8"
                            onClick={(e) => handleEndEvent(e, event.id)}
                          >
                            End Event & Distribute
                          </Button>
                        </div>
                      )}
                    </GlassCard>
                  ))
                )}
              </div>

              {/* Participant Management */}
              <div className="lg:col-span-8">
                {selectedEventId && currentEvent ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-xl font-bold text-white">Participants: {currentEvent.title}</h2>
                          {currentEvent.status === "Finished" && (
                            <Badge className="bg-white/10 text-white border-white/20">Completed</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Manage attendance {currentEvent.type === "competition" && "and assign rankings"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search wallet..."
                            className="pl-10 bg-white/5 border-white/10 w-[200px] h-9 text-sm"
                          />
                        </div>
                        {currentEvent.type === "competition" && currentEvent.status !== "Finished" && (
                          <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0 h-9">
                            <Save className="mr-2 h-4 w-4" />
                            Submit Rankings
                          </Button>
                        )}
                      </div>
                    </div>

                    <GlassCard className="overflow-hidden">
                      <Table>
                        <TableHeader className="bg-white/5">
                          <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="text-muted-foreground">Participant</TableHead>
                            <TableHead className="text-muted-foreground">Status</TableHead>
                            <TableHead className="text-muted-foreground">Check-in Time</TableHead>
                            {currentEvent.type === "competition" && (
                              <TableHead className="text-muted-foreground w-[150px]">Rank/Score</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {PARTICIPANTS.map((participant) => (
                            <TableRow key={participant.address} className="border-white/5 hover:bg-white/5">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-xs text-white font-mono">
                                    {participant.address.slice(0, 2)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white font-mono">{participant.address}</p>
                                    <p className="text-xs text-muted-foreground">{participant.ens}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    participant.status === "Checked In"
                                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                                      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                  }
                                >
                                  {participant.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{participant.checkInTime}</TableCell>
                              {currentEvent.type === "competition" && (
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      defaultValue={participant.score}
                                      disabled={currentEvent.status === "Finished"}
                                      className="bg-background/50 border-white/10 h-8 w-20 text-right"
                                    />
                                    {participant.score > 90 && <Trophy className="h-4 w-4 text-amber-400" />}
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </GlassCard>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                    <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Select an Event</h3>
                    <p className="text-muted-foreground max-w-sm">
                      Select an event from the list to manage participants, view analytics, and assign on-chain
                      rankings.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
          <DialogContent className="max-w-2xl bg-[#03132b] border-white/10 p-12">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Entrance QR Code</h2>
                <p className="text-muted-foreground">Attendees scan this code at the entrance to check in</p>
              </div>

              {/* Large QR Code Display */}
              <div className="mx-auto w-96 h-96 bg-white rounded-2xl p-8 flex items-center justify-center shadow-2xl">
                <div className="w-full h-full bg-black rounded-lg flex items-center justify-center">
                  <QrCode className="h-48 w-48 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-sm px-4 py-2">
                  Event ID: #EVT-00542
                </Badge>
                <p className="text-xs text-muted-foreground">
                  This QR code is unique to this event and remains active throughout the event duration.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

const INITIAL_EVENTS: Event[] = [
  {
    id: 1,
    title: "Sui Builder House: Denver",
    date: "Mar 15, 2025",
    attendees: 458,
    status: "Active",
    type: "competition",
  },
  {
    id: 2,
    title: "Move Language Workshop",
    date: "Apr 12, 2025",
    attendees: 120,
    status: "Upcoming",
    type: "standard",
  },
  {
    id: 3,
    title: "Sui Summer Hackathon",
    date: "Jun 01, 2025",
    attendees: 850,
    status: "Upcoming",
    type: "competition",
  },
]

const PARTICIPANTS = [
  {
    address: "0x71...3a92",
    ens: "builder.sui",
    status: "Checked In",
    checkInTime: "10:42 AM",
    score: 95,
  },
  {
    address: "0x3a...9b21",
    ens: "pixel_artist.sui",
    status: "Checked In",
    checkInTime: "10:15 AM",
    score: 88,
  },
  {
    address: "0x9c...1f44",
    ens: "defi_king.sui",
    status: "Pending",
    checkInTime: "-",
    score: 0,
  },
  {
    address: "0x2d...8e11",
    ens: "-",
    status: "Checked In",
    checkInTime: "11:30 AM",
    score: 92,
  },
  {
    address: "0x5f...2a33",
    ens: "move_master.sui",
    status: "Checked In",
    checkInTime: "09:55 AM",
    score: 100,
  },
]
