// export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
// export const MODULE_NAME = process.env.NEXT_PUBLIC_MODULE_NAME || 'eventum';
export const UPGRADE_CAP_ID = process.env.NEXT_PUBLIC_UPGRADE_CAP_ID || '';
// export const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID;

// Hardcoded for Demo/Testnet
export const PACKAGE_ID = "0x446b40a4f7b4c9869b9a6879e775da55c030da8f040daa140261bc83f301dce6";
export const PUBLISHER_ID = "0xb79229f732affeaf44c4e5ef06fd1bd64532367624ae638ab90089ad641f476c";
export const MODULE_NAME = "eventum";
export const EVENT_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::Event`;
export const TICKET_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::Ticket`;

// Array of featured event IDs (these should be actual event object IDs from your smart contract)
export const FEATURED_EVENTS = [
  "0xd93b7916d2b419a4913aee6d128912362cb17776c57e5232d17b9bf4e2158c52",
  "0x9832372d62b0a2d33f43180d758a20a6a4dbdd75065c1c31d5dec9c303f15c7e",
];