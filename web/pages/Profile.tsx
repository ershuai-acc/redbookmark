
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { Volume } from '../types';

interface ProfileProps {
  volumes: Volume[];
}

const Profile: React.FC<ProfileProps> = ({ volumes }) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeTagPopup, setActiveTagPopup] = useState<string | null>(null);

  const aggregatedData = useMemo(() => {
    const totalVolumes = volumes.length;
    const totalMarks = volumes.reduce((acc, v) => acc + v.marks.length, 0);
    const allClassifications = volumes.flatMap(v => v.classifications);
    const uniqueClassifications = Array.from(new Set(allClassifications));
    const classificationCount = uniqueClassifications.length;

    const activityMap: Record<string, number> = {};
    const uniqueDates = new Set<string>();

    volumes.forEach(volume => {
      volume.marks.forEach(mark => {
        const date = mark.date; 
        activityMap[date] = (activityMap[date] || 0) + 1;
        uniqueDates.add(date);
      });
    });

    return {
      totalVolumes,
      totalMarks,
      classificationCount,
      daysLogged: uniqueDates.size,
      activityMap,
      displayClassifications: uniqueClassifications.slice(0, 12) // Show up to 12
    };
  }, [volumes]);

  const volumesWithSameTag = useMemo(() => {
    if (!activeTagPopup) return [];
    return volumes.filter(v => v.classifications.includes(activeTagPopup));
  }, [volumes, activeTagPopup]);

  const jumpToVolume = (volumeId: string) => {
    navigate('/', { state: { jumpToId: volumeId } });
    setActiveTagPopup(null);
  };

  // Heatmap Configuration
  const ROWS = 6;
  const CELL_SIZE_PX = 38;
  const START_DATE_STR = '2026-01-01';
  
  const daysData = useMemo(() => {
    const days = [];
    const start = new Date(START_DATE_STR);
    const today = new Date();
    const end = new Date(today);
    end.setMonth(end.getMonth() + 6);

    let curr = new Date(start);
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    while (curr <= end) {
      const dateStr = curr.toISOString().split('T')[0];
      const count = aggregatedData.activityMap[dateStr] || 0;
      const isFirst = curr.getDate() === 1;
      
      let opacity = 0.05; 
      if (count >= 1 && count <= 2) opacity = 0.25;
      else if (count >= 3 && count <= 10) opacity = 0.45;
      else if (count > 10 && count <= 20) opacity = 0.7;
      else if (count > 20) opacity = 1.0;

      days.push({
        date: new Date(curr),
        opacity,
        dateStr,
        isFirstOfMonth: isFirst,
        monthLabel: isFirst ? monthNames[curr.getMonth()] : null
      });
      curr.setDate(curr.getDate() + 1);
    }
    
    while (days.length % ROWS !== 0) {
      days.push({ date: null, opacity: 0, dateStr: '', isFirstOfMonth: false, monthLabel: null });
    }

    return days;
  }, [aggregatedData.activityMap]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      const firstOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const dayIndex = daysData.findIndex(d => d.dateStr === firstOfMonthStr);
      
      if (dayIndex !== -1) {
        const colIndex = Math.floor(dayIndex / ROWS);
        const scrollAmount = colIndex * CELL_SIZE_PX;
        scrollContainerRef.current.scrollLeft = scrollAmount;
      }
    }
  }, [daysData]);

  return (
    <div className="min-h-screen bg-paper flex flex-col pb-24 border-x border-primary/5 select-none overflow-x-hidden">
      
      <header className="h-14 flex items-center justify-end px-6 border-b border-primary shrink-0">
        <button className="text-primary active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-[24px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
        </button>
      </header>

      {/* USER INFO AREA */}
      <section className="py-6 flex flex-col items-center border-b border-primary bg-primary/[0.01] shrink-0">
        <div className="w-[88px] h-[88px] rounded-full border border-primary p-1 flex items-center justify-center mb-3">
          <div className="w-full h-full rounded-full overflow-hidden border border-primary">
             <img 
               src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ershuai" 
               alt="Avatar" 
               className="w-full h-full object-cover grayscale brightness-95"
             />
          </div>
        </div>
        <h1 className="text-primary text-[38px] font-display italic leading-none mb-0.5 tracking-tighter">Ershuai</h1>
        <span className="text-primary text-[9px] font-mono font-bold uppercase tracking-[0.4em] opacity-80">@DAILY READING LOG</span>
      </section>

      {/* CLASSIFICATION */}
      <section className="px-6 py-5 border-b border-primary shrink-0">
        <h2 className="text-[10px] font-mono font-bold text-primary uppercase tracking-[0.2em] mb-4">CLASSIFICATION</h2>
        <div className="flex flex-wrap gap-x-2 gap-y-3">
          {(aggregatedData.displayClassifications.length > 0 ? aggregatedData.displayClassifications : ['FICTION', 'NOVEL', 'MAGIC', '1990S']).map((item, i) => (
            <button 
              key={i} 
              onClick={() => setActiveTagPopup(item)}
              className="border border-primary px-4 py-1.5 rounded-full text-primary hover:bg-primary/5 transition-all active:scale-95 flex items-center justify-center"
            >
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest leading-none pointer-events-none">{item}</span>
            </button>
          ))}
        </div>
      </section>

      {/* READING ACTIVITY LOG */}
      <section className="px-6 py-6 border-b border-primary shrink-0">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-[10px] font-mono font-bold text-primary uppercase tracking-[0.2em]">READING ACTIVITY LOG</h2>
          <span className="text-[8px] font-mono font-bold text-primary/30 uppercase tracking-widest">YEAR 2026</span>
        </div>
        
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto no-scrollbar scroll-smooth pb-2"
        >
          <div 
            className="grid grid-flow-col gap-1.5 shrink-0"
            style={{ 
              gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
              gridAutoColumns: '32px' 
            }}
          >
            {daysData.map((day, i) => (
              <div 
                key={i} 
                className="w-8 h-8 rounded-sm relative group" 
                style={{ 
                  backgroundColor: day.date ? `rgba(211, 21, 38, ${day.opacity})` : 'transparent',
                }}
              >
                {day.isFirstOfMonth && (
                  <div className="absolute -top-5 left-0 whitespace-nowrap z-10 pointer-events-none">
                    <span className="text-[7px] font-mono font-bold text-primary bg-paper/80 px-1 leading-none border border-primary/20 rounded-sm italic">
                      {day.monthLabel}
                    </span>
                  </div>
                )}
                {day.date && (
                   <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-primary/20 flex items-center justify-center pointer-events-none rounded-sm">
                      <span className="text-[6px] text-white font-mono font-bold">{day.date.getDate()}</span>
                   </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DATA ANALYTICS GRID */}
      <section className="grid grid-cols-2 flex-1">
        <div className="p-5 border-r border-b border-primary flex flex-col items-start justify-center">
          <span className="text-[8px] font-mono text-primary/50 uppercase tracking-[0.2em] font-bold">VOLUME</span>
          <p className="text-[44px] font-display italic text-primary leading-none tracking-tighter mt-2">
            {aggregatedData.totalVolumes}
          </p>
        </div>
        <div className="p-5 border-b border-primary flex flex-col items-start justify-center">
          <span className="text-[8px] font-mono text-primary/50 uppercase tracking-[0.2em] font-bold">LOG</span>
          <p className="text-[44px] font-display italic text-primary leading-none tracking-tighter mt-2">
            {aggregatedData.daysLogged}
          </p>
        </div>
        <div className="p-5 border-r border-primary flex flex-col items-start justify-center">
          <span className="text-[8px] font-mono text-primary/50 uppercase tracking-[0.2em] font-bold">MARK</span>
          <p className="text-[44px] font-display italic text-primary leading-none tracking-tighter mt-2">
            {aggregatedData.totalMarks > 999 ? `${(aggregatedData.totalMarks / 1000).toFixed(1)}k` : aggregatedData.totalMarks}
          </p>
        </div>
        <div className="p-5 flex flex-col items-start justify-center">
          <span className="text-[8px] font-mono text-primary/50 uppercase tracking-[0.2em] font-bold">TAGS</span>
          <p className="text-[44px] font-display italic text-primary leading-none tracking-tighter mt-2">
            {aggregatedData.classificationCount}
          </p>
        </div>
      </section>

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

      <Navigation />
    </div>
  );
};

export default Profile;
