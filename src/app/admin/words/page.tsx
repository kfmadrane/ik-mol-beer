'use client';

import { useState, useEffect } from 'react';
import AudioRecorder from '@/components/AudioRecorder';

type Word = { id: string; text: string; imagePath: string | null; audioPath: string | null };

export default function AdminWords() {
  const [words, setWords] = useState<Word[]>([]);
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchWords();
  }, []);

  const fetchWords = async () => {
    setFetchLoading(true);
    setFetchError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`/api/words?t=${Date.now()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} (${res.statusText || 'Error'})`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setWords(data);
      } else {
        throw new Error('Server returned invalid data: ' + JSON.stringify(data));
      }
    } catch (err: any) {
      console.error('Failed to fetch words:', err);
      setFetchError(err.name === 'AbortError' ? 'Timeout bij verbinding (duurde te lang)' : (err.message || 'Kon woorden niet laden'));
    } finally {
      setFetchLoading(false);
    }
  };

  const handleEdit = (word: Word) => {
    setEditingId(word.id);
    setText(word.text);
    setImage(null);
    setAudio(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setText('');
    setImage(null);
    setAudio(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) return alert('Word text is required');
    
    setLoading(true);
    const formData = new FormData();
    formData.append('text', text);
    if (image) formData.append('image', image);
    if (audio) formData.append('audio', audio, 'audio.webm');

    try {
      const url = editingId ? `/api/words/${editingId}` : '/api/words';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData,
      });
      if (res.ok) {
        handleCancelEdit();
        fetchWords();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save word');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this word?')) return;
    await fetch(`/api/words/${id}`, { method: 'DELETE' });
    if (editingId === id) handleCancelEdit();
    fetchWords();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <h2 className="text-4xl font-black text-slate-800 tracking-tight">Manage Words</h2>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 space-y-6">
        {editingId && (
          <div className="bg-amber-100 text-amber-900 p-4 rounded-xl font-bold flex items-center gap-2 border border-amber-300">
            <span>✏️</span> Editing word. Uploading new media will replace the old files.
          </div>
        )}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Word Text</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border-2 border-slate-300 p-3 rounded-xl focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all font-medium text-lg text-slate-900"
            placeholder="e.g. boom"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Picture {editingId && '(Optional)'}</label>
          <input
            type="file"
            accept="image/*"
            key={`img-${editingId || 'new'}`}
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="w-full border-2 border-slate-300 p-3 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
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
            {loading ? 'Saving...' : editingId ? 'Update Word' : 'Add Word'}
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
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-slate-800">Woordenlijst ({words.length})</h3>
            {fetchLoading && <span className="text-sm font-medium text-blue-600 animate-pulse">Laden...</span>}
          </div>
          <button
            type="button"
            onClick={fetchWords}
            disabled={fetchLoading}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-xl transition-all"
          >
            🔄 Vernieuwen
          </button>
        </div>

        {fetchError && (
          <div className="p-4 bg-red-100 border-b border-red-300 text-red-800 flex items-center justify-between">
            <div>
              <strong>Fout bij ophalen woorden:</strong> {fetchError}
            </div>
            <button
              onClick={fetchWords}
              className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-bold"
            >
              Opnieuw proberen
            </button>
          </div>
        )}

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200 text-slate-600">
              <th className="p-5 font-bold uppercase tracking-wider text-sm">Word</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">Image</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">Audio</th>
              <th className="p-5 font-bold uppercase tracking-wider text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {words.map((word) => (
              <tr key={word.id} className="hover:bg-blue-50 transition-colors">
                <td className="p-5 font-black text-2xl text-slate-800">{word.text}</td>
                <td className="p-5">
                  {word.imagePath ? (
                    <img src={word.imagePath} alt={word.text} className="h-16 w-16 object-cover rounded-xl shadow-sm border border-slate-200" />
                  ) : <span className="text-slate-400 italic">No image</span>}
                </td>
                <td className="p-5">
                  {word.audioPath ? (
                    <audio src={word.audioPath} controls className="h-10 w-48" />
                  ) : <span className="text-slate-400 italic">No audio</span>}
                </td>
                <td className="p-5">
                  <div className="flex gap-4">
                    <button onClick={() => handleEdit(word)} className="font-bold text-blue-600 hover:text-blue-800 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(word.id)} className="font-bold text-red-600 hover:text-red-800 hover:underline">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {words.length === 0 && (
          <div className="p-12 text-center text-slate-400 font-medium">
            No words found. Add your first word above!
          </div>
        )}
      </div>
    </div>
  );
}
