// Environment configuration for Enoki
// This file reads environment variables and exports them for use in client components

export const enokiConfig = {
    apiKey: process.env.NEXT_PUBLIC_ENOKI_API_KEY || 'enoki_public_2b56e044b29b41def403d9ffe14d613b',
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '666792268820-1g779clgu9gq8090mpr5u6nalhr1baql.apps.googleusercontent.com',
    network: (process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet') as 'devnet' | 'testnet' | 'mainnet',
}
