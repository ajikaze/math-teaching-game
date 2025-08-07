import React from 'react';
import { Sparkles } from 'lucide-react';
import { LocalCharacterState } from '../../types';

interface StatsDisplayProps {
    character: LocalCharacterState;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ character }) => {
    return (
        <>
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
                </div>
            </div>

            {/* AIモード表示 */}
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
        </>
    );
};

export default StatsDisplay;