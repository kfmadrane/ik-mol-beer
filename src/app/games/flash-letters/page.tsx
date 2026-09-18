'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, RefreshCw, Volume2 } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';

type Letter = { id: string; symbol: string; audioPath: string | null };

export default function FlashLettersGame() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [currentLetter, setCurrentLetter] = useState<Letter | null>(null);
  const [options, setOptions] = useState<Letter[]>([]);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [round, setRound] = useState(1);
  const { play, stop, isPlaying } = useAudio();
  const MAX_ROUNDS = 20;

  useEffect(() => {
    fetch('/api/letters')
      .then(res => res.json())
      .then(data => {
        setLetters(data);
        if (data.length > 0) pickRandomLetter(data, 1);
      });
  }, []);

  const pickRandomLetter = (letterList = letters, currentRound = round + 1) => {
    if (letterList.length === 0) return;
    
    stop();

    if (currentRound > MAX_ROUNDS) {
      setRound(currentRound);
      return;
    }

    const randomLetter = letterList[Math.floor(Math.random() * letterList.length)];
    setCurrentLetter(randomLetter);
    setIsRevealed(false);
    setIsFlashing(true);

    const distractors = [...letterList]
      .filter(l => l.id !== randomLetter.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    setOptions([...distractors, randomLetter].sort(() => Math.random() - 0.5));
    if (currentRound !== 1) setRound(currentRound);

    setTimeout(() => {
      setIsFlashing(false);
    }, 1500);
  };

  const handleReveal = () => {
    setIsRevealed(true);
    if (currentLetter?.audioPath) {
      play(currentLetter.audioPath);
    }
  };

  if (letters.length === 0) {
    return <div className="p-8 text-center text-xl font-bold">Laden... Voeg eerst letters toe in de admin.</div>;
  }

  if (round > MAX_ROUNDS) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center font-sans p-6">
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-lg w-full">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-4xl font-black text-orange-600 mb-4">Klaar!</h1>
          <p className="text-xl text-gray-600 mb-8">Je hebt {MAX_ROUNDS} letters geflitst. Super goed gedaan!</p>
          <Link href="/" className="bg-orange-500 text-white px-8 py-4 rounded-full text-2xl font-bold hover:bg-orange-600 shadow-lg block w-full">
            Terug naar Menu
          </Link>
        </div>
      </div>
    );
  }

  if (!currentLetter) return <div className="p-8 text-center text-2xl font-bold">Laden...</div>;

  return (
    <div className="min-h-screen bg-orange-50 p-6 flex flex-col items-center font-sans">
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <Link href="/" className="bg-white p-4 rounded-full shadow hover:bg-gray-50 flex items-center gap-2">
          <ArrowLeft size={24} /> Terug
        </Link>
        <div className="text-xl font-bold text-orange-400">Ronde {round} / {MAX_ROUNDS}</div>
        <button onClick={() => pickRandomLetter()} className="bg-white p-4 rounded-full shadow hover:bg-gray-50">
          <RefreshCw size={24} className="text-orange-500" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {isFlashing ? (
          <div className="flex items-center justify-center w-64 h-64 bg-white rounded-full shadow-2xl animate-pulse transform scale-110">
            <span className="text-9xl font-bold text-orange-500 lowercase">{currentLetter.symbol}</span>
          </div>
        ) : !isRevealed ? (
          <div className="flex flex-col items-center">
            <button 
              onClick={handleReveal}
              className="w-64 h-64 bg-orange-500 rounded-full shadow-2xl flex flex-col items-center justify-center hover:bg-orange-600 hover:scale-105 transition-all mb-12 border-8 border-orange-200"
            >
              <Eye size={64} className="text-white mb-4" />
              <span className="text-2xl font-bold text-white lowercase">Kijk Na</span>
            </button>
            <p className="text-xl text-gray-500 mb-12">Zeg het hardop en controleer het daarna.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-64 h-64 bg-white rounded-full shadow-xl border-8 border-green-200 mb-8">
              <span className="text-9xl font-bold text-green-500 lowercase">{currentLetter.symbol}</span>
            </div>
            
            {currentLetter.audioPath && (
              <button onClick={() => play(currentLetter.audioPath!)} className="mb-8 text-blue-500 hover:text-blue-600 bg-blue-50 p-4 rounded-full">
                <Volume2 size={48} />
              </button>
            )}

            <div className="flex gap-4">
              <button 
                onClick={() => pickRandomLetter()}
                disabled={isPlaying}
                className={`text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg transition-colors ${isPlaying ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
              >
                {isPlaying ? 'Luister...' : 'Volgende Letter! ➜'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
