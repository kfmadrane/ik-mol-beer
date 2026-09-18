'use client';

import { useState, useRef, useEffect } from 'react';

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = (path: string, onEnded?: () => void) => {
    // Stop currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(path);
    audioRef.current = audio;
    setIsPlaying(true);

    audio.onended = () => {
      if (audioRef.current === audio) {
        setIsPlaying(false);
        if (onEnded) onEnded();
      }
    };

    audio.onerror = () => {
      if (audioRef.current === audio) {
        setIsPlaying(false);
        if (onEnded) onEnded();
      }
    };

    audio.play().catch(e => {
      console.error("Audio playback failed", e);
      // Only set to false if this is still the active audio. 
      // If a new audio started, it interrupted this one (AbortError)
      if (audioRef.current === audio) {
        setIsPlaying(false);
        if (onEnded) onEnded();
      }
    });
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => stop();
  }, []);

  return { play, stop, isPlaying };
}
