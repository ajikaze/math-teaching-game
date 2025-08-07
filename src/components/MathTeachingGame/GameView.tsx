import React, { useState, useEffect } from 'react';
import { LocalCharacterState } from '../../types';
import { useConversation } from '../../hooks/useConversation';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { useGameData } from '../../contexts/GameDataContext';
import TopicSelector from './TopicSelector';
import ConversationArea from './ConversationArea';
import InputArea from './InputArea';
import StatsDisplay from './StatsDisplay';

interface GameViewProps {
    character: LocalCharacterState;
    onUpdateCharacter: (expGain: number, mood: string, topic: string) => void;
}

const GameView: React.FC<GameViewProps> = ({
    character,
    onUpdateCharacter,
}) => {
    const { saveMessage } = useGameData();
    const [currentTopic, setCurrentTopic] = useState<string>("algebra");
    const [userExplanation, setUserExplanation] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const {
        setConversationHistory,
        currentQuestion,
        aiResponse,
        setAiResponse,
        isGeneratingQuestion,
        generateNewQuestion,
        callAPI,
    } = useConversation(currentTopic, character);

    const { isListening, startVoiceRecognition } = useVoiceRecognition(
        (transcript) => {
            setUserExplanation((prev) => prev + transcript);
        }
    );

    // ユーザーの説明を送信
    const submitExplanation = async () => {
        if (!userExplanation.trim()) return;

        setIsLoading(true);

        // ユーザーメッセージを履歴に追加
        const userMessage = {
            role: "ユーザー",
            content: userExplanation,
            timestamp: new Date().toISOString(),
        };

        setConversationHistory((prev) => [...prev, userMessage]);
        
        // サーバーにユーザーメッセージを保存
        try {
            await saveMessage("user", userExplanation, currentTopic);
        } catch (error) {
            console.error("Failed to save user message:", error);
        }

        try {
            const data = await callAPI("answer", userExplanation);

            setAiResponse(data.response);

            // AIの応答を履歴に追加
            const aiMessage = {
                role: "マナ",
                content: data.response,
                timestamp: data.timestamp,
            };

            setConversationHistory((prev) => [...prev, aiMessage]);
            
            // サーバーにAIメッセージを保存
            try {
                await saveMessage("assistant", data.response, currentTopic);
            } catch (error) {
                console.error("Failed to save AI message:", error);
            }

            // キャラクター状態を更新
            onUpdateCharacter(data.expGain || 0, data.mood || "curious", currentTopic);
        } catch (error) {
            setAiResponse(
                "すみません、今は調子が悪いみたいです... 後でもう一度試してもらえますか？😅"
            );
        } finally {
            setIsLoading(false);
            setUserExplanation("");
        }
    };

    // 分野変更時に新しい質問を生成
    useEffect(() => {
        if (currentTopic) {
            generateNewQuestion();
        }
    }, [currentTopic]);

    // 初回質問生成
    useEffect(() => {
        generateNewQuestion();
    }, []);

    return (
        <>
            <TopicSelector
                currentTopic={currentTopic}
                setCurrentTopic={setCurrentTopic}
                character={character}
            />

            <ConversationArea
                currentQuestion={currentQuestion}
                isGeneratingQuestion={isGeneratingQuestion}
                isLoading={isLoading}
                aiResponse={aiResponse}
                mood={character.mood}
                onGenerateNewQuestion={generateNewQuestion}
            />

            <InputArea
                userExplanation={userExplanation}
                setUserExplanation={setUserExplanation}
                isLoading={isLoading}
                isListening={isListening}
                onSubmitExplanation={submitExplanation}
                onStartVoiceRecognition={startVoiceRecognition}
                onGenerateNewQuestion={generateNewQuestion}
                isGeneratingQuestion={isGeneratingQuestion}
            />

            <StatsDisplay character={character} />
        </>
    );
};

export default GameView;