
export type VisualStyle = 'Cinematic Office Noir' | '3D Isometric' | 'Modern Pro 3D' | 'Sketch & Ink' | 'Neo-Brutalism' | 'Cyberpunk Glitch' | 'Art Deco Futurism';

export type MemePurpose = 'Make them laugh' | 'Make them think' | 'Relate to the pain' | 'Call out the gurus';
export type MemeRole = 'The Industry Expert' | 'The Relatable Peer' | 'The Bold Rebel' | 'The Data Scientist';
export type MemeReference = 'Original Asset' | 'Suits' | 'The Big Bang Theory' | 'Stranger Things' | 'The Wolf of Wall Street' | 'The Pursuit of Happyness' | 'Office Comedy' | 'Viral Template' | 'User Upload' | 'Iconic Personality';

export interface ViralTemplate {
  id: string;
  name: string;
  year: string;
  description: string;
  category: 'Classic' | 'Modern' | 'Corporate' | 'Chaotic';
}

export interface BrandDNA {
  industry: string;
  villain: string;
  audience: string;
  extraContext: string;
  visualStyle: VisualStyle;
  brandColors: string;
  brandName: string;
  brandSignature: string; // The specific signature text/style
  purpose: MemePurpose;
  role: MemeRole;
  reference: MemeReference;
  personality?: string; // e.g., Harvey Specter, Daenerys
  templateId?: string;
  referenceImage?: string; // base64
  useLikeness: boolean;
}

export interface MemeResult {
  imageUrl: string;
  captions: string[];
  vibe: 'Neutral' | 'Edgy' | 'Safe';
  timestamp: number;
}

export enum AppStatus {
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  GENERATING = 'GENERATING'
}
