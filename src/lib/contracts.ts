// export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
// export const MODULE_NAME = process.env.NEXT_PUBLIC_MODULE_NAME || 'eventum';
export const UPGRADE_CAP_ID = process.env.NEXT_PUBLIC_UPGRADE_CAP_ID || '';
// export const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID;

// Hardcoded for Demo/Testnet
export const PACKAGE_ID = "0x7e6998d8eab6bb2df27599562185d332e1de3ecc2293d79490c33e04a9d58834";
export const PUBLISHER_ID = "0x82a5b1657fd493836e81e7a6fba439d73afe69e655dcab54e24888705d6a925c";
export const MODULE_NAME = "eventum";
export const EVENT_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::Event`;
export const TICKET_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::Ticket`;
