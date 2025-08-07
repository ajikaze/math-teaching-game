// 会話関連の型定義

export interface LocalConversationMessage {
    role: string;
    content: string;
    timestamp: string;
}

export interface ApiResponse {
    response: string;
    expGain?: number;
    mood?: string;
    timestamp: string;
}

export interface ChatRequest {
    conversationHistory: LocalConversationMessage[];
    characterState: any;
    currentTopic: string;
    requestType: "question" | "answer";
    message?: string;
}

export interface MockResponses {
    [key: string]: string[];
}

export interface MockQuestions {
    algebra: string[];
    geometry: string[];
    functions: string[];
    probability: string[];
}

export const MOCK_RESPONSES: string[] = [
    "なるほど！とても分かりやすい説明をありがとう！😊 そういう考え方もあるんだね。",
    "うーん、もう少し詳しく教えてもらえる？🤔 具体例があると嬉しいな！",
    "すごい！よく理解できたよ！✨ 次はもっと難しい問題にもチャレンジしてみたいな。",
    "ありがとう！でも、ここの部分がちょっと分からないかも...😅 もう一度説明してもらえる？",
    "わあ！そんな方法があるんだ！🤩 勉強になったよ、ありがとう！",
];

export const MOCK_QUESTIONS: MockQuestions = {
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