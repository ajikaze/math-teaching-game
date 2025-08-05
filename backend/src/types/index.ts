// backend/src/types/index.ts

export interface CharacterState {
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

export interface ConversationMessage {
    role: string;
    content: string;
    timestamp: string;
}

export interface ChatRequestBody {
    message?: string;
    conversationHistory: ConversationMessage[];
    characterState: CharacterState;
    currentTopic: string;
    requestType: "question" | "answer";
}

export interface ChatResponse {
    response: string;
    timestamp: string;
    expGain?: number;
    mood?: CharacterState["mood"];
    metadata?: {
        topic: string;
        difficulty?: string;
        understanding?: number;
        type: "question" | "evaluation";
    };
}

export interface APIError {
    error: string;
    message?: string;
    code?: string;
}
