import { useState, useEffect } from 'react';
import { LocalCharacterState } from '../types';
import { useGameData } from '../contexts/GameDataContext';

export const useCharacterState = () => {
    const { 
        characterState, 
        addExperience, 
        updateMood, 
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
    
    // サーバーデータとの同期
    useEffect(() => {
        if (characterState) {
            setCharacter({
                name: "マナ",
                level: characterState.level,
                experience: characterState.experience,
                maxExp: characterState.level * 100,
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

    // キャラクター状態更新
    const updateCharacterState = async (expGain: number, newMood: string, currentTopic: string) => {
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
                mood: newMood as LocalCharacterState["mood"],
                totalProblems: prev.totalProblems + 1,
            };
        });
        
        // サーバーに経験値追加
        if (expGain > 0) {
            try {
                await addExperience(expGain, currentTopic);
            } catch (error) {
                console.error("Failed to add experience:", error);
            }
        }
        
        // サーバーに気分更新
        try {
            await updateMood(newMood);
        } catch (error) {
            console.error("Failed to update mood:", error);
        }
    };

    const progressPercentage = (character.experience / character.maxExp) * 100;

    return {
        character,
        updateCharacterState,
        progressPercentage,
    };
};