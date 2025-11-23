import { TicketPayload } from "./types";

export function createTicketMessage(tokenId: string): Uint8Array {
    // We simply sign the tokenId string
    return new TextEncoder().encode(`Login to Eventum with Token ID: ${tokenId}`);
}

export function encodeTicketPayload(payload: TicketPayload): string {
    return JSON.stringify(payload);
}
