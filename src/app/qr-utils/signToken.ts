/**
 * Ticket payload types and utilities with anti-replay protection
 */

// Full ticket proof payload (stored in Walrus)
export interface TicketProof {
    ticket_id: string;
    event_id: string;
    timestamp: number;
    signature: string;
    signer_address: string;
}

// Compact QR code payload (contains only Walrus blob ID)
export interface WalrusQRPayload {
    w: string;  // Walrus blobId
    t: string;  // ticket_id (for quick reference)
}

/**
 * Creates the message to be signed for a ticket with anti-replay protection
 * @param ticketId - The ticket/NFT token ID
 * @param eventId - The event ID
 * @param timestamp - Unix timestamp for anti-replay
 * @returns The message string to sign
 */
export function createTicketMessage(
    ticketId: string,
    eventId: string,
    timestamp: number
): string {
    return `Ticket Check-in\nTicket: ${ticketId}\nEvent: ${eventId}\nTime: ${timestamp}`;
}

/**
 * Creates a fresh timestamp for anti-replay protection
 * @returns Unix timestamp in seconds
 */
export function createTimestamp(): number {
    return Math.floor(Date.now() / 1000);
}

/**
 * Validates that a timestamp is recent (within 5 minutes)
 * @param timestamp - Unix timestamp to validate
 * @returns true if timestamp is recent
 */
export function isTimestampValid(timestamp: number): boolean {
    const now = createTimestamp();
    const fiveMinutes = 5 * 60;
    return Math.abs(now - timestamp) <= fiveMinutes;
}

/**
 * Converts a QR payload to JSON
 * @param payload - The QR payload
 * @returns JSON string
 */
export function qrPayloadToJSON(payload: WalrusQRPayload): string {
    return JSON.stringify(payload);
}

/**
 * Parses a JSON string into a QR payload
 * @param json - JSON string
 * @returns Parsed QR payload
 */
export function parseQRPayload(json: string): WalrusQRPayload {
    const parsed = JSON.parse(json);

    if ('w' in parsed && 't' in parsed) {
        return parsed as WalrusQRPayload;
    }

    throw new Error('Invalid QR payload format');
}
