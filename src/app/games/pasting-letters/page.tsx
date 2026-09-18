'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Volume2 } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';

type Word = { id: string; text: string; audioPath: string | null };
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

export default function PastingLettersGame() {
  const [words, setWords] = useState<Word[]>([]);
  const [allLetters, setAllLetters] = useState<Letter[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [options, setOptions] = useState<Letter[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<{ id: string; symbol: string }[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [round, setRound] = useState(1);
  const { play: playAudioTrack, stop, isPlaying } = useAudio();

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

    stop(); // Prevent audio overlap

    if (currentRound > MAX_ROUNDS) {
      setRound(currentRound);
      return;
    }

    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    setCurrentWord(randomWord);
    setIsSuccess(false);
    setSelectedLetters([]);

    const tokens = tokenizeWord(randomWord.text, letterList);
    const correctLetters = tokens.map((char) => {
      const found = letterList.find(l => l.symbol.toLowerCase() === char.toLowerCase());
      return found || { id: `temp-${Math.random()}`, symbol: char, audioPath: null };
    });

    const distractors = [...letterList]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const pool = [...correctLetters, ...distractors]
      .sort(() => Math.random() - 0.5);

    setOptions(pool);
    if (currentRound !== 1) setRound(currentRound);
    
    if (randomWord.audioPath) {
      setTimeout(() => {
        playAudioTrack(randomWord.audioPath!);
      }, 500);
    }
  };

  const handleSelectLetter = (letter: Letter, index: number) => {
    if (isSuccess) return;

    if (letter.audioPath) {
      new Audio(letter.audioPath).play(); // We don't track small letter pings
    }

    setSelectedLetters(prev => {
      const newSelection = [...prev, { id: Date.now().toString() + index, symbol: letter.symbol }];
      checkWin(newSelection);
      return newSelection;
    });
  };

  const handleRemoveLetter = (index: number) => {
    if (isSuccess) return;
    setSelectedLetters(prev => prev.filter((_, i) => i !== index));
  };

  const checkWin = (currentSelection: { id: string; symbol: string }[]) => {
    if (!currentWord) return;
    const currentText = currentSelection.map(s => s.symbol).join('');
    if (currentText.toLowerCase() === currentWord.text.toLowerCase()) {
      setIsSuccess(true);
      if (currentWord.audioPath) {
        setTimeout(() => {
          playAudioTrack(currentWord.audioPath!);
        }, 500);
      }
    }
  };

  if (words.length === 0 || allLetters.length === 0) {
    return <div className="p-8 text-center text-xl font-bold">Laden... Voeg woorden en letters toe in de admin.</div>;
  }

  if (round > MAX_ROUNDS) {
    return (
      <div className="min-h-screen bg-purple-50 flex flex-col items-center justify-center font-sans p-6">
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-lg w-full">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-4xl font-black text-purple-600 mb-4">Klaar!</h1>
          <p className="text-xl text-gray-600 mb-8">Je hebt {MAX_ROUNDS} woorden geoefend. Super goed gedaan!</p>
          <Link href="/" className="bg-purple-500 text-white px-8 py-4 rounded-full text-2xl font-bold hover:bg-purple-600 shadow-lg block w-full">
            Terug naar Menu
          </Link>
        </div>
      </div>
    );
  }

  if (!currentWord) return <div className="p-8 text-center text-2xl font-bold">Laden...</div>;

  return (
    <div className="min-h-screen bg-purple-50 p-6 flex flex-col items-center font-sans">
      <div className="w-full max-w-4xl flex justify-between items-center mb-4">
        <Link href="/" className="bg-white p-4 rounded-full shadow hover:bg-gray-50 flex items-center gap-2">
          <ArrowLeft size={24} /> Terug
        </Link>
        <div className="text-xl font-bold text-purple-400">Ronde {round} / {MAX_ROUNDS}</div>
        <button onClick={() => pickRandomWord()} className="bg-white p-4 rounded-full shadow hover:bg-gray-50">
          <RefreshCw size={24} className="text-purple-500" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl">
        
        <button 
          onClick={() => currentWord.audioPath && playAudioTrack(currentWord.audioPath)} 
          className="mb-12 bg-white p-8 rounded-full shadow-lg hover:bg-purple-100 hover:scale-110 transition-all border-4 border-purple-200"
        >
          <Volume2 size={64} className="text-purple-600" />
        </button>

        <div className="flex flex-wrap justify-center gap-4 mb-12 min-h-[6rem] w-full bg-white p-6 rounded-3xl shadow-inner border-2 border-dashed border-purple-300">
          {selectedLetters.map((letter, index) => (
            <button
              key={letter.id}
              onClick={() => handleRemoveLetter(index)}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl text-4xl sm:text-5xl font-bold lowercase text-white shadow-md transition-all ${isSuccess ? 'bg-green-500 cursor-default scale-110' : 'bg-purple-500 hover:scale-95'}`}
              disabled={isSuccess}
            >
              {letter.symbol}
            </button>
          ))}
        </div>

        {isSuccess && (
          <div className="mb-8 animate-bounce">
            <button 
              onClick={() => pickRandomWord()} 
              disabled={isPlaying}
              className={`text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg transition-colors ${isPlaying ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {isPlaying ? 'Luister...' : 'Volgende Woord! ➜'}
            </button>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4">
          {options.map((letter, i) => (
            <button
              key={`${letter.id}-${i}`}
              onClick={() => handleSelectLetter(letter as Letter, i)}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl text-4xl sm:text-5xl font-bold lowercase text-gray-700 shadow-md hover:bg-purple-50 hover:-translate-y-1 transition-all border-b-4 border-gray-200"
            >
              {letter.symbol}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
