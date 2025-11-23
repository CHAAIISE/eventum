# QR Code Utilities

This folder contains utilities for signing tickets and generating QR codes.

## Files

- `generateQR.ts`: Core functions to generate QR code images (Data URLs).
- `signToken.ts`: Utilities to create and parse ticket payloads (Token ID + Signature).
- `useTicketSigner.ts`: React hook to sign a token ID using the connected wallet.
- `useQRCode.ts`: React hook to generate a QR code from a string.

## Usage Guide

### 1. Sign a Ticket (Token ID)

Use the `useTicketSigner` hook to sign a token ID. This proves ownership of the NFT.

```tsx
import { useTicketSigner } from '@/app/qr-utils/useTicketSigner';

function SignerComponent({ tokenId }: { tokenId: string }) {
  const { signAndCreatePayload, isLoading } = useTicketSigner();

  const handleSign = async () => {
    // Generates a JSON payload: { "t": "tokenId", "s": "signature" }
    const { json } = await signAndCreatePayload(tokenId);
    console.log('Signed Payload:', json);
    return json;
  };

  return <button onClick={handleSign} disabled={isLoading}>Sign Ticket</button>;
}
```

### 2. Generate a QR Code

Use the `useQRCode` hook to display the QR code.

```tsx
import { useQRCode } from '@/app/qr-utils/useQRCode';

function QRCodeDisplay({ data }: { data: string }) {
  // optimized: true is recommended for large payloads like signatures
  const { qrCode, isLoading } = useQRCode(data, { optimized: true });

  if (isLoading) return <div>Generating...</div>;
  if (!qrCode) return null;

  return <img src={qrCode} alt="Ticket QR" />;
}
```

### 3. Putting it Together

```tsx
import { useState } from 'react';
import { useTicketSigner } from '@/app/qr-utils/useTicketSigner';
import { useQRCode } from '@/app/qr-utils/useQRCode';

export default function TicketView({ tokenId }: { tokenId: string }) {
  const { signAndCreatePayload, isLoading: isSigning } = useTicketSigner();
  const [payload, setPayload] = useState<string | null>(null);
  
  const { qrCode } = useQRCode(payload, { optimized: true });

  const handleGenerate = async () => {
    const { json } = await signAndCreatePayload(tokenId);
    setPayload(json);
  };

  return (
    <div>
      {!payload ? (
        <button onClick={handleGenerate} disabled={isSigning}>
          {isSigning ? 'Signing...' : 'Show QR Code'}
        </button>
      ) : (
        qrCode && <img src={qrCode} alt="Ticket" />
      )}
    </div>
  );
}
```
