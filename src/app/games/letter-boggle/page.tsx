'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

type Letter = { id: string; symbol: string; audioPath: string | null };

export default function LetterBoggleGame() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [grid, setGrid] = useState<Letter[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [wordsFound, setWordsFound] = useState<{ word: string; isValid: boolean }[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    fetch(`/api/letters?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        setLetters(data);
        if (data.length >= 8) {
          generateGrid(data);
        }
      });
  }, []);

  const generateGrid = (availableLetters = letters) => {
    const shuffled = [...availableLetters].sort(() => Math.random() - 0.5);
    let selected: Letter[] = [];
    for (let i = 0; i < 9; i++) {
      selected.push(shuffled[i % shuffled.length]);
    }
    setGrid(selected.sort(() => Math.random() - 0.5));
    setSelectedIndices([]);
    setWordsFound([]);
    setIsGameOver(false);
  };

  const handleSelect = (index: number) => {
    if (selectedIndices.includes(index)) {
      if (selectedIndices[selectedIndices.length - 1] === index) {
        setSelectedIndices(prev => prev.slice(0, -1));
      }
      return;
    }
    
    const letter = grid[index];
    if (letter.audioPath) {
      new Audio(letter.audioPath).play();
    }
    
    setSelectedIndices(prev => [...prev, index]);
  };

  const checkWord = async () => {
    if (selectedIndices.length === 0) return;
    
    setIsChecking(true);
    const word = selectedIndices.map(i => grid[i].symbol).join('');
    
    try {
      const res = await fetch(`/api/check-word?word=${encodeURIComponent(word)}`);
      const data = await res.json();
      
      setWordsFound(prev => [{ word, isValid: data.exists }, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
      setSelectedIndices([]);
    }
  };

  if (letters.length < 8) {
    return <div className="p-8 text-center text-xl font-bold">Laden... Je hebt minimaal 8 letters nodig in de admin.</div>;
  }

  if (isGameOver) {
    const validWords = wordsFound.filter(w => w.isValid).length;
    return (
      <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center font-sans p-6">
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-lg w-full">
          <div className="text-6xl mb-6">🏆</div>
          <h1 className="text-4xl font-black text-pink-600 mb-4">Klaar!</h1>
          <p className="text-xl text-gray-600 mb-8">
            Je hebt <span className="font-bold text-green-500">{validWords}</span> goede woorden gevonden!
          </p>
          <div className="flex gap-4">
            <Link href="/" className="flex-1 bg-pink-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:bg-pink-600 shadow-lg text-center">
              Menu
            </Link>
            <button onClick={() => generateGrid()} className="flex-1 bg-blue-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:bg-blue-600 shadow-lg">
              Nog een keer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentWord = selectedIndices.map(i => grid[i].symbol).join('');

  return (
    <div className="min-h-screen bg-pink-50 p-6 flex flex-col items-center font-sans">
      <div className="w-full max-w-4xl flex justify-between items-center mb-4">
        <Link href="/" className="bg-white p-4 rounded-full shadow hover:bg-gray-50 flex items-center gap-2">
          <ArrowLeft size={24} /> Terug
        </Link>
        <h1 className="text-3xl font-bold text-pink-700">Letter Boggle</h1>
        <button onClick={() => setIsGameOver(true)} className="bg-white text-pink-500 px-6 py-3 rounded-full font-bold shadow hover:bg-gray-50">
          Klaar!
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-5xl justify-center items-start mt-4">
        
        {/* Game Board */}
        <div className="flex flex-col items-center bg-white p-8 rounded-3xl shadow-lg">
          <div className="h-16 mb-4 flex items-center justify-center text-4xl font-bold text-pink-600 tracking-widest min-w-[200px] border-b-4 border-gray-200 pb-2 lowercase">
            {currentWord || '-'}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {grid.map((letter, i) => {
              const isSelected = selectedIndices.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl text-5xl font-bold lowercase shadow-md transition-all ${
                    isSelected
                      ? 'bg-pink-500 text-white scale-95 shadow-none'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-pink-50 hover:-translate-y-1'
                  }`}
                >
                  {letter.symbol}
                </button>
              );
            })}
          </div>

          <button
            onClick={checkWord}
            disabled={selectedIndices.length === 0 || isChecking}
            className="w-full bg-green-500 text-white py-4 rounded-2xl text-2xl font-bold hover:bg-green-600 disabled:opacity-50 transition-colors shadow-lg"
          >
            {isChecking ? 'Checken...' : 'Controleer Woord!'}
          </button>
        </div>

        {/* Found Words List */}
        <div className="w-full lg:w-80 bg-white p-6 rounded-3xl shadow-lg h-[500px] flex flex-col">
          <h2 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2 flex justify-between">
            Gevonden 
            <span className="text-green-500">{wordsFound.filter(w => w.isValid).length}</span>
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {wordsFound.length === 0 && (
              <p className="text-gray-400 text-center mt-8">Nog geen woorden gevonden. Maak een woord!</p>
            )}
            {wordsFound.map((item, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-xl border-2 ${item.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <span className="text-xl font-bold lowercase text-gray-800">{item.word}</span>
                {item.isValid ? (
                  <CheckCircle2 className="text-green-500" size={24} />
                ) : (
                  <XCircle className="text-red-400" size={24} />
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
