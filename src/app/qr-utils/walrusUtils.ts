"use client"

import { walrusClient } from '@/lib/walrusClient';
import { TicketProof } from './signToken';

/**
 * Fetches a ticket proof from Walrus using the blob ID
 * Uses SDK first, then falls back to HTTP endpoints if SDK fails
 * 
 * @param blobId - The Walrus blob ID from the QR code
 * @returns The ticket proof stored in Walrus
 * @throws Error if proof cannot be fetched
 */
export async function fetchProofFromWalrus(blobId: string): Promise<TicketProof> {
    // Strategy: Try the official HTTP Aggregator FIRST.
    // The SDK connects to individual storage nodes, some of which might be down (causing connection refused).
    // The aggregator is load-balanced and more reliable for reads.

    const aggregatorUrl = `https://aggregator.walrus-testnet.walrus.space/v1/${blobId}`;
    const publisherUrl = `https://publisher.walrus-testnet.walrus.space/v1/${blobId}`;

    // 1. Try Aggregator (Fastest, Cached)
    try {
        console.log('[Walrus] Fetching from Aggregator:', aggregatorUrl);
        const response = await fetch(aggregatorUrl);

        if (response.ok) {
            const text = await response.text();
            console.log('[Walrus] ✅ Aggregator fetch successful! Length:', text.length);
            const proof: TicketProof = JSON.parse(text);
            return proof;
        } else {
            console.warn('[Walrus] Aggregator returned status:', response.status);
        }
    } catch (httpError: any) {
        console.warn('[Walrus] Aggregator fetch failed:', httpError.message);
    }

    // 2. Try Publisher (Might have it if just uploaded)
    try {
        console.log('[Walrus] Fetching from Publisher:', publisherUrl);
        const response = await fetch(publisherUrl);

        if (response.ok) {
            const text = await response.text();
            console.log('[Walrus] ✅ Publisher fetch successful! Length:', text.length);
            const proof: TicketProof = JSON.parse(text);
            return proof;
        } else {
            console.warn('[Walrus] Publisher returned status:', response.status);
        }
    } catch (httpError: any) {
        console.warn('[Walrus] Publisher fetch failed:', httpError.message);
    }

    // 3. Fallback: Try SDK if HTTP endpoints fail
    console.log('[Walrus] HTTP endpoints failed, attempting SDK fallback...');

    try {
        // Helper to timeout SDK calls
        const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
            return Promise.race([
                promise,
                new Promise<T>((_, reject) =>
                    setTimeout(() => reject(new Error('SDK Request timeout')), timeoutMs)
                ),
            ]);
        };

        const blob = await withTimeout(
            walrusClient.walrus.getBlob({ blobId }),
            5000 // 5 second timeout for SDK
        );

        const file = blob.asFile();
        const text = await file.text();
        console.log('[Walrus] ✅ SDK fetch successful! Length:', text.length);
        return JSON.parse(text);
    } catch (sdkError: any) {
        console.error('[Walrus] ❌ All fetch methods failed. SDK Error:', sdkError.message);
        throw new Error(`Could not fetch blob ${blobId} from Walrus (Aggregator & SDK failed)`);
    }
}
