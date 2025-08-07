import React, { useState, useEffect } from 'react';
import { 
    BarChart3, 
    TrendingUp, 
    Target,
    Award,
    Clock,
    BookOpen,
    Brain
} from 'lucide-react';
import { apiClient } from '../utils/api';

interface DailyStats {
    date: string;
    studyTime: number;
    problemsSolved: number;
    correctAnswers: number;
    averageScore: number;
    topicsStudied: string[];
}

interface LearningSession {
    id: string;
    startTime: string;
    endTime: string;
    duration: number;
    topic: string;
    problemsSolved: number;
    correctAnswers: number;
    totalScore: number;
}

interface Achievement {
    id: string;
    type: string;
    category: string;
    title: string;
    description: string;
    pointsAwarded: number;
    unlockedAt: string;
}

interface AnalyticsData {
    dailyStats: DailyStats[];
    recentSessions: LearningSession[];
    achievements: Achievement[];
    totalStudyTime: number;
    totalProblems: number;
    overallAccuracy: number;
}

const LearningAnalytics: React.FC = () => {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

    useEffect(() => {
        fetchAnalyticsData();
    }, [selectedPeriod]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const [dailyStatsRes, sessionsRes, achievementsRes] = await Promise.all([
                apiClient.get(`/analytics/daily-stats?period=${selectedPeriod}`),
                apiClient.get('/analytics/sessions'),
                apiClient.get('/analytics/achievements')
            ]);

            const dailyStats = dailyStatsRes.data;
            const sessions = sessionsRes.data;
            const achievements = achievementsRes.data;

            // Calculate totals
            const totalStudyTime = dailyStats.reduce((sum: number, stat: DailyStats) => sum + stat.studyTime, 0);
            const totalProblems = dailyStats.reduce((sum: number, stat: DailyStats) => sum + stat.problemsSolved, 0);
            const totalCorrect = dailyStats.reduce((sum: number, stat: DailyStats) => sum + stat.correctAnswers, 0);
            const overallAccuracy = totalProblems > 0 ? (totalCorrect / totalProblems) * 100 : 0;

            setAnalyticsData({
                dailyStats,
                recentSessions: sessions,
                achievements,
                totalStudyTime,
                totalProblems,
                overallAccuracy
            });
        } catch (error) {
            console.error('Failed to fetch analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (minutes: number): string => {
        if (minutes < 60) return `${minutes}分`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}時間${mins}分`;
    };

    const getTopicColor = (topic: string): string => {
        const colors: { [key: string]: string } = {
            'algebra': 'bg-blue-500',
            'geometry': 'bg-green-500',
            'functions': 'bg-purple-500',
            'probability': 'bg-yellow-500',
            'general': 'bg-gray-500'
        };
        return colors[topic] || colors['general'];
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">学習データを読み込み中...</span>
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className="text-center p-8 text-gray-600">
                学習データを取得できませんでした。
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <BarChart3 className="mr-2 text-blue-500" />
                    学習分析ダッシュボード
                </h2>
                <div className="flex space-x-2">
                    {(['week', 'month', 'year'] as const).map((period) => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedPeriod === period
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {period === 'week' ? '1週間' : period === 'month' ? '1ヶ月' : '1年間'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">総学習時間</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {formatTime(analyticsData.totalStudyTime)}
                            </p>
                        </div>
                        <Clock className="text-blue-500 w-8 h-8" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">解いた問題数</p>
                            <p className="text-2xl font-bold text-green-600">
                                {analyticsData.totalProblems}
                            </p>
                        </div>
                        <BookOpen className="text-green-500 w-8 h-8" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">正答率</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {analyticsData.overallAccuracy.toFixed(1)}%
                            </p>
                        </div>
                        <Target className="text-purple-500 w-8 h-8" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">獲得実績</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {analyticsData.achievements.length}
                            </p>
                        </div>
                        <Award className="text-yellow-500 w-8 h-8" />
                    </div>
                </div>
            </div>

            {/* Daily Progress Chart */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <TrendingUp className="mr-2 text-blue-500" />
                    日別学習進捗
                </h3>
                <div className="space-y-4">
                    {analyticsData.dailyStats.slice(-7).map((stat, index) => {
                        const date = new Date(stat.date);
                        const maxProblems = Math.max(...analyticsData.dailyStats.map(s => s.problemsSolved));
                        const progressWidth = maxProblems > 0 ? (stat.problemsSolved / maxProblems) * 100 : 0;

                        return (
                            <div key={index} className="flex items-center space-x-4">
                                <div className="w-20 text-sm text-gray-600">
                                    {date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>問題数: {stat.problemsSolved}</span>
                                        <span>正答率: {stat.problemsSolved > 0 ? ((stat.correctAnswers / stat.problemsSolved) * 100).toFixed(1) : 0}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progressWidth}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="w-16 text-sm text-gray-600 text-right">
                                    {formatTime(stat.studyTime)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Brain className="mr-2 text-green-500" />
                    最近の学習セッション
                </h3>
                <div className="space-y-3">
                    {analyticsData.recentSessions.slice(0, 5).map((session) => {
                        const startTime = new Date(session.startTime);
                        const accuracy = session.problemsSolved > 0 ? (session.correctAnswers / session.problemsSolved) * 100 : 0;

                        return (
                            <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${getTopicColor(session.topic)}`}></div>
                                    <div>
                                        <p className="font-medium text-gray-800">{session.topic}</p>
                                        <p className="text-sm text-gray-600">
                                            {startTime.toLocaleDateString('ja-JP')} {startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-gray-800">{formatTime(session.duration)}</p>
                                    <p className="text-sm text-gray-600">
                                        {session.problemsSolved}問 / {accuracy.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Award className="mr-2 text-yellow-500" />
                    獲得した実績
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analyticsData.achievements.map((achievement) => {
                        const unlockedDate = new Date(achievement.unlockedAt);
                        
                        return (
                            <div key={achievement.id} className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                                <div className="flex items-start space-x-3">
                                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                                        <Award className="w-6 h-6 text-yellow-800" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-800">{achievement.title}</h4>
                                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                                        <div className="flex justify-between items-center text-xs text-gray-500">
                                            <span>{achievement.category}</span>
                                            <span>{unlockedDate.toLocaleDateString('ja-JP')}</span>
                                        </div>
                                        {achievement.pointsAwarded > 0 && (
                                            <div className="mt-2 inline-flex items-center px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">
                                                +{achievement.pointsAwarded} ポイント
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {analyticsData.achievements.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        まだ実績を獲得していません。学習を続けて実績を解除しましょう！
                    </div>
                )}
            </div>
        </div>
    );
};

export default LearningAnalytics;