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

    const buttonStyle = {
        marginTop: '0.5rem',
        width: '2rem',
        height: '2rem',
        padding: '0',
        backgroundColor: isPlaying ? '#FFFFFF' : '#E5E7EB',
        color: isPlaying ? '#000000' : '#000000', // 텍스트 색상을 항상 검정색으로
        borderRadius: '50%', // 원 모양으로 만들기
        fontSize: '1.5rem',
        transition: 'all 0.3s ease',
        boxShadow: isPlaying
            ? '0 0 10px #FFFFFF, 0 0 20px #FFFFFF, 0 0 30px #FFFFFF'
            : 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: 'none',
        cursor: 'pointer',
    };

    return (
        <button
            onClick={togglePlay}
            style={buttonStyle}
        >
            {isPlaying ? '⏸️' : '▶️'}
        </button>
    );
}
