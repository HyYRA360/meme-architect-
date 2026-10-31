import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import type { BrandDNA, MemeResult } from "./types.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Free-tier Gemini model used for all text and image (SVG/Canvas) generation
const MODEL_FREE = "gemini-3.8-flash";

function getAiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function svgToDataUrl(svgString: string): string {
  const cleaned = svgString
    .replace(/^```(?:svg|xml)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const svgStart = cleaned.indexOf("<svg");
  const svgEnd = cleaned.lastIndexOf("</svg>");
  let finalSvg =
    svgStart !== -1 && svgEnd !== -1
      ? cleaned.slice(svgStart, svgEnd + 6)
      : cleaned;

  if (!finalSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    finalSvg = finalSvg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  return `data:image/svg+xml;base64,${Buffer.from(finalSvg, "utf-8").toString("base64")}`;
}

function buildFallbackSvg(dna: BrandDNA, headline: string, subheadline: string): string {
  const escapedBrand = (dna.brandName || "Brand").replace(/[<>&"']/g, "");
  const escapedHeadline = (headline || dna.villain || "The Status Quo").replace(/[<>&"']/g, "");
  const escapedSub = (subheadline || dna.industry || "").replace(/[<>&"']/g, "");
  const escapedSig = (dna.brandSignature || "").replace(/[<>&"']/g, "");
  const color = dna.brandColors || "#10b981";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#090d16"/>
        <stop offset="50%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="12" dy="12" stdDeviation="0" flood-color="${color}" flood-opacity="0.85"/>
      </filter>
    </defs>
    <rect width="1080" height="1080" fill="url(#bg)"/>
    <circle cx="880" cy="200" r="260" fill="${color}" opacity="0.08"/>
    <circle cx="200" cy="880" r="320" fill="${color}" opacity="0.06"/>
    <rect x="70" y="70" width="940" height="940" rx="44" fill="#0f172a" stroke="${color}" stroke-width="6" filter="url(#shadow)"/>
    <rect x="120" y="130" width="320" height="54" rx="14" fill="${color}"/>
    <text x="280" y="166" fill="#020617" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="900" text-anchor="middle" letter-spacing="4">${dna.visualStyle.toUpperCase()}</text>
    <text x="540" y="420" fill="#ffffff" font-family="Inter, system-ui, sans-serif" font-size="52" font-weight="900" text-anchor="middle">${escapedHeadline.slice(0, 34)}</text>
    <text x="540" y="490" fill="#e2e8f0" font-family="Inter, system-ui, sans-serif" font-size="36" font-weight="700" text-anchor="middle">${escapedHeadline.slice(34, 72)}</text>
    <rect x="240" y="560" width="600" height="8" fill="${color}" rx="4"/>
    <text x="540" y="650" fill="${color}" font-family="Inter, system-ui, sans-serif" font-size="34" font-weight="800" text-anchor="middle">${escapedSub.slice(0, 45)}</text>
    <text x="540" y="760" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-size="30" font-weight="700" text-anchor="middle">${escapedBrand}</text>
    <text x="960" y="965" fill="#64748b" font-family="monospace" font-size="22" font-weight="700" text-anchor="end">${escapedSig}</text>
  </svg>`;

  return svgToDataUrl(svg);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "50mb" }));

  app.post("/api/gemini/generate-meme", async (req, res) => {
    try {
      const { dna, vibe = "Neutral" } = req.body as { dna: BrandDNA; vibe?: string };
      const ai = getAiClient();

      let promptContext = "";
      if (dna.reference === "Viral Template" && dna.templateId) {
        promptContext = `VIRAL TEMPLATE SELECTED: ${dna.templateId}. Adapt the exact multi-panel or character composition and irony of this viral meme format to the user's industry.`;
      } else if (dna.reference === "User Upload" && dna.referenceImage) {
        promptContext = `USER HAS UPLOADED A REFERENCE IMAGE. Replicate the structure, layout, character pose, and "meme energy" of the provided image, reskinned with the user's brand elements and industry context.`;
      } else if (dna.reference === "Iconic Personality" && dna.personality) {
        promptContext = `ICONIC PERSONALITY SELECTED: ${dna.personality}. Center the visual illustration and tone around this character's iconic persona, wardrobe, and setting.`;
      } else {
        promptContext = `FOUNDATION: Inspired by the style/vibe of "${dna.reference}".`;
      }

      let styleDetails = "";
      if (dna.visualStyle === "Neo-Brutalism") {
        styleDetails =
          "Neo-Brutalism: High-contrast aesthetic with thick 6px chunky black outlines, vibrant flat colors, heavy offset hard-edged shadows, bold geometric panels.";
      } else if (dna.visualStyle === "Cinematic Office Noir") {
        styleDetails =
          "Cinematic Office Noir: Dramatic chiaroscuro lighting, moody midnight blue and slate tones, Venetian blind light rays, deep cinematic shadows, glowing monitors.";
      } else if (dna.visualStyle === "3D Isometric") {
        styleDetails =
          "3D Isometric: Clean isometric projection (30-degree angles), layered 3D blocks, floating dashboard screens, miniature office/tech perspective, crisp sharp edges and gradients.";
      } else if (dna.visualStyle === "Sketch & Ink") {
        styleDetails =
          "Sketch & Ink: Architectural hand-drawn ink illustration, expressive cross-hatching lines, blueprint/paper texture accents, high-contrast strokes with emerald/brand highlights.";
      } else if (dna.visualStyle === "Cyberpunk Glitch") {
        styleDetails =
          "Cyberpunk Glitch: Neon-drenched high-tech aesthetic, scanlines, chromatic aberration offset layers, vibrant magenta and cyan neon lighting, futuristic HUD overlays.";
      } else if (dna.visualStyle === "Art Deco Futurism") {
        styleDetails =
          "Art Deco Futurism: Sleek symmetrical geometric sunbursts, bold gold (#f59e0b) and chrome gradients, stylized 1920s metropolis architecture meets sci-fi luxury.";
      } else {
        styleDetails =
          "Modern Pro 3D: Smooth multi-stop radial and linear gradients, glassmorphic cards, soft studio rim lighting, premium 3D vector shading.";
      }

      const masterPrompt = `
You are the "Meme Architect: Professional Edition" AND a master vector illustrator.
ROLE: ${dna.role}.
PURPOSE: ${dna.purpose}.
${promptContext}

USER CONTEXT:
- Industry: ${dna.industry}
- Target Audience: ${dna.audience}
- Extra Context / Tweaks: ${dna.extraContext || "None"}
- Villains/Pain Points: ${dna.villain}
- Brand Name: ${dna.brandName}
- Brand Signature: ${dna.brandSignature}
- Primary Brand Color: ${dna.brandColors || "#10b981"}
- Visual Style: ${dna.visualStyle} (${styleDetails})
- Personality Focus: ${dna.personality || "N/A"}
- Vibe Selection: ${vibe}

TASK:
1. Generate 3 punchy LinkedIn caption variations:
   - Structure: Hook → The "Pain" → The "Insight" → The "Ask" (CTA).
   - Tone: Match "${dna.role}" and "${dna.purpose}".
   - BANNED PHRASES: "In the ever-changing landscape," "Unlock your potential," "Let’s dive in," "Unleash."
   - FORMAT: Heavy white space. Short, punchy sentences.
2. Generate a visualMetaphorPrompt describing the meme scene.
3. Generate a complete, rich, standalone square 1080x1080 SVG illustration (svgMarkup) that visually renders this meme:
   - Root element MUST be: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
   - Use rich <defs> (linearGradient, radialGradient, filter drop-shadows, patterns) matching "${dna.visualStyle}" and brand color "${dna.brandColors || "#10b981"}".
   - Draw a detailed multi-layered scene: background environment (office/city/grid), expressive central character(s) with recognizable silhouettes/faces/accessories inspired by "${dna.personality || dna.templateId || dna.industry}", props (laptops, charts, coffee mugs with "${dna.brandName}"), and visual humor depicting "${dna.villain}".
   - Include bold, high-contrast meme text banners/captions inside the artwork (e.g. Top/Bottom meme text or dialogue bubbles) that are witty, legible, and properly centered within the 1080x1080 viewBox.
   - Include a clean watermark in the bottom-right corner reading "${dna.brandSignature}".
`;

      const contentsParts: any[] = [{ text: masterPrompt }];
      if (dna.reference === "User Upload" && dna.referenceImage) {
        const base64Data = dna.referenceImage.split(",")[1];
        const mimeType = dna.referenceImage.split(";")[0].split(":")[1];
        if (base64Data && mimeType && !mimeType.includes("svg")) {
          contentsParts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          });
        }
      }

      const response = await ai.models.generateContent({
        model: MODEL_FREE,
        contents: { parts: contentsParts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              captions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 3 LinkedIn caption variations.",
              },
              visualMetaphorPrompt: {
                type: Type.STRING,
                description: "A concise description of the visual metaphor.",
              },
              svgMarkup: {
                type: Type.STRING,
                description:
                  "Complete, valid raw <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1080 1080' width='1080' height='1080'>...</svg> illustration code.",
              },
            },
            required: ["captions", "visualMetaphorPrompt", "svgMarkup"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      const captions: string[] = parsed.captions || [];
      const baseVisualMetaphor: string = parsed.visualMetaphorPrompt || "Professional struggle";
      const rawSvg: string = parsed.svgMarkup || "";

      const imageUrl =
        rawSvg && rawSvg.includes("<svg")
          ? svgToDataUrl(rawSvg)
          : buildFallbackSvg(dna, dna.villain, baseVisualMetaphor);

      const result: MemeResult = {
        imageUrl,
        captions,
        vibe: vibe as any,
        timestamp: Date.now(),
      };

      res.json(result);
    } catch (error: any) {
      console.error("Error in /api/gemini/generate-meme:", error);
      res.status(500).json({ error: error?.message || "Failed to generate meme" });
    }
  });

  app.post("/api/gemini/edit-meme-image", async (req, res) => {
    try {
      const { currentImageUrl, editPrompt } = req.body as {
        currentImageUrl: string;
        editPrompt: string;
      };
      const ai = getAiClient();
      const base64Data = currentImageUrl.split(",")[1];
      const mimeType = currentImageUrl.split(";")[0].split(":")[1];

      const parts: any[] = [];
      let existingSvg = "";

      if (mimeType && mimeType.includes("svg") && base64Data) {
        existingSvg = Buffer.from(base64Data, "base64").toString("utf-8");
      } else if (base64Data && mimeType) {
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType,
          },
        });
      }

      parts.push({
        text: `You are an elite vector illustrator. Modify or recreate this 1080x1080 square meme illustration (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">) to apply the following user tweak while preserving the overall brand aesthetic, character composition, and corner watermark:
USER EDIT REQUEST: "${editPrompt}"
${existingSvg ? `\nCURRENT SVG CODE:\n${existingSvg}` : ""}
Return ONLY the complete, valid <svg>...</svg> markup.`,
      });

      const svgEditResponse = await ai.models.generateContent({
        model: MODEL_FREE,
        contents: { parts },
      });

      const updatedSvgText = svgEditResponse.text || "";
      if (updatedSvgText.includes("<svg")) {
        res.json({ imageUrl: svgToDataUrl(updatedSvgText) });
        return;
      }

      res.status(500).json({ error: "Failed to edit image" });
    } catch (error: any) {
      console.error("Error in /api/gemini/edit-meme-image:", error);
      res.status(500).json({ error: error?.message || "Failed to edit image" });
    }
  });

  app.post("/api/gemini/vibe-check", async (req, res) => {
    try {
      const { dna, newVibe } = req.body as {
        dna: BrandDNA;
        currentMeme: MemeResult;
        newVibe: "Edgy" | "Safe";
      };
      const ai = getAiClient();
      const prompt = `
    Role: ${dna.role}.
    Vibe: ${newVibe}.
    Audience: ${dna.audience}.
    Personality Inspiration: ${dna.personality || "None"}.
    Regenerate 3 captions that are ${
      newVibe === "Edgy" ? "sharper and more sarcastic" : "more professional and authoritative"
    }.
    Keep the Hook → Pain → Insight → CTA structure.
  `;

      const response = await ai.models.generateContent({
        model: MODEL_FREE,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      });
      const captions = JSON.parse(response.text || "[]");
      res.json({ captions });
    } catch (error: any) {
      console.error("Error in /api/gemini/vibe-check:", error);
      res.status(500).json({ error: error?.message || "Failed to perform vibe check" });
    }
  });

  app.post("/api/gemini/analyze-strategy", async (req, res) => {
    try {
      const { dna } = req.body as { dna: BrandDNA; meme: MemeResult };
      const ai = getAiClient();
      const prompt = `
    Analyze this LinkedIn strategy for "${dna.brandName}".
    Role: ${dna.role}. Personality/Reference: ${dna.personality || dna.reference}. Purpose: ${dna.purpose}. 
    Explain why this builds authority for ${dna.audience}. Max 4 sentences.
  `;
      const response = await ai.models.generateContent({
        model: MODEL_FREE,
        contents: prompt,
      });
      res.json({ analysis: response.text || "Strategy analysis unavailable." });
    } catch (error: any) {
      console.error("Error in /api/gemini/analyze-strategy:", error);
      res.status(500).json({ error: error?.message || "Failed to analyze strategy" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
