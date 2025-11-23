import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// --- CONFIGURATION WALRUS (TESTNET) ---
const WALRUS_PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";

export const maxDuration = 60;

/**
 * Fonction utilitaire pour uploader une image depuis une URL vers Walrus
 */
async function storeOnWalrus(imageUrl: string): Promise<string> {
  try {
    // 1. Télécharger l'image depuis Replicate
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error(`Failed to fetch image from Replicate: ${imageRes.statusText}`);
    const imageBlob = await imageRes.blob();

    // 2. Envoyer le binaire (Blob) au Publisher Walrus
    // L'endpoint /v1/store?epochs=1 stocke pour une durée par défaut (1 epoch sur testnet)
    const uploadRes = await fetch(`${WALRUS_PUBLISHER}/v1/store?epochs=5`, {
      method: "PUT",
      body: imageBlob,
    });

    if (!uploadRes.ok) throw new Error(`Walrus upload failed: ${uploadRes.statusText}`);

    const data = await uploadRes.json();
    
    // Walrus renvoie un objet contenant "newlyCreated" ou "alreadyCertified" avec le blobId
    let blobId = "";
    if (data.newlyCreated) {
        blobId = data.newlyCreated.blobObject.blobId;
    } else if (data.alreadyCertified) {
        blobId = data.alreadyCertified.blobId;
    } else {
        throw new Error("Invalid Walrus response format");
    }

    // 3. Construire l'URL HTTP publique (via l'Aggregator)
    // C'est cette URL qui sera lisible par les navigateurs et wallets
    return `${WALRUS_AGGREGATOR}/v1/${blobId}`;

  } catch (error) {
    console.error("Walrus Store Error:", error);
    // Fallback : Si Walrus échoue, on renvoie l'URL Replicate (mieux que rien pour la démo)
    return imageUrl;
  }
}

export async function POST(req: Request) {
  try {
    const { eventTitle, coverImageUrl } = await req.json();

    if (!coverImageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    console.log(`🍌 Starting Gen + Walrus Storage for: ${eventTitle}`);

    const assetsConfig: Record<string, any> = {
      ticket: { type: "original", url: coverImageUrl },
      attended: { type: "generate", prompt: `A massive trophy medal made of solid LIQUID STEEL. Molten steel texture, shiny. No text.` },
      gold: { type: "generate", prompt: `A massive trophy medal made of solid LIQUID GOLD. Molten gold texture, shiny. No text.` },
      silver: { type: "generate", prompt: `A massive trophy medal made of solid LIQUID SILVER. Molten silver texture, shiny. No text.` },
      bronze: { type: "generate", prompt: `A massive trophy medal made of solid LIQUID BRONZE. Molten bronze texture, shiny. No text.` }
    };

    const delayMs = 8000; // Petit délai pour ne pas spammer Replicate
    const entries = Object.entries(assetsConfig);
    const results: Array<{ key: string; url: string }> = [];

    for (let i = 0; i < entries.length; i++) {
      const [key, config] = entries[i];
      let tempUrl = "";

      // A. GÉNÉRATION (ou récupération originale)
      if (config.type === "original") {
        tempUrl = config.url;
      } else {
        console.log(`--> Generating ${key}...`);
        const output = await replicate.run("google/nano-banana", {
          input: {
            prompt: config.prompt,
            image_input: [coverImageUrl],
            negative_prompt: "flat, 2d, blurred, text, watermark",
            num_inference_steps: 25,
          },
        });
        
        // Extraction URL Replicate
        if (Array.isArray(output)) tempUrl = String(output[0]);
        else if (typeof output === "object" && output && "url" in output) tempUrl = (output as any).url();
        else tempUrl = String(output);
      }

      // B. STOCKAGE SUR WALRUS (L'étape cruciale)
      console.log(`--> Uploading ${key} to Walrus...`);
      const permanentUrl = await storeOnWalrus(tempUrl);
      console.log(`✅ ${key} stored: ${permanentUrl}`);

      results.push({ key, url: permanentUrl });

      if (i < entries.length - 1 && config.type !== "original") {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }

    const finalImages = results.reduce((acc, curr) => {
      acc[curr.key] = curr.url;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({ success: true, images: finalImages });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}