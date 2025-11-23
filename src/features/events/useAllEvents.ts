import { useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit';
import { PACKAGE_ID, MODULE_NAME } from '@/lib/contracts';

export function useAllEvents() {
  const client = useSuiClient();

  // 1. On cherche tous les signaux "EventCreated" émis par ton contrat
  const { data: eventsLog, isLoading, error } = useSuiClientQuery(
    'queryEvents',
    {
      query: {
        MoveEventType: `${PACKAGE_ID}::${MODULE_NAME}::EventCreated`,
      },
      order: 'descending', // Les plus récents en premier
    }
  );

  console.log('🔍 EventCreated query result:', eventsLog);
  console.log('❌ Events error:', error);

  // 2. On nettoie les données pour récupérer juste les IDs
  const eventIds = eventsLog?.data.map((event) => {
    const parsedJson = event.parsedJson as any;
    console.log('📦 Event parsedJson:', parsedJson);
    return parsedJson.event_id; // C'est l'ID de l'objet Event !
  }) || [];

  console.log('🎯 Extracted eventIds:', eventIds);

  // 3. (Optionnel mais recommandé) On récupère les objets complets pour avoir l'image, le prix, etc.
  // Note: Si tu as besoin de plus de détails que ce qu'il y a dans le signal
  const { data: fullEventsData, isLoading: isLoadingDetails } = useSuiClientQuery(
    'multiGetObjects',
    {
      ids: eventIds,
      options: {
        showContent: true,
        showDisplay: true, // Pour récupérer l'URL de l'image
      },
    },
    {
      enabled: eventIds.length > 0, // Ne query que si on a des IDs
    }
  );

  console.log('📚 Full events data:', fullEventsData);

  return {
    events: fullEventsData?.map((obj) => obj.data) || [],
    isLoading: isLoading || isLoadingDetails,
    error
  };
}