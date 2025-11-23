import { useState } from "react";
import { useSignPersonalMessage, useCurrentAccount } from "@mysten/dapp-kit";
import { createTicketMessage, encodeTicketPayload } from "./utils";

export function useTicketGenerator() {
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
    const currentAccount = useCurrentAccount();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateTicket = async (tokenId: string): Promise<string | null> => {
        if (!currentAccount) {
            setError("Wallet not connected");
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const message = createTicketMessage(tokenId);
            const { signature } = await signPersonalMessage({
                message,
                account: currentAccount,
            });

            const payload = encodeTicketPayload({
                tokenId,
                signature,
                address: currentAccount.address,
            });

            return payload;
        } catch (err: any) {
            console.error("Failed to sign ticket:", err);
            setError(err.message || "Failed to generate ticket signature");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        generateTicket,
        isLoading,
        error,
    };
}
