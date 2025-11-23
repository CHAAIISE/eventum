import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { eventTitle, coverImageUrl } = await req.json();

    if (!coverImageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    console.log(`🍌 Starting Batch Generation with Google Nano Banana for: ${eventTitle}`);

    // Configuration des prompts pour chaque variante
    type AssetConfig =
      | { type: "original"; url: string }
      | { type: "generate"; prompt: string };

    const assetsConfig: Record<string, AssetConfig> = {
      // 1. TICKET : On garde l'original (pas d'appel IA)
      ticket: {
        type: "original",
        url: coverImageUrl,
      },

      // 2. BADGE PARTICIPANT : Style "Sticker/Badge"
      attended: {
        type: "generate",
        prompt: `A massive trophy medal made of solid LIQUID STEEL. Molten steel texture, shiny, metallic gray. No text or numbers.`,
      },

      // 3. OR : Le prompt qui a marché
      gold: {
        type: "generate",
        prompt: `A massive trophy medal made of solid LIQUID GOLD. Molten gold texture, shiny, metallic yellow. No text or numbers.`,
      },

      // 4. ARGENT : Chrome/Métal blanc
      silver: {
        type: "generate",
        prompt: `A massive trophy medal made of solid LIQUID SILVER. Molten silver texture, shiny, metallic chrome texture. No text or numbers.`,
      },

      // 5. BRONZE : Métal vieilli/marron
      bronze: {
        type: "generate",
        prompt: `A massive trophy medal made of solid LIQUID BRONZE. Molten bronze texture, shiny, metallic brown texture. No text or numbers.`,
      },
    };

    // Lancement des générations SÉQUENTIELLES avec délai entre chaque appel
    const delayMs = 10000; // 10 secondes entre chaque génération
    const entries = Object.entries(assetsConfig);
    const results: Array<{ key: string; url: string }> = [];

    for (let i = 0; i < entries.length; i++) {
      const [key, config] = entries[i];

      // Si c'est l'original, on le renvoie tout de suite
      if (config.type === "original") {
        results.push({ key, url: config.url });
      } else {
        console.log(`--> Generating ${key}...`);

        // Appel à Replicate (attend la réponse avant de continuer)
        const output = await replicate.run("google/nano-banana", {
          input: {
            prompt: config.prompt,
            image_input: [coverImageUrl], // Le modèle attend un tableau
            negative_prompt: "flat, 2d, blurred, low quality, text, watermark, distorted",
            num_inference_steps: 30,
          },
        });

        // Gestion robuste de la réponse (String, Array, ou Object)
        let finalUrl = "";
        if (Array.isArray(output)) {
          finalUrl = String(output[0]);
        } else if (typeof output === "string") {
          finalUrl = output;
        } else if (output && typeof output === "object" && "url" in output) {
          // @ts-ignore
          finalUrl = output.url();
        } else {
          finalUrl = String(output);
        }

        results.push({ key, url: finalUrl });
      }

      // Si ce n'est pas la dernière entrée, attendre delayMs
      if (i < entries.length - 1) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }

    // Construction de l'objet final
    const finalImages = results.reduce((acc, curr) => {
      acc[curr.key] = curr.url;
      return acc;
    }, {} as Record<string, string>);

    console.log("✅ Batch Generation Complete!");
    return NextResponse.json({ success: true, images: finalImages });
  } catch (error: any) {
    console.error("🍌 Replicate Error:", error);
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 });
  }
}
