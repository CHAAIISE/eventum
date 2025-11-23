export interface TicketPayload {
    tokenId: string;
    signature: string;
    address: string; // Useful for verification to know WHO signed it
}
