# QR Code System - Simplified

All Walrus-related code has been removed. The system now uses a simple, reliable approach:

## How It Works

1. **Signing**: User signs their ticket ID with their wallet (Personal Message signature)
2. **QR Generation**: The signature + ticket ID are embedded in a QR code in compact JSON format
3. **Scanning**: The QR code is scanned and the signature is verified

## Files

### Core Utilities (`src/app/qr-utils/`)

- **`generateQR.ts`**: QR code generation using the `qrcode` library
- **`useQRCode.ts`**: React hook for easy QR code generation
- **`signToken.ts`**: Signature creation and payload formatting
- **`useTicketSigner.ts`**: React hook for wallet signing
- **`scanQR.ts`**: QR code scanning using `html5-qrcode`

### Testing Pages

- **`/qr-testing`**: Test QR generation with wallet signing
- **`/scan-testing`**: Test QR scanning

### Production Use

- **`/my-events`**: Users can generate QR codes for their tickets
- **`/manage`**: Organizers can scan QR codes to verify tickets

## Payload Format

Compact JSON format to minimize QR code size:

```json
{
  "t": "0x123...",  // tokenId
  "s": "0xABC..."   // signature
}
```

## Dependencies

- `qrcode`: QR code generation
- `html5-qrcode`: QR code scanning
- `@mysten/dapp-kit`: Wallet integration for signing

## Next Steps

The system is now simplified and working. You can:
1. Test QR generation at `/qr-testing`
2. Test QR scanning at `/scan-testing`
3. Integrate verification logic in the scanner to check signatures against on-chain data
