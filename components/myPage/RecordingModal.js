'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AudioRecorder from './AudioRecorder';
import AudioPlayer from './AudioPlayer';
import {fetchAudioUrls, updateAudio} from "@/api/user/api";

export default function RecordingModal({ isOpen, onClose }) {
    const [recordings, setRecordings] = useState(Array(5).fill(null));
    const [audioUrls, setAudioUrls] = useState(Array(5).fill(null));

    useEffect(() => {
        if (isOpen) {
            console.log("Recording modal opened")
            fetchAudioUrls(setAudioUrls);
        }
    }, [isOpen]);

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
            handleClose();
        } catch (error) {
            console.error('Error uploading recordings:', error);
        }
    };

    const handleClose = () => {
        setRecordings(Array(5).fill(null));
        setAudioUrls(Array(5).fill(null));
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg w-3/4 max-w-3xl">
                <h2 className="text-2xl font-bold mb-6">피격음 녹음</h2>
                <div className="grid grid-cols-5 gap-6 mb-6">
                    {Array(5).fill(null).map((_, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <AudioRecorder onRecordingComplete={(blob) => handleRecording(index, blob)} />
                            {(recordings[index] || audioUrls[index]) && (
                                <AudioPlayer
                                    audioBlob={recordings[index]}
                                    audioUrl={audioUrls[index]}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={handleSubmit}
                        className="bg-blue-500 text-white px-6 py-3 rounded text-lg"
                    >
                        저장
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-300 px-6 py-3 rounded text-lg"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}
