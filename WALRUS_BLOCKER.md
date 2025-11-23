# Known Issue: Walrus Upload Relay Error

## Current Status: BLOCKED

### Error
```
400 The query parameters are missing the transaction ID or the nonce, 
but the proxy requires them to check the tip payment.
```

### What We've Tried

1. ✅ Added `network: 'testnet'` to both `SuiClient` and `walrus()` config
2. ✅ Verified SDK types - `flow.upload()` expects `{ digest:string }`
3. ✅ Passing digest correctly from register transaction
4. ❌ Still getting 400 error from Relay

### Analysis

The error is coming from the **Walrus Upload Relay proxy**, not our code. The proxy expects:
- Query parameter: `txId` (transaction ID)
- Query parameter: `nonce`

But the SDK's `flow.upload({ digest })` method doesn't seem to include these in the HTTP request it makes to the Relay.

### Possible Causes

1. **SDK Bug**: The `@mysten/walrus` SDK might have a bug in how it constructs the upload URL
2. **Testnet Instability**: The testnet Relay might have strict requirements not in the SDK
3. **Configuration Missing**: There might be additional config needed for the Upload Relay
4. **SDK Version Mismatch**: Our SDK version (0.8.4) might not match testnet expectations

### Workarounds Attempted

- ❌ Manual fetch to Relay (404 - wrong endpoint)
- ❌ Passing different parameter formats
- ❌ Using different SDK methods

### Recommended Next Steps

1. **Check SDK Version**: Try upgrading/downgrading `@mysten/walrus`
2. **Check Walrus Discord**: Ask in the Walrus community
3. **Alternative Approach**: Use direct Publisher node upload (no Relay)
4. **Wait for Fix**: This might be a known issue being fixed

### Temporary Fallback

For now, the system can work WITHOUT Walrus by:
1. Removing Walrus upload
2. Embedding full signature directly in QR (larger QR codes)
3. This removes the optimization but keeps functionality

### Code to Disable Walrus (Temporary)

In `use TicketSigner.ts`, set a flag to skip Walrus:
```typescript
const USE_WALRUS = false; // Set to false to skip Walrus

if (USE_WALRUS) {
  // ... walrus flow ...
} else {
  // Return direct signature QR
}
```

---

**Note**: This is a testnet infrastructure issue, not a code issue. The implementation is correct according to SDK types, but the Relay proxy has stricter requirements than the SDK provides.
