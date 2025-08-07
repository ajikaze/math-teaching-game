import { useState } from 'react';

export const useVoiceRecognition = (onResult: (transcript: string) => void) => {
    const [isListening, setIsListening] = useState<boolean>(false);

    const startVoiceRecognition = () => {
        if ("webkitSpeechRecognition" in window) {
            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.lang = "ja-JP";
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                onResult(transcript);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = () => {
                setIsListening(false);
            };

            recognition.start();
        } else {
            alert("音声認識がサポートされていません");
        }
    };

    return {
        isListening,
        startVoiceRecognition,
    };
};