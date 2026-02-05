
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Volume } from '../types';
import Navigation from '../components/Navigation';

interface LibraryProps {
  volumes: Volume[];
  onAddVolume: (volume: Omit<Volume, 'id' | 'marks' | 'archivalId'>) => void;
  onUpdateVolume: (id: string, volume: Partial<Omit<Volume, 'id' | 'marks' | 'archivalId'>>) => void;
}

const Library: React.FC<LibraryProps> = ({ volumes, onAddVolume, onUpdateVolume }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVolumeId, setEditingVolumeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ title: '', author: '', classificationInput: '' });
  const [activeTagPopup, setActiveTagPopup] = useState<string | null>(null);

  // Handle jumping to a volume from other pages (e.g. Profile)
  useEffect(() => {
    const state = location.state as { jumpToId?: string } | null;
    if (state?.jumpToId) {
      const targetIndex = volumes.findIndex(v => v.id === state.jumpToId);
      if (targetIndex !== -1) {
        setCurrentIndex(targetIndex);
      }
      // Clear the state so it doesn't jump again on refresh/back
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, volumes, navigate]);

  const filteredVolumes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return volumes;
    
    return volumes.filter(volume => 
      volume.title.toLowerCase().includes(query) ||
      volume.author.toLowerCase().includes(query) ||
      volume.classifications.some(c => c.toLowerCase().includes(query))
    );
  }, [volumes, searchQuery]);

  const volumesWithSameTag = useMemo(() => {
    if (!activeTagPopup) return [];
    return volumes.filter(v => v.classifications.includes(activeTagPopup));
  }, [volumes, activeTagPopup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    
    const classifications = formData.classificationInput.split(',').map(t => t.trim()).filter(Boolean).slice(0, 8);
    
    if (editingVolumeId) {
      onUpdateVolume(editingVolumeId, { 
        title: formData.title, 
        author: formData.author, 
        classifications 
      });
    } else {
      onAddVolume({ 
        title: formData.title, 
        author: formData.author, 
        classifications 
      });
    }
    
    closeModal();
  };

  const closeModal = () => {
    setFormData({ title: '', author: '', classificationInput: '' });
    setShowAddForm(false);
    setEditingVolumeId(null);
  };

  const openEdit = (e: React.MouseEvent, volume: Volume) => {
    e.stopPropagation();
    setFormData({
      title: volume.title,
      author: volume.author,
      classificationInput: volume.classifications.join(', ')
    });
    setEditingVolumeId(volume.id);
    setShowAddForm(true);
  };

  const nextVolume = () => {
    if (currentIndex < filteredVolumes.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const prevVolume = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const jumpToVolume = (volumeId: string) => {
    setSearchQuery('');
    const targetIndex = volumes.findIndex(v => v.id === volumeId);
    if (targetIndex !== -1) {
      setCurrentIndex(targetIndex);
    }
    setActiveTagPopup(null);
  };

  const getClassificationStyle = (index: number) => {
    const styles = [
      "absolute -top-16 right-4 z-[120]", 
      "absolute top-[28%] -right-6 z-[120]", 
      "absolute bottom-20 left-4 z-[120]", 
      "absolute bottom-14 right-6 z-[120]", 
      "absolute top-[55%] -left-4 z-[120]", 
      "absolute -top-4 left-[35%] z-[120]", 
      "absolute bottom-32 right-1 z-[120]", 
      "absolute top-1/2 left-4 z-[120]", 
    ];
    return styles[index] || "";
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col pt-4 pb-40 overflow-hidden relative">
      <header className="px-6 flex items-center gap-4 mb-10 z-[60]">
        <button 
          onClick={() => setShowAddForm(true)}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90 border border-white/5 shrink-0"
        >
          <span className="material-symbols-outlined text-2xl font-bold">add</span>
        </button>

        <div className="flex-1 h-12 bg-white/10 rounded-full flex items-center px-6 gap-3 border border-white/5">
          <span className="material-symbols-outlined text-white/40 text-xl shrink-0">search</span>
          <input 
            className="flex-1 bg-transparent border-0 focus:ring-0 text-white text-[10px] font-mono font-bold tracking-[0.1em] placeholder:text-white/20 uppercase"
            placeholder="SEARCH..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentIndex(0);
            }}
          />
        </div>

        <div className="w-8 shrink-0"></div>
      </header>

      <main className="flex-1 relative flex flex-col items-center justify-center px-6">
        {filteredVolumes.length > 0 ? (
          <div className="relative w-full aspect-[4/5] max-w-[340px]">
            {[...Array(2)].map((_, i) => {
              const depth = i + 1;
              if (currentIndex + depth >= filteredVolumes.length) return null;
              return (
                <div 
                  key={`bg-stack-${depth}`}
                  className="absolute inset-0 bg-paper/60 rounded-[2.5rem] border border-black/5"
                  style={{
                    transform: `translateY(${depth * 10}px) scale(${1 - depth * 0.04})`,
                    zIndex: 10 - depth,
                    opacity: 1 - depth * 0.3
                  }}
                />
              );
            })}

            {/* HOTSPOTS - REDUCED FOOTPRINT TO PREVENT CONFLICT WITH TOP/BOTTOM BUTTONS */}
            <div className="absolute inset-x-0 top-[15%] bottom-[15%] z-[100] flex pointer-events-none">
                <button onClick={prevVolume} className="w-[25%] h-full pointer-events-auto cursor-w-resize" />
                <div className="flex-1" />
                <button onClick={nextVolume} className="w-[25%] h-full pointer-events-auto cursor-e-resize" />
            </div>

            {filteredVolumes.map((volume, idx) => {
              const isActive = idx === currentIndex;
              if (Math.abs(idx - currentIndex) > 1 && !isActive) return null;

              return (
                <div
                  key={volume.id}
                  className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isActive ? 'z-40' : 'z-10'}`}
                  style={{
                    transform: isActive 
                      ? 'translate(0, 0) scale(1) rotate(0deg)' 
                      : (idx < currentIndex) 
                        ? 'translate(140%, 15%) scale(0.85) rotate(15deg)' 
                        : 'translate(0, 10px) scale(0.96) rotate(0deg)',
                    opacity: isActive ? 1 : (idx < currentIndex) ? 0 : 0.4,
                    pointerEvents: isActive ? 'auto' : 'none'
                  }}
                >
                  {isActive && (
                    <div className="absolute inset-0 pointer-events-none z-[120]">
                      <div className="absolute top-12 -left-6 pointer-events-auto">
                        <div className="bg-paper text-primary px-7 py-3 rounded-full text-[11px] font-bold tracking-widest uppercase shadow-lg border border-primary/5">
                          {volume.author || "ANONYMOUS"}
                        </div>
                      </div>
                      {volume.classifications.map((c, i) => (
                        <div key={i} className={`${getClassificationStyle(i)} pointer-events-auto`}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTagPopup(c);
                            }}
                            className="bg-paper text-primary px-5 py-2.5 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-md border border-primary/5 whitespace-nowrap active:scale-95 transition-transform hover:bg-paper-dark"
                          >
                            {c}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div 
                    onClick={() => navigate(`/mark/${volume.id}`)}
                    className="relative w-full h-full bg-paper rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-black/5 cursor-pointer"
                  >
                    <div className={`h-28 w-full border-b border-primary/5 flex items-stretch shrink-0 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="w-1/3 border-r border-primary/5 p-6 flex flex-col justify-end">
                        <span className="text-[9px] font-mono font-bold text-primary/80 uppercase tracking-tighter">ARCHIVE VOL.</span>
                      </div>
                      <div className="flex-1 p-6 flex items-center justify-end z-[130]">
                        {isActive && (
                          <button 
                            onClick={(e) => openEdit(e, volume)}
                            className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center text-primary/40 hover:text-primary hover:bg-primary/5 transition-all bg-paper pointer-events-auto"
                            title="Edit Volume Info"
                          >
                            <span className="material-symbols-outlined text-xl">edit</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                      <h2 className={`font-display text-6xl leading-[0.85] italic text-primary uppercase break-words px-2 tracking-tighter transition-all duration-700 ${isActive ? 'scale-100 opacity-100' : 'scale-90 opacity-20'}`}>
                        {volume.title}
                      </h2>
                    </div>
                    <div className={`absolute right-7 top-1/2 -translate-y-1/2 rotate-90 origin-right opacity-30 ${isActive ? 'opacity-30' : 'opacity-0'}`}>
                      <span className="text-[9px] font-mono font-bold text-primary uppercase tracking-[0.5em] whitespace-nowrap">
                        ID: {volume.archivalId}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-white/20 font-display italic text-3xl text-center px-12 animate-pulse">
            Registry is empty.
          </div>
        )}
      </main>

      <footer className="mt-8 flex flex-col items-center gap-4 z-[60] pb-6">
         <div className="flex items-center gap-6 text-white font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
            <button onClick={prevVolume} className={currentIndex === 0 ? 'opacity-20' : 'opacity-100'}>BACK</button>
            <div className="w-1 h-1 rounded-full bg-white/20"></div>
            <button onClick={nextVolume} className={currentIndex === filteredVolumes.length - 1 ? 'opacity-20' : 'opacity-100'}>FORWARD</button>
         </div>
         <div className="h-0.5 w-32 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-500"
              style={{ width: filteredVolumes.length ? `${((currentIndex + 1) / filteredVolumes.length) * 100}%` : '0%' }}
            />
         </div>
      </footer>

      {/* CLASSIFICATION POPUP */}
      {activeTagPopup && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-end justify-center backdrop-blur-sm" onClick={() => setActiveTagPopup(null)}>
           <div 
             className="bg-paper w-full max-w-md rounded-t-[2.5rem] p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom duration-500"
             onClick={e => e.stopPropagation()}
           >
              <div className="w-12 h-1 bg-primary/10 rounded-full mx-auto mb-8" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-mono text-[10px] font-bold text-primary/40 uppercase tracking-[0.3em]">
                  Volumes under: <span className="text-primary">{activeTagPopup}</span>
                </h3>
                <button onClick={() => setActiveTagPopup(null)} className="text-primary/20 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
                {volumesWithSameTag.map(v => (
                  <button
                    key={v.id}
                    onClick={() => jumpToVolume(v.id)}
                    className="w-full text-left p-4 rounded-2xl hover:bg-primary/5 transition-colors group flex items-center justify-between border border-transparent hover:border-primary/5"
                  >
                    <div className="min-w-0 pr-4">
                      <h4 className="font-display italic text-xl text-primary leading-tight truncate">
                        {v.title}
                      </h4>
                      <p className="text-[9px] font-mono text-primary/50 uppercase tracking-widest mt-1">
                        {v.author || 'ANONYMOUS'}
                      </p>
                    </div>
                    <span className="text-[8px] font-mono text-primary/20 group-hover:text-primary transition-colors shrink-0">
                      {v.archivalId}
                    </span>
                  </button>
                ))}
              </div>
           </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md">
           <div className="bg-paper p-10 rounded-[2.5rem] w-full max-w-2xl border border-primary/10 flex flex-col min-h-[500px]">
              <h3 className="font-display italic text-4xl text-primary mb-12 text-center uppercase tracking-tight">
                {editingVolumeId ? 'EDIT BOOK VOLUME' : 'ADD NEW BOOK VOLUME'}
              </h3>
              
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
                <div className="space-y-10">
                  <div>
                    <label className="text-[10px] font-mono text-primary/40 uppercase tracking-widest block mb-1 font-bold">TITLE</label>
                    <input 
                      required autoFocus 
                      className="w-full bg-transparent border-0 border-b border-primary/10 focus:ring-0 focus:border-primary/40 p-2 font-newsreader italic text-primary text-2xl placeholder:text-primary/10" 
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-primary/40 uppercase tracking-widest block mb-1 font-bold">AUTHOR</label>
                    <input 
                      className="w-full bg-transparent border-0 border-b border-primary/10 focus:ring-0 focus:border-primary/40 p-2 font-newsreader italic text-primary text-2xl placeholder:text-primary/10" 
                      value={formData.author} 
                      onChange={e => setFormData({...formData, author: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-primary/40 uppercase tracking-widest block mb-1 font-bold">CLASSIFICATIONS</label>
                    <input 
                      placeholder="Separate with commas..." 
                      className="w-full bg-transparent border-0 border-b border-primary/10 focus:ring-0 focus:border-primary/40 p-2 font-newsreader italic text-primary text-2xl placeholder:text-primary/10" 
                      value={formData.classificationInput} 
                      onChange={e => setFormData({...formData, classificationInput: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="flex justify-end items-center mt-12 gap-3">
                  <button 
                    type="button" 
                    onClick={closeModal} 
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
      <Navigation />
    </div>
  );
};

export default Library;
