// src/components/MathTeachingGame.tsx
import React, { useState, useEffect } from "react";
import {
    Trophy,
    Brain,
    MessageCircle,
    Mic,
    MicOff,
    Sparkles,
    RefreshCw,
    LogOut,
    User,
} from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { useGameData } from '../contexts/GameDataContext';
import { apiClient } from '../utils/api';

// Local interfaces for component state
interface LocalCharacterState {
    name: string;
    level: number;
    experience: number;
    maxExp: number;
    understanding: {
        algebra: number;
        geometry: number;
        functions: number;
        probability: number;
    };
    mood: "curious" | "happy" | "confused" | "excited";
    totalProblems: number;
    personality: string;
}

interface LocalConversationMessage {
    role: string;
    content: string;
    timestamp: string;
}

const MathTeachingGame: React.FC = () => {
    const { user, logout } = useAuth();
    const { 
        characterState, 
        conversationHistory: savedHistory, 
        addExperience, 
        updateMood, 
        saveMessage,
        refreshAllData
    } = useGameData();
    
    const [character, setCharacter] = useState<LocalCharacterState>({
        name: "マナ",
        level: 1,
        experience: 0,
        maxExp: 100,
        understanding: {
            algebra: 0,
            geometry: 0,
            functions: 0,
            probability: 0,
        },
        mood: "curious",
        totalProblems: 0,
        personality: "curious_student",
    });
    
    // Sync with server data when available
    useEffect(() => {
        if (characterState) {
            setCharacter({
                name: "マナ",
                level: characterState.level,
                experience: characterState.experience,
                maxExp: characterState.level * 100, // Calculate maxExp based on level
                understanding: {
                    algebra: characterState.understandingAlgebra,
                    geometry: characterState.understandingGeometry,
                    functions: characterState.understandingFunctions,
                    probability: characterState.understandingProbability,
                },
                mood: characterState.mood as "curious" | "happy" | "confused" | "excited",
                totalProblems: characterState.totalProblems,
                personality: "curious_student",
            });
        }
    }, [characterState]);

    const [currentTopic, setCurrentTopic] = useState<string>("algebra");
    const [currentQuestion, setCurrentQuestion] = useState<string>("");
    const [userExplanation, setUserExplanation] = useState<string>("");
    const [aiResponse, setAiResponse] = useState<string>("");
    const [isListening, setIsListening] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [conversationHistory, setConversationHistory] = useState<
        LocalConversationMessage[]
    >([]);
    
    // Sync with server conversation history
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
    const [isGeneratingQuestion, setIsGeneratingQuestion] =
        useState<boolean>(false);

    const mathTopics = {
        algebra: {
            name: "代数",
            icon: "📐",
            color: "bg-blue-500",
            description: "方程式・不等式・因数分解など",
        },
        geometry: {
            name: "幾何",
            icon: "📏",
            color: "bg-green-500",
            description: "図形・角度・面積・体積など",
        },
        functions: {
            name: "関数",
            icon: "📊",
            color: "bg-purple-500",
            description: "グラフ・一次関数・二次関数など",
        },
        probability: {
            name: "確率",
            icon: "🎲",
            color: "bg-orange-500",
            description: "場合の数・順列・組合せなど",
        },
    };

    // モック用の質問データ
    const mockQuestions = {
        algebra: [
            "2x + 3 = 7 という方程式の解き方を教えて！",
            "x² - 5x + 6 = 0 を因数分解するにはどうしたらいいの？",
            "連立方程式って何？どうやって解くの？",
        ],
        geometry: [
            "三角形の面積の求め方を教えて！",
            "円の面積と円周の公式について説明して！",
            "ピタゴラスの定理って何？どう使うの？",
        ],
        functions: [
            "y = 2x + 1 のグラフってどんな形？",
            "一次関数と二次関数の違いを教えて！",
            "関数のグラフを読み取る方法は？",
        ],
        probability: [
            "サイコロを2回振る時の確率はどう計算するの？",
            "順列と組合せの違いって何？",
            "条件付き確率について教えて！",
        ],
    };

    // モック用の応答データ
    const mockResponses = [
        "なるほど！とても分かりやすい説明をありがとう！😊 そういう考え方もあるんだね。",
        "うーん、もう少し詳しく教えてもらえる？🤔 具体例があると嬉しいな！",
        "すごい！よく理解できたよ！✨ 次はもっと難しい問題にもチャレンジしてみたいな。",
        "ありがとう！でも、ここの部分がちょっと分からないかも...😅 もう一度説明してもらえる？",
        "わあ！そんな方法があるんだ！🤩 勉強になったよ、ありがとう！",
    ];

    // 実際のAPI呼び出し関数
    const callAPI = async (
        requestType: "question" | "answer",
        message?: string
    ) => {
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
                const questions =
                    mockQuestions[currentTopic as keyof typeof mockQuestions];
                const randomQuestion =
                    questions[Math.floor(Math.random() * questions.length)];

                return {
                    response: randomQuestion,
                    timestamp: new Date().toISOString(),
                };
            } else {
                const randomResponse =
                    mockResponses[
                        Math.floor(Math.random() * mockResponses.length)
                    ];
                const expGain = Math.floor(Math.random() * 20) + 5;
                const moods: LocalCharacterState["mood"][] = [
                    "happy",
                    "excited",
                    "curious",
                ];
                const randomMood =
                    moods[Math.floor(Math.random() * moods.length)];

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

            // 質問も会話履歴に追加（ローカルとサーバーの両方）
            const newMessage: LocalConversationMessage = {
                role: "マナ",
                content: data.response,
                timestamp: data.timestamp,
            };

            setConversationHistory((prev) => [...prev, newMessage]);
            setCharacter((prev) => ({ ...prev, mood: "curious" }));
            
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

    // ユーザーの説明を送信
    const submitExplanation = async () => {
        if (!userExplanation.trim()) return;

        setIsLoading(true);

        // ユーザーメッセージを履歴に追加（ローカルとサーバーの両方）
        const userMessage: LocalConversationMessage = {
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
            const aiMessage: LocalConversationMessage = {
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

            // キャラクター状態を更新（ローカルとサーバーの両方）
            updateCharacterState(data.expGain || 0, data.mood || "curious");
            
            // サーバーに経験値追加
            if (data.expGain && data.expGain > 0) {
                try {
                    await addExperience(data.expGain, currentTopic);
                } catch (error) {
                    console.error("Failed to add experience:", error);
                }
            }
            
            // サーバーに気分更新
            if (data.mood) {
                try {
                    await updateMood(data.mood);
                } catch (error) {
                    console.error("Failed to update mood:", error);
                }
            }
        } catch (error) {
            setAiResponse(
                "すみません、今は調子が悪いみたいです... 後でもう一度試してもらえますか？😅"
            );
        } finally {
            setIsLoading(false);
            setUserExplanation("");
        }
    };

    // キャラクター状態更新
    const updateCharacterState = (expGain: number, newMood: string) => {
        setCharacter((prev) => {
            const newExp = prev.experience + expGain;
            const newLevel = Math.floor(newExp / 100) + 1;
            const newUnderstanding = { ...prev.understanding };

            // 現在のトピックの理解度を上げる
            if (currentTopic in newUnderstanding) {
                newUnderstanding[
                    currentTopic as keyof typeof newUnderstanding
                ] = Math.min(
                    newUnderstanding[
                        currentTopic as keyof typeof newUnderstanding
                    ] + expGain,
                    100
                );
            }

            return {
                ...prev,
                experience: newExp % 100,
                level: newLevel,
                understanding: newUnderstanding,
                mood: newMood as CharacterState["mood"],
                totalProblems: prev.totalProblems + 1,
            };
        });
    };

    // 表情を取得
    const getCharacterExpression = (): string => {
        const expressions = {
            curious: "🤔",
            happy: "😊",
            confused: "😵‍💫",
            excited: "🤩",
        };
        return expressions[character.mood] || "🤔";
    };

    // 音声認識
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
                setUserExplanation((prev) => prev + transcript);
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

    const progressPercentage = (character.experience / character.maxExp) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
            <div className="max-w-md mx-auto space-y-4">
                {/* ヘッダー */}
                <div className="math-card">
                    {/* User Info and Logout */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                                {user?.username || 'ユーザー'}
                            </span>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                            title="ログアウト"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>ログアウト</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">
                                マナと学ぶ数学
                            </h1>
                            <p className="text-sm text-gray-600">
                                Lv.{character.level} • 解答数:{" "}
                                {character.totalProblems}
                            </p>
                        </div>
                        <div className="character-expression">
                            {getCharacterExpression()}
                        </div>
                    </div>

                    {/* 経験値バー */}
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>経験値</span>
                            <span>{character.experience}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* 分野選択 */}
                <div className="math-card">
                    <h2 className="font-semibold text-gray-800 mb-3">
                        学習分野
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(mathTopics).map(([key, topic]) => (
                            <button
                                key={key}
                                onClick={() => setCurrentTopic(key)}
                                className={`p-4 rounded-xl flex flex-col items-center space-y-2 transition-all duration-200 ${
                                    currentTopic === key
                                        ? `${topic.color} text-white shadow-lg scale-105`
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102"
                                }`}
                            >
                                <span className="text-2xl">{topic.icon}</span>
                                <div className="text-center">
                                    <div className="font-medium">
                                        {topic.name}
                                    </div>
                                    <div className="text-xs opacity-75">
                                        {topic.description}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* 理解度表示 */}
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                            マナの理解度
                        </h3>
                        <div className="space-y-2">
                            {Object.entries(character.understanding).map(
                                ([key, value]) => (
                                    <div
                                        key={key}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="text-sm text-gray-600">
                                            {
                                                mathTopics[
                                                    key as keyof typeof mathTopics
                                                ]?.name
                                            }
                                        </span>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-20 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${value}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-600 w-10 text-right">
                                                {value}%
                                            </span>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* 対話エリア */}
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
                                            onClick={generateNewQuestion}
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

                {/* 入力エリア */}
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
                                onChange={(e) =>
                                    setUserExplanation(e.target.value)
                                }
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
                                onClick={submitExplanation}
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
                                onClick={startVoiceRecognition}
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
                                onClick={generateNewQuestion}
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
                                            •
                                            段階的に説明するとマナが理解しやすい
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

                {/* 学習統計 */}
                <div className="math-card">
                    <h3 className="font-semibold text-gray-800 mb-3">
                        学習統計
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                                {character.level}
                            </div>
                            <div className="text-xs text-blue-600">レベル</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                                {character.totalProblems}
                            </div>
                            <div className="text-xs text-green-600">解答数</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                                {Math.round(
                                    Object.values(
                                        character.understanding
                                    ).reduce((a, b) => a + b, 0) / 4
                                )}
                                %
                            </div>
                            <div className="text-xs text-purple-600">
                                平均理解度
                            </div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">
                                {conversationHistory.length}
                            </div>
                            <div className="text-xs text-orange-600">
                                会話数
                            </div>
                        </div>
                    </div>
                </div>

                {/* デモモード通知 */}
                <div className="math-card bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                    <div className="flex items-center space-x-2 text-green-800">
                        <Sparkles size={20} />
                        <div>
                            <p className="font-medium">AIモード稼働中</p>
                            <p className="text-sm">
                                実際のAI機能でマナと対話できます！詳しく教えるほどマナが成長します。
                            </p>
                        </div>
                    </div>
                </div>

                {/* フッター */}
                <div className="text-center text-xs text-gray-500 py-4">
                    <p>マナと一緒に数学を楽しく学ぼう！ 🎓✨</p>
                    <p className="mt-1">powered by Gemini AI (デモ版)</p>
                </div>
            </div>
        </div>
    );
};

export default MathTeachingGame;
