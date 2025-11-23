"use client"

import dynamic from "next/dynamic"
import type React from "react"
import { useState, useEffect } from "react"
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
  CheckCircle2,
  Camera,
  Loader2,
  Lock,
  Unlock,
  ScanLine
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

// --- SUI IMPORTS ---
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { useToast } from "@/hooks/use-toast"
import { PACKAGE_ID, MODULE_NAME } from "@/lib/contracts"

export default function ManagePage() {
  const [view, setView] = useState<"create" | "dashboard">("dashboard")
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const currentAccount = useCurrentAccount()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  // --- FORM STATES ---
  const [eventType, setEventType] = useState<"standard" | "competition">("standard")
  const [isPaid, setIsPaid] = useState(false)
  const [hasPrizePool, setHasPrizePool] = useState(false)
  
  const [createTitle, setCreateTitle] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [createDate, setCreateDate] = useState("")
  const [createTime, setCreateTime] = useState("")
  const [createSupply, setCreateSupply] = useState("")
  const [createPrice, setCreatePrice] = useState("")
  const [createRoyalty, setCreateRoyalty] = useState("")
  const [dist1, setDist1] = useState("")
  const [dist2, setDist2] = useState("")
  const [dist3, setDist3] = useState("")
  const [createCoverUrl, setCreateCoverUrl] = useState("")
  
  // AI Generation States
  const [generating, setGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<Record<string, string> | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // --- DASHBOARD STATE ---
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"Active" | "Upcoming" | "Finished">("Active")
  
  // Modals State
  const [showQRModal, setShowQRModal] = useState(false)
  const [showDistributeModal, setShowDistributeModal] = useState(false)
  const [winnerIdsInput, setWinnerIdsInput] = useState("")
  
  // Scanner State
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(true) // Pour pauser le scan après détection

  // Import dynamique du scanner pour éviter les erreurs SSR
  const Scanner = dynamic(
    () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
    { ssr: false }
  )

  // --- DATA FETCHING (SUI) ---

  // 1. Récupérer les OrganizerCap
  const { data: capsData, isPending: isLoadingCaps, refetch: refetchCaps } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: currentAccount?.address || "",
      filter: { StructType: `${PACKAGE_ID}::${MODULE_NAME}::OrganizerCap` },
      options: { showContent: true },
    },
    { enabled: !!currentAccount && view === "dashboard" }
  )

  // 2. Récupérer le Publisher Object (Nécessaire pour create_event dans la nouvelle version)
  // Note: Cela suppose que l'utilisateur connecté EST le propriétaire du package (celui qui a déployé)
  const { data: publisherData } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: currentAccount?.address || "",
      filter: { StructType: "0x2::package::Publisher" },
    },
    { enabled: !!currentAccount && view === "create" }
  )

  // 3. Extraire les Event IDs
  const organizedEventIds = capsData?.data.map((cap) => {
    const fields = (cap.data?.content as any)?.fields
    return fields?.event_id
  }) || []

  // 4. Récupérer les Events
  const { data: eventsData, isPending: isLoadingEvents, refetch: refetchEvents } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids: organizedEventIds,
      options: { showContent: true },
    },
    { enabled: organizedEventIds.length > 0 }
  )

  // 5. Transformer les données pour l'UI
  const myEvents = eventsData?.map((obj) => {
    const fields = (obj.data?.content as any)?.fields
    if (!fields) return null
    
    const isEnded = fields.event_ended
    const isUpcoming = !fields.checkin_enabled && !isEnded
    const isActive = fields.checkin_enabled && !isEnded

    let uiStatus: "Active" | "Upcoming" | "Finished" = "Upcoming"
    if (isEnded) uiStatus = "Finished"
    else if (isActive) uiStatus = "Active"

    return {
        id: obj.data?.objectId,
        title: fields.title,
        date: fields.date,
        attendees: Number(fields.minted_count),
        max: Number(fields.max_supply),
        status: uiStatus,
        type: fields.is_competition ? "competition" : "standard",
        balance: fields.balance,
        checkinEnabled: fields.checkin_enabled,
        ended: fields.event_ended,
        // On retrouve le Cap ID pour pouvoir agir sur l'event
        capId: capsData?.data.find(c => (c.data?.content as any)?.fields?.event_id === obj.data?.objectId)?.data?.objectId
    }
  }).filter(e => e !== null) || []

  const currentEvent = myEvents.find((e) => e?.id === selectedEventId)
  const filteredEvents = myEvents.filter((e) => e?.status === activeTab)


  // --- ACTIONS SUI ---

  const handleCreateEventOnChain = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    // 1. Vérifications initiales
    if (!currentAccount) {
        return toast({ title: "Connect Wallet", variant: "destructive" })
    }
    
    // On vérifie qu'on est le publisher (deployer)
    const publisherObj = publisherData?.data?.find(obj => true)
    if (!publisherObj) {
        return toast({ 
            title: "Publisher Object Missing", 
            description: "You must be the contract deployer to create events.", 
            variant: "destructive" 
        })
    }

    // On vérifie que les assets IA sont générés
    if (!generatedImages) {
        return toast({
            title: "Assets Missing",
            description: "Please generate AI assets first (Ticket, Medals...).",
            variant: "destructive"
        })
    }

    if (!createTitle || !createDate || !createSupply) {
        return toast({ title: "Missing Fields", variant: "destructive" })
    }

    try {
      const tx = new Transaction()
      
      // Conversion Prix
      const priceInMist = isPaid && createPrice ? parseFloat(createPrice) * 1_000_000_000 : 0
      
      // Distribution Prix
      const distribution = []
      if (hasPrizePool) {
        if (dist1) distribution.push(Number(dist1))
        if (dist2) distribution.push(Number(dist2))
        if (dist3) distribution.push(Number(dist3))
      }

      // Construction du vecteur d'URLs (Ordre strict pour le Smart Contract)
      // 0: Ticket, 1: Badge, 2: Gold, 3: Silver, 4: Bronze
      const assetUrls = [
          generatedImages.ticket,  
          generatedImages.attended, 
          generatedImages.gold,     
          generatedImages.silver,   
          generatedImages.bronze    
      ]

      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::create_event`,
        arguments: [
          tx.object(publisherObj.data?.objectId!), // Arg 1: Publisher
          tx.pure.string(createTitle),
          tx.pure.string(createDescription || "No description"),
          tx.pure.string(`${createDate} ${createTime}`),
          tx.pure.u64(priceInMist),
          tx.pure.u64(Number(createSupply)),
          tx.pure.u16(isPaid && createRoyalty ? Number(createRoyalty) : 0),
          tx.pure.vector('u64', distribution),
          tx.pure.bool(eventType === "competition"),
          tx.pure.vector('string', assetUrls) // Arg 10: Les URLs IA
        ],
      })

      signAndExecute({ transaction: tx }, {
        onSuccess: (result) => {
          toast({ title: "Event Created!", description: "Redirecting to dashboard..." })
          setTimeout(() => {
             setView("dashboard")
             refetchCaps()
          }, 1000)
        },
        onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
      })
    } catch (err) {
      console.error(err)
      toast({ title: "Transaction Failed", description: String(err), variant: "destructive" })
    }
  }

  const handleToggleCheckin = (enabled: boolean) => {
    if (!currentEvent || !currentEvent.capId) return
    setIsProcessing(true)
    const tx = new Transaction()
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::toggle_checkin`,
        arguments: [tx.object(currentEvent.capId), tx.object(currentEvent.id!), tx.pure.bool(enabled)]
    })
    signAndExecute({ transaction: tx }, {
        onSuccess: () => {
            toast({ title: `Check-in ${enabled ? 'Enabled' : 'Disabled'}` })
            refetchEvents()
            setIsProcessing(false)
        },
        onError: (e) => { toast({ title: "Error", description: e.message, variant: "destructive" }); setIsProcessing(false) }
    })
  }

  const handleScanAndWhitelist = (ticketId: string) => {
      if (!currentEvent || !currentEvent.capId) return
      
      // Pause le scanner
      setIsScanning(false)
      setScanResult(ticketId)

      const tx = new Transaction()
      
      // CORRECTION ICI : Le backend attend vector<ID>, donc on envoie un tableau
      tx.moveCall({
          target: `${PACKAGE_ID}::${MODULE_NAME}::add_to_whitelist`,
          arguments: [
              tx.object(currentEvent.capId),
              tx.object(currentEvent.id!),
              // On encapsule l'ID unique dans un vecteur (liste de 1 élément)
              // Note : En Move/Sui SDK, les IDs sont passés comme des 'address' dans les vecteurs
              tx.pure.vector('address', [ticketId]) 
          ]
      })

      signAndExecute({ transaction: tx }, {
          onSuccess: () => {
              toast({ title: "Ticket Whitelisted!", description: "User can now validate presence." })
              // On garde le scanner fermé pour laisser le temps de voir le succès, 
              // ou on peut le rouvrir automatiquement après un délai.
              // Ici on le laisse fermé et on reset le scanResult au bout de 2s si on veut réactiver :
              setTimeout(() => {
                  setScanResult(null)
                  setIsScanning(true) // Prêt pour le suivant
              }, 2000)
          },
          onError: (e) => { 
              toast({ title: "Whitelist Failed", description: e.message, variant: "destructive" })
              setIsScanning(true) // On réactive tout de suite en cas d'erreur
          }
      })
  }

  const handleDistributePrizes = () => {
    if (!currentEvent || !currentEvent.capId || !winnerIdsInput) return
    const winnerIds = winnerIdsInput.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0)
    
    setIsProcessing(true)
    const tx = new Transaction()
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::distribute_prizes`,
        arguments: [tx.object(currentEvent.capId), tx.object(currentEvent.id!), tx.pure.vector('address', winnerIds)]
    })
    signAndExecute({ transaction: tx }, {
        onSuccess: () => {
            toast({ title: "Prizes Distributed & Event Ended" })
            setShowDistributeModal(false)
            refetchEvents()
            setIsProcessing(false)
        },
        onError: (e) => { toast({ title: "Error", description: e.message, variant: "destructive" }); setIsProcessing(false) }
    })
  }

  // --- RENDER ---

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Manage
          </h1>
          <p className="text-muted-foreground text-lg">Create and manage your events</p>
        </div>

        {/* ... [TABS NAVIGATION] ... */}
        <div className="flex items-center gap-2 mb-10 p-1 bg-white/5 rounded-lg w-fit border border-white/10">
          <button onClick={() => setView("dashboard")} className={`px-8 py-3 rounded-md text-sm font-medium transition-all ${view === "dashboard" ? "bg-cyan-600 text-white" : "text-muted-foreground hover:bg-white/5"}`}>My Created Events</button>
          <button onClick={() => setView("create")} className={`px-8 py-3 rounded-md text-sm font-medium transition-all ${view === "create" ? "bg-cyan-600 text-white" : "text-muted-foreground hover:bg-white/5"}`}>Create New Event</button>
        </div>

        {/* View A: Create New Event Form */}
        {view === "create" && (
          <div className="max-w-3xl mx-auto">
            <GlassCard className="p-8 md:p-10 border-white/10">
              <form className="space-y-8">
                {/* [CHAMPS DU FORMULAIRE IDENTIQUES A AVANT] */}
                <div className="space-y-4">
                  <div className="space-y-2"><Label className="text-white">Event Title</Label><Input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} className="bg-white/5 border-white/10 text-white h-12 text-lg" /></div>
                  <div className="space-y-2"><Label className="text-white">Description</Label><Textarea value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} className="bg-white/5 border-white/10 text-white" /></div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><Label className="text-white">Date</Label><Input type="date" value={createDate} onChange={(e) => setCreateDate(e.target.value)} className="bg-white/5 text-white border-white/10" /></div>
                    <div className="space-y-2"><Label className="text-white">Time</Label><Input type="time" value={createTime} onChange={(e) => setCreateTime(e.target.value)} className="bg-white/5 text-white border-white/10" /></div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <Label className="text-white">Competition Mode</Label>
                    <Switch checked={eventType === "competition"} onCheckedChange={(c) => setEventType(c ? "competition" : "standard")} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                      <Label className="text-white">Paid Event</Label>
                      <Switch checked={isPaid} onCheckedChange={setIsPaid} />
                  </div>
                  {isPaid && (
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2"><Label className="text-white">Price (SUI)</Label><Input type="number" value={createPrice} onChange={(e) => setCreatePrice(e.target.value)} className="bg-white/5 text-white border-white/10"/></div>
                             <div className="space-y-2"><Label className="text-white">Royalty %</Label><Input type="number" value={createRoyalty} onChange={(e) => setCreateRoyalty(e.target.value)} className="bg-white/5 text-white border-white/10"/></div>
                        </div>
                  )}
                  <div className="space-y-2"><Label className="text-white">Total Supply</Label><Input type="number" value={createSupply} onChange={(e) => setCreateSupply(e.target.value)} className="bg-white/5 text-white border-white/10"/></div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                      <Label className="text-white">Prize Pool</Label>
                      <Switch checked={hasPrizePool} onCheckedChange={setHasPrizePool} />
                  </div>
                  {hasPrizePool && (
                         <div className="grid grid-cols-3 gap-4">
                             <Input placeholder="1st %" value={dist1} onChange={(e) => setDist1(e.target.value)} className="bg-white/5 text-white border-white/10"/>
                             <Input placeholder="2nd %" value={dist2} onChange={(e) => setDist2(e.target.value)} className="bg-white/5 text-white border-white/10"/>
                             <Input placeholder="3rd %" value={dist3} onChange={(e) => setDist3(e.target.value)} className="bg-white/5 text-white border-white/10"/>
                         </div>
                  )}
                   <div className="space-y-2"><Label className="text-white">Cover Image</Label><Input placeholder="URL" value={createCoverUrl} onChange={(e) => setCreateCoverUrl(e.target.value)} className="bg-white/5 text-white border-white/10"/></div>
                </div>
                {/* --- DEBUT DU BLOC MANQUANT : AI ASSET FACTORY --- */}
                <div className="space-y-2 pt-6 border-t border-white/10">
                    <Label className="text-white flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-cyan-400"/> AI Asset Factory (Required)
                    </Label>
                    
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <p className="text-xs text-muted-foreground mb-4">
                            Before launching, you must generate the 5 NFT variations (Ticket, Badge, Gold, Silver, Bronze).
                            This uses Replicate & Walrus.
                        </p>

                        <Button
                            type="button" // IMPORTANT : type="button" pour ne pas soumettre le formulaire
                            onClick={async () => {
                                setGenerateError(null)
                                if (!createTitle) return setGenerateError("Please enter an event title first")
                                if (!createCoverUrl) return setGenerateError("Please enter a cover URL first")
                                
                                try {
                                    setGenerating(true)
                                    const payload = { eventTitle: createTitle, coverImageUrl: createCoverUrl }
                                    
                                    // Appel à ton API route.ts
                                    const res = await fetch("/api/generate-assets", { 
                                        method: "POST", 
                                        body: JSON.stringify(payload) 
                                    })
                                    const data = await res.json()
                                    
                                    if(data.images) {
                                        setGeneratedImages(data.images)
                                        toast({ title: "Assets Generated!", description: "Stored on Walrus Testnet." })
                                    } else {
                                        setGenerateError("Generation failed. Check console.")
                                    }
                                } catch(e) { 
                                    console.error(e)
                                    setGenerateError("Error calling API")
                                } finally { 
                                    setGenerating(false) 
                                }
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-0"
                            disabled={generating || !createTitle || !createCoverUrl}
                        >
                            {generating ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating & Uploading to Walrus...</>
                            ) : (
                                <><Camera className="mr-2 h-4 w-4" /> 1. Generate NFT Assets</>
                            )}
                        </Button>

                        {generateError && <p className="text-red-400 text-xs mt-2 font-mono">{generateError}</p>}

                        {/* PREVIEW DES IMAGES GENERÉES */}
                        {generatedImages && (
                            <div className="grid grid-cols-5 gap-2 mt-4 animate-in fade-in">
                                {Object.entries(generatedImages).map(([key, url]) => (
                                    <div key={key} className="text-center group">
                                        <div className="relative h-16 w-16 mx-auto overflow-hidden rounded border border-white/20">
                                            <img src={url} className="h-full w-full object-cover bg-black/50" alt={key} />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground capitalize mt-1 block">{key}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <Button 
                    onClick={handleCreateEventOnChain}
                    disabled={!generatedImages || generating}
                    className="w-full h-14 text-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Rocket className="mr-2 h-5 w-5" /> 
                  {!generatedImages ? "2. Launch Locked (Generate first)" : "2. Launch Event On-Chain"}
                </Button>
              </form>
            </GlassCard>
          </div>
        )}

        {/* View B: Dashboard */}
        {view === "dashboard" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* LEFT: List of Events */}
              <div className="lg:col-span-4 space-y-4">
                <h2 className="text-xl font-bold text-white mb-4">Your Events</h2>
                {isLoadingEvents ? (
                     <div className="flex justify-center py-10"><Loader2 className="animate-spin text-cyan-400"/></div>
                ) : filteredEvents.length === 0 ? (
                  <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10 border-dashed">
                    <p className="text-muted-foreground">No {activeTab.toLowerCase()} events found.</p>
                  </div>
                ) : (
                  filteredEvents.map((event) => (
                    <GlassCard
                      key={event!.id}
                      className={`p-4 cursor-pointer transition-all group ${selectedEventId === event!.id ? "border-cyan-500/50 bg-white/10" : "hover:bg-white/10"}`}
                      onClick={() => setSelectedEventId(Number(event!.id) ? Number(event!.id) : event!.id as any)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className={event!.status === "Active" ? "text-green-400 border-green-500/30" : "text-muted-foreground"}>{event!.status}</Badge>
                        <Badge className="bg-blue-500/10 text-blue-400">{event!.type}</Badge>
                      </div>
                      <h3 className="font-bold text-white mb-1">{event!.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-cyan-400 mb-3"><Calendar className="h-3 w-3" /> {event!.date}</div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1"><Users className="h-3 w-3" /> {event!.attendees} / {event!.max}</div>
                        <ChevronRight className="h-4 w-4"/>
                      </div>
                    </GlassCard>
                  ))
                )}
              </div>

              {/* RIGHT: Event Management */}
              <div className="lg:col-span-8">
                {selectedEventId && currentEvent ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{currentEvent.title}</h2>
                            <p className="text-sm font-mono text-muted-foreground">ID: {currentEvent.id}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                onClick={() => handleToggleCheckin(!currentEvent.checkinEnabled)}
                                disabled={currentEvent.ended || isProcessing}
                                className={currentEvent.checkinEnabled ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}
                            >
                                {isProcessing ? <Loader2 className="animate-spin mr-2"/> : currentEvent.checkinEnabled ? <Lock className="mr-2 h-4 w-4"/> : <Unlock className="mr-2 h-4 w-4"/>}
                                {currentEvent.checkinEnabled ? "Disable Check-in" : "Enable Check-in"}
                            </Button>
                            <Button onClick={() => setShowQRModal(true)} variant="outline" className="border-white/10"><QrCode className="mr-2 h-4 w-4"/> Event QR</Button>
                        </div>
                    </div>

                    {/* STATS */}
                    <div className="grid grid-cols-3 gap-4">
                        <GlassCard className="p-4 text-center"><p className="text-xs text-muted-foreground uppercase">Sold</p><p className="text-2xl font-bold text-white">{currentEvent.attendees}</p></GlassCard>
                        <GlassCard className="p-4 text-center"><p className="text-xs text-muted-foreground uppercase">Rev (SUI)</p><p className="text-2xl font-bold text-cyan-400">{Number(currentEvent.balance) / 1e9}</p></GlassCard>
                        <GlassCard className="p-4 text-center"><p className="text-xs text-muted-foreground uppercase">Check-in</p><p className={`text-xl font-bold ${currentEvent.checkinEnabled ? "text-green-400" : "text-yellow-400"}`}>{currentEvent.checkinEnabled ? "OPEN" : "CLOSED"}</p></GlassCard>
                    </div>

                    {/* [NOUVEAU] SCANNER ZONE */}
                    {currentEvent.checkinEnabled && !currentEvent.ended && (
                         <div className="p-6 border border-cyan-500/20 rounded-xl bg-cyan-500/5 flex items-center justify-between">
                             <div>
                                 <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2"><ScanLine className="h-5 w-5"/> Check-in Scanner</h3>
                                 <p className="text-sm text-muted-foreground">Scan attendee QR codes to whitelist them for presence validation.</p>
                             </div>
                             <Button onClick={() => setShowQRScanner(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white h-12 px-6">
                                 <Camera className="mr-2 h-5 w-5"/> Open Camera
                             </Button>
                         </div>
                    )}
                    
                    {!currentEvent.ended && currentEvent.type === 'competition' && (
                        <div className="p-6 border border-red-500/20 rounded-xl bg-red-500/5">
                            <h3 className="text-lg font-bold text-red-400 mb-2">End Event & Distribute</h3>
                            <p className="text-sm text-muted-foreground mb-4">Finalize the event and send prizes to winners.</p>
                            <Button onClick={() => setShowDistributeModal(true)} className="bg-red-600 hover:bg-red-700 text-white w-full">
                                <Trophy className="mr-2 h-4 w-4" /> Distribute Prizes
                            </Button>
                        </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                    <Users className="h-8 w-8 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-bold text-white">Select an Event</h3>
                    <p className="text-muted-foreground">View details and manage your event.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* MODALS */}
        <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
            <DialogContent className="bg-[#03132b] border-white/10">
                <DialogHeader><DialogTitle className="text-white text-center">Event Check-in QR</DialogTitle></DialogHeader>
                <div className="flex justify-center p-4 bg-white rounded-lg">
                     <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${selectedEventId}`} />
                </div>
                <p className="text-center text-cyan-400 text-xs font-mono mt-2">{selectedEventId}</p>
            </DialogContent>
        </Dialog>

        <Dialog open={showDistributeModal} onOpenChange={setShowDistributeModal}>
             <DialogContent className="bg-[#03132b] border-white/10">
                 <DialogHeader><DialogTitle className="text-white">Distribute Prizes</DialogTitle><DialogDescription>Enter winning Ticket IDs.</DialogDescription></DialogHeader>
                 <Textarea className="bg-white/5 border-white/10 text-white font-mono" placeholder="0x...\n0x..." value={winnerIdsInput} onChange={(e) => setWinnerIdsInput(e.target.value)} />
                 <DialogFooter><Button onClick={handleDistributePrizes} disabled={isProcessing} className="bg-red-600 text-white">{isProcessing ? <Loader2 className="animate-spin"/> : "Confirm Distribution"}</Button></DialogFooter>
             </DialogContent>
        </Dialog>

        {/* 3. SCANNER MODAL (MODIFIE POUR WHITELIST) */}
        <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
          <DialogContent className="max-w-lg bg-[#03132b] border-white/10">
            <DialogHeader>
                <DialogTitle className="text-white">Scan Attendee QR</DialogTitle>
                <DialogDescription>This will whitelist the ticket for check-in.</DialogDescription>
            </DialogHeader>
            
            {/* Zone Caméra */}
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                <Scanner 
                    onScan={(r) => { 
                        if(r?.[0]?.rawValue && isScanning) { 
                            handleScanAndWhitelist(r[0].rawValue) 
                        } 
                    }} 
                />
                {/* Overlay de visée */}
                <div className="absolute inset-0 border-2 border-cyan-500/50 m-12 rounded-lg pointer-events-none"></div>
            </div>

            {scanResult && (
                <div className="text-center mt-4 p-2 bg-white/10 rounded">
                    <p className="text-xs text-muted-foreground">Processing ID:</p>
                    <p className="text-green-400 font-mono font-bold break-all">{scanResult}</p>
                    <Loader2 className="animate-spin h-4 w-4 mx-auto mt-2 text-cyan-400"/>
                </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}