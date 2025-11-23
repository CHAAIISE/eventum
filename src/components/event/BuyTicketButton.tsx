// src/components/event/BuyTicketButton.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Ticket, Loader2 } from "lucide-react"
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { useToast } from "@/hooks/use-toast"
import { PACKAGE_ID, MODULE_NAME } from "@/lib/contracts"

interface BuyButtonProps {
  eventId: string
  price: string // Prix brut venant de Move (ex: "1000000000")
  onSuccess?: () => void
}

export function BuyTicketButton({ eventId, price, onSuccess }: BuyButtonProps) {
  const account = useCurrentAccount()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const { toast } = useToast()
  const [isBuying, setIsBuying] = useState(false)

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
          onSuccess: (res) => {
            toast({ title: "Ticket Minted!", description: "Check your dashboard." })
            setIsBuying(false)
            if (onSuccess) onSuccess()
          },
          onError: (err) => {
            console.error(err)
            toast({ title: "Error", description: err.message, variant: "destructive" })
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