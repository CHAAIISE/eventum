# Eventum - Web3 Event Management Platform

> A decentralized event ticketing and competition management platform built on Sui blockchain with Walrus storage integration.

## Features

- **NFT Ticketing**: Mint tickets as NFTs stored in Sui Kiosk with dynamic metadata
- **Competition Mode**: Organize competitions with prize pool distribution and ranking system
- **QR Check-in**: Secure check-in system using Walrus-encrypted QR codes with wallet signatures
- **Real-time Updates**: Auto-updating UI with React Query for ticket sales and event status
- **Dynamic NFTs**: Tickets evolve based on status (Pending → Verified → Certified with medals)
- **Prize Distribution**: Automated prize pool management with on-chain verification
- **Anti-Fraud**: Wallet signature verification + one ticket per address restriction

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Sui Wallet (Enoki or Sui Wallet extension)
- Walrus CLI (optional, for testing storage)

### Installation

```bash
# Clone the repository
git clone https://github.com/CHAAIISE/eventum.git
cd eventum

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys (see Configuration section)

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Configuration

Create a `.env.local` file with:

```env
# Enoki Authentication (for Sui wallet integration)
NEXT_PUBLIC_ENOKI_API_KEY=your_enoki_api_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Sui Network Configuration
NEXT_PUBLIC_SUI_NETWORK=testnet

# Contract Addresses (auto-configured in src/lib/contracts.ts)
NEXT_PUBLIC_PACKAGE_ID=0x446b40a4f7b4c9869b9a6879e775da55c030da8f040daa140261bc83f301dce6
```

## Project Structure

```
eventum/
├── move/                          # Sui Move smart contracts
│   └── sources/
│       └── eventum.move          # Main contract with Event, Ticket, and Prize logic
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── event/[id]/          # Event detail page with ticket purchase
│   │   ├── my-events/           # User's tickets dashboard
│   │   ├── manage/              # Organizer dashboard (create events)
│   │   └── scan/                # QR code scanner for check-in
│   ├── components/
│   │   └── event/
│   │       └── BuyTicketButton.tsx  # Ticket purchase with Kiosk integration
│   ├── features/
│   │   └── ticket-qr/           # QR code generation and signing
│   ├── lib/
│   │   ├── contracts.ts         # Contract addresses and constants
│   │   └── walrusClient.ts      # Walrus SDK configuration
│   └── app/qr-utils/            # QR code utilities (sign, scan, verify)
└── README.md
```

## Usage Guide

### For Attendees

1. **Browse Events**: Visit homepage to see featured events
2. **Buy Ticket**: Click on an event → "Mint Ticket" → Confirm wallet transaction
3. **View Tickets**: Go to "My Events" to see all your tickets
4. **Check-in**: Present QR code at event entrance for verification
5. **Claim Certification**: After event ends, claim your participation NFT (or medal if ranked)

### For Organizers

1. **Create Event**:

   - Go to `/manage`
   - Fill event details (title, description, date, price, supply)
   - Set prize distribution if it's a competition
   - Upload asset URLs for badges/medals

2. **Manage Event**:

   - Enable check-in when event starts
   - Add tickets to whitelist for check-in authorization
   - Set rankings for competitions
   - Distribute prizes to winners
   - End event and allow certification claims

3. **Withdraw Funds**:
   - After prizes are distributed (or if no prizes)
   - Withdraw ticket sales revenue

### For Scanners (Event Staff)

1. Go to `/scan` page
2. Grant camera permission
3. Scan attendee QR codes
4. System verifies wallet signature + ticket ownership
5. Auto check-in if valid

## Smart Contract Functions

### User Functions

- `buy_ticket_into_kiosk()` - Purchase ticket and store in Kiosk
- `self_checkin()` - Check-in with whitelisted ticket
- `claim_certification()` - Claim participation NFT after event ends
- `deposit_prize_pool()` - Anyone can contribute to prize pool

### Organizer Functions

- `create_event()` - Create new event with Publisher
- `add_to_whitelist()` - Authorize tickets for check-in
- `toggle_checkin()` - Enable/disable check-in
- `set_final_rankings()` - Assign ranks to participants
- `distribute_prizes()` - Lock prize distribution and allocate funds
- `end_event_without_prizes()` - End non-competition events
- `withdraw_funds()` - Withdraw ticket sales after event

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Blockchain**: Sui Move, @mysten/dapp-kit, @mysten/kiosk
- **Storage**: Walrus (decentralized blob storage)
- **State Management**: React Query (@tanstack/react-query)
- **Authentication**: Enoki (zkLogin)
- **QR Codes**: html5-qrcode, qrcode library

## Development

### Deploy Smart Contract

```bash
cd move
sui client publish --gas-budget 100000000
```

Update `PACKAGE_ID` in `src/lib/contracts.ts` with deployed address.

### Run Tests

```bash
# Move contract tests
cd move
sui move test

# Frontend tests
pnpm test
```

### Build for Production

```bash
pnpm build
pnpm start
```

## Key Concepts

### Kiosk Pattern

Tickets are stored in Sui Kiosk (marketplace-ready NFT container) instead of direct transfer. This enables:

- Future secondary market trading
- Royalty enforcement on resales
- Better NFT management

### Dynamic NFT Status

Tickets have evolving metadata:

- **Status 0**: Pending (after purchase)
- **Status 1**: Verified (after check-in)
- **Status 2**: Certified (after event, with medal if ranked)

### Walrus Integration

QR codes contain encrypted proofs stored on Walrus:

```json
{
  "w": "blob_id_on_walrus",
  "t": "ticket_nft_id"
}
```

The proof includes wallet signature + timestamp for anti-replay protection.

## Known Issues

- **Walrus Sync Delay**: After QR generation, wait 30s before scanning (aggregator sync time)
- **Multiple Kiosks**: Users with 8+ Kiosks may experience slower ticket loading
- **Testnet Stability**: Walrus testnet may have downtime affecting QR verification

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Test thoroughly (especially smart contract changes)
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Links

- [Sui Documentation](https://docs.sui.io)
- [Walrus Documentation](https://docs.walrus.site)
- [Enoki zkLogin](https://docs.enoki.mystenlabs.com)

## Support

For issues or questions:

- Open a GitHub issue
- Join our Discord (coming soon)

---

Built with care for the Sui ecosystem
