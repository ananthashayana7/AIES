'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GameState, initializeGame, move, Tile } from './logic';
import { motion, AnimatePresence } from 'framer-motion';

const TILE_COLORS: Record<number, { bg: string; text: string; size?: string }> = {
  2: { bg: '#eee4da', text: '#776e65' },
  4: { bg: '#ede0c8', text: '#776e65' },
  8: { bg: '#f2b179', text: '#f9f6f2' },
  16: { bg: '#f59563', text: '#f9f6f2' },
  32: { bg: '#f67c5f', text: '#f9f6f2' },
  64: { bg: '#f65e3b', text: '#f9f6f2' },
  128: { bg: '#edcf72', text: '#f9f6f2', size: 'text-3xl' },
  256: { bg: '#edcc61', text: '#f9f6f2', size: 'text-3xl' },
  512: { bg: '#edc850', text: '#f9f6f2', size: 'text-3xl' },
  1024: { bg: '#edc53f', text: '#f9f6f2', size: 'text-2xl' },
  2048: { bg: '#edc22e', text: '#f9f6f2', size: 'text-2xl' },
};

export default function Game2048() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !gameState || gameState.over) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };

    const dx = touchEnd.x - touchStart.x;
    const dy = touchEnd.y - touchStart.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 30) {
      let direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null = null;
      if (absDx > absDy) {
        direction = dx > 0 ? 'RIGHT' : 'LEFT';
      } else {
        direction = dy > 0 ? 'DOWN' : 'UP';
      }

      if (direction) {
        setGameState((prev) => (prev ? move(prev, direction!) : null));
      }
    }
    setTouchStart(null);
  };

  useEffect(() => {
    const savedBest = localStorage.getItem('2048-best');
    if (savedBest) {
      setBestScore(parseInt(savedBest, 10));
    }
    setGameState(initializeGame());
  }, []);

  useEffect(() => {
    if (gameState && gameState.score > bestScore) {
      setBestScore(gameState.score);
      localStorage.setItem('2048-best', gameState.score.toString());
    }
  }, [gameState?.score, bestScore]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!gameState || gameState.over) return;

    let direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null = null;
    if (e.key === 'ArrowUp') direction = 'UP';
    if (e.key === 'ArrowDown') direction = 'DOWN';
    if (e.key === 'ArrowLeft') direction = 'LEFT';
    if (e.key === 'ArrowRight') direction = 'RIGHT';

    if (direction) {
      e.preventDefault();
      setGameState(prev => prev ? move(prev, direction!) : null);
    }
  }, [gameState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const resetGame = () => {
    setGameState(initializeGame());
  };

  if (!gameState) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#faf8ef] font-bold text-[#776e65] selection:bg-transparent">
      <div className="w-full max-w-[400px] p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-6xl font-extrabold tracking-tighter">2048</h1>
          <div className="flex gap-2">
            <ScoreBox label="SCORE" value={gameState.score} />
            <ScoreBox label="BEST" value={bestScore} />
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <p className="text-lg leading-tight">
            Join the numbers and get to the <strong>2048 tile!</strong>
          </p>
          <button
            onClick={resetGame}
            className="bg-[#8f7a66] text-[#f9f6f2] px-6 py-2.5 rounded font-bold hover:bg-[#7f6a56] transition-colors"
          >
            New Game
          </button>
        </div>

        {/* Game Container */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative bg-[#bbada0] p-3 rounded-lg aspect-square w-full touch-none select-none shadow-inner"
        >
          {/* Grid Background */}
          <div className="grid grid-cols-4 grid-rows-4 gap-3 w-full h-full">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="bg-[#cdc1b4] rounded-sm w-full h-full" />
            ))}
          </div>

          {/* Tiles */}
          <div className="absolute inset-0 p-3 grid grid-cols-4 grid-rows-4 gap-3">
             <AnimatePresence mode="popLayout">
              {gameState.tiles.map((tile) => (
                <TileView key={tile.id} tile={tile} />
              ))}
            </AnimatePresence>
          </div>

          {/* Overlays */}
          {gameState.over && (
            <div className="absolute inset-0 bg-[#eee4da]/70 flex flex-col items-center justify-center rounded-lg z-20 animate-fade-in">
              <h2 className="text-5xl font-bold mb-6">Game Over!</h2>
              <button
                onClick={resetGame}
                className="bg-[#8f7a66] text-[#f9f6f2] px-8 py-3 rounded font-bold text-lg"
              >
                Try Again
              </button>
            </div>
          )}

          {gameState.won && (
             <div className="absolute inset-0 bg-[#edc22e]/50 flex flex-col items-center justify-center rounded-lg z-20 animate-fade-in">
              <h2 className="text-5xl font-bold mb-6 text-white">You Win!</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setGameState({ ...gameState, won: false })}
                  className="bg-[#8f7a66] text-[#f9f6f2] px-6 py-2 rounded font-bold"
                >
                  Keep going
                </button>
                <button
                  onClick={resetGame}
                  className="bg-[#8f7a66] text-[#f9f6f2] px-6 py-2 rounded font-bold"
                >
                  Try Again
                </button>
              </div>
           </div>
          )}
        </div>

        <p className="mt-8 text-sm opacity-75">
          <strong>HOW TO PLAY:</strong> Use your <strong>arrow keys</strong> to move the tiles. When two tiles with the same number touch, they <strong>merge into one!</strong>
        </p>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}

function ScoreBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#bbada0] px-4 py-2 rounded min-w-[70px] text-center">
      <div className="text-[10px] text-[#eee4da] font-bold leading-none mb-1">{label}</div>
      <div className="text-white text-xl font-bold leading-none">{value}</div>
    </div>
  );
}

function TileView({ tile }: { tile: Tile }) {
  const color = TILE_COLORS[tile.value] || { bg: '#3c3a32', text: '#f9f6f2' };

  return (
    <motion.div
      layout
      key={tile.id}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 40,
        mass: 1,
      }}
      className="w-full h-full flex items-center justify-center"
      style={{
        gridRowStart: tile.y + 1,
        gridColumnStart: tile.x + 1,
        zIndex: tile.value,
      }}
    >
      <motion.div
        key={tile.value}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 0.1, times: [0, 0.5, 1] }}
        className={`w-full h-full rounded-sm flex items-center justify-center font-bold shadow-sm ${color.size || 'text-4xl'}`}
        style={{
          backgroundColor: color.bg,
          color: color.text,
        }}
      >
        {tile.value}
      </motion.div>
    </motion.div>
  );
}
