'use client';
import React, { useState, useRef } from 'react';

export default function AudioRecorder({ onRecordingComplete }) {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            mediaRecorderRef.current = new MediaRecorder(stream);

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                onRecordingComplete(audioBlob);
                chunksRef.current = [];
                stopMicrophone();
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);

            // 1.5초 후 자동 중지
            setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.stop();
                    setIsRecording(false);
                }
            }, 2000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };

    const stopMicrophone = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        mediaRecorderRef.current = null;
        setIsRecording(false);
    };

    return (
        <button
            onClick={startRecording}
            disabled={isRecording}
            className={`p-4 rounded-full ${
                isRecording ? 'bg-[#50C710] animate-pulse' : 'bg-[#50C710]'
            } hover:scale-105 text-white text-2xl w-16 h-16 flex items-center justify-center transition-all duration-300`}
        >
            {isRecording ? '⏺️' : '🎙️'}
        </button>
    );
}
