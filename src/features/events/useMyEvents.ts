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
    }
  );

  // 2. Filtrer uniquement les événements créés par l'utilisateur connecté
  const myEventIds = eventsLog?.data
    .filter((event) => {
      const parsedJson = event.parsedJson as any;
      return parsedJson.organizer === currentAccount?.address;
    })
    .map((event) => {
      const parsedJson = event.parsedJson as any;
      return parsedJson.event_id;
    }) || [];

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

  const events = fullEventsData?.map((obj) => obj.data) || [];

  return {
    events,
    isLoading: isLoading || isLoadingDetails,
    error,
    hasEvents: events.length > 0,
  };
}
