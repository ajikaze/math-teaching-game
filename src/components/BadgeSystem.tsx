import React, { useState, useEffect } from 'react';
import { 
    Award, 
    Trophy, 
    Star, 
    Target, 
    Flame, 
    BookOpen, 
    Brain,
    Zap,
    Crown,
    Medal
} from 'lucide-react';

interface Badge {
    id: string;
    title: string;
    description: string;
    category: 'algebra' | 'geometry' | 'functions' | 'probability' | 'general' | 'streak' | 'mastery';
    type: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    iconType: 'award' | 'trophy' | 'star' | 'target' | 'flame' | 'book' | 'brain' | 'zap' | 'crown' | 'medal';
    requirement: string;
    progress: number;
    maxProgress: number;
    isUnlocked: boolean;
    unlockedAt?: string;
    pointsAwarded: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface BadgeNotification {
    badge: Badge;
    show: boolean;
}

const BadgeSystem: React.FC = () => {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [notification, setNotification] = useState<BadgeNotification | null>(null);

    useEffect(() => {
        fetchBadges();
        
        // Check for new badges every 30 seconds
        const interval = setInterval(checkForNewBadges, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchBadges = async () => {
        try {
            setLoading(true);
            // Mock data - in real implementation, this would fetch from analytics API
            const mockBadges: Badge[] = [
                {
                    id: '1',
                    title: '初心者',
                    description: '最初の問題を解きました！',
                    category: 'general',
                    type: 'bronze',
                    iconType: 'star',
                    requirement: '1問解く',
                    progress: 1,
                    maxProgress: 1,
                    isUnlocked: true,
                    unlockedAt: new Date().toISOString(),
                    pointsAwarded: 10,
                    rarity: 'common'
                },
                {
                    id: '2',
                    title: '代数の探検者',
                    description: '代数分野で10問解きました',
                    category: 'algebra',
                    type: 'silver',
                    iconType: 'brain',
                    requirement: '代数で10問解く',
                    progress: 7,
                    maxProgress: 10,
                    isUnlocked: false,
                    pointsAwarded: 50,
                    rarity: 'rare'
                },
                {
                    id: '3',
                    title: '連続学習者',
                    description: '3日連続で学習しました',
                    category: 'streak',
                    type: 'gold',
                    iconType: 'flame',
                    requirement: '3日連続学習',
                    progress: 2,
                    maxProgress: 3,
                    isUnlocked: false,
                    pointsAwarded: 100,
                    rarity: 'epic'
                },
                {
                    id: '4',
                    title: '幾何学マスター',
                    description: '幾何分野で90%以上の正答率を達成',
                    category: 'geometry',
                    type: 'platinum',
                    iconType: 'crown',
                    requirement: '幾何で90%以上の正答率',
                    progress: 85,
                    maxProgress: 90,
                    isUnlocked: false,
                    pointsAwarded: 200,
                    rarity: 'legendary'
                },
                {
                    id: '5',
                    title: '学習王',
                    description: '100問解きました！',
                    category: 'general',
                    type: 'diamond',
                    iconType: 'trophy',
                    requirement: '100問解く',
                    progress: 45,
                    maxProgress: 100,
                    isUnlocked: false,
                    pointsAwarded: 500,
                    rarity: 'legendary'
                }
            ];
            
            setBadges(mockBadges);
        } catch (error) {
            console.error('Failed to fetch badges:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkForNewBadges = async () => {
        // In a real implementation, this would check for newly unlocked badges
        // and show notifications
        console.log('Checking for new badges...');
    };

    const getBadgeIcon = (iconType: Badge['iconType'], size: number = 24) => {
        const iconProps = { size, className: 'drop-shadow-sm' };
        
        switch (iconType) {
            case 'award': return <Award {...iconProps} />;
            case 'trophy': return <Trophy {...iconProps} />;
            case 'star': return <Star {...iconProps} />;
            case 'target': return <Target {...iconProps} />;
            case 'flame': return <Flame {...iconProps} />;
            case 'book': return <BookOpen {...iconProps} />;
            case 'brain': return <Brain {...iconProps} />;
            case 'zap': return <Zap {...iconProps} />;
            case 'crown': return <Crown {...iconProps} />;
            case 'medal': return <Medal {...iconProps} />;
            default: return <Award {...iconProps} />;
        }
    };

    const getBadgeColors = (type: Badge['type'], isUnlocked: boolean) => {
        if (!isUnlocked) {
            return {
                bg: 'bg-gray-100',
                border: 'border-gray-200',
                text: 'text-gray-400',
                icon: 'text-gray-300',
                gradient: 'from-gray-100 to-gray-200'
            };
        }

        switch (type) {
            case 'bronze':
                return {
                    bg: 'bg-orange-50',
                    border: 'border-orange-200',
                    text: 'text-orange-800',
                    icon: 'text-orange-600',
                    gradient: 'from-orange-100 to-amber-100'
                };
            case 'silver':
                return {
                    bg: 'bg-gray-50',
                    border: 'border-gray-300',
                    text: 'text-gray-800',
                    icon: 'text-gray-600',
                    gradient: 'from-gray-100 to-slate-200'
                };
            case 'gold':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-300',
                    text: 'text-yellow-800',
                    icon: 'text-yellow-600',
                    gradient: 'from-yellow-100 to-amber-200'
                };
            case 'platinum':
                return {
                    bg: 'bg-indigo-50',
                    border: 'border-indigo-300',
                    text: 'text-indigo-800',
                    icon: 'text-indigo-600',
                    gradient: 'from-indigo-100 to-purple-200'
                };
            case 'diamond':
                return {
                    bg: 'bg-cyan-50',
                    border: 'border-cyan-300',
                    text: 'text-cyan-800',
                    icon: 'text-cyan-600',
                    gradient: 'from-cyan-100 to-blue-200'
                };
            default:
                return {
                    bg: 'bg-gray-50',
                    border: 'border-gray-200',
                    text: 'text-gray-800',
                    icon: 'text-gray-600',
                    gradient: 'from-gray-100 to-gray-200'
                };
        }
    };

    const getRarityColor = (rarity: Badge['rarity']) => {
        switch (rarity) {
            case 'common': return 'text-gray-500';
            case 'rare': return 'text-blue-500';
            case 'epic': return 'text-purple-500';
            case 'legendary': return 'text-orange-500';
            default: return 'text-gray-500';
        }
    };

    const categories = [
        { id: 'all', name: 'すべて', icon: '🏆' },
        { id: 'general', name: '一般', icon: '⭐' },
        { id: 'algebra', name: '代数', icon: '🔢' },
        { id: 'geometry', name: '幾何', icon: '📐' },
        { id: 'functions', name: '関数', icon: '📊' },
        { id: 'probability', name: '確率', icon: '🎲' },
        { id: 'streak', name: '連続記録', icon: '🔥' },
        { id: 'mastery', name: '習得', icon: '👑' }
    ];

    const filteredBadges = badges.filter(badge => 
        selectedCategory === 'all' || badge.category === selectedCategory
    );

    const unlockedCount = badges.filter(badge => badge.isUnlocked).length;
    const totalPoints = badges
        .filter(badge => badge.isUnlocked)
        .reduce((sum, badge) => sum + badge.pointsAwarded, 0);

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">バッジを読み込み中...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center">
                    <Trophy className="mr-3 text-yellow-500" size={32} />
                    実績・バッジコレクション
                </h2>
                
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                        <div className="text-2xl font-bold text-blue-700">{unlockedCount}</div>
                        <div className="text-sm text-blue-600">獲得バッジ</div>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-700">{totalPoints}</div>
                        <div className="text-sm text-yellow-600">獲得ポイント</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                        <div className="text-2xl font-bold text-green-700">
                            {Math.round((unlockedCount / badges.length) * 100)}%
                        </div>
                        <div className="text-sm text-green-600">達成率</div>
                    </div>
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
                {categories.map(category => (
                    <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                            selectedCategory === category.id
                                ? 'bg-blue-500 text-white shadow-md scale-105'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                    </button>
                ))}
            </div>

            {/* Badge Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBadges.map(badge => {
                    const colors = getBadgeColors(badge.type, badge.isUnlocked);
                    const progressPercentage = badge.isUnlocked ? 100 : (badge.progress / badge.maxProgress) * 100;
                    
                    return (
                        <div
                            key={badge.id}
                            className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                                badge.isUnlocked ? 'cursor-pointer' : 'cursor-default'
                            }`}
                        >
                            {/* Gradient Background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-50`}></div>
                            
                            {/* Content */}
                            <div className={`relative p-6 ${colors.bg} ${colors.border}`}>
                                {/* Badge Icon */}
                                <div className={`flex justify-center mb-4 ${colors.icon}`}>
                                    <div className={`p-4 rounded-full ${badge.isUnlocked ? 'bg-white bg-opacity-60' : 'bg-gray-100'}`}>
                                        {getBadgeIcon(badge.iconType, 32)}
                                    </div>
                                </div>

                                {/* Badge Info */}
                                <div className="text-center">
                                    <h3 className={`font-bold text-lg mb-2 ${colors.text}`}>
                                        {badge.title}
                                    </h3>
                                    <p className={`text-sm mb-3 ${colors.text} opacity-80`}>
                                        {badge.description}
                                    </p>
                                    
                                    {/* Requirement */}
                                    <div className={`text-xs mb-3 ${colors.text} opacity-70`}>
                                        {badge.requirement}
                                    </div>

                                    {/* Progress Bar */}
                                    {!badge.isUnlocked && (
                                        <div className="mb-3">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className={colors.text}>進捗</span>
                                                <span className={colors.text}>
                                                    {badge.progress}/{badge.maxProgress}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${progressPercentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Badges Details */}
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-full font-medium text-white ${
                                                badge.type === 'bronze' ? 'bg-orange-500' :
                                                badge.type === 'silver' ? 'bg-gray-500' :
                                                badge.type === 'gold' ? 'bg-yellow-500' :
                                                badge.type === 'platinum' ? 'bg-indigo-500' :
                                                'bg-cyan-500'
                                            }`}>
                                                {badge.type.toUpperCase()}
                                            </span>
                                            <span className={getRarityColor(badge.rarity)}>
                                                {badge.rarity.toUpperCase()}
                                            </span>
                                        </div>
                                        {badge.isUnlocked && (
                                            <div className="text-green-600 font-medium">
                                                +{badge.pointsAwarded}pt
                                            </div>
                                        )}
                                    </div>

                                    {/* Unlocked Date */}
                                    {badge.isUnlocked && badge.unlockedAt && (
                                        <div className={`text-xs mt-2 ${colors.text} opacity-60`}>
                                            獲得日: {new Date(badge.unlockedAt).toLocaleDateString('ja-JP')}
                                        </div>
                                    )}
                                </div>

                                {/* Unlocked Overlay */}
                                {badge.isUnlocked && (
                                    <div className="absolute top-2 right-2">
                                        <div className="bg-green-500 text-white rounded-full p-1">
                                            <Star size={16} fill="currentColor" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredBadges.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Trophy size={48} className="mx-auto mb-4 opacity-50" />
                    <p>このカテゴリにはまだバッジがありません</p>
                </div>
            )}

            {/* Badge Notification Modal */}
            {notification && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center animate-bounce">
                        <div className="text-6xl mb-4">🎉</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                            新しいバッジを獲得！
                        </h3>
                        <div className="mb-4">
                            {getBadgeIcon(notification.badge.iconType, 48)}
                        </div>
                        <h4 className="text-xl font-semibold text-gray-700 mb-2">
                            {notification.badge.title}
                        </h4>
                        <p className="text-gray-600 mb-4">
                            {notification.badge.description}
                        </p>
                        <div className="text-green-600 font-bold mb-6">
                            +{notification.badge.pointsAwarded} ポイント獲得！
                        </div>
                        <button
                            onClick={() => setNotification(null)}
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BadgeSystem;