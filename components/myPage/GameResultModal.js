import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { getGameResults } from '@/api/user/api';

const GameResultModal = ({ isOpen, onClose, userEmail }) => {
    const [results, setResults] = useState([]);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef();

    const lastResultElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    useEffect(() => {
        setLoading(true);
        getGameResults(userEmail, page)
            .then(response => {
                setResults(prev => [...prev, ...response.content]);
                setHasMore(!response.last);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching game results:", err);
                setLoading(false);
            });
    }, [page, userEmail]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">대전 기록</h2>
                {results.map((result, index) => (
                    <div
                        key={result.id}
                        ref={index === results.length - 1 ? lastResultElementRef : null}
                        className={`flex justify-between items-center p-4 mb-4 rounded-lg ${
                            result.win
                                ? 'bg-gradient-to-r from-blue-200 to-red-200'
                                : 'bg-gradient-to-r from-red-200 to-blue-200'
                        }`}
                    >
                        <div className="flex items-center">
                            <Image
                                src={result.myProfileImage || '/default-profile.jpg'}
                                alt="My Profile"
                                width={50}
                                height={50}
                                className="rounded-full mr-4"
                            />
                            <span>{result.myNickname}</span>
                        </div>
                        <div className="text-lg font-bold">
                            {result.win ? 'WIN' : 'LOSE'}
                        </div>
                        <div className="flex items-center">
                            <span>{result.opponentNickname}</span>
                            <Image
                                src={result.opponentProfileImage || '/default-profile.jpg'}
                                alt="Opponent Profile"
                                width={50}
                                height={50}
                                className="rounded-full ml-4"
                            />
                        </div>
                    </div>
                ))}
                {loading && <p>Loading...</p>}
            </div>
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white text-2xl"
            >
                &times;
            </button>
        </div>
    );
};

export default GameResultModal;
