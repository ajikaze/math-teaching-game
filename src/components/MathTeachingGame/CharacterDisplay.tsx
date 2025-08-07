import React from 'react';
import { LocalCharacterState, CHARACTER_EXPRESSIONS } from '../../types';

interface CharacterDisplayProps {
    character: LocalCharacterState;
    progressPercentage: number;
}

const CharacterDisplay: React.FC<CharacterDisplayProps> = ({
    character,
    progressPercentage,
}) => {
    const getCharacterExpression = (): string => {
        return CHARACTER_EXPRESSIONS[character.mood] || "🤔";
    };

    return (
        <>
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
        </>
    );
};

export default CharacterDisplay;