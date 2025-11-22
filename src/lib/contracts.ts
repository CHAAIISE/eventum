export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
export const MODULE_NAME = process.env.NEXT_PUBLIC_MODULE_NAME || 'eventum';
// export const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID;

// Ajoute les IDs des events que tu as créés via la page "Manage"
// À chaque fois que tu crées un event pour la démo, copie son ID ici.
export const FEATURED_EVENTS = [
  "0x...id_event_1...", 
  "0x...id_event_2...",
  "0x...id_event_3..."
];