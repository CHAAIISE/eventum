"use client"

import { useState } from 'react';
import { useQRScanner, processScannedQR } from '@/app/qr-utils/scanQR';
import { TicketProof } from '@/app/qr-utils/signToken';
import { verifyTicketProof, VerificationResult } from '@/app/qr-utils/verifyProof';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSuiClient } from '@mysten/dapp-kit';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function ScanTestingPage() {
    const [scannedText, setScannedText] = useState<string | null>(null);
    const [proof, setProof] = useState<TicketProof | null>(null);
    const [verification, setVerification] = useState<VerificationResult | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [isScannerActive, setIsScannerActive] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const suiClient = useSuiClient();

    const handleScan = async (text: string) => {
        setScannedText(text);
        setScanError(null);
        setProof(null);
        setVerification(null);

        // Stop scanning immediately to prevent multiple triggers
        setIsScannerActive(false);

        try {
            // 1. Fetch proof from Walrus
            console.log('[Scanner] Processing QR code...');
            const fetchedProof = await processScannedQR(text);

            if (!fetchedProof) {
                setScanError("Failed to fetch proof from Walrus");
                return;
            }

            setProof(fetchedProof);

            // 2. Verify the proof
            setIsVerifying(true);
            const qrPayload = JSON.parse(text);
            const result = await verifyTicketProof(qrPayload.w, suiClient);
            setVerification(result);
            setIsVerifying(false);

        } catch (err: any) {
            console.error("[Scanner] Error:", err);
            setScanError(err.message || "Error processing scanned data");
            setIsVerifying(false);
        }
    };

    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Ticket Verification Scanner
            </h1>

            <div className="grid gap-8">
                {/* Scanner Section */}
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader>
                        <CardTitle>Scan Ticket QR Code</CardTitle>
                        <CardDescription className="text-gray-400">
                            Scan a Walrus-generated ticket QR code to verify ownership and authenticity.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center space-y-4">
                            {!isScannerActive ? (
                                <Button
                                    onClick={() => {
                                        setScannedText(null);
                                        setProof(null);
                                        setVerification(null);
                                        setScanError(null);
                                        setIsScannerActive(true);
                                    }}
                                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                                >
                                    Start Scanner
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => setIsScannerActive(false)}
                                    variant="destructive"
                                >
                                    Stop Scanner
                                </Button>
                            )}

                            {/* The container for the scanner */}
                            {isScannerActive && (
                                <div className="w-full max-w-md bg-black rounded-lg overflow-hidden">
                                    <ScannerComponent onScan={handleScan} />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Verification in Progress */}
                {isVerifying && (
                    <Card className="bg-white/5 border-white/10 text-white">
                        <CardContent className="py-12">
                            <div className="flex flex-col items-center space-y-4">
                                <Loader2 className="h-12 w-12 text-cyan-500 animate-spin" />
                                <p className="text-lg">Verifying ticket proof...</p>
                                <p className="text-sm text-gray-400">
                                    Checking signature, ownership, and timestamp
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Verification Results */}
                {verification && (
                    <Card className={`border-2 ${verification.isValid ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                {verification.isValid ? (
                                    <>
                                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                                        <span className="text-green-400">Ticket Verified ✓</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-8 w-8 text-red-500" />
                                        <span className="text-red-400">Verification Failed ✗</span>
                                    </>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {verification.isValid && proof ? (
                                <div className="space-y-3">
                                    <div className="bg-black/30 p-4 rounded-md border border-green-500/30">
                                        <p className="text-sm text-gray-400 mb-2">Ticket ID</p>
                                        <p className="font-mono text-green-400 break-all">{proof.ticket_id}</p>
                                    </div>

                                    <div className="bg-black/30 p-4 rounded-md border border-green-500/30">
                                        <p className="text-sm text-gray-400 mb-2">Event ID</p>
                                        <p className="font-mono text-green-400 break-all">{proof.event_id}</p>
                                    </div>

                                    <div className="bg-black/30 p-4 rounded-md border border-green-500/30">
                                        <p className="text-sm text-gray-400 mb-2">Owner Address</p>
                                        <p className="font-mono text-green-400 break-all">{proof.signer_address}</p>
                                    </div>

                                    <div className="bg-black/30 p-4 rounded-md border border-green-500/30">
                                        <p className="text-sm text-gray-400 mb-2">Timestamp</p>
                                        <p className="font-mono text-green-400">
                                            {new Date(proof.timestamp * 1000).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-green-500/20 border border-green-500/40 rounded-lg">
                                        <p className="font-semibold text-green-300">✅ All Security Checks Passed:</p>
                                        <ul className="mt-2 space-y-1 text-sm text-green-200">
                                            <li>✓ Cryptographic signature verified</li>
                                            <li>✓ Ticket ownership confirmed in Kiosk</li>
                                            <li>✓ Timestamp is recent (anti-replay)</li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-lg">
                                    <p className="font-semibold text-red-300">Error:</p>
                                    <p className="text-red-200 mt-1">{verification.error}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Scan Error */}
                {scanError && (
                    <Card className="bg-red-500/10 border-red-500/50 border-2">
                        <CardContent className="py-6">
                            <div className="flex items-start gap-3">
                                <XCircle className="h-6 w-6 text-red-500 mt-0.5" />
                                <div>
                                    <p className="font-bold text-red-300">Scan Error</p>
                                    <p className="text-red-200 text-sm mt-1">{scanError}</p>
                                    {scannedText && (
                                        <details className="mt-2">
                                            <summary className="text-xs text-red-300 cursor-pointer">
                                                Show raw data
                                            </summary>
                                            <code className="block mt-1 p-2 bg-black/50 rounded text-xs break-all text-red-200">
                                                {scannedText}
                                            </code>
                                        </details>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

// Separate component to handle the hook lifecycle cleanly
function ScannerComponent({ onScan }: { onScan: (text: string) => void }) {
    useQRScanner(
        "qr-reader",
        (decodedText) => {
            onScan(decodedText);
        },
        (error) => {
            // Ignore scan errors as they happen every frame no QR is detected
        },
        { fps: 10, qrbox: 250 }
    );

    return <div id="qr-reader" className="w-full" />;
}
