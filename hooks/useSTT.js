import { useEffect, useRef, useState } from 'react';

const useSTT = (onResult, onError) => {
    const recognition = useRef(null);
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [finalTranscript, setFinalTranscript] = useState('');
    const reconnectTimeoutRef = useRef(null);

    useEffect(() => {
        if (typeof window.webkitSpeechRecognition !== 'function') {
            alert('크롬에서만 동작 합니다.');
            return;
        }

        recognition.current = new window.webkitSpeechRecognition();
        recognition.current.continuous = true;
        recognition.current.interimResults = true;
        recognition.current.lang = 'ko-KR';

        recognition.current.onstart = () => {
            setIsRecognizing(true);
        };

        recognition.current.onend = () => {
            setIsRecognizing(false);
            // 인식이 종료되면 재연결 시도
            reconnectTimeoutRef.current = setTimeout(startRecognition, 1000);
        };

        recognition.current.onresult = (event) => {
            let interimTranscript = '';
            let newFinalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    newFinalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            setFinalTranscript(newFinalTranscript);
            onResult({ finalTranscript: newFinalTranscript, interimTranscript });
        };

        recognition.current.onerror = (event) => {
            console.error('Speech recognition error:', event);
            if (event.error === 'aborted') {
                console.log('Recognition aborted. Restarting...');
                // 짧은 지연 후 재시작
                setTimeout(() => {
                    if (!isRecognizing) {
                        startRecognition();
                    }
                }, 1000);
            } else if (onError) {
                onError(event);
            }
            // 다른 에러에 대해서도 재연결 시도
            reconnectTimeoutRef.current = setTimeout(startRecognition, 1000);
        };

        return () => {
            if (recognition.current) {
                recognition.current.stop();
                setIsRecognizing(false);
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [onResult, onError]);

    const startRecognition = () => {
        if (recognition.current && !isRecognizing) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    setFinalTranscript('');
                    setIsRecognizing(true);
                    console.log("Recording Start!!!!!");
                    recognition.current.start();
                })
                .catch((err) => {
                    console.error('마이크 접근 권한이 필요합니다.');
                });
        }
    };

    const stopRecognition = () => {
        if (recognition.current) {
            recognition.current.stop();
            setIsRecognizing(false);
            // 재연결 타이머 취소
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        }
    };

    return {
        isRecognizing,
        finalTranscript,
        startRecognition,
        stopRecognition
    };
};

export default useSTT;