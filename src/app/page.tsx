import Link from 'next/link';
import { Image as ImageIcon, Type, Zap, Settings, Headphones } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center py-12 px-4 font-sans text-slate-800">
      <div className="w-full max-w-4xl flex justify-end mb-8">
        <Link href="/admin" className="text-gray-500 hover:text-gray-800 flex items-center gap-2 bg-white p-2 rounded-full shadow">
          <Settings size={24} />
        </Link>
      </div>

      <h1 className="text-5xl font-extrabold mb-12 text-center text-blue-600 drop-shadow-sm">
        Spelen & Leren!
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-4xl">
        
        {/* Game 1: Prentje Woordje */}
        <Link href="/games/picture-word" className="group flex flex-col items-center bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-4 border-transparent hover:border-green-400">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-6 group-hover:scale-110 transition-transform">
            <ImageIcon size={48} />
          </div>
          <h2 className="text-2xl font-bold text-center">Prentje - woordje</h2>
          <p className="text-gray-500 text-center mt-2">Maak het woord bij het plaatje!</p>
        </Link>

        {/* Game 2: Letters Plakken */}
        <Link href="/games/pasting-letters" className="group flex flex-col items-center bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-4 border-transparent hover:border-purple-400">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center text-purple-500 mb-6 group-hover:scale-110 transition-transform">
            <Type size={48} />
          </div>
          <h2 className="text-2xl font-bold text-center">Letters plakken</h2>
          <p className="text-gray-500 text-center mt-2">Luister naar de klanken en maak het woord!</p>
        </Link>

        {/* Game 3: Letters Flitsen */}
        <Link href="/games/flash-letters" className="group flex flex-col items-center bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-4 border-transparent hover:border-orange-400">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform">
            <Zap size={48} />
          </div>
          <h2 className="text-2xl font-bold text-center">Letters flitsen</h2>
          <p className="text-gray-500 text-center mt-2">Welke letter zie je?</p>
        </Link>

        {/* Game 4: Listen Letter */}
        <Link href="/games/listen-letter" className="group flex flex-col items-center bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-4 border-transparent hover:border-teal-400">
          <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center text-teal-500 mb-6 group-hover:scale-110 transition-transform">
            <Headphones size={48} />
          </div>
          <h2 className="text-2xl font-bold text-center">Zoek de letter</h2>
          <p className="text-gray-500 text-center mt-2">Luister en zoek de juiste letter!</p>
        </Link>

        {/* Game 5: Listen Word */}
        <Link href="/games/listen-word" className="group flex flex-col items-center bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-4 border-transparent hover:border-rose-400">
          <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mb-6 group-hover:scale-110 transition-transform">
            <Headphones size={48} />
          </div>
          <h2 className="text-2xl font-bold text-center">Zoek het woord</h2>
          <p className="text-gray-500 text-center mt-2">Luister en zoek het juiste woord!</p>
        </Link>

        {/* Game 6: Letter Boggle */}
        <Link href="/games/letter-boggle" className="group flex flex-col items-center bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 border-4 border-transparent hover:border-pink-400">
          <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center text-pink-500 mb-6 group-hover:scale-110 transition-transform">
            <Type size={48} />
          </div>
          <h2 className="text-2xl font-bold text-center">Letter Boggle</h2>
          <p className="text-gray-500 text-center mt-2">Maak zoveel mogelijk woorden!</p>
        </Link>
        
      </div>
    </div>
  );
}
