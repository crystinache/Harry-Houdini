/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, useSpring, useMotionValue } from "motion/react";

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [selectedSuit, setSelectedSuit] = useState<string | null>(null);
  const [lastResetTap, setLastResetTap] = useState(0);
  
  const posterUrl = "https://i.imgur.com/MJzV4Fm.png";
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Stati per lo Zoom e il Pan usando Motion Values per prestazioni ottimali
  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
 
  // Molle per rendere i movimenti fluidi e naturali
  const smoothScale = useSpring(scale, { damping: 25, stiffness: 120 });
  const smoothX = useSpring(x, { damping: 25, stiffness: 120 });
  const smoothY = useSpring(y, { damping: 25, stiffness: 120 });
 
  const touchStartDist = useRef<number | null>(null);
  const touchStartScale = useRef<number>(1);
  const lastCenter = useRef<{x: number, y: number} | null>(null);
 
  const valRef = useRef<string | null>(null);
  const suitRef = useRef<string | null>(null);
  const lastSuitTapRef = useRef<{ time: number, index: number } | null>(null);

  const suits = [
    { symbol: "♥", color: "text-red-600" },
    { symbol: "♦", color: "text-red-600" },
    { symbol: "♣", color: "text-white" },
    { symbol: "♠", color: "text-white" }
  ];

  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q'];

  // Sincronizza i ref
  useEffect(() => {
    valRef.current = selectedValue;
    suitRef.current = selectedSuit;
  }, [selectedValue, selectedSuit]);

  useEffect(() => {
    const img = new Image();
    img.src = posterUrl;
    img.onload = () => setIsLoaded(true);
  }, []);

  // Gestione dei gesti Touch per Zoom (Pinch) e Pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;

    // 1. HIT TEST per la SELEZIONE (solo se non abbiamo finito)
    // Usiamo changedTouches per agire solo sulle nuove dita
    const currentlyDone = valRef.current !== null && suitRef.current !== null;
    
    if (!currentlyDone) {
      const rect = containerRef.current.getBoundingClientRect();
      const gridLeft = 0.05;
      const gridWidth = 0.90;
      const gridTop = 0.22;
      const gridHeight = 0.56;
      const rowsCount = 4; // 4 semi + 12 valori = 16 elementi -> 4 righe da 4

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const relX = (touch.clientX - rect.left) / rect.width;
        const relY = (touch.clientY - rect.top) / rect.height;

        if (relX >= gridLeft && relX <= (gridLeft + gridWidth) && relY >= gridTop && relY <= (gridTop + gridHeight)) {
          const col = Math.floor((relX - gridLeft) / (gridWidth / 4));
          const row = Math.floor((relY - gridTop) / (gridHeight / rowsCount));
          
          if (row === 0 && col >= 0 && col < 4 && suitRef.current === null) {
            const now = Date.now();
            const s = suits[col].symbol;
            
            // Verifica Doppio Tocco sul Seme
            if (lastSuitTapRef.current && lastSuitTapRef.current.index === col && (now - lastSuitTapRef.current.time < 500)) {
              setSelectedSuit(s);
              setSelectedValue("K");
              suitRef.current = s;
              valRef.current = "K";
              lastSuitTapRef.current = null;
            } else {
              setSelectedSuit(s);
              suitRef.current = s;
              lastSuitTapRef.current = { time: now, index: col };
            }
          } else if (row > 0 && valRef.current === null) {
            const valIdx = (row - 1) * 4 + col;
            if (valIdx >= 0 && valIdx < values.length) {
              const v = values[valIdx];
              setSelectedValue(v);
              valRef.current = v;
            }
          }
        }
      }
    }

    if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = d;
      touchStartScale.current = scale.get();
    }
    
    if (e.touches.length > 0) {
      let cx = 0, cy = 0;
      for (let i = 0; i < e.touches.length; i++) {
        cx += e.touches[i].clientX;
        cy += e.touches[i].clientY;
      }
      lastCenter.current = { x: cx / e.touches.length, y: cy / e.touches.length };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // 1. Gestione Pinch-to-Zoom
    if (e.touches.length === 2 && touchStartDist.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = Math.max(1, (currentDist / touchStartDist.current) * touchStartScale.current);
      scale.set(newScale);
    }

    // 2. Gestione Pan (Spostamento immagine)
    if (e.touches.length > 0 && lastCenter.current) {
      let cx = 0, cy = 0;
      for (let i = 0; i < e.touches.length; i++) {
        cx += e.touches[i].clientX;
        cy += e.touches[i].clientY;
      }
      const currentCenter = { x: cx / e.touches.length, y: cy / e.touches.length };
      
      // Sposta l'immagine non appena iniziamo lo zoom
      if (scale.get() > 1.01) {
        x.set(x.get() + (currentCenter.x - lastCenter.current.x));
        y.set(y.get() + (currentCenter.y - lastCenter.current.y));
      }
      
      lastCenter.current = currentCenter;
    }
  };

  const handleTouchEnd = () => {
    touchStartDist.current = null;
    lastCenter.current = null;
    
    // Se lo scale è quasi 1, riportalo esattamente a 1 e resetta la posizione
    if (scale.get() < 1.1) {
      scale.set(1);
      x.set(0);
      y.set(0);
    }
  };

  const handleReset = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    if (now - lastResetTap < 500) {
      setSelectedValue(null);
      setSelectedSuit(null);
      valRef.current = null;
      suitRef.current = null;
      scale.set(1);
      x.set(0);
      y.set(0);
    }
    setLastResetTap(now);
  };

  const isSelectionDone = selectedValue !== null && selectedSuit !== null;

  return (
    <div 
      className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] pointer-events-none" />
      
      {!isLoaded && (
        <div className="text-white font-serif animate-pulse z-50">
          Preparazione...
        </div>
      )}

      {/* Contenitore Immagine con Zoom e Pan fluidi */}
      <motion.div 
        style={{ 
          scale: smoothScale,
          x: smoothX,
          y: smoothY,
        }}
        className="relative h-[100vh] flex items-center justify-center"
      >
        <div 
          ref={containerRef}
          className="relative max-h-[100dvh] max-w-full aspect-[2/3] shadow-[0_0_100px_rgba(0,0,0,0.9)] flex items-center justify-center bg-[#0a0a0a]"
        >
          <img 
            src={posterUrl} 
            alt="Harry Houdini" 
            className="w-full h-full object-contain pointer-events-none transition-opacity duration-1000"
            style={{ opacity: isLoaded ? 1 : 0 }}
          />

          {/* Zona di RESET su "LONDON" (In basso a DESTRA) */}
          <div 
            onPointerDown={handleReset}
            className="absolute bottom-[2%] right-[2%] w-[30%] h-[10%] cursor-pointer z-[60]"
          />

          {/* VALORI NEGLI OCCHI (Visible default or selected value) */}
          <div 
            className="absolute text-white font-bold pointer-events-none flex items-center justify-center transition-opacity duration-300"
            style={{
              left: '51.6%',
              top: '36.5%',
              width: '1.5%',
              height: '1.5%',
              fontSize: '0.3vh',
              lineHeight: 1,
              opacity: 0.9
            }}
          >
            {selectedValue || "K"}
          </div>

          <div 
            className="absolute text-white font-bold pointer-events-none flex items-center justify-center transition-opacity duration-300"
            style={{
              left: '63.2%',
              top: '36.2%',
              width: '1.5%',
              height: '1.5%',
              fontSize: '0.3vh',
              lineHeight: 1,
              opacity: 0.9
            }}
          >
            {selectedSuit || "♥"}
          </div>

          {/* GRIGLIE DI SELEZIONE: Scompaiono immediatamente se la selezione è completa */}
          {isLoaded && !isSelectionDone && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="absolute border-2 border-white/40 grid grid-cols-4 grid-rows-4 bg-white/5"
                style={{
                  width: '90%',
                  height: '56%',
                  left: '5%',
                  top: '22%',
                }}
              >
                {/* Riga 1: Semi - Scompaiono quando selezionati */}
                {suits.map((suit) => (
                  <div 
                    key={suit.symbol} 
                    className={`border border-white/20 flex items-center justify-center text-5xl sm:text-7xl font-bold transition-all ${selectedSuit === suit.symbol ? 'opacity-0 scale-50' : ''} ${suit.color}`}
                  >
                    {suit.symbol}
                  </div>
                ))}
                
                {/* Righe 2-4: Valori - Scompaiono quando selezionati */}
                {values.map((val, i) => (
                  <div 
                    key={i} 
                    className={`border border-white/20 flex items-center justify-center text-white text-4xl sm:text-6xl font-bold transition-all ${selectedValue === val ? 'opacity-0 scale-50' : ''}`}
                  >
                    {val}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Illuminazione ambientale */}
      <div className="absolute inset-0 bg-radial-[at_50%_0%] from-white/10 to-transparent pointer-events-none" />
    </div>
  );
}


