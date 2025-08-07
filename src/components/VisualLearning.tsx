import React, { useState } from 'react';
import { Eye, Square, TrendingUp, Box, Activity } from 'lucide-react';
import { VisualProblem, Shape, TabType } from '../types/MathTypes';
import ProblemSelector from './visualLearning/ProblemSelector';
import InteractiveCanvas from './visualLearning/InteractiveCanvas';
import MeasurementPanel from './visualLearning/MeasurementPanel';
import FunctionGraphVisualizer from './visualizers/FunctionGraphVisualizer';
import ThreeDObjectVisualizer from './visualizers/3DObjectVisualizer';
import AnimationVisualizer from './visualizers/AnimationVisualizer';

const VisualLearning: React.FC = () => {
    const [selectedProblem, setSelectedProblem] = useState<VisualProblem | null>(null);
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [currentTab, setCurrentTab] = useState<TabType>('interactive');

    const visualProblems: VisualProblem[] = [
        {
            id: 'circle-area',
            title: '円の面積',
            description: '円の半径を変更して、面積の変化を観察しましょう',
            category: 'geometry',
            shapes: [
                {
                    id: 'circle1',
                    type: 'circle',
                    points: [{ x: 200, y: 150 }, { x: 250, y: 150 }],
                    color: '#3B82F6',
                    label: 'r',
                    draggable: true
                }
            ],
            answer: Math.PI * 50 * 50,
            explanation: '面積 = π × r² です'
        },
        {
            id: 'triangle-angles',
            title: '三角形の内角',
            description: '三角形の頂点を動かして、内角の合計を確認しましょう',
            category: 'geometry',
            shapes: [
                {
                    id: 'triangle1',
                    type: 'triangle',
                    points: [
                        { x: 150, y: 100 },
                        { x: 250, y: 200 },
                        { x: 100, y: 200 }
                    ],
                    color: '#10B981',
                    draggable: true
                }
            ],
            answer: 180,
            explanation: '三角形の内角の和は常に180°です'
        },
        {
            id: 'quadratic-function',
            title: '二次関数のグラフ',
            description: 'y = ax² + bx + c のパラメータを変更して、グラフの変化を見てみましょう',
            category: 'functions',
            shapes: [],
            explanation: '二次関数の係数がグラフの形を決定します'
        }
    ];

    const handleProblemSelect = (problem: VisualProblem) => {
        setSelectedProblem(problem);
        setShapes([...problem.shapes]);
    };

    const handleShapeUpdate = (updatedShapes: Shape[]) => {
        setShapes(updatedShapes);
    };


    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center">
                    <Eye className="mr-3 text-purple-500" />
                    ビジュアル学習
                </h2>
                <p className="text-gray-600">数学の概念を視覚的・体験的に理解しましょう</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-6">
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setCurrentTab('interactive')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                            currentTab === 'interactive' 
                                ? 'bg-white text-purple-700 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        <Square className="w-4 h-4" />
                        <span>図形操作</span>
                    </button>
                    <button
                        onClick={() => setCurrentTab('functions')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                            currentTab === 'functions' 
                                ? 'bg-white text-blue-700 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        <TrendingUp className="w-4 h-4" />
                        <span>関数グラフ</span>
                    </button>
                    <button
                        onClick={() => setCurrentTab('3d')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                            currentTab === '3d' 
                                ? 'bg-white text-green-700 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        <Box className="w-4 h-4" />
                        <span>3Dオブジェクト</span>
                    </button>
                    <button
                        onClick={() => setCurrentTab('animations')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                            currentTab === 'animations' 
                                ? 'bg-white text-orange-700 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        <Activity className="w-4 h-4" />
                        <span>アニメーション</span>
                    </button>
                </div>
            </div>

            {/* Content based on selected tab */}
            {currentTab === 'functions' && (
                <FunctionGraphVisualizer />
            )}

            {currentTab === '3d' && (
                <ThreeDObjectVisualizer />
            )}

            {currentTab === 'animations' && (
                <AnimationVisualizer />
            )}

            {currentTab === 'interactive' && (
                <>
                    <ProblemSelector 
                        problems={visualProblems}
                        selectedProblem={selectedProblem}
                        onProblemSelect={handleProblemSelect}
                    />

                    {selectedProblem && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <InteractiveCanvas 
                                    problem={selectedProblem}
                                    shapes={shapes}
                                    onShapeUpdate={handleShapeUpdate}
                                />
                            </div>
                            
                            <div className="space-y-4">
                                <MeasurementPanel shapes={shapes} />
                                
                                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                                    <h4 className="font-semibold text-blue-800 mb-2">解説</h4>
                                    <p className="text-sm text-blue-700">
                                        {selectedProblem.explanation}
                                    </p>
                                </div>

                                <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
                                    <h4 className="font-semibold text-yellow-800 mb-2">💡 使い方のヒント</h4>
                                    <ul className="text-xs text-yellow-700 space-y-1">
                                        <li>• 赤い点をドラッグして図形を変形できます</li>
                                        <li>• グリッドを表示して正確な位置を確認しましょう</li>
                                        <li>• 寸法表示で数値の変化を観察してください</li>
                                        <li>• リセットボタンで初期状態に戻せます</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!selectedProblem && (
                        <div className="text-center py-12 text-gray-500">
                            <Eye size={48} className="mx-auto mb-4 opacity-50" />
                            <p>上の問題を選択して、インタラクティブ学習を始めましょう</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default VisualLearning;