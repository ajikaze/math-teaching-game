import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient, CharacterState, ConversationMessage } from '../utils/api';
import { useAuth } from './AuthContext';

interface GameDataContextType {
  characterState: CharacterState | null;
  conversationHistory: ConversationMessage[];
  isLoading: boolean;
  
  // Character state management
  updateCharacterState: (updates: Partial<CharacterState>) => Promise<void>;
  addExperience: (experience: number, topic?: string) => Promise<void>;
  updateMood: (mood: string) => Promise<void>;
  
  // Conversation management
  saveMessage: (role: string, content: string, topic?: string) => Promise<void>;
  refreshConversationHistory: () => Promise<void>;
  
  // Data refresh
  refreshAllData: () => Promise<void>;
}

const GameDataContext = createContext<GameDataContextType | undefined>(undefined);

export const useGameData = () => {
  const context = useContext(GameDataContext);
  if (context === undefined) {
    throw new Error('useGameData must be used within a GameDataProvider');
  }
  return context;
};

interface GameDataProviderProps {
  children: React.ReactNode;
}

export const GameDataProvider: React.FC<GameDataProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [characterState, setCharacterState] = useState<CharacterState | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshAllData();
    } else {
      // Clear data when user is not authenticated
      setCharacterState(null);
      setConversationHistory([]);
    }
  }, [isAuthenticated, user]);

  const refreshAllData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const [character, conversations] = await Promise.all([
        apiClient.getCharacterState(),
        apiClient.getConversationHistory(50) // Get last 50 conversations
      ]);
      
      setCharacterState(character);
      setConversationHistory(conversations);
    } catch (error) {
      console.error('Failed to load game data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const updateCharacterState = async (updates: Partial<CharacterState>) => {
    try {
      const updatedState = await apiClient.updateCharacterState(updates);
      setCharacterState(updatedState);
    } catch (error) {
      console.error('Failed to update character state:', error);
      throw error;
    }
  };

  const addExperience = async (experience: number, topic?: string) => {
    try {
      const updatedState = await apiClient.addExperience(experience, topic);
      setCharacterState(updatedState);
    } catch (error) {
      console.error('Failed to add experience:', error);
      throw error;
    }
  };

  const updateMood = async (mood: string) => {
    try {
      const updatedState = await apiClient.updateMood(mood);
      setCharacterState(updatedState);
    } catch (error) {
      console.error('Failed to update mood:', error);
      throw error;
    }
  };

  const saveMessage = async (role: string, content: string, topic?: string) => {
    try {
      const savedMessage = await apiClient.saveMessage(role, content, topic);
      setConversationHistory(prev => [...prev, savedMessage]);
    } catch (error) {
      console.error('Failed to save message:', error);
      throw error;
    }
  };

  const refreshConversationHistory = async () => {
    if (!isAuthenticated) return;
    
    try {
      const conversations = await apiClient.getConversationHistory(50);
      setConversationHistory(conversations);
    } catch (error) {
      console.error('Failed to refresh conversation history:', error);
      throw error;
    }
  };

  const value = {
    characterState,
    conversationHistory,
    isLoading,
    updateCharacterState,
    addExperience,
    updateMood,
    saveMessage,
    refreshConversationHistory,
    refreshAllData
  };

  return (
    <GameDataContext.Provider value={value}>
      {children}
    </GameDataContext.Provider>
  );
};