'use client';

import { createNetworkConfig, SuiClientProvider, useSuiClientContext, WalletProvider } from '@mysten/dapp-kit';
import { isEnokiNetwork, registerEnokiWallets } from '@mysten/enoki';
import { getFullnodeUrl } from '@mysten/sui/client';
import { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { enokiConfig } from './config';

// Create network configuration
const { networkConfig } = createNetworkConfig({
    devnet: { url: getFullnodeUrl('devnet') },
    testnet: { url: getFullnodeUrl('testnet') },
    mainnet: { url: getFullnodeUrl('mainnet') },
});

// Create query client for React Query
const queryClient = new QueryClient();

// Component to register Enoki wallets
function RegisterEnokiWallets() {
    const { client, network } = useSuiClientContext();

    useEffect(() => {
        console.log('[Enoki] Attempting to register wallets...');
        console.log('[Enoki] Network:', network);
        console.log('[Enoki] Is Enoki Network:', isEnokiNetwork(network));

        // Register for all networks (devnet, testnet, mainnet)
        if (!['devnet', 'testnet', 'mainnet'].includes(network)) {
            console.warn('[Enoki] Unknown network:', network);
            return;
        }

        const enokiApiKey = enokiConfig.apiKey;
        const googleClientId = enokiConfig.googleClientId;

        console.log('[Enoki] API Key present:', !!enokiApiKey);
        console.log('[Enoki] Google Client ID present:', !!googleClientId);
        console.log('[Enoki] Google Client ID value:', googleClientId ? `${googleClientId.substring(0, 20)}...` : 'undefined');

        if (!googleClientId) {
            console.error('[Enoki] Google Client ID not configured!');
            console.error('[Enoki] Config:', { apiKey: !!enokiApiKey, googleClientId: !!googleClientId });
            return;
        }

        const config: any = {
            providers: {
                google: {
                    clientId: googleClientId,
                },
            },
            client,
            network,
        };

        // Add apiKey only if it's defined
        if (enokiApiKey) {
            config.apiKey = enokiApiKey;
        }

        console.log('[Enoki] Registering with config:', {
            hasApiKey: !!enokiApiKey,
            network,
            providers: Object.keys(config.providers)
        });

        try {
            const { unregister } = registerEnokiWallets(config);
            console.log('[Enoki] ✓ Wallets registered successfully');
            return unregister;
        } catch (error) {
            console.error('[Enoki] ✗ Failed to register wallets:', error);
        }
    }, [client, network]);

    return null;
}

// Main Enoki provider component
export function EnokiProvider({ children }: { children: ReactNode }) {
    const defaultNetwork = enokiConfig.network;

    return (
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networkConfig} defaultNetwork={defaultNetwork}>
                <RegisterEnokiWallets />
                <WalletProvider autoConnect>
                    {children}
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    );
}
