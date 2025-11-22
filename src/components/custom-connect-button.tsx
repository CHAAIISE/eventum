"use client"

import { useCurrentAccount, useDisconnectWallet, useWallets } from "@mysten/dapp-kit"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"

export function CustomConnectButton() {
    const currentAccount = useCurrentAccount()
    const { mutate: disconnect } = useDisconnectWallet()
    const wallets = useWallets()
    const [showWalletModal, setShowWalletModal] = useState(false)

    // If wallet is connected, show address with dropdown
    if (currentAccount) {
        const address = currentAccount.address
        const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="h-12 px-8 text-lg rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-0 shadow-lg shadow-cyan-900/20">
                        <Wallet className="mr-2 h-4 w-4" />
                        {shortAddress}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-56 bg-background/95 backdrop-blur-xl border-white/10"
                >
                    <DropdownMenuItem
                        onClick={() => navigator.clipboard.writeText(address)}
                        className="cursor-pointer"
                    >
                        Copy Address
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => disconnect()}
                        className="cursor-pointer text-red-400 focus:text-red-400"
                    >
                        Disconnect
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    // If wallet is not connected, show connect button
    return (
        <>
            <Button
                onClick={() => setShowWalletModal(true)}
                className="h-12 px-8 text-lg rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-0 shadow-lg shadow-cyan-900/20"
            >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
            </Button>

            <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
                <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-white/10">
                    <DialogHeader>
                        <DialogTitle>Connect Wallet</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-4">
                        {wallets.map((wallet) => (
                            <Button
                                key={wallet.name}
                                onClick={() => {
                                    wallet.features['standard:connect'].connect()
                                    setShowWalletModal(false)
                                }}
                                variant="outline"
                                className="w-full justify-start gap-3 h-14 border-white/10 hover:bg-white/5"
                            >
                                {wallet.icon && (
                                    <img src={wallet.icon} alt={wallet.name} className="w-6 h-6" />
                                )}
                                <span>{wallet.name}</span>
                            </Button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
