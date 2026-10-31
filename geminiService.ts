import { BrandDNA, MemeResult } from "./types";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }
  return response.json();
}

async function ensurePngDataUrl(imageUrl: string): Promise<string> {
  if (!imageUrl || !imageUrl.startsWith("data:image/svg+xml")) {
    return imageUrl;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(imageUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, 1080, 1080);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(imageUrl);
      }
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}

export async function generateMeme(dna: BrandDNA, vibe: string = 'Neutral'): Promise<MemeResult> {
  const result = await postJson<MemeResult>("/api/gemini/generate-meme", { dna, vibe });
  result.imageUrl = await ensurePngDataUrl(result.imageUrl);
  return result;
}

export async function editMemeImage(currentImageUrl: string, editPrompt: string): Promise<string> {
  const data = await postJson<{ imageUrl: string }>("/api/gemini/edit-meme-image", {
    currentImageUrl,
    editPrompt,
  });
  return ensurePngDataUrl(data.imageUrl);
}

export async function vibeCheck(dna: BrandDNA, currentMeme: MemeResult, newVibe: 'Edgy' | 'Safe'): Promise<string[]> {
  const data = await postJson<{ captions: string[] }>("/api/gemini/vibe-check", {
    dna,
    currentMeme,
    newVibe,
  });
  return data.captions;
}

export async function analyzeStrategy(dna: BrandDNA, meme: MemeResult): Promise<string> {
  const data = await postJson<{ analysis: string }>("/api/gemini/analyze-strategy", {
    dna,
    meme,
  });
  return data.analysis;
}
