# Walrus Ticketing System Implementation

Complete implementation of the Sui Kiosk & Walrus ticketing check-in system.

## ✅ Implementation Complete

### Architecture

**Client Side (Attendee)**
1. User signs a ticket proof with their wallet
2. Proof includes: `ticket_id`, `event_id`, `timestamp`, `signature`, `signer_address`
3. Proof is uploaded to Walrus (3-step flow: Register → Upload → Certify)
4. QR code contains only: `{w: blobId, t: ticket_id}` (~50 bytes)

**Manager Side (Scanner)**
1. Scan QR code to get `blobId`
2. Fetch full proof from Walrus
3. Run 3-point security audit:
   - ✓ Verify cryptographic signature
   - ✓ Verify Kiosk ownership
   - ✓ Verify timestamp (anti-replay)
4. If valid, whitelist the ticket on-chain

## Key Files

### Core Configuration
- **`src/lib/walrusClient.ts`** - Walrus client with critical `network: 'testnet'` fix

### Attendee Flow
- **`src/app/qr-utils/useTicketSigner.ts`** - Wallet signing + Walrus upload hook
- **`src/app/qr-utils/signToken.ts`** - Payload types and anti-replay utilities
- **`src/app/qr-testing/page.tsx`** - Testing interface for QR generation

### Manager Flow
- **`src/app/qr-utils/verifyProof.ts`** - 3-point security audit implementation
- **`src/app/qr-utils/walrusUtils.ts`** - Walrus fetch utility

## Critical Fixes Applied

### Fix #1: Network Configuration (404 Error Fix)
```typescript
// ❌ WRONG - causes 404  
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

// ✅ CORRECT
const suiClient = new SuiClient({ 
  url: getFullnodeUrl('testnet'),
  network: 'testnet', // REQUIRED
});

const walrusClient = suiClient.$extend(
  walrus({
    ...
    network: 'testnet', // ALSO REQUIRED
  })
);
```

### Fix #2: Upload Flow ("missing transaction ID" Error Fix)
```typescript
// ❌ WRONG
await flow.upload({ digest: registerResult.digest });

// ✅ CORRECT - Pass entire result object
await flow.upload(registerResult);
```

## Testing

### Test QR Generation
1. Go to `/qr-testing`
2. Connect wallet
3. Ensure you have Testnet WAL tokens
4. Enter Token ID and Event ID
5. Click "Sign & Generate QR"
6. Approve 3 transactions: Sign Message → Register → Certify

### Expected Flow
- ✅ Message signed with wallet
- ✅ Proof uploaded to Walrus  
- ✅ QR code generated with blob ID
- ✅ QR code is small (~50 bytes vs ~1000+ bytes for direct signature)

## Next Steps

### 1. Scanner UI
Create a scanner page that:
- Uses `html5-qrcode` to scan QR codes
- Calls `verifyTicketProof(blobId, suiClient)`
- Displays verification result
- If valid, shows whitelist button

### 2. Smart Contract Whitelisting
Implement the manager's transaction to whitelist verified tickets:
```typescript
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::event::whitelist_ticket`,
  arguments: [
    tx.object(EVENT_ID),
    tx.pure.string(proof.ticket_id),
  ],
});
await signAndExecuteTransaction({ transaction: tx });
```

### 3. Attendee Final Upgrade
After ticket is whitelisted, attendee calls:
```typescript
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::event::upgrade_ticket`,
  arguments: [
    tx.object(KIOSK_CAP_ID),
    tx.object(TICKET_ID),
  ],
});
```

## Security Features

✅ **Cryptographic Signatures** - Wallet-signed proofs  
✅ **Kiosk Ownership Verification** - On-chain check  
✅ **Anti-Replay Protection** - 5-minute timestamp window  
✅ **Decentralized Storage** - Walrus (no backend)  
✅ **Small QR Codes** - Only blob ID in QR  

## Troubleshooting

**404 Error from Walrus**
→ Ensure `network: 'testnet'` is in BOTH `SuiClient` and `walrus()` config

**"Missing transaction ID" Error**
→ Pass entire `registerResult` object to `flow.upload()`

**"Not enough WAL tokens"**
→ Get Testnet WAL from Sui Discord #testnet-faucet

**Signature Verification Fails**
→ Check that message format matches exactly between signing and verification
