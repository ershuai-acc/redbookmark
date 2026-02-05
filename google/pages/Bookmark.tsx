
import React, { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { GoogleGenAI } from '@google/genai';
import { Volume, Mark as MarkType } from '../types';

interface BookmarkProps {
  volumes: Volume[];
  onAddMark: (volumeId: string, mark: Omit<MarkType, 'id'>) => void;
}

const Bookmark: React.FC<BookmarkProps> = ({ volumes, onAddMark }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const volume = volumes.find(v => v.id === id);
  const exportRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMarkText, setNewMarkText] = useState('');
  const [newPageNumber, setNewPageNumber] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!volume) return <div className="p-8 text-center text-white font-mono uppercase tracking-widest text-[10px]">Registry Not Found</div>;

  const currentMark = volume.marks[activeTab];

  const handlePrev = () => { if (activeTab > 0) setActiveTab(activeTab - 1); };
  const handleNext = () => { if (activeTab < volume.marks.length - 1) setActiveTab(activeTab + 1); };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarkText.trim()) return;
    onAddMark(volume.id, {
      text: newMarkText,
      date: new Date().toISOString().split('T')[0],
      page: newPageNumber.trim() || `Mark ${volume.marks.length + 1}`
    });
    setNewMarkText('');
    setNewPageNumber('');
    setShowAddModal(false);
    setActiveTab(volume.marks.length);
  };

  const handleOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsOcrLoading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [{ inlineData: { data: base64.split(',')[1], mimeType: file.type } }, { text: "Extract all text from this image precisely." }]
        }
      });
      if (response.text) setNewMarkText(prev => prev ? prev + "\n" + response.text.trim() : response.text.trim());
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleExportImage = async () => {
    if (!exportRef.current || !currentMark) return;
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 150));
    const dataUrl = await toPng(exportRef.current, { cacheBust: true, backgroundColor: '#D31526' });
    const link = document.createElement('a');
    link.download = `mark_${volume.title}_${activeTab + 1}.png`;
    link.href = dataUrl;
    link.click();
    setIsExporting(false);
  };

  const handleSyncToFeishu = () => {
    setIsSyncing(true);
    // Mocking sync process
    setTimeout(() => {
      setIsSyncing(false);
      alert('Archive successfully synced to Feishu.');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col pt-12 pb-8 overflow-hidden relative">
      <header className="px-6 flex items-start gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"><span className="material-symbols-outlined">arrow_back</span></button>
        <div className="flex flex-col flex-1 min-w-0">
          <h1 className="text-white text-2xl font-display italic truncate uppercase tracking-tighter">{volume.title}</h1>
          <span className="text-white/60 text-[10px] uppercase font-mono tracking-widest font-bold mt-1">AUTHOR: {volume.author}</span>
        </div>
      </header>

      <main ref={exportRef} className="flex-1 px-5 flex flex-col">
        <div className="flex items-end -mb-[1px] relative z-20 px-2 gap-1">
          <button disabled={activeTab === 0} onClick={handlePrev} className={`h-10 px-4 folder-tab-shape text-[9px] font-mono font-bold flex-1 ${activeTab > 0 ? 'bg-paper-dark text-primary' : 'bg-paper-dark/30 text-primary/20'}`}>PREV</button>
          <div className="h-12 px-6 folder-tab-shape bg-paper text-primary flex items-center justify-center text-[10px] font-mono font-bold flex-[1.5] z-30 shadow-lg uppercase">
            {volume.marks.length > 0 ? `mark_${activeTab + 1}` : 'EMPTY'}
          </div>
          <button disabled={activeTab >= volume.marks.length - 1} onClick={handleNext} className={`h-10 px-4 folder-tab-shape text-[9px] font-mono font-bold flex-1 ${activeTab < volume.marks.length - 1 ? 'bg-paper-dark text-primary' : 'bg-paper-dark/30 text-primary/20'}`}>NEXT</button>
          <button onClick={() => setShowAddModal(true)} className="h-10 px-4 folder-tab-shape bg-primary/20 text-white flex-1"><span className="material-symbols-outlined text-sm">add</span></button>
        </div>

        <div className="flex-1 bg-paper border border-black/5 p-8 flex flex-col relative z-10 shadow-2xl rounded-sm min-h-[400px]">
           {currentMark ? (
             <>
               <div className="flex-grow flex flex-col justify-center items-center text-center py-10">
                  <div className="w-12 h-[1px] bg-primary/20 mb-12"></div>
                  <h2 className="font-display text-4xl leading-[1.3] italic text-primary px-2">“{currentMark.text}”</h2>
                  <div className="w-12 h-[1px] bg-primary/20 mt-12"></div>
               </div>
               <div className="mt-auto pt-8 border-t border-primary/10 flex justify-between items-end gap-2 text-primary">
                  <div className="flex flex-col flex-1"><span className="text-[7px] font-mono uppercase tracking-widest opacity-40">VOLUME</span><span className="text-[9px] font-bold uppercase truncate">{volume.title}</span></div>
                  <div className="flex flex-col items-center flex-1"><span className="text-[7px] font-mono uppercase tracking-widest opacity-40">LOC.</span><span className="text-[9px] font-bold">{currentMark.page}</span></div>
                  <div className="flex flex-col items-end flex-1"><span className="text-[7px] font-mono uppercase tracking-widest opacity-40">DATE</span><span className="text-[9px] font-bold">{currentMark.date}</span></div>
               </div>
             </>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center opacity-30"><span className="material-symbols-outlined text-5xl mb-4">history_edu</span><p className="font-mono text-[10px] uppercase text-center tracking-widest font-bold">Registry is empty.</p></div>
           )}
        </div>
      </main>

      <footer className="mt-8 px-5 grid grid-cols-3 gap-2 mb-4">
        <button className="bg-paper/10 py-3 flex flex-col items-center justify-center border border-white/10 rounded-sm text-white transition-all active:scale-95">
          <span className="material-symbols-outlined text-lg">chat</span>
          <span className="text-[7.5px] font-mono font-bold uppercase tracking-tighter mt-1 text-center leading-tight">Share Mark</span>
        </button>
        <button onClick={handleExportImage} disabled={!currentMark || isExporting} className="bg-paper/10 py-3 flex flex-col items-center justify-center border border-white/10 rounded-sm text-white transition-all active:scale-95">
          <span className="material-symbols-outlined text-lg">{isExporting ? 'sync' : 'image'}</span>
          <span className="text-[7.5px] font-mono font-bold uppercase tracking-tighter mt-1 text-center leading-tight">Export Card</span>
        </button>
        <button onClick={handleSyncToFeishu} disabled={isSyncing} className="bg-paper/10 py-3 flex flex-col items-center justify-center border border-white/10 rounded-sm text-white transition-all active:scale-95">
          <span className="material-symbols-outlined text-lg">{isSyncing ? 'sync' : 'sync_alt'}</span>
          <span className="text-[7.5px] font-mono font-bold uppercase tracking-tighter mt-1 text-center leading-tight">Sync all to Feishu</span>
        </button>
      </footer>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm">
           <div className="bg-paper p-8 rounded-[2rem] w-full max-w-sm shadow-2xl">
              <h3 className="font-display italic text-2xl text-primary mb-6 text-center uppercase tracking-tighter">ADD MARK</h3>
              <form onSubmit={handleAddSubmit} className="space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[9px] font-mono text-primary/60 uppercase font-bold tracking-widest">Content</label>
                    <label className="cursor-pointer flex items-center gap-1 bg-primary/5 px-2 py-1 rounded">
                      <input type="file" accept="image/*" className="hidden" onChange={handleOcr} />
                      <span className="material-symbols-outlined text-xs">{isOcrLoading ? 'sync' : 'photo_camera'}</span>
                      <span className="text-[8px] font-mono font-bold uppercase">OCR</span>
                    </label>
                  </div>
                  <textarea required autoFocus rows={4} className="w-full bg-transparent border-2 border-primary/10 p-4 font-newsreader italic text-primary text-lg rounded-xl resize-none" value={newMarkText} onChange={e => setNewMarkText(e.target.value)} />
                </div>
                
                <div className="flex justify-end items-center mt-6 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)} 
                    className="px-6 py-3.5 text-[11px] font-mono font-bold uppercase rounded-full tracking-widest text-primary/40 hover:text-primary border border-primary/10 hover:border-primary/30 active:scale-95 transition-all"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit" 
                    className="bg-primary text-paper px-8 py-3.5 text-[11px] font-mono font-bold uppercase rounded-full tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    SAVE
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Bookmark;
