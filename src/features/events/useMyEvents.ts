import { useSuiClient, useSuiClientQuery, useCurrentAccount } from "@mysten/dapp-kit";
import { PACKAGE_ID, MODULE_NAME } from "@/lib/contracts";

/**
 * Hook pour récupérer uniquement les événements créés par l'utilisateur connecté
 */
export function useMyEvents() {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();

  // 1. Query tous les EventCreated
  const { data: eventsLog, isLoading, error } = useSuiClientQuery(
    'queryEvents',
    {
      query: {
        MoveEventType: `${PACKAGE_ID}::${MODULE_NAME}::EventCreated`,
      },
      order: 'descending',
    },
    {
      enabled: !!currentAccount?.address, // Ne query que si l'utilisateur est connecté
    }
  );

  console.log('🔍 [useMyEvents] All EventCreated:', eventsLog);
  console.log('👤 [useMyEvents] Current user address:', currentAccount?.address);

  // 2. Filtrer uniquement les événements créés par l'utilisateur connecté
  const myEventIds = eventsLog?.data
    .filter((event) => {
      const parsedJson = event.parsedJson as any;
      const isMyEvent = parsedJson.organizer === currentAccount?.address;
      console.log('📋 [useMyEvents] Event:', parsedJson.event_id, 'organizer:', parsedJson.organizer, 'isMyEvent:', isMyEvent);
      return isMyEvent;
    })
    .map((event) => {
      const parsedJson = event.parsedJson as any;
      return parsedJson.event_id;
    }) || [];

  console.log('🎯 [useMyEvents] My event IDs:', myEventIds);

  // 3. Charger les détails complets de mes événements
  const { data: fullEventsData, isLoading: isLoadingDetails } = useSuiClientQuery(
    'multiGetObjects',
    {
      ids: myEventIds,
      options: {
        showContent: true,
        showDisplay: true,
        showOwner: true,
      },
    },
    {
      enabled: myEventIds.length > 0,
    }
  );

  console.log('📚 [useMyEvents] Full events data:', fullEventsData);

  const events = fullEventsData?.map((obj) => obj.data) || [];

  console.log('✅ [useMyEvents] Final events:', events);

  return {
    events,
    isLoading: isLoading || isLoadingDetails,
    error,
    hasEvents: events.length > 0,
  };
}
