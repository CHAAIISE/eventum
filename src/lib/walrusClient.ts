import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { walrus } from '@mysten/walrus';

const TESTNET_RELAY_URL = 'https://upload-relay.testnet.walrus.space';

/**
 * Walrus Client Configuration
 * 
 * CRITICAL FIX: Both the SuiClient constructor AND the walrus() extension
 * MUST explicitly include network: 'testnet' to avoid 404 errors.
 */

// 1. Create a standard SuiClient with network specified
const suiClient = new SuiClient({
    url: getFullnodeUrl('testnet'),
    network: 'testnet', // CRITICAL: Required for Walrus SDK
});

// 2. Extend the client with the walrus() extension
export const walrusClient = suiClient.$extend(
    walrus({
        uploadRelay: {
            host: TESTNET_RELAY_URL,
            // CRITICAL FIX: Add sendTip to allow the proxy to verify tip payment
            sendTip: {
                max: 1000000000, // Maximum tip amount in MIST (1 WAL)
            },
        },
        network: 'testnet', // CRITICAL: Required for Walrus SDK
    }),
);
