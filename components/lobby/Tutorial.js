import { useState, useEffect } from 'react';

export default function Tutorial({ isVisible, onClose }) {
    const [animationClass, setAnimationClass] = useState('translate-y-full');

    useEffect(() => {
        if (isVisible) {
            setTimeout(() => setAnimationClass('translate-y-0'), 50);
        } else {
            setAnimationClass('translate-y-full');
        }
    }, [isVisible]);

    return (
        <div
            className={`absolute inset-x-0 bottom-0 h-full bg-white rounded-lg shadow-lg transition-all duration-300 ease-in-out transform ${animationClass}`}
        >
            <h2 className="text-gray-800 text-3xl text-center font-bold mb-4 mt-4">Tutorial</h2>
            <div className="p-6 overflow-y-auto h-[calc(100%-4rem)]">
                {/* 여기에 튜토리얼 내용을 추가하세요 */}
                <p>This is where the tutorial content will go...</p>
            </div>
        </div>
    );
}