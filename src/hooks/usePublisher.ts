import { useSuiClientQuery } from "@mysten/dapp-kit";
import { PACKAGE_ID } from "@/lib/contracts";

/**
 * Hook pour récupérer automatiquement le Publisher partagé
 * Cherche l'objet Publisher créé par le package
 */
export function usePublisher() {
  // On cherche tous les objets de type Publisher appartenant au package
  const { data, isLoading, error } = useSuiClientQuery(
    "queryObjects",
    {
      filter: {
        StructType: `0x2::package::Publisher`,
      },
      options: {
        showContent: true,
        showOwner: true,
      },
    }
  );

  // On filtre pour trouver celui qui est shared et lié à notre package
  const publisher = data?.data.find((obj) => {
    const owner = obj.data?.owner;
    return owner && typeof owner === "object" && "Shared" in owner;
  });

  const publisherId = publisher?.data?.objectId;

  return {
    publisherId,
    isLoading,
    error,
  };
}
