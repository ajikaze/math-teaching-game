import React from 'react';
import {
    MessageCircle,
    Mic,
    MicOff,
    Sparkles,
    Brain,
    Trophy,
} from 'lucide-react';

interface InputAreaProps {
    userExplanation: string;
    setUserExplanation: (value: string) => void;
    isLoading: boolean;
    isListening: boolean;
    onSubmitExplanation: () => void;
    onStartVoiceRecognition: () => void;
    onGenerateNewQuestion: () => void;
    isGeneratingQuestion: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({
    userExplanation,
    setUserExplanation,
    isLoading,
    isListening,
    onSubmitExplanation,
    onStartVoiceRecognition,
    onGenerateNewQuestion,
    isGeneratingQuestion,
}) => {
    return (
        <div className="math-card">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">
                    マナに教えてあげよう！
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Brain size={16} />
                    <span>AIモード</span>
                </div>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <textarea
                        value={userExplanation}
                        onChange={(e) => setUserExplanation(e.target.value)}
                        placeholder="ここに説明を入力してね... 詳しく教えるほどマナが成長するよ！"
                        className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        rows={4}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        {userExplanation.length}/500
                    </div>
                </div>

                <div className="flex space-x-2">
                    <button
                        onClick={onSubmitExplanation}
                        disabled={!userExplanation.trim() || isLoading}
                        className="flex-1 math-button flex items-center justify-center space-x-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                <span>送信中...</span>
                            </>
                        ) : (
                            <>
                                <MessageCircle size={18} />
                                <span>教える！</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={onStartVoiceRecognition}
                        disabled={isListening}
                        className={`p-3 rounded-xl transition-all duration-200 ${
                            isListening
                                ? "bg-red-500 text-white animate-pulse"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        title="音声入力"
                    >
                        {isListening ? (
                            <MicOff size={20} />
                        ) : (
                            <Mic size={20} />
                        )}
                    </button>

                    <button
                        onClick={onGenerateNewQuestion}
                        disabled={isGeneratingQuestion}
                        className="p-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-all duration-200"
                        title="新しい質問を生成"
                    >
                        <Sparkles
                            size={20}
                            className={
                                isGeneratingQuestion
                                    ? "animate-spin"
                                    : ""
                            }
                        />
                    </button>
                </div>

                {isListening && (
                    <div className="text-center">
                        <div className="inline-flex items-center space-x-2 text-red-500 bg-red-50 px-4 py-2 rounded-full">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium">
                                音声を聞いています...
                            </span>
                        </div>
                    </div>
                )}

                {/* 学習のヒント */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start space-x-2">
                        <Trophy
                            size={16}
                            className="text-yellow-600 mt-0.5"
                        />
                        <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-1">
                                学習のコツ 💡
                            </p>
                            <ul className="space-y-1 text-xs">
                                <li>
                                    • 具体例を使って説明すると効果的
                                </li>
                                <li>
                                    • 段階的に説明するとマナが理解しやすい
                                </li>
                                <li>
                                    • 図や数式を言葉で表現してみよう
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InputArea;