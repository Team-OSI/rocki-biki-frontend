'use client';
import React, { useState, useRef, useEffect } from 'react';

export default function AudioPlayer({ audioBlob, audioUrl }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(new Audio());

    useEffect(() => {
        const audio = audioRef.current;
        if (audioBlob) {
            const blobUrl = URL.createObjectURL(audioBlob);
            audio.src = blobUrl;
            return () => URL.revokeObjectURL(blobUrl);
        } else if (audioUrl) {
            audio.src = audioUrl;
        }
    }, [audioBlob, audioUrl]);

    useEffect(() => {
        const audio = audioRef.current;
        audio.addEventListener('ended', () => setIsPlaying(false));
        return () => {
            audio.removeEventListener('ended', () => setIsPlaying(false));
        };
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    if (!audioBlob && !audioUrl) return null;

    return (
        <button
            onClick={togglePlay}
            className="mt-2 p-3 bg-gray-200 rounded-full text-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
            {isPlaying ? '⏸️' : '▶️'}
        </button>
    );
}
