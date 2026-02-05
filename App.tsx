
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Library from './pages/Library';
import Bookmark from './pages/Bookmark';
import Profile from './pages/Profile';
import { Volume, Mark as MarkType } from './types';
import { INITIAL_VOLUMES } from './constants';

const App: React.FC = () => {
  const [volumes, setVolumes] = useState<Volume[]>(() => {
    const saved = localStorage.getItem('archival_volumes');
    return saved ? JSON.parse(saved) : INITIAL_VOLUMES;
  });

  useEffect(() => {
    localStorage.setItem('archival_volumes', JSON.stringify(volumes));
  }, [volumes]);

  const handleAddVolume = (volume: Omit<Volume, 'id' | 'marks' | 'archivalId'>) => {
    const newVolume: Volume = {
      ...volume,
      id: Date.now().toString(),
      archivalId: `V-${Math.floor(1000 + Math.random() * 9000)}`,
      marks: []
    };
    setVolumes(prev => [...prev, newVolume]);
  };

  const handleUpdateVolume = (id: string, updatedFields: Partial<Omit<Volume, 'id' | 'marks' | 'archivalId'>>) => {
    setVolumes(prev => prev.map(v => v.id === id ? { ...v, ...updatedFields } : v));
  };

  const handleAddMark = (volumeId: string, mark: Omit<MarkType, 'id'>) => {
    setVolumes(prev => prev.map(v => v.id === volumeId ? {
      ...v,
      marks: [...v.marks, { ...mark, id: Date.now().toString() }]
    } : v));
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative shadow-2xl overflow-hidden bg-primary">
      <HashRouter>
        <Routes>
          <Route 
            path="/" 
            element={<Library volumes={volumes} onAddVolume={handleAddVolume} onUpdateVolume={handleUpdateVolume} />} 
          />
          <Route path="/library" element={<Navigate to="/" replace />} />
          <Route path="/mark/:id" element={<Bookmark volumes={volumes} onAddMark={handleAddMark} />} />
          <Route path="/profile" element={<Profile volumes={volumes} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </div>
  );
};

export default App;
