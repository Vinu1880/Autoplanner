// contexts/RotationPatternsContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WeekPattern {
  [key: string]: string[];
}

interface RotationPattern {
  id: string;
  name: string;
  description?: string;
  weeks: WeekPattern[];
  cycleLength: number;
}

interface RotationPatternsContextType {
  patterns: RotationPattern[];
  addPattern: (pattern: RotationPattern) => void;
  updatePattern: (pattern: RotationPattern) => void;
  deletePattern: (id: string) => void;
  getPattern: (id: string) => RotationPattern | undefined;
}

const RotationPatternsContext = createContext<RotationPatternsContextType | undefined>(undefined);

export function RotationPatternsProvider({ children }: { children: ReactNode }) {
  const [patterns, setPatterns] = useState<RotationPattern[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Charger les patterns depuis localStorage au montage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rotationPatterns');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPatterns(parsed); // ✅ Correction ici - pas de setPatterns(setPatterns)
        } catch (e) {
          console.error('Erreur chargement patterns:', e);
          setPatterns([]); // ✅ Tableau vide en cas d'erreur
        }
      }
      setIsInitialized(true);
    }
  }, []);

  // Sauvegarder les patterns dans localStorage à chaque changement
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem('rotationPatterns', JSON.stringify(patterns));
    }
  }, [patterns, isInitialized]);

  const addPattern = (pattern: RotationPattern) => {
    setPatterns(prev => [...prev, pattern]);
  };

  const updatePattern = (pattern: RotationPattern) => {
    setPatterns(prev => prev.map(p => p.id === pattern.id ? pattern : p));
  };

  const deletePattern = (id: string) => {
    setPatterns(prev => prev.filter(p => p.id !== id));
  };

  const getPattern = (id: string) => {
    return patterns.find(p => p.id === id);
  };

  return (
    <RotationPatternsContext.Provider value={{ patterns, addPattern, updatePattern, deletePattern, getPattern }}>
      {children}
    </RotationPatternsContext.Provider>
  );
}

export function useRotationPatterns() {
  const context = useContext(RotationPatternsContext);
  if (context === undefined) {
    throw new Error('useRotationPatterns must be used within a RotationPatternsProvider');
  }
  return context;
}