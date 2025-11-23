import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { KioskClient, Network } from '@mysten/kiosk';
import { useQuery } from '@tanstack/react-query';
import { TICKET_TYPE, PACKAGE_ID, MODULE_NAME } from '@/lib/contracts';

export function useMyTicketsAndEvents() {
  const account = useCurrentAccount();
  const client = useSuiClient();

  return useQuery({
    // On ne lance la requête que si le wallet est connecté
    queryKey: ['my-tickets', account?.address],
    enabled: !!account,
    queryFn: async () => {
      if (!account) return { tickets: [], events: [], kioskId: null, kioskCapId: null };

      // 1. Initialiser le client Kiosk
      const kioskClient = new KioskClient({
        client,
        network: Network.TESTNET,
      });

      // 2. Trouver les Kiosks appartenant à l'utilisateur
      const { kioskOwnerCaps } = await kioskClient.getOwnedKiosks({
        address: account.address,
      });

      console.log('🔍 [useMyTickets] KioskOwnerCaps trouvés:', kioskOwnerCaps.length);
      console.log('🔍 [useMyTickets] KioskOwnerCaps:', kioskOwnerCaps);

      if (kioskOwnerCaps.length === 0) return { tickets: [], events: [], kioskId: null, kioskCapId: null };

      // 3. Parcourir TOUS les Kiosks pour récupérer tous les tickets
      let allTickets: any[] = [];
      let mainKioskId = kioskOwnerCaps[0].kioskId;
      let mainKioskCapId = kioskOwnerCaps[0].objectId;

      for (const cap of kioskOwnerCaps) {
        const kioskId = cap.kioskId;
        
        console.log('🔍 [useMyTickets] Checking Kiosk:', kioskId);
        
        const res = await kioskClient.getKiosk({
          id: kioskId,
          options: {
            withObjects: true,
          },
        });

        console.log('🔍 [useMyTickets] Items in this Kiosk:', res.items.length);
        
        // Filtrer pour ne garder QUE les tickets du package actuel
        const kioskTickets = res.items.filter((item) => {
          const matches = item.type === TICKET_TYPE;
          if (matches) {
            console.log('✅ [useMyTickets] Found ticket in Kiosk:', kioskId);
          }
          return matches;
        });

        allTickets = allTickets.concat(kioskTickets);
      }

      console.log('🎯 [useMyTickets] Total filtered tickets from all Kiosks:', allTickets.length);

      // 5. Récupérer les objets complets des tickets (avec les fields)
      if (allTickets.length === 0) {
        return { 
          tickets: [], 
          events: [], 
          kioskId: mainKioskId, 
          kioskCapId: mainKioskCapId 
        };
      }

      const ticketIds = allTickets.map((t: any) => t.objectId);
      const ticketsWithFields = await client.multiGetObjects({
        ids: ticketIds,
        options: {
          showContent: true,
          showDisplay: true,
        },
      });

      console.log('🎯 [useMyTickets] Tickets with fields:', ticketsWithFields);

      console.log('🎯 [useMyTickets] Tickets with fields:', ticketsWithFields);

      // 6. Extraire les IDs des événements depuis les tickets
      // Le chemin est : data -> content -> fields -> event_id
      const eventIds = ticketsWithFields.map((ticketObj) => {
        const fields = (ticketObj.data?.content as any)?.fields;
        return fields?.event_id;
      }).filter((id) => !!id); // Enlever les nulls

      // Dédoublonner les IDs (si j'ai 2 tickets pour le même concert)
      const uniqueEventIds = [...new Set(eventIds)];

      if (uniqueEventIds.length === 0) {
        // Retourner les tickets même sans événements (pour les voir quand même)
        return { 
          tickets: ticketsWithFields.map(t => t.data).filter(Boolean), 
          events: [], 
          kioskId: mainKioskId, 
          kioskCapId: mainKioskCapId 
        };
      }

      // 7. Récupérer les détails complets des événements
      const eventsData = await client.multiGetObjects({
        ids: uniqueEventIds,
        options: {
          showContent: true,
          showDisplay: true, // Pour l'image de l'event
        },
      });

      // On retourne les tickets ET les événements associés
      return {
        tickets: ticketsWithFields.map(t => t.data).filter(Boolean), // Les objets Ticket complets (avec fields)
        events: eventsData.map(e => e.data), // Les infos de l'Event (Date, Lieu, Titre)
        kioskId: mainKioskId, // Pour les transactions
        kioskCapId: mainKioskCapId, // Pour les transactions
      };
    },
  });
}
