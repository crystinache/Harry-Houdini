/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [selectedSuit, setSelectedSuit] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [lastResetTap, setLastResetTap] = useState(0);
  
  const posterUrl = "https://i.imgur.com/Su1cI42.png";
  
  // Ref per gestire il gesto di zoom
  const touchStartDist = useRef<number | null>(null);
  const isPinching = useRef(false);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && selectedValue && selectedSuit) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
      isPinching.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPinching.current && e.touches.length === 2 && touchStartDist.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      // Se allargano le dita (zoom) oltre una soglia, rivela la carta
      if (currentDist > touchStartDist.current * 1.5) {
        setIsRevealed(true);
        isPinching.current = false;
        touchStartDist.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    isPinching.current = false;
    touchStartDist.current = null;
  };

  const handleReset = () => {
    const now = Date.now();
    if (now - lastResetTap < 500) {
      // Doppia pressione rilevata
      setIsRevealed(false);
      setSelectedValue(null);
      setSelectedSuit(null);
    }
    setLastResetTap(now);
  };

  return (
    <div 
      className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Texture di sfondo effetto legno scuro */}
      <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] pointer-events-none" />
      
      {!isLoaded && (
        <div className="text-white font-serif animate-pulse z-50">
          Preparazione palcoscenico...
        </div>
      )}

      {/* Contenitore Poster con proporzioni fisse */}
      <div className="relative h-[100vh] aspect-[2/3] max-w-full flex items-center justify-center overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.9)]">
        {/* Immagine Locandina */}
        <img 
          src={posterUrl} 
          alt="Harry Houdini" 
          className="w-full h-full object-contain pointer-events-none transition-opacity duration-1000"
          style={{ opacity: isLoaded ? 1 : 0 }}
        />

        {/* Zona di RESET su "LONDON" (posizionata in basso) */}
        <div 
          onClick={handleReset}
          className="absolute bottom-[2%] left-[30%] w-[40%] h-[8%] cursor-pointer z-[60]"
          title="Reset"
        />

        {/* RIVELAZIONE NEGLI OCCHI */}
        {isRevealed && (
          <>
            {/* Valore nell'occhio sinistro (suo destro) */}
            <div 
              className="absolute text-white font-bold pointer-events-none flex items-center justify-center"
              style={{
                left: '44.8%',
                top: '35.8%',
                width: '1.2%',
                height: '1.2%',
                fontSize: '0.45vw',
                lineHeight: 1
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
                width: '1.2%',
                height: '1.2%',
                fontSize: '0.45vw',
                lineHeight: 1
              }}
            >
              {selectedSuit}
            </div>
          </>
        )}

        {isLoaded && !isRevealed && (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {/* Griglia 1: 3x4 (Valori) */}
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
                  onPointerDown={() => setSelectedValue(val)}
                  className={`border border-white/20 flex items-center justify-center text-white text-4xl sm:text-6xl font-bold transition-all ${selectedValue === val ? 'bg-white/30 scale-95 shadow-inner' : 'hover:bg-white/10 active:bg-white/20'}`}
                >
                  {val}
                </div>
              ))}
            </div>

            {/* Griglia 2: 1x4 (Semi) */}
            <div 
              className="absolute border-2 border-white/40 border-l-0 grid grid-cols-1 grid-rows-4 bg-black/20"
              style={{
                width: '40%',
                height: '56%',
                left: '60%',
                top: '22%',
              }}
            >
              {suits.map((suit, i) => (
                <div 
                  key={suit.symbol} 
                  onPointerDown={() => setSelectedSuit(suit.symbol)}
                  className={`border border-white/20 flex items-center justify-center text-5xl sm:text-7xl font-bold transition-all ${selectedSuit === suit.symbol ? 'bg-white/30 scale-95 shadow-inner' : 'hover:bg-white/10 active:bg-white/20'} ${suit.color}`}
                >
                  {suit.symbol}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Illuminazione ambientale superiore */}
      <div className="absolute inset-0 bg-radial-[at_50%_0%] from-white/10 to-transparent pointer-events-none" />
    </div>
  );
}

