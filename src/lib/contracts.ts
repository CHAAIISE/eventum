export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
export const MODULE_NAME = process.env.NEXT_PUBLIC_MODULE_NAME || 'eventum';
export const PUBLISHER_ID = process.env.NEXT_PUBLIC_PUBLISHER_ID || '';
export const UPGRADE_CAP_ID = process.env.NEXT_PUBLIC_UPGRADE_CAP_ID || '';
// export const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID;

// Array of featured event IDs (these should be actual event object IDs from your smart contract)
export const FEATURED_EVENTS = [
  "0x...id_event_1...",
  "0x...id_event_2...",
  "0x...id_event_3..."
];