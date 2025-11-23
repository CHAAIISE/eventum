"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Camera, ExternalLink, Calendar, MapPin, CheckCircle2, Trophy, Medal, Award, QrCode, X, Loader2, Wallet, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

// --- SUI IMPORTS ---
import { useCurrentAccount, useSuiClientQuery, useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { PACKAGE_ID, MODULE_NAME } from "@/lib/contracts"

import { useTicketGenerator } from "@/features/ticket-qr/useTicketGenerator"
import { Loader2 } from "lucide-react"



type TabType = "active" | "past"

export default function MyEventsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("active")
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrPayload, setQrPayload] = useState<string | null>(null)
<<<<<<< HEAD
  
  // Sui Hooks
  const account = useCurrentAccount()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  // --- 1. RECUPERATION DU KIOSK ---
  const { data: kioskCapData, isPending: isLoadingCap, refetch: refetchCap } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address || "",
      filter: { StructType: "0x2::kiosk::KioskOwnerCap" },
      options: { showContent: true },
    },
    { enabled: !!account }
  )

  const kioskCap = kioskCapData?.data?.[0]
  const kioskId = (kioskCap?.data?.content as any)?.fields?.for
  const kioskCapId = kioskCap?.data?.objectId

  // --- 2. RECUPERATION DES ITEMS DU KIOSK ---
  const { data: kioskFields, isPending: isLoadingFields, refetch: refetchFields } = useSuiClientQuery(
    "getDynamicFields",
    { parentId: kioskId || "" },
    { enabled: !!kioskId }
  )

  // On récupère les IDs réels des objets (le nom du dynamic field dans un Kiosk = ID de l'objet)
    const realTicketIds: string[] = (kioskFields?.data ?? [])
      .map((f: any) => String(f?.name?.value ?? ""))
      .filter((id: string) => id.length > 0)

  // --- 3. RECUPERATION DES TICKETS COMPLETS ---
  const { data: ticketsData, isPending: isLoadingTickets, refetch: refetchTickets } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids: realTicketIds,
      options: { showContent: true, showDisplay: true },
    },
    { enabled: realTicketIds.length > 0 }
  )

  const refreshData = () => {
    refetchCap()
    refetchFields()
    refetchTickets()
  }

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

  // --- ACTIONS BLOCKCHAIN ---

  const handleCheckIn = (ticket: any) => {
    setIsProcessing(true)
    const tx = new Transaction()
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::self_checkin`,
        arguments: [
            tx.object(ticket.eventId),
            tx.object(kioskId),
            tx.object(kioskCapId!),
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
    setIsProcessing(true)
    const tx = new Transaction()
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::claim_certification`,
        arguments: [
            tx.object(ticket.eventId),
            tx.object(kioskId),
            tx.object(kioskCapId!),
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

  const isLoading = isLoadingCap || isLoadingFields || isLoadingTickets
=======
  const [generatingTokenId, setGeneratingTokenId] = useState<string | null>(null)

  const { generateTicket } = useTicketGenerator()

  const handleGenerateQR = async (e: React.MouseEvent, tokenId: string) => {
    e.stopPropagation()
    setGeneratingTokenId(tokenId)
    try {
      const payload = await generateTicket(tokenId)
      if (payload) {
        setQrPayload(payload)
        setShowQRModal(true)
      }
    } finally {
      setGeneratingTokenId(null)
    }
  }
>>>>>>> origin/main

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 flex justify-between items-end">
            <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    My Events
                </h1>
                <p className="text-muted-foreground text-lg">Your event tickets and proof-of-attendance badges</p>
            </div>
            <Button variant="outline" onClick={refreshData} disabled={isLoading} className="border-white/10 hover:bg-white/5">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-10 p-1 bg-white/5 rounded-lg w-fit border border-white/10">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-8 py-3 rounded-md text-sm font-medium transition-all ${activeTab === "active"
              ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/30"
              : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
          >
            Active ({activeEvents.length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`px-8 py-3 rounded-md text-sm font-medium transition-all ${activeTab === "past"
              ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/30"
              : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
          >
            Past / POAPs ({pastEvents.length})
          </button>
        </div>

        {/* Active Events */}
        {activeTab === "active" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeEvents.length === 0 && !isLoading && (
                <div className="col-span-full text-center py-12 border border-dashed border-white/10 rounded-xl">
                    <p className="text-muted-foreground">No active tickets found.</p>
                    <Link href="/"><Button variant="link" className="text-cyan-400">Explore Events</Button></Link>
                </div>
            )}
            
            {activeEvents.map((event) => (
              <GlassCard key={event!.id} className="overflow-hidden group flex flex-col h-full">
                {/* Ticket Visual */}
                <div className="relative h-56 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border-b border-white/10 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
                  
                  {/* Affichage Image Dynamique (Priorité à l'image du NFT, sinon icône) */}
                  {event!.url.startsWith('http') ? (
                      <img src={event!.url} alt="Ticket" className="h-32 w-32 object-contain z-10 drop-shadow-lg" />
                  ) : (
                    <div className="relative z-10 text-center">
                        <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <Calendar className="h-8 w-8 text-white" />
                        </div>
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">#{event!.ticketIdDisplay}</Badge>
                    </div>
                  )}

                  <div className="absolute top-3 right-3">
                    <Badge className={event!.status === 1 ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}>
                        {event!.status === 1 ? "Checked-In" : "Active"}
                    </Badge>
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-5 space-y-4 flex-1 flex flex-col">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">{event!.title}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-cyan-400" />
                        <span>Sui Network</span>
                      </div>
                      <p className="text-xs pt-2 line-clamp-2">{event!.description}</p>
                    </div>
                  </div>

<<<<<<< HEAD
                  <div className="mt-auto space-y-3">
                    {/* LOGIQUE BOUTONS INTELLIGENTS */}
                    
                    {/* CAS 1: Ticket non scanné (Status 0) -> Afficher QR */}
                    {event!.status === 0 && (
                        <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-0 h-9 shadow-lg shadow-green-900/20"
                            onClick={(e) => {
                            e.stopPropagation()
                            // L'ID REEL DU TICKET POUR LE SCANNER
                            setQrPayload(event!.id)
                            setShowQRModal(true)
                            }}
                        >
                            <QrCode className="mr-2 h-4 w-4" />
                            Show Entrance QR
                        </Button>
                    )}
=======
                  {/* Primary Action: Generate QR */}
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-0 h-9 shadow-lg shadow-green-900/20"
                    onClick={(e) => handleGenerateQR(e, event.ticketId)}
                    disabled={generatingTokenId === event.ticketId}
                  >
                    {generatingTokenId === event.ticketId ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <QrCode className="mr-2 h-4 w-4" />
                    )}
                    {generatingTokenId === event.ticketId ? "Signing..." : "Show Entrance QR"}
                  </Button>
>>>>>>> origin/main

                    {/* CAS 2: Ticket scanné (Status 1) -> Claim Reward */}
                    {event!.status === 1 && (
                         <Button
                            size="sm"
                            disabled={isProcessing}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white border-0 h-9"
                            onClick={() => handleClaim(event)}
                        >
                            {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Trophy className="mr-2 h-4 w-4" />}
                            Claim & Reveal NFT
                        </Button>
                    )}

                    {/* Secondary Action: Trade */}
                    <button className="w-full text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-2 py-2">
                        Trade on TradePort
                        <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Past Events / POAPs */}
        {activeTab === "past" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {pastEvents.length === 0 && (
                <div className="col-span-full text-center py-12 border border-dashed border-white/10 rounded-xl">
                    <p className="text-muted-foreground">No past events yet.</p>
                </div>
            )}

            {pastEvents.map((event) => (
              <GlassCard key={event!.id} className="overflow-hidden h-full flex flex-col">
                {/* Badge Visual */}
                <div className="relative h-56 bg-gradient-to-br from-slate-600/20 to-slate-800/20 border-b border-white/10 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
                  <div className="relative z-10 text-center">
                    
                    {/* Affichage de l'image du NFT (Médaille/Badge) */}
                    {event!.url.startsWith('http') ? (
                         <img src={event!.url} alt="Medal" className="h-32 w-32 object-contain drop-shadow-2xl animate-in zoom-in duration-500" />
                    ) : (
                        // Fallback si image cassée
                        <div className={`h-24 w-24 mx-auto mb-3 rounded-full flex items-center justify-center shadow-2xl bg-gradient-to-br from-slate-500 to-slate-700`}>
                            <Award className="h-12 w-12 text-white" />
                        </div>
                    )}
                   
                    <Badge
                      className={`mt-3 ${event!.rank === 1 // Gold
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : event!.rank === 2 // Silver
                          ? "bg-gray-400/20 text-gray-300 border-gray-500/30"
                          : event!.rank === 3 // Bronze
                            ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                            : "bg-white/20 text-white border-white/30"
                        }`}
                    >
                      {event!.rank === 1 ? "Gold Winner" : event!.rank === 2 ? "Silver Winner" : event!.rank === 3 ? "Bronze Winner" : "Finisher"}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-2">{event!.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{event!.description}</p>
                  
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 font-medium">Verified On-Chain</span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* QR generator Modal */}
        <Dialog
          open={showQRModal}
          onOpenChange={(open) => {
            setShowQRModal(open)
            if (!open) setQrPayload(null)
          }}
        >
          <DialogContent className="max-w-2xl bg-[#03132b] border-white/10 p-12">
            <button
              onClick={() => {
                setShowQRModal(false)
                setQrPayload(null)
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="text-center space-y-6">
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold text-white mb-2">Entrance QR Code</DialogTitle>
                <DialogDescription className="text-muted-foreground">Attendees scan this code at the entrance to check in</DialogDescription>
              </DialogHeader>

              {/* Large QR Code Display */}
              <div className="mx-auto w-96 h-96 bg-white rounded-2xl p-8 flex items-center justify-center shadow-2xl">
                <div className="w-full h-full bg-white rounded-lg flex flex-col items-center justify-center p-4">
                  {qrPayload ? (
                    <>
<<<<<<< HEAD
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${qrPayload}`}
                        alt="Event QR Code"
                        className="h-64 w-64 bg-white/5 rounded-md"
                      />
=======
                      <div className="h-64 w-64 bg-gray-200 flex items-center justify-center p-4 border-2 border-gray-400">
                        <div className="text-center">
                          <div className="text-6xl mb-2">📱</div>
                          <div className="text-sm font-mono font-bold text-gray-800">PLACEHOLDER</div>
                          <div className="text-xs text-gray-600 mt-1">QR CODE</div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              if (qrPayload) await navigator.clipboard.writeText(qrPayload)
                            } catch (e) {
                              console.error("copy failed", e)
                            }
                          }}
                        >
                          Copy Payload
                        </Button>
                      </div>
>>>>>>> origin/main
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">No QR payload yet.</div>
                  )}
                </div>
              </div>

              <div className="space-y-2 w-full text-center">
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  ID: {qrPayload}
                </p>
                <p className="text-xs text-cyan-400">
                  Show this to the organizer to validate your attendance.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div >
  )
}