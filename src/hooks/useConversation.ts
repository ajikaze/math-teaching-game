import { useState, useEffect } from 'react';
import { LocalConversationMessage, ApiResponse, MOCK_RESPONSES, MOCK_QUESTIONS, MockQuestions } from '../types';
import { useGameData } from '../contexts/GameDataContext';
import { apiClient } from '../utils/api';

export const useConversation = (currentTopic: string, character: any) => {
    const { 
        conversationHistory: savedHistory, 
        saveMessage,
    } = useGameData();
    
    const [conversationHistory, setConversationHistory] = useState<LocalConversationMessage[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<string>("");
    const [aiResponse, setAiResponse] = useState<string>("");
    const [isGeneratingQuestion, setIsGeneratingQuestion] = useState<boolean>(false);

    // サーバー会話履歴との同期
    useEffect(() => {
        if (savedHistory && savedHistory.length > 0) {
            const localHistory = savedHistory.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp
            }));
            setConversationHistory(localHistory);
        }
    }, [savedHistory]);

    // API呼び出し関数
    const callAPI = async (
        requestType: "question" | "answer",
        message?: string
    ): Promise<ApiResponse> => {
        const requestData = {
            conversationHistory,
            characterState: character,
            currentTopic,
            requestType,
            ...(message && { message }),
        };

        try {
            const data = await apiClient.chat(requestData);
            return {
                response: data.response,
                expGain: data.expGain || 0,
                mood: data.mood || "curious",
                timestamp: data.timestamp || new Date().toISOString(),
            };
        } catch (error) {
            console.error("API呼び出しエラー:", error);
            // エラー時はモックデータを返す
            if (requestType === "question") {
                const questions = MOCK_QUESTIONS[currentTopic as keyof MockQuestions];
                const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

                return {
                    response: randomQuestion,
                    timestamp: new Date().toISOString(),
                };
            } else {
                const randomResponse = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
                const expGain = Math.floor(Math.random() * 20) + 5;
                const moods = ["happy", "excited", "curious"] as const;
                const randomMood = moods[Math.floor(Math.random() * moods.length)];

                return {
                    response: randomResponse,
                    expGain,
                    mood: randomMood,
                    timestamp: new Date().toISOString(),
                };
            }
        }
    };

    // 新しい質問を生成
    const generateNewQuestion = async () => {
        setIsGeneratingQuestion(true);
        setAiResponse("");

        try {
            const data = await callAPI("question");
            setCurrentQuestion(data.response);

            // 質問も会話履歴に追加
            const newMessage: LocalConversationMessage = {
                role: "マナ",
                content: data.response,
                timestamp: data.timestamp,
            };

            setConversationHistory((prev) => [...prev, newMessage]);
            
            // サーバーにメッセージを保存
            try {
                await saveMessage("assistant", data.response, currentTopic);
            } catch (error) {
                console.error("Failed to save message:", error);
            }
        } catch (error) {
            setCurrentQuestion("今日は何を勉強しようかな？🤔");
        } finally {
            setIsGeneratingQuestion(false);
        }
    };

    return {
        conversationHistory,
        setConversationHistory,
        currentQuestion,
        aiResponse,
        setAiResponse,
        isGeneratingQuestion,
        generateNewQuestion,
        callAPI,
    };
};