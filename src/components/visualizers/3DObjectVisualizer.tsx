import React, { useState } from 'react';
import { Box, RotateCw } from 'lucide-react';

interface Object3D {
    id: string;
    name: string;
    formula: string;
    color: string;
    description: string;
}

const ThreeDObjectVisualizer: React.FC = () => {
    const [selectedObject, setSelectedObject] = useState<string>('cube');
    const [rotationAngle, setRotationAngle] = useState(0);

    const objects3D: Object3D[] = [
        {
            id: 'cube',
            name: '立方体',
            formula: '体積 = a³',
            color: 'blue',
            description: '全ての辺の長さが等しい直方体'
        },
        {
            id: 'sphere',
            name: '球体',
            formula: '体積 = 4/3πr³',
            color: 'red',
            description: '中心からの距離が一定の点の集合'
        },
        {
            id: 'cylinder',
            name: '円柱',
            formula: '体積 = πr²h',
            color: 'green',
            description: '円形の底面を持つ柱体'
        },
        {
            id: 'cone',
            name: '円錐',
            formula: '体積 = 1/3πr²h',
            color: 'purple',
            description: '円形の底面から頂点に向かう錐体'
        },
        {
            id: 'pyramid',
            name: '四角錐',
            formula: '体積 = 1/3×底面積×高さ',
            color: 'orange',
            description: '四角形の底面を持つ錐体'
        },
        {
            id: 'prism',
            name: '三角柱',
            formula: '体積 = 底面積×高さ',
            color: 'teal',
            description: '三角形の底面を持つ柱体'
        }
    ];

    const selectedObj = objects3D.find(obj => obj.id === selectedObject);

    const getColorClasses = (color: string) => {
        const colorMap = {
            blue: { bg: 'bg-blue-300', border: 'border-blue-400', light: 'bg-blue-100', hover: 'hover:bg-blue-200' },
            red: { bg: 'bg-red-300', border: 'border-red-400', light: 'bg-red-100', hover: 'hover:bg-red-200' },
            green: { bg: 'bg-green-300', border: 'border-green-400', light: 'bg-green-100', hover: 'hover:bg-green-200' },
            purple: { bg: 'bg-purple-300', border: 'border-purple-400', light: 'bg-purple-100', hover: 'hover:bg-purple-200' },
            orange: { bg: 'bg-orange-300', border: 'border-orange-400', light: 'bg-orange-100', hover: 'hover:bg-orange-200' },
            teal: { bg: 'bg-teal-300', border: 'border-teal-400', light: 'bg-teal-100', hover: 'hover:bg-teal-200' }
        };
        return colorMap[color as keyof typeof colorMap] || colorMap.blue;
    };

    const render3DObject = (obj: Object3D) => {
        const colors = getColorClasses(obj.color);

        switch (obj.id) {
            case 'cube':
                return (
                    <div className="relative perspective-1000" style={{ perspective: '1000px' }}>
                        <div 
                            className={`w-32 h-32 ${colors.bg} border-4 ${colors.border} relative shadow-lg transition-transform duration-500`}
                            style={{ 
                                transform: `rotateX(${rotationAngle * 0.5}deg) rotateY(${rotationAngle}deg)`,
                                transformStyle: 'preserve-3d'
                            }}
                        >
                            <div className={`absolute -top-3 -right-3 w-32 h-32 ${colors.light} border-4 ${colors.border} opacity-70 transform -translate-x-6 -translate-y-6`}></div>
                            <div className={`absolute top-0 right-0 w-6 h-32 ${colors.bg} border-2 ${colors.border} transform skew-y-12`}></div>
                            <div className={`absolute top-0 right-0 w-32 h-6 ${colors.light} border-2 ${colors.border} transform skew-x-12`}></div>
                        </div>
                    </div>
                );

            case 'sphere':
                return (
                    <div className="relative">
                        <div 
                            className={`w-32 h-32 ${colors.bg} rounded-full shadow-inner relative transition-transform duration-500`}
                            style={{ transform: `rotateY(${rotationAngle}deg)` }}
                        >
                            <div className={`absolute top-3 left-3 w-10 h-10 ${colors.light} rounded-full opacity-60`}></div>
                            <div className={`absolute top-6 right-8 w-6 h-6 ${colors.light} rounded-full opacity-40`}></div>
                        </div>
                    </div>
                );

            case 'cylinder':
                return (
                    <div className="relative">
                        <div 
                            className={`w-24 h-32 ${colors.bg} relative shadow-lg transition-transform duration-500`}
                            style={{ 
                                transform: `rotateX(${rotationAngle * 0.3}deg) rotateY(${rotationAngle * 0.7}deg)`,
                                borderRadius: '0 0 12px 12px'
                            }}
                        >
                            <div className={`absolute -top-1 left-0 w-24 h-6 ${colors.border} rounded-full border-4`}></div>
                            <div className={`absolute -bottom-1 left-0 w-24 h-6 ${colors.border} rounded-full border-4`}></div>
                            <div className={`absolute top-2 left-1 w-22 h-4 ${colors.light} rounded-full opacity-50`}></div>
                        </div>
                    </div>
                );

            case 'cone':
                return (
                    <div className="relative">
                        <div 
                            className="relative transition-transform duration-500"
                            style={{ transform: `rotateX(${rotationAngle * 0.3}deg) rotateY(${rotationAngle * 0.8}deg)` }}
                        >
                            <div 
                                className={`w-0 h-0 border-l-16 border-r-16 border-b-32 ${colors.bg} relative`}
                                style={{ 
                                    borderLeftColor: 'transparent',
                                    borderRightColor: 'transparent',
                                    borderBottomColor: colors.bg.split(' ')[0].replace('bg-', '#') + (colors.bg.includes('300') ? '4d' : '80'),
                                    borderBottomWidth: '100px',
                                    borderLeftWidth: '50px',
                                    borderRightWidth: '50px'
                                }}
                            ></div>
                            <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-24 h-6 ${colors.border} rounded-full border-4`}></div>
                        </div>
                    </div>
                );

            case 'pyramid':
                return (
                    <div className="relative">
                        <div 
                            className="relative transition-transform duration-500"
                            style={{ transform: `rotateX(${rotationAngle * 0.4}deg) rotateY(${rotationAngle}deg)` }}
                        >
                            <div className={`w-20 h-20 ${colors.bg} transform rotate-45 relative border-4 ${colors.border}`}>
                                <div className={`absolute -top-3 -left-3 w-20 h-20 ${colors.light} transform rotate-45 opacity-70 border-4 ${colors.border}`}></div>
                            </div>
                        </div>
                    </div>
                );

            case 'prism':
                return (
                    <div className="relative">
                        <div 
                            className="relative transition-transform duration-500"
                            style={{ transform: `rotateX(${rotationAngle * 0.2}deg) rotateY(${rotationAngle * 0.9}deg)` }}
                        >
                            <div className={`w-24 h-32 ${colors.bg} relative border-4 ${colors.border}`} 
                                 style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}>
                                <div className={`absolute top-2 left-2 w-20 h-4 ${colors.light} opacity-50`}></div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return <div className={`w-32 h-32 ${colors.bg} rounded`}></div>;
        }
    };

    const rotate = () => {
        setRotationAngle(prev => prev + 45);
    };

    const autoRotate = () => {
        const interval = setInterval(() => {
            setRotationAngle(prev => (prev + 5) % 360);
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
        }, 3000); // 3秒間回転
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 flex items-center justify-center">
                    <Box className="mr-2 text-purple-500" />
                    3D数学オブジェクト
                </h3>
                <p className="text-gray-600 mt-2">立体的な数学オブジェクトを回転させて理解を深めましょう</p>
            </div>

            {/* Object Selector */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
                {objects3D.map(obj => {
                    const colors = getColorClasses(obj.color);
                    return (
                        <button
                            key={obj.id}
                            onClick={() => setSelectedObject(obj.id)}
                            className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                selectedObject === obj.id
                                    ? `${colors.light} ${colors.border} text-gray-800`
                                    : `border-gray-200 bg-white text-gray-600 hover:border-gray-300`
                            }`}
                        >
                            {obj.name}
                        </button>
                    );
                })}
            </div>

            {/* Main Display */}
            {selectedObj && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 3D Object Display */}
                    <div className="bg-white rounded-lg shadow-sm border p-8">
                        <div className="text-center mb-6">
                            <h4 className="text-xl font-bold text-gray-800 mb-2">{selectedObj.name}</h4>
                            <p className="text-sm text-gray-600 mb-4">{selectedObj.description}</p>
                            <div className="text-lg font-mono text-blue-700 bg-blue-50 py-2 px-4 rounded-lg inline-block">
                                {selectedObj.formula}
                            </div>
                        </div>

                        <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center min-h-64">
                            {render3DObject(selectedObj)}
                        </div>

                        <div className="flex justify-center space-x-4 mt-6">
                            <button
                                onClick={rotate}
                                className={`p-3 ${getColorClasses(selectedObj.color).light} text-gray-700 rounded-lg ${getColorClasses(selectedObj.color).hover} transition-colors flex items-center space-x-2`}
                            >
                                <RotateCw className="w-5 h-5" />
                                <span>回転</span>
                            </button>
                            <button
                                onClick={autoRotate}
                                className="p-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                            >
                                自動回転
                            </button>
                        </div>
                    </div>

                    {/* Information Panel */}
                    <div className="space-y-6">
                        {/* Properties */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h4 className="font-semibold text-gray-800 mb-4">特性</h4>
                            <div className="space-y-3 text-sm">
                                {selectedObj.id === 'cube' && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">面の数:</span>
                                            <span className="font-medium">6</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">頂点の数:</span>
                                            <span className="font-medium">8</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">辺の数:</span>
                                            <span className="font-medium">12</span>
                                        </div>
                                    </>
                                )}
                                {selectedObj.id === 'sphere' && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">表面積:</span>
                                            <span className="font-medium">4πr²</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">断面:</span>
                                            <span className="font-medium">円</span>
                                        </div>
                                    </>
                                )}
                                {selectedObj.id === 'cylinder' && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">底面積:</span>
                                            <span className="font-medium">πr²</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">側面積:</span>
                                            <span className="font-medium">2πrh</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">表面積:</span>
                                            <span className="font-medium">2πr(r+h)</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Interactive Controls */}
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <h4 className="font-semibold text-gray-800 mb-4">コントロール</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">回転角度</label>
                                    <input
                                        type="range"
                                        min={0}
                                        max={360}
                                        step={15}
                                        value={rotationAngle}
                                        onChange={(e) => setRotationAngle(parseInt(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="text-xs text-gray-500 text-center mt-1">
                                        {rotationAngle}°
                                    </div>
                                </div>
                                <button
                                    onClick={() => setRotationAngle(0)}
                                    className="w-full p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                >
                                    リセット
                                </button>
                            </div>
                        </div>

                        {/* Learning Tips */}
                        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
                            <h4 className="font-semibold text-yellow-800 mb-2">💡 学習のヒント</h4>
                            <ul className="text-sm text-yellow-700 space-y-1">
                                <li>• 異なる角度から観察して立体構造を理解しましょう</li>
                                <li>• 体積の公式と実際の形状を関連付けて覚えましょう</li>
                                <li>• 断面図を想像しながら回転させてみましょう</li>
                                <li>• 実生活での応用例を考えてみましょう</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThreeDObjectVisualizer;