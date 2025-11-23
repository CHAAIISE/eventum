//export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
//export const MODULE_NAME = process.env.NEXT_PUBLIC_MODULE_NAME || 'eventum';
// export const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID;
export const PACKAGE_ID = "0xbd9e7b3976852fe126def67a7bd64abdab049be8548767a44900ad7ca6ddca2d";
export const REGISTRY_ID = "0x5d4a7efa119fe2028cd22f8273779d074aa56c535882b1a3ec10270f392103bc";
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