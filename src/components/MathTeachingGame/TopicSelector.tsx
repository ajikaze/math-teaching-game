import React from 'react';
import { LocalCharacterState, MATH_TOPICS } from '../../types';

interface TopicSelectorProps {
    currentTopic: string;
    setCurrentTopic: (topic: string) => void;
    character: LocalCharacterState;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
    currentTopic,
    setCurrentTopic,
    character,
}) => {
    return (
        <div className="math-card">
            <h2 className="font-semibold text-gray-800 mb-3">
                学習分野
            </h2>
            <div className="grid grid-cols-2 gap-3">
                {Object.entries(MATH_TOPICS).map(([key, topic]) => (
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
                                    {MATH_TOPICS[key as keyof typeof MATH_TOPICS]?.name}
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
    );
};

export default TopicSelector;