import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { CHARACTER_EXPRESSIONS } from '../../types';

interface ConversationAreaProps {
    currentQuestion: string;
    isGeneratingQuestion: boolean;
    isLoading: boolean;
    aiResponse: string;
    mood: "curious" | "happy" | "confused" | "excited";
    onGenerateNewQuestion: () => void;
}

const ConversationArea: React.FC<ConversationAreaProps> = ({
    currentQuestion,
    isGeneratingQuestion,
    isLoading,
    aiResponse,
    mood,
    onGenerateNewQuestion,
}) => {
    const getCharacterExpression = (): string => {
        return CHARACTER_EXPRESSIONS[mood] || "🤔";
    };

    return (
        <div className="math-card">
            <div className="flex items-start space-x-3">
                <div className="text-3xl">
                    {getCharacterExpression()}
                </div>
                <div className="flex-1 space-y-3">
                    {/* マナの質問 */}
                    {(currentQuestion || isGeneratingQuestion) && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-l-4 border-blue-500">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-blue-800 font-medium">
                                    マナ
                                </p>
                                <button
                                    onClick={onGenerateNewQuestion}
                                    disabled={isGeneratingQuestion}
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                    title="新しい質問を生成"
                                >
                                    <RefreshCw
                                        size={16}
                                        className={
                                            isGeneratingQuestion
                                                ? "animate-spin"
                                                : ""
                                        }
                                    />
                                </button>
                            </div>
                            {isGeneratingQuestion ? (
                                <div className="flex items-center space-x-2 text-blue-600">
                                    <Sparkles
                                        size={16}
                                        className="animate-pulse"
                                    />
                                    <span>質問を考えています...</span>
                                </div>
                            ) : (
                                <p className="text-blue-800">
                                    {currentQuestion}
                                </p>
                            )}
                        </div>
                    )}

                    {/* AIの応答 */}
                    {isLoading && (
                        <div className="bg-gray-100 rounded-xl p-4">
                            <div className="flex items-center space-x-2 text-gray-600">
                                <div className="animate-bounce">🤔</div>
                                <span>マナが考えています...</span>
                            </div>
                        </div>
                    )}

                    {aiResponse && !isLoading && (
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border-l-4 border-green-500">
                            <p className="text-green-800 font-medium mb-2">
                                マナ
                            </p>
                            <p className="text-green-800">
                                {aiResponse}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConversationArea;