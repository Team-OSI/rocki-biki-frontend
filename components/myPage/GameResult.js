import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { getGameResults } from '@/api/user/api';

const GameResultComponent = ({ userEmail }) => {
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
                const content = Array.isArray(response.content) ? response.content : [];
                setResults(prev => [...prev, ...content]);
                setHasMore(!response.last); // response.last가 true면 더 이상 데이터가 없음
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching game results:", err);
                setLoading(false);
            });
    }, [page, userEmail]);

    return (
        <div className="bg-white rounded-lg p-8 w-full h-full overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">대전 기록</h2>
            {results.length === 0 && !loading && (
                <p className="text-center text-gray-500">대전 기록이 없습니다.</p>
            )}
            {results.map((result, index) => (
                <div
                    key={result.id}
                    ref={index === results.length - 1 ? lastResultElementRef : null}
                    className={`flex justify-between items-center p-4 mb-4 rounded-lg ${
                        result.win
                            ? 'bg-blue-500'
                            : 'bg-red-500'
                    }`}
                >
                    <div className="flex items-center">
                        <div className="relative w-12 h-12 mr-4">
                            <Image
                                src={result.userProfileImage || '/default-profile.jpg'}
                                alt="My Profile"
                                layout="fill"
                                className="rounded-full object-cover"
                            />
                        </div>
                        <span>{result.userName}</span>
                    </div>
                    <div className="text-lg font-bold text-center w-16">
                        {result.win ? 'WIN' : 'LOSE'}
                    </div>
                    <div className="flex items-center">
                        <span>{result.opponentName}</span>
                        <div className="relative w-12 h-12 ml-4">
                            <Image
                                src={result.opponentProfileImage || '/default-profile.jpg'}
                                alt="Opponent Profile"
                                layout="fill"
                                className="rounded-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            ))}
            {loading && <p>Loading...</p>}
        </div>
    );
};

export default GameResultComponent;