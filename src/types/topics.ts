// 学習分野関連の型定義

export interface MathTopic {
    name: string;
    icon: string;
    color: string;
    description: string;
}

export interface MathTopics {
    algebra: MathTopic;
    geometry: MathTopic;
    functions: MathTopic;
    probability: MathTopic;
}

export const MATH_TOPICS: MathTopics = {
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