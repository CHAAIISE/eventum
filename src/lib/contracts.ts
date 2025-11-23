//export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
//export const MODULE_NAME = process.env.NEXT_PUBLIC_MODULE_NAME || 'eventum';
// export const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID;
export const PACKAGE_ID = "0x159d139f5e374aabbed91004c137b5d11c439d25ad77b8111a403dc28386cdc8";
export const REGISTRY_ID = "0xdf81469054115d57296a0aa730fb1bab8cba6324b2861dae24ee735a7ad29690";
export const PUBLISHER_ID = "0xe8bf69923d2c71c0e69b3eda3714eef85d7b8388d1826354f0142a4f142e4b99"; // SHARED Publisher
export const MODULE_NAME = "eventum";
export const EVENT_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::Event`;
export const TICKET_TYPE = `${PACKAGE_ID}::${MODULE_NAME}::Ticket`;
// Ajoute les IDs des events que tu as créés via la page "Manage"
// À chaque fois que tu crées un event pour la démo, copie son ID ici.
export const FEATURED_EVENTS = [
  "0x...id_event_1...", 
  "0x...id_event_2...",
  "0x...id_event_3..."
];