import { useEffect, useRef, useState } from 'react';

const useSTT = (onResult, onError) => {
    const recognition = useRef(null);
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [finalTranscript, setFinalTranscript] = useState('');

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
            if (event.error === 'no-speech' || event.error === 'aborted') {
                startRecognition(); // 재시도
            }
            if (onError) {
                onError(event);
            }
        };

        return () => {
            if (recognition.current) {
                recognition.current.stop();
                setIsRecognizing(false);
            }
        };
    }, [onResult, onError]);

    const startRecognition = () => {
        if (recognition.current && !isRecognizing) {
            setFinalTranscript('');
            setIsRecognizing(true);
            recognition.current.start();
        }
    };

    const stopRecognition = () => {
        recognition.current.stop();
        setIsRecognizing(false);
    };

    // const stopRecognition = () => {
    //     console.log(2);
    //     if (recognition.current && isRecognizing) {
    //         console.log(3);
    //         recognition.current.stop();
    //         setIsRecognizing(false);
    //     }
    // };

    return {
        isRecognizing,
        finalTranscript,
        startRecognition,
        stopRecognition
    };
};

export default useSTT;
