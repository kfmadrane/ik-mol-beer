'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Play, Trash2 } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onClear: () => void;
}

export default function AudioRecorder({ onRecordingComplete, onClear }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      // Explicitly check for API support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone API is not available. This usually means the connection is not secure (HTTPS is required) or your browser is too old.');
        return;
      }
      if (typeof window.MediaRecorder === 'undefined') {
        alert('MediaRecorder API is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/mp4') && (/iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent) || !MediaRecorder.isTypeSupported('audio/webm'))) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm';
        }
      }

      const options = mimeType && MediaRecorder.isTypeSupported(mimeType) ? { mimeType } : undefined;
      const mediaRecorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const actualType = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: actualType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      alert(`Microphone access failed: ${error.message || error.name || 'Unknown error'}. Please check browser permissions.`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleClear = () => {
    setAudioUrl(null);
    onClear();
  };

  return (
    <div className="flex items-center gap-4 p-4 border rounded-md bg-gray-50">
      {!audioUrl ? (
        <>
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              <Square size={20} /> Stop Recording
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Mic size={20} /> Record Audio
            </button>
          )}
          {isRecording && <span className="text-red-500 animate-pulse">Recording...</span>}
        </>
      ) : (
        <div className="flex items-center gap-4 w-full">
          <audio src={audioUrl} controls className="flex-1 h-10" />
          <button
            type="button"
            onClick={handleClear}
            className="p-2 text-red-500 hover:bg-red-100 rounded"
            title="Clear Recording"
          >
            <Trash2 size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
