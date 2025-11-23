"use client"

import { useState } from 'react';
import { useTicketSigner } from '@/app/qr-utils/useTicketSigner';
import { useQRCode } from '@/app/qr-utils/useQRCode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConnectButton } from '@mysten/dapp-kit';

export default function QRTestingPage() {
    const [tokenId, setTokenId] = useState<string>('0x1234567890abcdef');
    const [eventId, setEventId] = useState<string>('0xevent123');
    const [signedPayload, setSignedPayload] = useState<string | null>(null);

    const { signAndUploadProof, isLoading: isSigning, status, isReady } = useTicketSigner();

    // Generate QR code from the signed payload
    const { qrCode, isLoading: isGeneratingQR } = useQRCode(signedPayload, {
        optimized: true,
        width: 300
    });

    const handleSignAndGenerate = async () => {
        if (!tokenId || !eventId) return;

        try {
            const { json } = await signAndUploadProof(tokenId, eventId);
            setSignedPayload(json);
        } catch (error) {
            console.error("Failed to sign:", error);
            alert("Failed to sign token. See console for details.");
        }
    };

    return (
        <div className="container mx-auto py-12 px-4 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                QR Code Flow Testing
            </h1>

            <div className="grid gap-8">
                {/* Step 1: Connect Wallet */}
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader>
                        <CardTitle>1. Connect Wallet</CardTitle>
                        <CardDescription className="text-gray-400">
                            You need to connect a wallet to sign the token ID.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-center">
                            <ConnectButton />
                        </div>
                        {!isReady && (
                            <p className="text-yellow-400 text-sm mt-4 text-center">
                                Please connect your wallet to proceed.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Step 2: Enter Token ID & Sign */}
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader>
                        <CardTitle>2. Sign Token ID</CardTitle>
                        <CardDescription className="text-gray-400">
                            Enter a mock Token ID (or use the default) and sign it with your wallet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Token ID</label>
                            <Input
                                value={tokenId}
                                onChange={(e) => setTokenId(e.target.value)}
                                className="bg-black/20 border-white/10 text-white"
                                placeholder="Enter Token ID..."
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Event ID</label>
                            <Input
                                value={eventId}
                                onChange={(e) => setEventId(e.target.value)}
                                className="bg-black/20 border-white/10 text-white"
                                placeholder="Enter Event ID..."
                            />
                        </div>

                        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-200">
                            ℹ️ This will upload your proof to Walrus. Make sure you have Testnet WAL tokens.
                        </div>

                        <Button
                            onClick={handleSignAndGenerate}
                            disabled={!isReady || isSigning || !tokenId || !eventId}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                        >
                            {isSigning ? (status || 'Processing...') : 'Sign & Generate QR'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Step 3: View Result */}
                {signedPayload && (
                    <Card className="bg-white/5 border-white/10 text-white">
                        <CardHeader>
                            <CardTitle>3. Generated QR Code</CardTitle>
                            <CardDescription className="text-gray-400">
                                This QR code contains the compact JSON payload with your signature.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center space-y-6">

                            {isGeneratingQR ? (
                                <div className="h-[300px] w-[300px] flex items-center justify-center bg-white/5 rounded-lg">
                                    <p>Generating QR...</p>
                                </div>
                            ) : qrCode ? (
                                <div className="bg-white p-4 rounded-xl">
                                    <img src={qrCode} alt="Ticket QR" className="w-[300px] h-[300px]" />
                                </div>
                            ) : null}

                            <div className="w-full space-y-2">
                                <label className="text-sm font-medium text-gray-400">Payload Data (Compact JSON):</label>
                                <div className="bg-black/30 p-3 rounded-md font-mono text-xs break-all text-green-400 border border-white/5">
                                    {signedPayload}
                                </div>
                                <p className="text-xs text-gray-500 text-right">
                                    Size: {new TextEncoder().encode(signedPayload).length} bytes
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
