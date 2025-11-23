"use client"

import { useState, useEffect } from 'react';
import { generateQRCode, generateOptimizedQRCode } from './generateQR';

interface UseQRCodeOptions {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    color?: {
        dark?: string;
        light?: string;
    };
    optimized?: boolean; // If true, uses optimized settings for large payloads
}

/**
 * React hook to generate QR codes asynchronously
 * @param data - The string data to encode
 * @param options - Generation options
 * @returns Object containing the QR code data URL, loading state, and error
 */
export function useQRCode(data: string | null, options: UseQRCodeOptions = {}) {
    const [qrCode, setQrCode] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!data) {
            setQrCode('');
            return;
        }

        let mounted = true;

        const generate = async () => {
            setIsLoading(true);
            setError(null);

            try {
                let result: string;

                if (options.optimized) {
                    result = await generateOptimizedQRCode(data, {
                        width: options.width,
                        margin: options.margin,
                    });
                } else {
                    result = await generateQRCode(data, {
                        width: options.width,
                        margin: options.margin,
                        errorCorrectionLevel: options.errorCorrectionLevel,
                        color: options.color,
                    });
                }

                if (mounted) {
                    setQrCode(result);
                }
            } catch (err) {
                if (mounted) {
                    console.error('Error in useQRCode:', err);
                    setError(err instanceof Error ? err : new Error('Failed to generate QR code'));
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        generate();

        return () => {
            mounted = false;
        };
    }, [data, options.width, options.margin, options.errorCorrectionLevel, options.color?.dark, options.color?.light, options.optimized]);

    return { qrCode, isLoading, error };
}
