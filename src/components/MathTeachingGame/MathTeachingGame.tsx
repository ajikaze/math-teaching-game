// src/components/MathTeachingGame/MathTeachingGame.tsx
import React, { useState } from "react";
import { useCharacterState } from '../../hooks/useCharacterState';
import HeaderNavigation from './HeaderNavigation';
import CharacterDisplay from './CharacterDisplay';
import GameView from './GameView';
import LearningAnalytics from '../LearningAnalytics';
import BadgeSystem from '../BadgeSystem';
import VisualLearning from '../VisualLearning';

const MathTeachingGame: React.FC = () => {
    const [currentView, setCurrentView] = useState<'game' | 'analytics' | 'badges' | 'visual'>('game');
    const { character, updateCharacterState, progressPercentage } = useCharacterState();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
            <div className={`${currentView !== 'game' ? 'max-w-6xl' : 'max-w-md'} mx-auto space-y-4 transition-all duration-300`}>
                {/* ヘッダー */}
                <div className="math-card">
                    <HeaderNavigation
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                    />
                    
                    <CharacterDisplay
                        character={character}
                        progressPercentage={progressPercentage}
                    />
                </div>

                {/* 条件付きコンテンツ表示 */}
                {currentView === 'analytics' ? (
                    <LearningAnalytics />
                ) : currentView === 'badges' ? (
                    <BadgeSystem />
                ) : currentView === 'visual' ? (
                    <VisualLearning />
                ) : (
                    <GameView
                        character={character}
                        onUpdateCharacter={updateCharacterState}
                    />
                )}
            </div>
        </div>
    );
};

export default MathTeachingGame;