// backend/src/services/mathQuestionService.ts
import { CharacterState, ConversationMessage } from "../types";
import { logger } from "../utils/logger";

interface QuestionGenerationParams {
    topic: string;
    characterLevel: number;
    understanding: CharacterState["understanding"];
    conversationHistory: ConversationMessage[];
}

export class MathQuestionService {
    private questionTemplates = {
        algebra: {
            beginner: [
                "2x + 3 = 7 という方程式があるね。これってどうやって解けばいいのかな？🤔",
                "x + 5 = 12 の解き方を教えて！左辺と右辺って何だろう？",
                "文字式って何？なんで数字じゃなくて文字を使うの？",
                "等式の性質について教えて！両辺に同じ数を足しても大丈夫？",
            ],
            intermediate: [
                "x² - 5x + 6 = 0 を因数分解で解く方法を教えて！",
                "連立方程式 { x + y = 5, 2x - y = 1 } はどう解くの？",
                "二次方程式の解の公式って何？どんな時に使うの？",
                "不等式 2x + 3 > 7 の解き方は普通の方程式と違うの？",
            ],
            advanced: [
                "判別式を使って二次方程式の解の個数を調べる方法は？",
                "複素数を含む二次方程式はどう解けばいいの？",
                "三次方程式の因数分解にはどんなコツがあるの？",
                "恒等式と方程式の違いって何？",
            ],
        },
        geometry: {
            beginner: [
                "三角形の面積を求める公式を教えて！底辺×高さ÷2だっけ？",
                "円の面積と円周の求め方は？πって何の数字なの？",
                "四角形にはどんな種類があるの？正方形と長方形の違いは？",
                "角度って何？直角は何度？",
            ],
            intermediate: [
                "ピタゴラスの定理について教えて！どんな三角形で使えるの？",
                "相似な図形の性質は？面積比と辺の比の関係は？",
                "円周角と中心角の関係を教えて！",
                "三角形の合同条件ってどんなものがあるの？",
            ],
            advanced: [
                "三角比（sin, cos, tan）って何？どう使うの？",
                "球の体積と表面積の求め方は？",
                "ベクトルって何？図形の問題でどう使うの？",
                "座標平面上での直線の方程式はどう求めるの？",
            ],
        },
        functions: {
            beginner: [
                "関数って何？y = 2x + 1 のグラフはどんな形？",
                "一次関数の傾きって何を表してるの？",
                "座標って何？(3, 5)の意味を教えて！",
                "グラフの読み取り方を教えて！",
            ],
            intermediate: [
                "二次関数 y = x² のグラフはなんで放物線になるの？",
                "関数の最大値・最小値ってどう求めるの？",
                "一次関数と二次関数の違いは？",
                "変化の割合って何？どう計算するの？",
            ],
            advanced: [
                "二次関数の頂点の座標はどう求めるの？",
                "関数の合成って何？f(g(x))はどう計算するの？",
                "逆関数って何？どんな時に存在するの？",
                "指数関数と対数関数の関係を教えて！",
            ],
        },
        probability: {
            beginner: [
                "サイコロを1回振る時、偶数が出る確率は？",
                "確率って何？どうやって計算するの？",
                "全事象って何？標本空間とは違うの？",
                "コインを投げる実験で確率を考えてみよう！",
            ],
            intermediate: [
                "サイコロを2回振る時、和が7になる確率は？",
                "順列と組合せの違いを教えて！",
                "重複を許す場合の数え方は？",
                "条件付き確率って何？どう計算するの？",
            ],
            advanced: [
                "ベイズの定理について教えて！",
                "期待値って何？どうやって計算するの？",
                "正規分布って何？標準偏差との関係は？",
                "独立な事象と排反な事象の違いは？",
            ],
        },
    };

    public async generateQuestion(
        params: QuestionGenerationParams
    ): Promise<string> {
        try {
            const { topic, understanding } = params;

            // 理解度に基づいて難易度を決定
            const currentUnderstanding =
                understanding[topic as keyof typeof understanding] || 0;
            let difficulty: "beginner" | "intermediate" | "advanced";

            if (currentUnderstanding < 30) {
                difficulty = "beginner";
            } else if (currentUnderstanding < 70) {
                difficulty = "intermediate";
            } else {
                difficulty = "advanced";
            }

            // 質問テンプレートから選択
            const templates =
                this.questionTemplates[
                    topic as keyof typeof this.questionTemplates
                ];
            if (!templates) {
                throw new Error(`Unknown topic: ${topic}`);
            }

            const questions = templates[difficulty];
            const randomIndex = Math.floor(Math.random() * questions.length);
            const selectedQuestion = questions[randomIndex];

            // 会話履歴を考慮して質問を調整
            const adjustedQuestion = this.adjustQuestionBasedOnHistory(
                selectedQuestion,
                params.conversationHistory
            );

            logger.info(`Generated ${difficulty} question for ${topic}`);
            return adjustedQuestion;
        } catch (error) {
            logger.error("Question generation failed:", error);
            return "ねえ、今日は何を勉強したい気分？😊 どの分野に興味があるか教えて！";
        }
    }

    private adjustQuestionBasedOnHistory(
        question: string,
        history: ConversationMessage[]
    ): string {
        // 最近の会話を確認して重複を避ける
        const recentQuestions = history
            .filter((msg) => msg.role === "マナ")
            .slice(-3)
            .map((msg) => msg.content);

        // 同じような質問が最近あった場合は少し変える
        if (recentQuestions.some((q) => this.isSimilarQuestion(question, q))) {
            return this.addVariation(question);
        }

        return question;
    }

    private isSimilarQuestion(q1: string, q2: string): boolean {
        // 簡単な類似度チェック（キーワードベース）
        const keywords1 = q1.match(/[ぁ-んァ-ヶー一-龠]+/g) || [];
        const keywords2 = q2.match(/[ぁ-んァ-ヶー一-龠]+/g) || [];

        const commonWords = keywords1.filter(
            (word) => (keywords2 as string[]).includes(word) && word.length > 1
        );

        return commonWords.length > 2;
    }

    private addVariation(question: string): string {
        const variations = [
            "別の角度から考えてみよう！",
            "こんどはこの問題はどうかな？",
            "少し違った問題も見てみよう！",
            "今度はこれについて教えて！",
        ];

        const variation =
            variations[Math.floor(Math.random() * variations.length)];
        return `${variation} ${question}`;
    }
}
