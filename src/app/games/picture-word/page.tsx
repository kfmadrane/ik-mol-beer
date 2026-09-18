'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Volume2 } from 'lucide-react';

type Word = { id: string; text: string; imagePath: string | null; audioPath: string | null };
type Letter = { id: string; symbol: string; audioPath: string | null };

const tokenizeWord = (text: string, letterList: Letter[]) => {
  const sortedSymbols = [...letterList]
    .map(l => l.symbol.toLowerCase())
    .sort((a, b) => b.length - a.length);
  
  let remaining = text.toLowerCase();
  const tokens = [];
  
  while (remaining.length > 0) {
    let matched = false;
    for (const sym of sortedSymbols) {
      if (remaining.startsWith(sym)) {
        tokens.push(sym);
        remaining = remaining.slice(sym.length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push(remaining[0]);
      remaining = remaining.slice(1);
    }
  }
  return tokens;
};

export default function PictureWordGame() {
  const [words, setWords] = useState<Word[]>([]);
  const [allLetters, setAllLetters] = useState<Letter[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [shuffledLetters, setShuffledLetters] = useState<{ id: number; symbol: string }[]>([]);
  const [spelledLetters, setSpelledLetters] = useState<{ id: number; symbol: string }[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [round, setRound] = useState(1);
  const MAX_ROUNDS = 20;

  useEffect(() => {
    Promise.all([
      fetch('/api/words').then(res => res.json()),
      fetch('/api/letters').then(res => res.json())
    ]).then(([wordsData, lettersData]) => {
      setWords(wordsData);
      setAllLetters(lettersData);
      if (wordsData.length > 0 && lettersData.length > 0) {
        pickRandomWord(wordsData, lettersData, 1);
      }
    });
  }, []);

  const pickRandomWord = (wordList = words, letterList = allLetters, currentRound = round + 1) => {
    if (wordList.length === 0 || letterList.length === 0) return;
    
    if (currentRound > MAX_ROUNDS) {
      setRound(currentRound); // Trigger game over
      return;
    }

    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    setCurrentWord(randomWord);
    setIsSuccess(false);
    setSpelledLetters([]);

    const tokens = tokenizeWord(randomWord.text, letterList);
    const letters = tokens.map((symbol, index) => ({
      id: index,
      symbol,
    }));
    
    setShuffledLetters(letters.sort(() => Math.random() - 0.5));
    if (currentRound !== 1) setRound(currentRound);
  };

  const handleSelectLetter = (letter: { id: number; symbol: string }) => {
    if (isSuccess) return;

    setSpelledLetters(prev => [...prev, letter]);
    setShuffledLetters(prev => prev.filter(l => l.id !== letter.id));
  };

  const handleRemoveLetter = (letter: { id: number; symbol: string }) => {
    if (isSuccess) return;

    setShuffledLetters(prev => [...prev, letter]);
    setSpelledLetters(prev => prev.filter(l => l.id !== letter.id));
  };

  useEffect(() => {
    if (!currentWord) return;
    const targetTokens = tokenizeWord(currentWord.text, allLetters);
    
    if (spelledLetters.length !== targetTokens.length) return;

    const spelledWord = spelledLetters.map(l => l.symbol).join('');
    if (spelledWord.toLowerCase() === currentWord.text.toLowerCase()) {
      setIsSuccess(true);
      playAudio();
    }
  }, [spelledLetters, currentWord, allLetters]);

  const playAudio = () => {
    if (currentWord?.audioPath) {
      new Audio(currentWord.audioPath).play();
    }
  };

  if (words.length === 0 || allLetters.length === 0) {
    return <div className="p-8 text-center text-xl font-bold">Laden... Voeg eerst woorden en letters toe in de admin.</div>;
  }

  if (round > MAX_ROUNDS) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center font-sans p-6">
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-lg w-full">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-4xl font-black text-blue-600 mb-4">Klaar!</h1>
          <p className="text-xl text-gray-600 mb-8">Je hebt {MAX_ROUNDS} woorden geoefend. Super goed gedaan!</p>
          <Link href="/" className="bg-blue-500 text-white px-8 py-4 rounded-full text-2xl font-bold hover:bg-blue-600 shadow-lg block w-full">
            Terug naar Menu
          </Link>
        </div>
      </div>
    );
  }

  if (!currentWord) return <div className="p-8 text-center text-2xl font-bold">Laden...</div>;

  const targetTokens = tokenizeWord(currentWord.text, allLetters);

  return (
    <div className="min-h-screen bg-blue-50 p-6 flex flex-col items-center font-sans">
      <div className="w-full max-w-4xl flex justify-between items-center mb-4">
        <Link href="/" className="bg-white p-4 rounded-full shadow hover:bg-gray-50 flex items-center gap-2">
          <ArrowLeft size={24} /> Terug
        </Link>
        <div className="text-xl font-bold text-blue-400">Ronde {round} / {MAX_ROUNDS}</div>
        <button onClick={() => pickRandomWord()} className="bg-white p-4 rounded-full shadow hover:bg-gray-50">
          <RefreshCw size={24} className="text-blue-500" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl">
        {currentWord.imagePath && (
          <div className="mb-12">
            <img 
              src={currentWord.imagePath} 
              alt="Prentje" 
              className="w-64 h-64 object-cover rounded-3xl shadow-xl border-4 border-white"
            />
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4 mb-12 min-h-[5rem] w-full bg-white p-6 rounded-3xl shadow-inner border-2 border-dashed border-gray-300">
          {spelledLetters.length === 0 && !isSuccess && (
            <div className="text-gray-400 text-xl font-medium pt-2">Sleep de klanken hier...</div>
          )}
          {spelledLetters.map((letter) => (
            <button
              key={letter.id}
              onClick={() => handleRemoveLetter(letter)}
              className={`min-w-[4rem] px-4 h-16 sm:min-w-[5rem] sm:h-20 rounded-xl text-4xl sm:text-5xl font-bold text-white shadow-md transition-all ${isSuccess ? 'bg-green-500 cursor-default scale-110' : 'bg-blue-500 hover:scale-95'}`}
              disabled={isSuccess}
            >
              {letter.symbol}
            </button>
          ))}
          {/* Empty placeholders to show how many sounds there are */}
          {!isSuccess && Array.from({ length: targetTokens.length - spelledLetters.length }).map((_, i) => (
            <div key={`empty-${i}`} className="min-w-[4rem] h-16 sm:min-w-[5rem] sm:h-20 border-b-4 border-gray-200"></div>
          ))}
        </div>

        {isSuccess && (
          <div className="mb-8 animate-bounce">
            <button onClick={() => pickRandomWord()} className="bg-green-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:bg-green-600 shadow-lg">
              Volgende Woord! ➜
            </button>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4">
          {shuffledLetters.map((letter) => (
            <button
              key={letter.id}
              onClick={() => handleSelectLetter(letter)}
              className="min-w-[4rem] px-4 h-16 sm:min-w-[5rem] sm:h-20 bg-white rounded-xl text-4xl sm:text-5xl font-bold text-gray-700 shadow-md hover:bg-blue-50 hover:-translate-y-1 transition-all border-b-4 border-gray-200"
            >
              {letter.symbol}
            </button>
          ))}
        </div>

        {currentWord.audioPath && (
          <button onClick={playAudio} className="mt-8 bg-gray-100 p-4 rounded-full text-gray-600 hover:bg-gray-200">
            🔊 Luister
          </button>
        )}
      </div>
    </div>
  );
}
