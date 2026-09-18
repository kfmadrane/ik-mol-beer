'use client';

import { useState, useEffect } from 'react';
import AudioRecorder from '@/components/AudioRecorder';

type Letter = { id: string; symbol: string; audioPath: string | null };

export default function AdminLetters() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [symbol, setSymbol] = useState('');
  const [audio, setAudio] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLetters();
  }, []);

  const fetchLetters = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`/api/letters?t=${Date.now()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (Array.isArray(data)) {
        setLetters(data);
      }
    } catch (err) {
      console.error('Failed to fetch letters:', err);
    }
  };

  const handleEdit = (letter: Letter) => {
    setEditingId(letter.id);
    setSymbol(letter.symbol);
    setAudio(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSymbol('');
    setAudio(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol) return alert('Letter symbol is required');
    
    setLoading(true);
    const formData = new FormData();
    formData.append('symbol', symbol);
    if (audio) {
      formData.append('audio', audio, 'audio.mp3');
    }

    try {
      const url = editingId ? `/api/letters/${editingId}` : '/api/letters';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData,
      });
      if (res.ok) {
        handleCancelEdit();
        fetchLetters();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save letter');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this letter?')) return;
    await fetch(`/api/letters/${id}`, { method: 'DELETE' });
    if (editingId === id) handleCancelEdit();
    fetchLetters();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <h2 className="text-4xl font-black text-slate-800 tracking-tight">Manage Letters (Flitsletters)</h2>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 space-y-6">
        {editingId && (
          <div className="bg-amber-100 text-amber-900 p-4 rounded-xl font-bold flex items-center gap-2 border border-amber-300">
            <span>✏️</span> Editing letter. Uploading new audio will replace the old file.
          </div>
        )}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Letter / Sound</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full border-2 border-slate-300 p-3 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all font-medium text-lg text-slate-900"
            placeholder="e.g. a, b, oo, ch"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Audio Recording {editingId && '(Optional)'}</label>
          <AudioRecorder
            key={`audio-${editingId || 'new'}`}
            onRecordingComplete={(blob) => setAudio(blob)}
            onClear={() => setAudio(null)}
          />
        </div>

        <div className="flex gap-4 pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors shadow-lg"
          >
            {loading ? 'Saving...' : editingId ? 'Update Letter' : 'Add Letter'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-slate-200 text-slate-700 px-8 py-3 rounded-xl font-bold hover:bg-slate-300 transition-colors"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200 text-slate-600">
              <th className="p-5 font-bold uppercase tracking-wider text-sm">Letter</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">Audio</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {letters.map((letter) => (
              <tr key={letter.id} className="hover:bg-blue-50 transition-colors">
                <td className="p-5 font-black text-4xl text-slate-800 uppercase">{letter.symbol}</td>
                <td className="p-5">
                  {letter.audioPath ? (
                    <audio src={letter.audioPath} controls className="h-10 w-48" />
                  ) : <span className="text-slate-400 italic">No audio</span>}
                </td>
                <td className="p-5">
                  <div className="flex gap-4">
                    <button onClick={() => handleEdit(letter)} className="font-bold text-blue-600 hover:text-blue-800 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(letter.id)} className="font-bold text-red-600 hover:text-red-800 hover:underline">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {letters.length === 0 && (
          <div className="p-12 text-center text-slate-400 font-medium">
            No letters found. Add your first letter above!
          </div>
        )}
      </div>
    </div>
  );
}
