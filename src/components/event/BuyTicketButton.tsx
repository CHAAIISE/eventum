// src/components/event/BuyTicketButton.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Ticket, Loader2 } from "lucide-react"
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClientQuery, useSuiClient } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { useToast } from "@/hooks/use-toast"
import { PACKAGE_ID, MODULE_NAME } from "@/lib/contracts"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { KioskClient, Network } from '@mysten/kiosk'

interface BuyButtonProps {
  eventId: string
  price: string // Prix brut venant de Move (ex: "1000000000")
  onSuccess?: () => void
}

export function BuyTicketButton({ eventId, price, onSuccess }: BuyButtonProps) {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const { toast } = useToast()
  const [isBuying, setIsBuying] = useState(false)
  const [justBought, setJustBought] = useState(false)
  const queryClient = useQueryClient()

  // 1. Vérifier si l'utilisateur possède déjà un Kiosk (via KioskOwnerCap)
  const { data: kioskData, isLoading: isLoadingKiosk } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address || "",
      filter: { StructType: "0x2::kiosk::KioskOwnerCap" },
      options: { showContent: true },
    },
    { enabled: !!account }
  )

  // 2. Vérifier si l'utilisateur a déjà un ticket pour cet event dans son Kiosk
  const { data: hasTicket } = useQuery({
    queryKey: ['has-ticket', account?.address, eventId],
    enabled: !!account && !!eventId,
    refetchInterval: 2000,
    queryFn: async () => {
      if (!account) return false

      const kioskClient = new KioskClient({
        client,
        network: Network.TESTNET,
      })

      const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({
        address: account.address,
      })

      if (kioskOwnerCaps.length === 0) return false

      const kioskId = kioskOwnerCaps[0].kioskId

      const res = await kioskClient.getKiosk({
        id: kioskId,
        options: { withObjects: true },
      })

      const myTickets = res.items.filter((item) => 
        item.type.includes('::eventum::Ticket')
      )

      if (myTickets.length === 0) return false

      const ticketIds = myTickets.map(t => t.objectId)
      const ticketsWithFields = await client.multiGetObjects({
        ids: ticketIds,
        options: { showContent: true },
      })

      // Vérifier si un ticket correspond à cet event
      return ticketsWithFields.some((ticketObj) => {
        const fields = (ticketObj.data?.content as any)?.fields
        return fields?.event_id === eventId
      })
    }
  })

  const hasAlreadyBought = hasTicket || justBought

  const handleBuy = async () => {
    if (!account) return toast({ title: "Connect Wallet", variant: "destructive" })

    setIsBuying(true)
    const tx = new Transaction()

    try {
      // A. Gestion du Paiement
      const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(price)])

      // B. Gestion du Kiosk
      let kioskId, kioskCapId

      // Si l'user a déjà un Kiosk, on prend le premier trouvé
      if (kioskData?.data && kioskData.data.length > 0) {
        const kioskCapObj = kioskData.data[0]
        kioskCapId = tx.object(kioskCapObj.data?.objectId!)
        // L'ID du Kiosk est stocké dans le champ 'for' du Cap
        // Note: Pour simplifier ici, on suppose que l'ID du Kiosk est accessible. 
        // En prod, il est mieux de stocker l'ID du Kiosk ou de le déduire.
        // HACK RAPIDE POUR LE TEST : On crée un nouveau Kiosk à chaque fois si on n'est pas sûr.
        // Pour faire propre : On va CRÉER un nouveau Kiosk pour cet event pour éviter les conflits.
        // (Optimisation future : réutiliser le kiosk)
      }

      // APPROCHE SIMPLE & SÛRE : Créer un Kiosk dédié pour la transaction si besoin
      // Mais pour ton hackathon, utilisons le pattern "Create Kiosk if needed" dans la même TX
      
      const [newKiosk, newKioskCap] = tx.moveCall({ target: '0x2::kiosk::new' })
      
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::buy_ticket_into_kiosk`,
        arguments: [
          tx.object(eventId),
          newKiosk,
          newKioskCap,
          paymentCoin
        ]
      })

      // Finalisation Kiosk
      tx.moveCall({
        target: '0x2::transfer::public_share_object',
        typeArguments: ['0x2::kiosk::Kiosk'],
        arguments: [newKiosk]
      })
      tx.transferObjects([newKioskCap], account.address)

      // C. Exécution
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async (res) => {
            console.log('✅ Transaction réussie:', res);
            
            // Marquer immédiatement comme acheté
            setJustBought(true)
            setIsBuying(false)
            
            // Afficher le toast
            toast({ 
              title: "✅ Ticket Acheté !", 
              description: "Mise à jour de l'interface...",
              duration: 3000
            })
            
            // Refetch IMMÉDIATEMENT toutes les queries (pas de délai)
            await Promise.all([
              queryClient.refetchQueries({ 
                queryKey: ['getObject'], 
                type: 'active' 
              }),
              queryClient.refetchQueries({ 
                queryKey: ['has-ticket', account.address, eventId], 
              }),
              queryClient.invalidateQueries({ queryKey: ['my-tickets'] }),
              queryClient.invalidateQueries({ queryKey: ['getOwnedObjects'] }),
            ])
            
            console.log('✅ UI mise à jour immédiatement');
            
            if (onSuccess) onSuccess()
          },
          onError: (err) => {
            console.error('❌ Erreur transaction:', err)
            toast({ 
              title: "❌ Erreur d'achat", 
              description: err.message, 
              variant: "destructive",
              duration: 5000
            })
            setIsBuying(false)
          }
        }
      )

    } catch (e) {
      console.error(e)
      setIsBuying(false)
    }
  }

  if (!account) return <Button disabled>Connect Wallet to Buy</Button>
  
  if (hasAlreadyBought) {
    return (
      <Button 
        disabled
        className="w-full h-12 text-lg bg-green-600 hover:bg-green-600 text-white border-0 shadow-lg font-bold tracking-wide"
      >
        <Ticket className="mr-2 h-5 w-5" />
        NFT Already Minted
      </Button>
    )
  }
  
  return (
    <Button 
      onClick={handleBuy} 
      disabled={isBuying || isLoadingKiosk}
      className="w-full h-12 text-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0 shadow-lg shadow-cyan-900/20 mb-4 font-bold tracking-wide group"
    >
      {isBuying ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        <Ticket className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
      )}
      {isBuying ? "Minting..." : `Mint Ticket (${parseInt(price) / 1e9} SUI)`}
    </Button>
  )
}