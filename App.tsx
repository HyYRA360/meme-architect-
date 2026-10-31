
import React, { useState, useEffect, useRef } from 'react';
import { AppStatus, BrandDNA, MemeResult, VisualStyle, MemePurpose, MemeRole, MemeReference, ViralTemplate } from './types';
import { generateMeme, vibeCheck, editMemeImage, analyzeStrategy } from './geminiService';

// --- Constants ---
const VIRAL_TEMPLATES: ViralTemplate[] = [
  { id: 'Distracted Boyfriend', name: 'Distracted Boyfriend', year: '2017', description: 'Classic decision/distraction metaphor.', category: 'Classic' },
  { id: 'Woman Yelling at a Cat', name: 'Woman Yelling at a Cat', year: '2019', description: 'Dual perspective conflict.', category: 'Classic' },
  { id: 'This is Fine', name: 'This is Fine', year: '2016', description: 'Crisis management or denial.', category: 'Corporate' },
  { id: 'Drake Hotline Bling', name: 'Drake Hotline Bling', year: '2015', description: 'Preference/Rejection comparison.', category: 'Classic' },
  { id: 'Spiderman Pointing', name: 'Spider-Man Pointing', year: '2018', description: 'Identity crisis or blame-shifting.', category: 'Modern' },
  { id: 'Change My Mind', name: 'Change My Mind', year: '2018', description: 'Unpopular opinion or bold claim.', category: 'Corporate' },
  { id: 'Bernie Mittens', name: 'Bernie Mittens', year: '2021', description: 'Comfortable in chaos/waiting.', category: 'Modern' },
  { id: 'Two Buttons', name: 'Daily Struggle Button', year: '2015', description: 'Impossible choices.', category: 'Corporate' },
  { id: 'Is this a Pigeon?', name: 'Is this a...?', year: '2011', description: 'Misidentifying solutions.', category: 'Classic' },
  { id: 'Mocking Spongebob', name: 'Mocking Sponge', year: '2017', description: 'Repeating dumb advice.', category: 'Chaotic' },
  { id: 'Success Kid', name: 'Success Kid', year: '2007', description: 'Small wins in hard markets.', category: 'Classic' },
  { id: 'Expand Mind', name: 'Galaxy Brain', year: '2017', description: 'Increasingly complex bad ideas.', category: 'Chaotic' },
  { id: 'Surprised Pikachu', name: 'Surprised Pikachu', year: '2018', description: 'Predictable consequences.', category: 'Modern' },
  { id: 'Kermit Tea', name: 'But That\'s None of My Business', year: '2014', description: 'Passive-aggressive insights.', category: 'Corporate' },
  { id: 'Hide the Pain Harold', name: 'Hide Pain Harold', year: '2011', description: 'Forcing a smile through bad data.', category: 'Classic' }
];

const ICONIC_PERSONALITIES = [
  "Harvey Specter (Suits)", "Donna Paulsen (Suits)", "Mike Ross (Suits)", "Jordan Belfort (Wolf of Wall St)",
  "Miranda Priestly (Devil Wears Prada)", "Tony Stark (Iron Man)", "Don Draper (Mad Men)", "Bobby Axelrod (Billions)",
  "Daenerys Targaryen (Game of Thrones)", "Tyrion Lannister (Game of Thrones)", "Spider-Man (Pointing Meme)",
  "Anakin Skywalker (Star Wars)", "Padme Amidala (Star Wars)", "The Joker (Heath Ledger)", "Patrick Bateman (American Psycho)",
  "Sherlock Holmes (Benedict C.)", "Michael Scott (The Office)", "Dwight Schrute (The Office)", "Ron Swanson (Parks & Rec)",
  "Logan Roy (Succession)", "Kendall Roy (Succession)", "Shiv Roy (Succession)", "Geralt of Rivia (The Witcher)",
  "Wednesday Addams", "Eleven (Stranger Things)", "Rick Grimes (Walking Dead)", "Walter White (Breaking Bad)",
  "Saul Goodman (Better Call Saul)", "Thomas Shelby (Peaky Blinders)", "John Wick", "Ellen Ripley (Alien)",
  "Trinity (Matrix)", "Neo (Matrix)", "Morpheus (Matrix)", "Gandalf (LOTR)", "Gollum (LOTR)",
  "Ted Lasso", "Roy Kent (Ted Lasso)", "Leslie Knope (Parks & Rec)", "Batman (Bale)", "Wonder Woman",
  "Captain America", "Thor (Chill/Bro Version)", "Thanos", "Loki", "Dr. House", "Maleficent",
  "Cruella de Vil", "Indiana Jones", "James Bond (Craig)"
];

const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center p-6 text-center">
    <div className="w-24 h-24 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_40px_rgba(16,185,129,0.4)]"></div>
    <h2 className="text-4xl font-black text-white mb-4 tracking-tighter italic uppercase">Architecting Virality</h2>
    <p className="text-emerald-400 font-mono text-sm max-w-md uppercase tracking-[0.2em]">{message}</p>
  </div>
);

const FieldLabel: React.FC<{ label: string; tooltip: string }> = ({ label, tooltip }) => (
  <div className="flex flex-col mb-3">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{label}</label>
    <span className="text-[9px] text-emerald-500/60 font-medium italic mt-0.5">{tooltip}</span>
  </div>
);

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.ONBOARDING);
  const [dna, setDna] = useState<BrandDNA>({
    industry: 'Digital Marketer',
    villain: 'Algorithm changes killing organic reach',
    audience: 'High-growth founders and marketers',
    extraContext: '',
    visualStyle: 'Neo-Brutalism',
    brandColors: '#10b981',
    brandName: 'Nizam BIN Shahid',
    brandSignature: 'Nizam // Digital Marketer',
    purpose: 'Relate to the pain',
    role: 'The Industry Expert',
    reference: 'Original Asset',
    useLikeness: false
  });
  const [currentMeme, setCurrentMeme] = useState<MemeResult | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [editInput, setEditInput] = useState('');
  const [strategyNote, setStrategyNote] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    setStatus(AppStatus.GENERATING);
    setStrategyNote(null);
    try {
      const result = await generateMeme(dna);
      setCurrentMeme(result);
      setStatus(AppStatus.DASHBOARD);
    } catch (error) {
      console.error(error);
      alert("System recalibration required. Check your configuration.");
      setStatus(AppStatus.ONBOARDING);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDna({
          ...dna,
          reference: 'User Upload',
          referenceImage: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectTemplate = (template: ViralTemplate) => {
    setDna({
      ...dna,
      reference: 'Viral Template',
      templateId: template.id
    });
    setShowGallery(false);
  };

  const handleDownload = () => {
    if (!currentMeme?.imageUrl) return;
    const link = document.createElement('a');
    link.href = currentMeme.imageUrl;
    link.download = `MemeArchitect_${dna.brandName.replace(/\s+/g, '_')}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-emerald-500/30">
      {status === AppStatus.GENERATING && <LoadingOverlay message={loadingMsg} />}
      
      <header className="border-b border-white/5 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setStatus(AppStatus.ONBOARDING)}>
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center font-black text-white italic transform group-hover:rotate-12 group-hover:scale-110 transition-all shadow-xl shadow-emerald-900/40">M</div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">
                Meme<span className="text-emerald-500">Architect</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-[0.3em] mt-1">AUTHORITY ENGINE v6</p>
            </div>
          </div>
        </div>
      </header>

      {status === AppStatus.ONBOARDING ? (
        <main className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
          {showGallery && (
            <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-8">
              <div className="bg-slate-900 border border-white/10 w-full max-w-5xl rounded-3xl p-10 max-h-[90vh] overflow-y-auto custom-scrollbar relative">
                <button onClick={() => setShowGallery(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white uppercase text-xs font-black tracking-widest">[ Close ]</button>
                <h2 className="text-4xl font-black text-white italic mb-10 uppercase tracking-tighter">Viral Archives</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {VIRAL_TEMPLATES.map(t => (
                    <div key={t.id} onClick={() => handleSelectTemplate(t)} className="group bg-slate-950 border border-white/5 rounded-2xl p-6 hover:border-emerald-500 transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-mono text-slate-600 uppercase">{t.year}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-white/40 uppercase font-black">{t.category}</span>
                      </div>
                      <h3 className="text-xl font-black text-white mb-2 group-hover:text-emerald-400 transition-colors uppercase italic">{t.name}</h3>
                      <p className="text-slate-500 text-xs leading-relaxed font-medium">{t.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="max-w-6xl w-full bg-slate-900 border border-white/5 rounded-[40px] shadow-3xl p-12 my-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] -z-10"></div>
            
            <div className="flex flex-col lg:flex-row gap-12">
              <div className="lg:w-1/3 space-y-8">
                <div>
                  <h2 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase italic leading-none">Architect<br/>Your<br/>Legacy.</h2>
                  <p className="text-slate-500 font-medium leading-relaxed">High-status assets for high-stakes markets.</p>
                </div>

                <div className="space-y-4">
                  <button onClick={() => setShowGallery(true)} className="w-full bg-slate-950 border border-white/10 hover:border-emerald-500 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-4 uppercase text-xs tracking-widest group">
                    <span className="group-hover:scale-110 transition-transform">Viral Gallery</span>
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-950 border border-white/10 hover:border-emerald-500 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-4 uppercase text-xs tracking-widest group">
                    <span className="group-hover:scale-110 transition-transform">Remix My Image</span>
                  </button>
                  <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageUpload} />
                </div>

                {dna.referenceImage && <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-[10px] text-emerald-400 font-black uppercase tracking-widest animate-pulse">Remix Mode Active</div>}
              </div>

              <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <FieldLabel label="Brand Name" tooltip="Example: Nizam BIN Shahid" />
                  <input type="text" className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-800" value={dna.brandName} onChange={e => setDna({...dna, brandName: e.target.value})} />
                </div>
                <div>
                  <FieldLabel label="Brand Signature" tooltip="Stylized watermark: 'Nizam // Digital Marketer'" />
                  <input type="text" className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="e.g. Nizam // Digital Marketer" value={dna.brandSignature} onChange={e => setDna({...dna, brandSignature: e.target.value})} />
                </div>
                <div>
                  <FieldLabel label="Iconic Personality" tooltip="Drives the visual energy (e.g. Harvey Specter)" />
                  <select className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 custom-select" value={dna.personality} onChange={e => setDna({...dna, personality: e.target.value, reference: 'Iconic Personality'})}>
                    <option value="">None Selected</option>
                    {ICONIC_PERSONALITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel label="Campaign Villain" tooltip="Common enemy: 'Scope Creep', 'Bad Ads'" />
                  <input type="text" className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="e.g. Low ROAS" value={dna.villain} onChange={e => setDna({...dna, villain: e.target.value})} />
                </div>
                <div>
                  <FieldLabel label="Visual Style" tooltip="Artistic aesthetic for the generated image" />
                  <select className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 custom-select" value={dna.visualStyle} onChange={e => setDna({...dna, visualStyle: e.target.value as VisualStyle})}>
                    <option value="Neo-Brutalism">Neo-Brutalism (Bold, Raw, Graphic)</option>
                    <option value="Cinematic Office Noir">Office Noir (Moody, Dramatic Lights)</option>
                    <option value="3D Isometric">3D Isometric (Clean, Miniature, Tech)</option>
                    <option value="Modern Pro 3D">Modern Pro 3D (Premium Octane Render)</option>
                    <option value="Sketch & Ink">Sketch & Ink (Architectural Drawing)</option>
                    <option value="Cyberpunk Glitch">Cyberpunk Glitch (Neon, Techy, Edgy)</option>
                    <option value="Art Deco Futurism">Art Deco Futurism (Gold, Sleek, 1920s)</option>
                  </select>
                </div>
                <div>
                  <FieldLabel label="Target Audience" tooltip="Who are you calling out? 'CMOs', 'SaaS Owners'" />
                  <input type="text" className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" value={dna.audience} onChange={e => setDna({...dna, audience: e.target.value})} />
                </div>
                <div className="md:col-span-2 pt-6">
                  <button onClick={handleGenerate} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-6 rounded-[32px] shadow-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-[0.4em] italic text-sm">
                    /generate Authority
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 max-w-7xl mx-auto w-full p-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-10">
            <div className="bg-slate-900 border border-white/5 rounded-[40px] overflow-hidden shadow-3xl relative">
              <div className="aspect-square bg-slate-950 relative overflow-hidden group">
                {currentMeme?.imageUrl ? <img src={currentMeme.imageUrl} alt="Asset" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" /> : <div className="text-slate-800 font-black italic text-6xl animate-pulse flex h-full items-center justify-center">RENDERING...</div>}
                <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 text-[10px] text-white/80 font-mono tracking-widest uppercase shadow-2xl">
                  {dna.brandSignature}
                </div>
              </div>
              <div className="p-8 bg-slate-900/90 border-t border-white/5 flex gap-4">
                <input type="text" placeholder='Execute tweak (e.g. "make it darker")...' className="flex-1 bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50" value={editInput} onChange={(e) => setEditInput(e.target.value)} />
                <button onClick={handleGenerate} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-8 py-4 rounded-2xl transition-all uppercase tracking-widest shadow-xl">Apply</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <button onClick={() => setStatus(AppStatus.ONBOARDING)} className="py-5 rounded-3xl border-2 bg-slate-900 border-white/5 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-emerald-400 transition-all">Reset DNA</button>
              <button onClick={handleGenerate} className="py-5 rounded-3xl border-2 bg-slate-900 border-white/5 text-emerald-500 font-black text-xs uppercase tracking-widest hover:bg-emerald-500/5 transition-all">Re-Gen</button>
              <button onClick={handleDownload} className="py-5 rounded-3xl border-2 bg-emerald-600 border-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-500 transition-all">Download</button>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-10 overflow-y-auto max-h-[calc(100vh-160px)] pr-6 custom-scrollbar">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Copy Assets</h3>
              <span className="text-[10px] px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black tracking-widest uppercase border border-emerald-500/30">LOCKED</span>
            </div>
            <div className="space-y-8">
              {currentMeme?.captions.map((caption, idx) => (
                <div key={idx} className="bg-slate-900 border border-white/5 rounded-[32px] p-8 relative group hover:border-emerald-500/40 transition-all shadow-2xl">
                  <button onClick={() => { navigator.clipboard.writeText(caption); alert("Copied."); }} className="absolute top-8 right-8 text-[11px] font-black bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest">Copy</button>
                  <div className="text-slate-300 text-base leading-relaxed font-medium whitespace-pre-wrap">{caption}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default App;
