'use client';
import React, { useState, useEffect } from 'react';
import AudioRecorder from './AudioRecorder';
import AudioPlayer from './AudioPlayer';
import { fetchAudioUrls, updateAudio } from "@/api/user/api";

export default function RecordingComponent({ userEmail }) {
    const [recordings, setRecordings] = useState(Array(5).fill(null));
    const [audioUrls, setAudioUrls] = useState(Array(5).fill(null));

    useEffect(() => {
        fetchAudioUrls(setAudioUrls);
    }, []);

    const handleRecording = (index, audioBlob) => {
        const newRecordings = [...recordings];
        newRecordings[index] = audioBlob;
        setRecordings(newRecordings);
    };

    const handleSubmit = async () => {
        try {
            const formData = new FormData();
            for (let i = 0; i < 5; i++) {
                if (audioUrls[i]) {
                    formData.append(`audioUrl${i}`, audioUrls[i]);
                }
                if (recordings[i]) {
                    formData.append(`audio${i}`, recordings[i], `audio${i}.webm`);
                }
            }
            await updateAudio(formData);
            fetchAudioUrls(setAudioUrls);
            alert("피격음 저장 성공!!");
        } catch (error) {
            console.error('Error uploading recordings:', error);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">피격음 녹음</h2>
                <button
                    onClick={handleSubmit}
                    className="bg-[#1ba5e0] text-white px-4 py-2 rounded text-lg hover:scale-105 transition duration-300"
                >
                    저장
                </button>
            </div>
            <div className="grid grid-cols-5 gap-6 mb-6">
                {Array(5).fill(null).map((_, index) => (
                    <div key={index} className="flex flex-col items-center">
                        <AudioRecorder onRecordingComplete={(blob) => handleRecording(index, blob)}/>
                        {(recordings[index] || audioUrls[index]) && (
                            <AudioPlayer
                                audioBlob={recordings[index]}
                                audioUrl={audioUrls[index]}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}