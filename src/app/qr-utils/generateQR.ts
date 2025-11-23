import QRCode from 'qrcode';

/**
 * Generates a QR code image from a string
 * @param data - The string to encode in the QR code
 * @param options - Optional QR code generation options
 * @returns Promise<string> - Data URL of the generated QR code image
 */
export async function generateQRCode(
    data: string,
    options?: {
        width?: number;
        margin?: number;
        errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
        color?: {
            dark?: string;
            light?: string;
        };
    }
): Promise<string> {
    try {
        const defaultOptions = {
            width: 512,
            margin: 2,
            errorCorrectionLevel: 'H' as const,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        };

        const qrOptions = { ...defaultOptions, ...options };
        const qrCodeDataURL = await QRCode.toDataURL(data, qrOptions);

        return qrCodeDataURL;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw new Error('Failed to generate QR code');
    }
}

/**
 * Generates an optimized QR code for large payloads (like signatures)
 * Uses lower error correction to fit more data
 */
export async function generateOptimizedQRCode(
    data: string,
    options?: {
        width?: number;
        margin?: number;
    }
): Promise<string> {
    try {
        return generateQRCode(data, {
            width: options?.width || 400,
            margin: options?.margin || 1,
            errorCorrectionLevel: 'L', // Low error correction = more data capacity
        });
    } catch (error) {
        console.error('Error generating optimized QR code:', error);
        throw new Error('Failed to generate optimized QR code');
    }
}
