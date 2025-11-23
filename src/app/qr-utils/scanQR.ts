"use client"

import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import { WalrusQRPayload, parseQRPayload, TicketProof } from "./signToken";
import { fetchProofFromWalrus } from "./walrusUtils";

interface UseQRScannerOptions {
    fps?: number;
    qrbox?: number;
    aspectRatio?: number;
    disableFlip?: boolean;
    verbose?: boolean;
}

/**
 * React hook to handle QR code scanning using html5-qrcode
 * @param elementId - The ID of the HTML element to render the scanner into
 * @param onScanSuccess - Callback when a QR code is successfully scanned
 * @param onScanFailure - Callback when scanning fails (optional)
 * @param options - Scanner configuration options
 */
export function useQRScanner(
    elementId: string,
    onScanSuccess: (decodedText: string, decodedResult: any) => void,
    onScanFailure?: (error: any) => void,
    options: UseQRScannerOptions = {}
) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        // Ensure we are in the browser
        if (typeof window === 'undefined') return;

        // Check if element exists
        const element = document.getElementById(elementId);
        if (!element) return;

        // Initialize scanner if not already initialized
        if (!scannerRef.current) {
            const config = {
                fps: options.fps || 10,
                qrbox: options.qrbox || 250,
                aspectRatio: options.aspectRatio || 1.0,
                disableFlip: options.disableFlip || false,
                verbose: options.verbose || false,
            };

            try {
                const scanner = new Html5QrcodeScanner(elementId, config, /* verbose= */ false);
                scannerRef.current = scanner;

                scanner.render(
                    (decodedText, decodedResult) => {
                        onScanSuccess(decodedText, decodedResult);
                    },
                    (errorMessage) => {
                        if (onScanFailure) {
                            onScanFailure(errorMessage);
                        }
                    }
                );

                setIsScanning(true);
            } catch (e) {
                console.error("Failed to initialize QR scanner", e);
            }
        }

        // Cleanup function
        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
                } catch (e) {
                    console.error("Error clearing scanner", e);
                }
                scannerRef.current = null;
                setIsScanning(false);
            }
        };
    }, [elementId, options.fps, options.qrbox, options.aspectRatio, options.disableFlip, options.verbose]);

    return { isScanning };
}

/**
 * Helper function to parse scanned QR data and fetch the full proof from Walrus
 * @param scannedData - The raw string scanned from the QR code
 * @returns Promise resolving to the full TicketProof or null
 */
export async function processScannedQR(scannedData: string): Promise<TicketProof | null> {
    try {
        // Parse the QR payload
        const qrPayload = parseQRPayload(scannedData);

        console.log('[Scanner] QR Payload:', qrPayload);

        // Fetch the full proof from Walrus using the blob ID
        const proof = await fetchProofFromWalrus(qrPayload.w);

        console.log('[Scanner] Proof fetched from Walrus:', proof);

        return proof;
    } catch (error) {
        console.error("Failed to process scanned QR:", error);
        return null;
    }
}
