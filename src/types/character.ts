// キャラクター関連の型定義

export interface LocalCharacterState {
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

export interface CharacterExpressions {
    curious: string;
    happy: string;
    confused: string;
    excited: string;
}

export const CHARACTER_EXPRESSIONS: CharacterExpressions = {
    curious: "🤔",
    happy: "😊",
    confused: "😵‍💫",
    excited: "🤩",
};