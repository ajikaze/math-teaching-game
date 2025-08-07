import React from 'react';
import {
    Trophy,
    Brain,
    BarChart3,
    Eye,
    LogOut,
    User,
} from "lucide-react";
import { useAuth } from '../../contexts/AuthContext';

interface HeaderNavigationProps {
    currentView: 'game' | 'analytics' | 'badges' | 'visual';
    setCurrentView: (view: 'game' | 'analytics' | 'badges' | 'visual') => void;
}

const HeaderNavigation: React.FC<HeaderNavigationProps> = ({
    currentView,
    setCurrentView,
}) => {
    const { user, logout } = useAuth();

    return (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                    {user?.username || 'ユーザー'}
                </span>
            </div>
            <div className="flex items-center space-x-3">
                <button
                    onClick={() => setCurrentView('analytics')}
                    className={`flex items-center space-x-1 text-sm transition-colors ${
                        currentView === 'analytics' 
                            ? 'text-blue-700 font-medium' 
                            : 'text-blue-600 hover:text-blue-700'
                    }`}
                    title="学習分析を見る"
                >
                    <BarChart3 className="w-4 h-4" />
                    <span>分析</span>
                </button>
                <button
                    onClick={() => setCurrentView('badges')}
                    className={`flex items-center space-x-1 text-sm transition-colors ${
                        currentView === 'badges' 
                            ? 'text-yellow-700 font-medium' 
                            : 'text-yellow-600 hover:text-yellow-700'
                    }`}
                    title="バッジを見る"
                >
                    <Trophy className="w-4 h-4" />
                    <span>バッジ</span>
                </button>
                <button
                    onClick={() => setCurrentView('visual')}
                    className={`flex items-center space-x-1 text-sm transition-colors ${
                        currentView === 'visual' 
                            ? 'text-purple-700 font-medium' 
                            : 'text-purple-600 hover:text-purple-700'
                    }`}
                    title="ビジュアル学習"
                >
                    <Eye className="w-4 h-4" />
                    <span>ビジュアル</span>
                </button>
                {currentView !== 'game' && (
                    <button
                        onClick={() => setCurrentView('game')}
                        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-700 transition-colors"
                        title="ゲームに戻る"
                    >
                        <Brain className="w-4 h-4" />
                        <span>ゲーム</span>
                    </button>
                )}
                <button
                    onClick={logout}
                    className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                    title="ログアウト"
                >
                    <LogOut className="w-4 h-4" />
                    <span>ログアウト</span>
                </button>
            </div>
        </div>
    );
};

export default HeaderNavigation;