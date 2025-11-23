"use client"

import { useState } from "react"
import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Camera, ExternalLink, Calendar, MapPin, CheckCircle2, Trophy, Medal, Award, QrCode, X, Loader2, Wallet, RefreshCw, Ticket as TicketIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

// --- SUI IMPORTS ---
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { PACKAGE_ID, MODULE_NAME } from "@/lib/contracts"

import { useTicketGenerator } from "@/features/ticket-qr/useTicketGenerator"
import { useMyTicketsAndEvents } from "./useMyTickets"

type TabType = "upcoming" | "active" | "past"

export default function MyEventsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("upcoming")
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrPayload, setQrPayload] = useState<string | null>(null)

  // Sui Hooks
  const account = useCurrentAccount()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  // Utiliser le hook personnalisé
  const { data, isLoading, refetch: refreshData } = useMyTicketsAndEvents()
  const rawTickets = data?.tickets || []
  const eventsData = data?.events || []
  const kioskId = data?.kioskId
  const kioskCapId = data?.kioskCapId

  console.log('🎫 [MyEvents] Raw tickets from hook:', rawTickets.length);
  console.log('🎫 [MyEvents] Events from hook:', eventsData.length);
  console.log('🎫 [MyEvents] Kiosk ID:', kioskId);
  console.log('🎫 [MyEvents] First raw ticket:', rawTickets[0]);
  console.log('🎫 [MyEvents] First event:', eventsData[0]);

  // Mapper les événements pour savoir si le check-in est activé
  const eventsMap = new Map(
    eventsData?.map((obj: any) => [
      obj?.objectId,
      (obj?.content as any)?.fields?.checkin_enabled || false
    ]) || []
  )

  // Transformer les tickets en format utilisable
  const tickets = rawTickets.map((ticket: any) => {
    const fields = (ticket?.content as any)?.fields;
    if (!fields) {
      console.log('⚠️ [MyEvents] Ticket without fields:', ticket);
      return null;
    }

    const checkinEnabled = eventsMap.get(fields.event_id) || false
    
    // Vérifier si l'événement existe
    const eventExists = eventsData.some((e: any) => e?.objectId === fields.event_id);
    if (!eventExists) {
      console.warn('⚠️ [MyEvents] Event not found for ticket:', fields.event_id);
    }

<<<<<<< HEAD
    return {
      id: ticket.objectId,
      eventId: fields.event_id,
      title: fields.title || 'Unknown Event',
      description: fields.description || 'Event information unavailable',
      status: fields.status,
      rank: fields.rank,
      url: fields.url || "https://via.placeholder.com/200x200?text=Ticket",
      ticketIdDisplay: ticket.objectId.slice(0, 6).toUpperCase(),
      checkinEnabled: checkinEnabled,
      eventExists: eventExists
    }
  }).filter((t: any) => t !== null)
=======
  // On récupère les IDs réels des objets (le nom du dynamic field dans un Kiosk = ID de l'objet)
  const realTicketIds: string[] = (kioskFields?.data ?? [])
    .map((f: any) => String(f?.name?.value ?? ""))
    .filter((id: string) => id.length > 0)
>>>>>>> refs/remotes/origin/main

  console.log('🎫 [MyEvents] Formatted tickets:', tickets);
  console.log('🎫 [MyEvents] First formatted ticket:', tickets[0]);

  // Upcoming = Status 0 (Minted) ET check-in PAS encore activé
  const upcomingEvents = tickets.filter((t: any) => t.status === 0 && !t.checkinEnabled)
  // Active = (Status 0 ET check-in activé) OU Status 1 (CheckedIn)
  const activeEvents = tickets.filter((t: any) => (t.status === 0 && t.checkinEnabled) || t.status === 1)
  // Past = Status 2 (Certified)
  const pastEvents = tickets.filter((t: any) => t.status === 2)

<<<<<<< HEAD
  console.log('🎫 [MyEvents] upcomingEvents:', upcomingEvents.length);
  console.log('🎫 [MyEvents] activeEvents:', activeEvents.length);
  console.log('🎫 [MyEvents] pastEvents:', pastEvents.length);
=======
  // --- FILTRAGE DES TICKETS (Active vs Past) ---
  const tickets = ticketsData?.map((obj) => {
    const fields = (obj.data?.content as any)?.fields
    if (!fields) return null
    // On vérifie si c'est bien un ticket de notre module (pour éviter d'afficher d'autres NFTs du Kiosk)
    if (!obj.data?.type?.includes(MODULE_NAME)) return null

    return {
      id: obj.data?.objectId, // ID unique de l'objet
      eventId: fields.event_id,
      title: fields.title,
      description: fields.description,
      status: fields.status, // 0=Minted, 1=CheckedIn, 2=Certified
      rank: fields.rank, // 1=Gold, 2=Silver, 3=Bronze
      url: fields.url, // L'image dynamique
      ticketIdDisplay: obj.data?.objectId.slice(0, 6).toUpperCase()
    }
  }).filter(t => t !== null) || []

  // Active = Status 0 (To Check-in) OU Status 1 (To Claim)
  const activeEvents = tickets.filter(t => t!.status === 0 || t!.status === 1)
  // Past = Status 2 (Finished/Certified)
  const pastEvents = tickets.filter(t => t!.status === 2)
>>>>>>> refs/remotes/origin/main

  // --- ACTIONS BLOCKCHAIN ---
  const handleCheckIn = (ticket: any) => {
    if (!kioskId || !kioskCapId) {
      toast({ title: "Error", description: "Kiosk not found", variant: "destructive" })
      return
    }

    setIsProcessing(true)
    const tx = new Transaction()
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::self_checkin`,
        arguments: [
            tx.object(ticket.eventId),
            tx.object(kioskId),
            tx.object(kioskCapId),
            tx.pure.id(ticket.id)
        ]
    })

    signAndExecute({ transaction: tx }, {
      onSuccess: () => {
        toast({ title: "Check-in Confirmed!", description: "You are marked as present." })
        refreshData()
        setIsProcessing(false)
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" })
        setIsProcessing(false)
      }
    })
  }

  const handleClaim = (ticket: any) => {
    if (!kioskId || !kioskCapId) {
      toast({ title: "Error", description: "Kiosk not found", variant: "destructive" })
      return
    }

    setIsProcessing(true)
    const tx = new Transaction()
    tx.moveCall({

        target: `${PACKAGE_ID}::${MODULE_NAME}::claim_certification`,
        arguments: [
            tx.object(ticket.eventId),
            tx.object(kioskId),
            tx.object(kioskCapId),
            tx.pure.id(ticket.id)
        ]

    })

    signAndExecute({ transaction: tx }, {
      onSuccess: () => {
        toast({ title: "Rewards Claimed!", description: "Your NFT has evolved!" })
        refreshData()
        setIsProcessing(false)
      },
      onError: (err) => {
        console.error(err)
        toast({ title: "Wait for Event End", description: "The organizer hasn't ended the event yet.", variant: "destructive" })
        setIsProcessing(false)
      }
    })
  }

  // --- RENDERING ---
  if (!account) {
    return (
      <div className="min-h-screen pt-40 flex flex-col items-center justify-center">
        <Wallet className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-white mb-2">Wallet Not Connected</h2>
        <p className="text-muted-foreground">Please connect your Sui wallet to view your tickets.</p>
      </div>
    )
  }

  // Vérifier si l'utilisateur a un Kiosk
  if (!isLoading && !kioskId) {
    return (
        <div className="min-h-screen pt-40 flex flex-col items-center justify-center max-w-md mx-auto text-center px-4">
            <TicketIcon className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-white mb-2">No Kiosk Found</h2>
            <p className="text-muted-foreground mb-4">
                You don&apos;t have a Kiosk yet. A Kiosk will be automatically created when you purchase your first ticket.
            </p>
            <p className="text-sm text-muted-foreground/70">
                Browse events and buy a ticket to get started!
            </p>
        </div>
    )
  }

  if (isLoading) {
    return (
        <div className="min-h-screen pt-40 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (

    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">My Tickets</h1>
          <Button onClick={() => refreshData()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />

            Refresh
          </Button>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-8">
          <Button
            onClick={() => setActiveTab("upcoming")}
            variant={activeTab === "upcoming" ? "default" : "outline"}
            className="flex-1"
          >
            Upcoming ({upcomingEvents.length})
          </Button>
          <Button
            onClick={() => setActiveTab("active")}
            variant={activeTab === "active" ? "default" : "outline"}
            className="flex-1"
          >
            Active ({activeEvents.length})
          </Button>
          <Button
            onClick={() => setActiveTab("past")}
            variant={activeTab === "past" ? "default" : "outline"}
            className="flex-1"
          >
            Past/POAPs ({pastEvents.length})
          </Button>
        </div>


        {/* UPCOMING SECTION */}
        {activeTab === "upcoming" && (
          <div className="space-y-6">
            {upcomingEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No upcoming events</p>
            ) : (
              upcomingEvents.map((ticket: any) => (
                <GlassCard key={ticket.id} className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Image du NFT */}
                    <div className="relative">
                      <img 
                        src={ticket.url} 
                        alt={ticket.title} 
                        className="w-48 h-48 object-cover rounded-lg border-2 border-primary/20" 

                      />
                      <Badge className="absolute top-2 left-2">#{ticket.ticketIdDisplay}</Badge>
                    </div>
                    
                    {/* Infos du ticket */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2">{ticket.title}</h3>
                      <p className="text-muted-foreground mb-4">{ticket.description}</p>
                      
                      <div className="flex gap-2 mb-4 flex-wrap">
                        <Badge variant="outline">Status: Minted</Badge>
                        <Badge variant="outline">Event ID: {ticket.eventId?.slice(0, 8)}...</Badge>
                        {!ticket.eventExists && (
                          <Badge variant="destructive">⚠️ Event Not Found (Old Package)</Badge>
                        )}
                      </div>

                      {/* Bouton QR Code */}
                      <Button 
                        onClick={() => {
                          setQrPayload(`${ticket.id}|${ticket.eventId}`);
                          setShowQRModal(true);
                        }}
                        variant="outline"
                        className="w-full"
                        disabled={!ticket.eventExists}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        {ticket.eventExists ? 'Generate QR Code for Check-in' : 'QR Code Unavailable (Buy New Ticket)'}
                      </Button>
                      
                      {!ticket.eventExists && (
                        <p className="text-xs text-muted-foreground mt-2">
                          This ticket is from an old contract version. Please purchase a new ticket from the current events.
                        </p>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        )}

        {/* ACTIVE SECTION */}
        {activeTab === "active" && (
          <div className="space-y-6">
            {activeEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No active events</p>
            ) : (
              activeEvents.map((event: any) => (
                <GlassCard key={event.id} className="p-6">
                  <div className="flex items-start gap-6">
                    <img src={event.url} alt={event.title} className="w-32 h-32 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                      <p className="text-muted-foreground mb-4">{event.description}</p>
                      <Badge>Ticket #{event.ticketIdDisplay}</Badge>
                      {event.status === 0 && (
                        <Button onClick={() => handleCheckIn(event)} className="mt-4" disabled={isProcessing}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Check In
                        </Button>
                      )}
                      {event.status === 1 && (
                        <div className="flex items-center gap-4 mt-4">
                          <Badge variant="secondary">✓ Checked In</Badge>
                          <Button onClick={() => handleClaim(event)} disabled={isProcessing}>
                            <Trophy className="h-4 w-4 mr-2" />
                            Claim Rewards
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        )}

        {/* PAST SECTION */}
        {activeTab === "past" && (
          <div className="space-y-6">
            {pastEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No past events</p>
            ) : (
              pastEvents.map((event: any) => (
                <GlassCard key={event.id} className="p-6">
                  <div className="flex items-start gap-6">
                    <img src={event.url} alt={event.title} className="w-32 h-32 object-cover rounded-lg" />
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                      <p className="text-muted-foreground mb-4">{event.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge>Ticket #{event.ticketIdDisplay}</Badge>
                        {event.rank === 1 && <Badge variant="secondary"><Trophy className="h-3 w-3 mr-1" />Gold</Badge>}
                        {event.rank === 2 && <Badge variant="secondary"><Medal className="h-3 w-3 mr-1" />Silver</Badge>}
                        {event.rank === 3 && <Badge variant="secondary"><Award className="h-3 w-3 mr-1" />Bronze</Badge>}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        )}
      </div>

      {/* QR CODE MODAL */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Ticket QR Code</DialogTitle>
            <DialogDescription>
              Show this QR code at the event entrance for check-in
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrPayload && (
              <>
                <div className="bg-white p-4 rounded-lg">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPayload)}`}
                    alt="Ticket QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  QR Code contains your ticket ID and event information
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
