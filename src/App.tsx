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
  
  const posterUrl = "https://i.imgur.com/Su1cI42.png";
  
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

  const suits = [
    { symbol: "♥", color: "text-red-600" },
    { symbol: "♦", color: "text-red-600" },
    { symbol: "♣", color: "text-white" },
    { symbol: "♠", color: "text-white" }
  ];

  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q'];

  useEffect(() => {
    const img = new Image();
    img.src = posterUrl;
    img.onload = () => setIsLoaded(true);
  }, []);

  // Gestione dei gesti Touch per Zoom (Pinch) e Pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = d;
      touchStartScale.current = scale.get();
    }
    
    if (e.touches.length > 0) {
      // Calcola il centro tra le dita per il panning
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
      
      // Sposta l'immagine solo se siamo zoomati
      if (scale.get() > 1.05) {
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
    e.stopPropagation();
    const now = Date.now();
    if (now - lastResetTap < 500) {
      setSelectedValue(null);
      setSelectedSuit(null);
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
        className="relative h-[100vh] aspect-[2/3] max-w-full flex items-center justify-center shadow-[0_0_100px_rgba(0,0,0,0.9)]"
      >
        <img 
          src={posterUrl} 
          alt="Harry Houdini" 
          className="w-full h-full object-contain pointer-events-none transition-opacity duration-1000"
          style={{ opacity: isLoaded ? 1 : 0 }}
        />

        {/* Zona di RESET su "LONDON" */}
        <div 
          onPointerDown={handleReset}
          className="absolute bottom-[2%] left-[30%] w-[40%] h-[8%] cursor-pointer z-[60]"
        />

        {/* VALORI NEGLI OCCHI (Sempre presenti, diventano visibili allo zoom) */}
        {isSelectionDone && (
          <>
            {/* Valore nell'occhio sinistro (suo destro) */}
            <div 
              className="absolute text-white font-bold pointer-events-none flex items-center justify-center"
              style={{
                left: '44.8%',
                top: '35.8%',
                width: '1%',
                height: '1%',
                fontSize: '0.45vw',
                lineHeight: 1,
                opacity: 0.9
              }}
            >
              {selectedValue}
            </div>
            {/* Seme nell'occhio destro (suo sinistro) */}
            <div 
              className="absolute text-white font-bold pointer-events-none flex items-center justify-center"
              style={{
                left: '55.3%',
                top: '35.8%',
                width: '1%',
                height: '1%',
                fontSize: '0.45vw',
                lineHeight: 1,
                opacity: 0.9
              }}
            >
              {selectedSuit}
            </div>
          </>
        )}

        {/* GRIGLIE DI SELEZIONE (Scompaiono dopo la scelta) */}
        {!isSelectionDone && isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            {/* Griglia Valori */}
            <div 
              className="absolute border-2 border-white/40 grid grid-cols-3 grid-rows-4 bg-white/5"
              style={{
                width: '55%',
                height: '56%',
                left: '5%',
                top: '22%',
              }}
            >
              {values.map((val, i) => (
                <div 
                  key={i} 
                  onPointerDown={(e) => { e.stopPropagation(); setSelectedValue(val); }}
                  className={`border border-white/20 flex items-center justify-center text-white text-4xl sm:text-6xl font-bold transition-all ${selectedValue === val ? 'bg-white/30 scale-95 shadow-inner' : 'hover:bg-white/10 active:bg-white/20'}`}
                >
                  {val}
                </div>
              ))}
            </div>

            {/* Griglia Semi */}
            <div 
              className="absolute border-2 border-white/40 border-l-0 grid grid-cols-1 grid-rows-4 bg-black/20"
              style={{
                width: '40%',
                height: '56%',
                left: '60%',
                top: '22%',
              }}
            >
              {suits.map((suit) => (
                <div 
                  key={suit.symbol} 
                  onPointerDown={(e) => { e.stopPropagation(); setSelectedSuit(suit.symbol); }}
                  className={`border border-white/20 flex items-center justify-center text-5xl sm:text-7xl font-bold transition-all ${selectedSuit === suit.symbol ? 'bg-white/30 scale-95 shadow-inner' : 'hover:bg-white/10 active:bg-white/20'} ${suit.color}`}
                >
                  {suit.symbol}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Illuminazione ambientale */}
      <div className="absolute inset-0 bg-radial-[at_50%_0%] from-white/10 to-transparent pointer-events-none" />
    </div>
  );
}


