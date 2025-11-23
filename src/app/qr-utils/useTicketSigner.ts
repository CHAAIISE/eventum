"use client"

import { useSignPersonalMessage, useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { useState } from "react";
import {
    TicketProof,
    WalrusQRPayload,
    createTicketMessage,
    createTimestamp,
    qrPayloadToJSON
} from "./signToken";
import { walrusClient } from "@/lib/walrusClient";
import { WalrusFile } from "@mysten/walrus";

/**
 * Hook for signing ticket IDs and uploading to Walrus
 * Implements the complete 3-step Walrus flow with proper fixes
 */
export function useTicketSigner() {
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const currentAccount = useCurrentAccount();

    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    /**
     * Signs a ticket and uploads proof to Walrus
     * @param ticketId - The NFT/ticket token ID  
     * @param eventId - The event ID
     * @returns Promise<{payload, json, blobId}> - The QR payload, JSON string, and  blob ID
     */
    const signAndUploadProof = async (
        ticketId: string,
        eventId: string
    ): Promise<{
        payload: WalrusQRPayload;
        json: string;
        blobId: string;
    }> => {
        console.log('[useTicketSigner] Starting proof generation for ticket:', ticketId);

        setIsLoading(true);
        setError(null);
        setStatus("Creating proof...");

        try {
            // Check if wallet is connected
            if (!currentAccount) {
                throw new Error('Wallet not connected');
            }

            // 1. Create timestamp for anti-replay protection
            const timestamp = createTimestamp();

            // 2. Create the message to sign
            const message = createTicketMessage(ticketId, eventId, timestamp);
            const messageBytes = new TextEncoder().encode(message);

            // 3. Sign the message with the wallet (Personal Message)
            setStatus("Please sign the message...");
            const { signature } = await signPersonalMessage({
                message: messageBytes,
                account: currentAccount,
            });

            console.log('[useTicketSigner] Signature received');

            // 4. Create the complete proof object
            const proof: TicketProof = {
                ticket_id: ticketId,
                event_id: eventId,
                timestamp,
                signature,
                signer_address: currentAccount.address,
            };

            // 5. Prepare Walrus upload
            setStatus("Preparing Walrus upload...");

            const proofJSON = JSON.stringify(proof);
            const file = WalrusFile.from({
                contents: new TextEncoder().encode(proofJSON),
                identifier: `ticket_proof_${ticketId}.json`,
            });

            // 6. Create Upload Flow
            const flow = await walrusClient.walrus.writeFilesFlow({
                files: [file],
            });

            // 7. Encode the file
            await flow.encode();

            // 8. STEP 1: Register (Transaction 1)
            setStatus("Please sign transaction 1/2 (Register)...");
            const registerResult = await signAndExecuteTransaction({
                transaction: flow.register({
                    owner: currentAccount.address,
                    deletable: true,
                    epochs: 1,
                }),
                account: currentAccount,
            });

            console.log('[useTicketSigner] ===== REGISTER RESULT DEBUG =====');
            console.log('[useTicketSigner] Full registerResult:', registerResult);
            console.log('[useTicketSigner] registerResult.digest:', (registerResult as any).digest);
            console.log('[useTicketSigner] ====================================');

            // Extract the transaction digest
            const digest = (registerResult as any).digest;

            if (!digest) {
                throw new Error('No digest in register transaction result');
            }

            // 9. STEP 2: Upload to Relay
            // CRITICAL FIX: Pass the full registerResult object, not just { digest }
            // The SDK/Relay needs the full context to verify the transaction
            setStatus("Uploading proof to Walrus...");
            console.log('[useTicketSigner] Calling flow.upload with full registerResult');

            // Wait 2 seconds for Register tx to propagate so Relay can see it
            await new Promise(resolve => setTimeout(resolve, 2000));

            await flow.upload(registerResult);

            console.log('[useTicketSigner] Upload to Relay complete');

            // 10. STEP 3: Certify (Transaction 2)
            setStatus("Please sign transaction 2/2 (Certify)...");
            const certifyResult = await signAndExecuteTransaction({
                transaction: flow.certify(),
                account: currentAccount,
            });

            console.log('[useTicketSigner] ===== CERTIFY RESULT =====');
            console.log('[useTicketSigner] Certify result:', certifyResult);
            console.log('[useTicketSigner] Certify digest:', (certifyResult as any).digest);
            console.log('[useTicketSigner] Certify status:', (certifyResult as any).effects?.status);
            console.log('[useTicketSigner] ====================================');

            // 11. Get the blob ID
            console.log('[useTicketSigner] Getting blob ID from flow...');
            const files = await flow.listFiles();
            console.log('[useTicketSigner] Files returned:', files);
            console.log('[useTicketSigner] Number of files:', files.length);

            if (files.length === 0) {
                throw new Error("No files returned from flow.listFiles()");
            }

            const blobId = files[0].blobId;
            console.log('[useTicketSigner] Blob ID from files:', files);
            console.log('[useTicketSigner] Blob ID from files[0]:', files[0]);
            console.log('[useTicketSigner] Blob ID from files[0].blobId:', files[0].blobId);






            console.log('[useTicketSigner] Blob ID from files[0]:', blobId);
            console.log('[useTicketSigner] Full file object:', files[0]);

            if (!blobId) {
                throw new Error("No blobId in files[0]");
            }

            console.log('[useTicketSigner] ✅ Proof uploaded to Walrus!');
            console.log('[useTicketSigner] Blob ID:', blobId);
            console.log('[useTicketSigner] NOTE: Wait 30-60 seconds for aggregators to sync before scanning');

            // 12. Create compact QR payload
            const qrPayload: WalrusQRPayload = {
                w: blobId,
                t: ticketId,
            };

            const json = qrPayloadToJSON(qrPayload);

            setIsLoading(false);
            setStatus("Proof uploaded successfully!");

            return { payload: qrPayload, json, blobId };

        } catch (err: any) {
            const errorMessage = err?.message || 'Failed to create proof';
            console.error('[useTicketSigner] Error:', err);
            setError(errorMessage);
            setStatus("Failed");
            setIsLoading(false);
            throw new Error(errorMessage);
        }
    };

    return {
        signAndUploadProof,
        isLoading,
        status,
        error,
        isReady: !!currentAccount,
        walletAddress: currentAccount?.address,
    };
}
