'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Volume2 } from 'lucide-react';

type Letter = { id: string; symbol: string; audioPath: string | null };

export default function ListenLetterGame() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [currentLetter, setCurrentLetter] = useState<Letter | null>(null);
  const [options, setOptions] = useState<Letter[]>([]);
  const [round, setRound] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState<string[]>([]);
  const MAX_ROUNDS = 20;

  useEffect(() => {
    fetch('/api/letters')
      .then(res => res.json())
      .then(data => {
        // Filter out letters that don't have audio
        const validLetters = data.filter((l: Letter) => l.audioPath);
        setLetters(validLetters);
        if (validLetters.length > 0) pickRandomLetter(validLetters, 1);
      });
  }, []);

  const pickRandomLetter = (letterList = letters, currentRound = round + 1) => {
    if (letterList.length < 4) return;
    
    if (currentRound > MAX_ROUNDS) {
      setRound(currentRound); // Trigger game over
      return;
    }

    const randomLetter = letterList[Math.floor(Math.random() * letterList.length)];
    setCurrentLetter(randomLetter);
    setIsSuccess(false);
    setWrongAttempts([]);

    const distractors = [...letterList]
      .filter(l => l.id !== randomLetter.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    setOptions([...distractors, randomLetter].sort(() => Math.random() - 0.5));
    if (currentRound !== 1) setRound(currentRound);

    // Play sound automatically after a short delay
    setTimeout(() => {
      if (randomLetter.audioPath) {
        new Audio(randomLetter.audioPath).play().catch(e => console.log("Autoplay blocked"));
      }
    }, 500);
  };

  const handleSelect = (letter: Letter) => {
    if (isSuccess) return;

    if (letter.id === currentLetter?.id) {
      setIsSuccess(true);
      if (currentLetter?.audioPath) {
        new Audio(currentLetter.audioPath).play();
      }
    } else {
      setWrongAttempts(prev => [...prev, letter.id]);
    }
  };

  if (letters.length < 4) {
    return <div className="p-8 text-center text-xl font-bold">Laden... Voeg eerst minimaal 4 letters met geluid toe in de admin.</div>;
  }

  if (round > MAX_ROUNDS) {
    return (
      <div className="min-h-screen bg-teal-50 flex flex-col items-center justify-center font-sans p-6">
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-lg w-full">
          <div className="text-6xl mb-6">🏆</div>
          <h1 className="text-4xl font-black text-teal-600 mb-4">Klaar!</h1>
          <p className="text-xl text-gray-600 mb-8">Je hebt {MAX_ROUNDS} letters perfect gehoord!</p>
          <Link href="/" className="bg-teal-500 text-white px-8 py-4 rounded-full text-2xl font-bold hover:bg-teal-600 shadow-lg block w-full">
            Terug naar Menu
          </Link>
        </div>
      </div>
    );
  }

  if (!currentLetter) return null;

  return (
    <div className="min-h-screen bg-teal-50 p-6 flex flex-col items-center font-sans">
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <Link href="/" className="bg-white p-4 rounded-full shadow hover:bg-gray-50 flex items-center gap-2">
          <ArrowLeft size={24} /> Terug
        </Link>
        <div className="text-xl font-bold text-teal-600">Ronde {round} / {MAX_ROUNDS}</div>
        <button onClick={() => pickRandomLetter()} className="bg-white p-4 rounded-full shadow hover:bg-gray-50">
          <RefreshCw size={24} className="text-teal-500" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl">
        
        <button 
          onClick={() => {
            if (currentLetter.audioPath) new Audio(currentLetter.audioPath).play();
          }}
          className="w-48 h-48 bg-teal-500 rounded-full shadow-2xl flex flex-col items-center justify-center hover:bg-teal-600 hover:scale-105 transition-all mb-12 border-8 border-teal-200 animate-pulse"
        >
          <Volume2 size={80} className="text-white" />
        </button>

        <p className="text-2xl text-gray-600 mb-12 font-bold">Welke letter hoor je?</p>

        <div className="grid grid-cols-2 gap-6 w-full max-w-md">
          {options.map(letter => {
            const isWrong = wrongAttempts.includes(letter.id);
            const isCorrect = isSuccess && letter.id === currentLetter.id;
            
            return (
              <button
                key={letter.id}
                onClick={() => handleSelect(letter)}
                disabled={isWrong || isSuccess}
                className={`h-32 rounded-3xl text-6xl font-bold uppercase shadow-lg transition-all border-b-8 ${
                  isCorrect 
                    ? 'bg-green-500 text-white border-green-600 scale-105'
                    : isWrong
                      ? 'bg-red-100 text-red-300 border-red-200 cursor-not-allowed opacity-50'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-teal-50 hover:-translate-y-2'
                }`}
              >
                {letter.symbol}
              </button>
            );
          })}
        </div>

        {isSuccess && (
          <div className="mt-12 animate-bounce">
            <button 
              onClick={() => pickRandomLetter()}
              className="bg-green-500 text-white px-8 py-4 rounded-full text-2xl font-bold hover:bg-green-600 shadow-xl"
            >
              Volgende ➜
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
