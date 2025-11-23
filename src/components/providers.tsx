"use client"

import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit"
import { getFullnodeUrl } from "@mysten/sui/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type ReactNode, useState } from "react"
// Import de ton provider Enoki custom
import { EnokiProvider } from "@/app/enoki/EnokiProvider"

// Configure the network you want to connect to
const networks = {
    devnet: { url: getFullnodeUrl("devnet") },
    testnet: { url: getFullnodeUrl("testnet") },
    mainnet: { url: getFullnodeUrl("mainnet") },
}

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networks} defaultNetwork="testnet">
                <WalletProvider autoConnect>
                    {/* On place Enoki ici pour qu'il profite du contexte Sui/Wallet si besoin */}
                    <EnokiProvider>
                        {children}
                    </EnokiProvider>
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    )
}