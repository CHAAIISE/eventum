"use client"

import { SuiClient } from '@mysten/sui/client';
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
import { TicketProof, createTicketMessage, isTimestampValid } from './signToken';
import { fetchProofFromWalrus } from './walrusUtils';

/**
 * Result of ticket verification
 */
export interface VerificationResult {
    isValid: boolean;
    error?: string;
    proof?: TicketProof;
}

/**
 * Verifies a ticket proof through the 3-point security audit
 * 
 * 1. Cryptographic Proof: Verify the signature
 * 2. Ownership Verification: Check the ticket is in the user's Kiosk
 * 3. Anti-Replay Check: Verify the timestamp is recent
 * 
 * @param blobId - The Walrus blob ID from the QR code
 * @param suiClient - SuiClient instance
 * @returns VerificationResult
 */
export async function verifyTicketProof(
    blobId: string,
    suiClient: SuiClient
): Promise<VerificationResult> {
    try {
        // Step 1: Fetch the proof from Walrus
        console.log('[Verification] Fetching proof from Walrus...');
        const proof = await fetchProofFromWalrus(blobId);

        console.log('[Verification] Proof received:', {
            ticket_id: proof.ticket_id,
            event_id: proof.event_id,
            signer: proof.signer_address,
            timestamp: proof.timestamp,
        });

        // Step 2: Anti-Replay Check - Verify timestamp is recent
        console.log('[Verification] Checking timestamp...');
        if (!isTimestampValid(proof.timestamp)) {
            return {
                isValid: false,
                error: 'Proof has expired (timestamp older than 5 minutes)',
            };
        }

        // Step 3: Cryptographic Proof - Verify the signature
        console.log('[Verification] Verifying signature...');
        const message = createTicketMessage(
            proof.ticket_id,
            proof.event_id,
            proof.timestamp
        );
        const messageBytes = new TextEncoder().encode(message);

        try {
            const publicKey = await verifyPersonalMessageSignature(
                messageBytes,
                proof.signature
            );

            // Verify the recovered public key matches the claimed signer
            const recoveredAddress = publicKey.toSuiAddress();
            if (recoveredAddress !== proof.signer_address) {
                return {
                    isValid: false,
                    error: 'Signature does not match claimed signer address',
                };
            }
        } catch (error) {
            return {
                isValid: false,
                error: 'Invalid signature - cryptographic verification failed',
            };
        }

        // Step 4: Ownership Verification - Check Kiosk ownership
        console.log('[Verification] Verifying Kiosk ownership...');
        const ownsTicket = await verifyKioskOwnership(
            proof.signer_address,
            proof.ticket_id,
            suiClient
        );

        if (!ownsTicket) {
            return {
                isValid: false,
                error: 'Ticket not found in user\'s Kiosk - ownership verification failed',
            };
        }

        // All checks passed!
        console.log('[Verification] ✅ All checks passed!');
        return {
            isValid: true,
            proof,
        };

    } catch (error: any) {
        console.error('[Verification] Error:', error);
        return {
            isValid: false,
            error: error.message || 'Verification failed',
        };
    }
}

/**
 * Verifies that a user owns a specific ticket in their Kiosk
 * 
 * @param ownerAddress - The user's Sui address
 * @param ticketId - The ticket object ID
 * @param suiClient - SuiClient instance
 * @returns true if the ticket is in the user's Kiosk
 */
async function verifyKioskOwnership(
    ownerAddress: string,
    ticketId: string,
    suiClient: SuiClient
): Promise<boolean> {
    try {
        // 1. Find the user's KioskOwnerCap
        const kioskCaps = await suiClient.getOwnedObjects({
            owner: ownerAddress,
            filter: {
                StructType: '0x2::kiosk::KioskOwnerCap',
            },
            options: {
                showContent: true,
            },
        });

        if (!kioskCaps.data || kioskCaps.data.length === 0) {
            console.log('[Verification] No Kiosk found for user');
            return false;
        }

        // 2. Get the Kiosk ID from the KioskOwnerCap
        const kioskCap = kioskCaps.data[0];
        const kioskId = (kioskCap.data?.content as any)?.fields?.for;

        if (!kioskId) {
            console.log('[Verification] Could not extract Kiosk ID from KioskOwnerCap');
            return false;
        }

        console.log('[Verification] Found Kiosk:', kioskId);

        // 3. Check the Kiosk's dynamic fields for the ticket
        const dynamicFields = await suiClient.getDynamicFields({
            parentId: kioskId,
        });

        // In a Kiosk, items are stored as dynamic fields
        // The field name is the object ID
        const hasTicket = dynamicFields.data.some((field: any) => {
            const fieldName = String(field.name?.value || '');
            return fieldName === ticketId;
        });

        console.log('[Verification] Ticket found in Kiosk:', hasTicket);
        return hasTicket;

    } catch (error) {
        console.error('[Verification] Error checking Kiosk ownership:', error);
        return false;
    }
}
