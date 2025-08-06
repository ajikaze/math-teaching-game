import React from 'react';
import MathTeachingGame from "./components/MathTeachingGame";
import AuthScreen from "./components/AuthScreen";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameDataProvider } from './contexts/GameDataContext';

const AppContent: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">読み込み中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="App">
            {isAuthenticated ? (
                <GameDataProvider>
                    <MathTeachingGame />
                </GameDataProvider>
            ) : (
                <AuthScreen />
            )}
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
