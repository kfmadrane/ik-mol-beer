'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Volume2 } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';

type Word = { id: string; text: string; imagePath: string | null; audioPath: string | null };

export default function ListenWordGame() {
  const [words, setWords] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [options, setOptions] = useState<Word[]>([]);
  const [round, setRound] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState<string[]>([]);
  const { play, stop, isPlaying } = useAudio();
  const MAX_ROUNDS = 20;

  useEffect(() => {
    fetch('/api/words')
      .then(res => res.json())
      .then(data => {
        const validWords = data.filter((w: Word) => w.audioPath);
        setWords(validWords);
        if (validWords.length > 0) pickRandomWord(validWords, 1);
      });
  }, []);

  const pickRandomWord = (wordList = words, currentRound = round + 1) => {
    if (wordList.length < 4) return;
    
    stop();

    if (currentRound > MAX_ROUNDS) {
      setRound(currentRound);
      return;
    }

    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    setCurrentWord(randomWord);
    setIsSuccess(false);
    setWrongAttempts([]);

    const distractors = [...wordList]
      .filter(w => w.id !== randomWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    setOptions([...distractors, randomWord].sort(() => Math.random() - 0.5));
    if (currentRound !== 1) setRound(currentRound);

    setTimeout(() => {
      if (randomWord.audioPath) {
        play(randomWord.audioPath);
      }
    }, 500);
  };

  const handleSelect = (word: Word) => {
    if (isSuccess) return;

    if (word.id === currentWord?.id) {
      setIsSuccess(true);
      if (currentWord?.audioPath) {
        play(currentWord.audioPath);
      }
    } else {
      setWrongAttempts(prev => [...prev, word.id]);
    }
  };

  if (words.length < 4) {
    return <div className="p-8 text-center text-xl font-bold">Laden... Voeg eerst minimaal 4 woorden met geluid toe in de admin.</div>;
  }

  if (round > MAX_ROUNDS) {
    return (
      <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center font-sans p-6">
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-lg w-full">
          <div className="text-6xl mb-6">🏆</div>
          <h1 className="text-4xl font-black text-rose-600 mb-4">Klaar!</h1>
          <p className="text-xl text-gray-600 mb-8">Je hebt {MAX_ROUNDS} woorden perfect gehoord!</p>
          <Link href="/" className="bg-rose-500 text-white px-8 py-4 rounded-full text-2xl font-bold hover:bg-rose-600 shadow-lg block w-full">
            Terug naar Menu
          </Link>
        </div>
      </div>
    );
  }

  if (!currentWord) return null;

  return (
    <div className="min-h-screen bg-rose-50 p-6 flex flex-col items-center font-sans">
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <Link href="/" className="bg-white p-4 rounded-full shadow hover:bg-gray-50 flex items-center gap-2">
          <ArrowLeft size={24} /> Terug
        </Link>
        <div className="text-xl font-bold text-rose-600">Ronde {round} / {MAX_ROUNDS}</div>
        <button onClick={() => pickRandomWord()} className="bg-white p-4 rounded-full shadow hover:bg-gray-50">
          <RefreshCw size={24} className="text-rose-500" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl">
        
        <button 
          onClick={() => {
            if (currentWord.audioPath) play(currentWord.audioPath);
          }}
          className={`w-48 h-48 rounded-full shadow-2xl flex flex-col items-center justify-center transition-all mb-12 border-8 border-rose-200 ${isPlaying ? 'bg-rose-400 scale-110' : 'bg-rose-500 hover:bg-rose-600 hover:scale-105'}`}
        >
          <Volume2 size={80} className="text-white" />
        </button>

        <p className="text-2xl text-gray-600 mb-12 font-bold">Welk woord hoor je?</p>

        <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
          {options.map(word => {
            const isWrong = wrongAttempts.includes(word.id);
            const isCorrect = isSuccess && word.id === currentWord.id;
            
            return (
              <button
                key={word.id}
                onClick={() => handleSelect(word)}
                disabled={isWrong || isSuccess}
                className={`h-32 rounded-3xl text-4xl sm:text-5xl font-bold lowercase shadow-lg transition-all border-b-8 ${
                  isCorrect 
                    ? 'bg-green-500 text-white border-green-600 scale-105'
                    : isWrong
                      ? 'bg-red-100 text-red-300 border-red-200 cursor-not-allowed opacity-50'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-rose-50 hover:-translate-y-2'
                }`}
              >
                {word.text}
              </button>
            );
          })}
        </div>

        {isSuccess && (
          <div className="mt-12 animate-bounce">
            <button 
              onClick={() => pickRandomWord()}
              disabled={isPlaying}
              className={`text-white px-8 py-4 rounded-full text-2xl font-bold shadow-xl transition-colors ${isPlaying ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {isPlaying ? 'Luister...' : 'Volgende ➜'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
